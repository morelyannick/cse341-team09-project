
import { getDb } from '../db/connect.js';
import { createConfirmation } from '../models/confirmations.js';
import { generateConfirmationCode } from '../includes/helpers.js';

const bookingPage = async (req, res) => {
    try {
        const scheduleId = Number(req.params.scheduleId);

        if (!Number.isInteger(scheduleId) || scheduleId <= 0) {
            return res.status(404).send('Schedule not found.');
        }

        const db = getDb();

        const schedule = await db.collection('schedules').findOne({
            id: scheduleId
        });

        if (!schedule || !schedule.status) {
            return res.status(404).send('This schedule is unavailable.');
        }

        const trip = await db.collection('trips').findOne({
            id: schedule.tripId
        });

        if (!trip) {
            return res.status(404).send('Trip not found.');
        }

        const ticketClasses = await db.collection('ticketClasses').find({}).toArray();

        const ticketOptions = ticketClasses.map((ticketClass) => ({
            class: ticketClass.class,
            name: ticketClass.name,
            price: trip.distance * ticketClass.pricePerKm,
            amenities: ticketClass.amenities,
            description: ticketClass.description
        }));

        return res.render('trips/book', {
            title: 'Book Trip',
            schedule,
            ticketOptions
        });
    } catch (error) {
        console.error('Error loading booking page:', error);
        return res.status(500).send('Unable to load the booking page.');
    }
};

const processBookingRequest = async (req, res) => {
    try {
        const scheduleId = Number(req.body.scheduleId);
        const { tripId, ticketClass: selectedTicketClass } = req.body;
        const selectedDay = String(req.body.selectedDay || '').trim().toLowerCase();

        if (!Number.isInteger(scheduleId) || scheduleId <= 0) {
            return res.status(400).send('A valid schedule is required.');
        }

        const db = getDb();

        const schedule = await db.collection('schedules').findOne({
            id: scheduleId
        });

        if (!schedule || !schedule.status) {
            return res.status(400).send('This schedule is unavailable.');
        }

        if (tripId !== schedule.tripId) {
            return res.status(400).send('The selected trip does not match this schedule.');
        }

        const trip = await db.collection('trips').findOne({
            id: schedule.tripId
        });

        if (!trip) {
            return res.status(400).send('The selected trip could not be found.');
        }

        if (!schedule.daysOfWeek.includes(selectedDay)) {
            return res.status(400).send('The selected travel day is unavailable.');
        }

        const ticketClass = await db.collection('ticketClasses').findOne({
            class: selectedTicketClass
        });

        if (!ticketClass) {
            return res.status(400).send('Please select a valid ticket class.');
        }

        // Normalize passenger entries and remove empty array positions.
        const rawPassengers = req.body.passengers;
        const passengerEntries = Array.isArray(rawPassengers)
            ? rawPassengers.filter(Boolean)
            : rawPassengers && typeof rawPassengers === 'object'
                ? Object.values(rawPassengers)
                : [];

        if (passengerEntries.length < 1 || passengerEntries.length > 8) {
            return res.status(400).send('A booking must include between 1 and 8 passengers.');
        }

        const passengers = passengerEntries.map((passenger) => ({
            firstName: typeof passenger.firstName === 'string'
                ? passenger.firstName.trim()
                : '',
            lastName: typeof passenger.lastName === 'string'
                ? passenger.lastName.trim()
                : '',
            email: typeof passenger.email === 'string'
                ? passenger.email.trim().toLowerCase()
                : '',
            phone: typeof passenger.phone === 'string'
                ? passenger.phone.trim()
                : ''
        }));

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        const invalidPassenger = passengers.some((passenger) =>
            !passenger.firstName ||
            !passenger.lastName ||
            !emailPattern.test(passenger.email) ||
            !passenger.phone
        );

        if (invalidPassenger) {
            return res.status(400).send('Please provide complete and valid passenger information.');
        }

        // Calculate the price using database values, not submitted form values.
        const totalPrice =
            trip.distance * ticketClass.pricePerKm * passengers.length;

        if (!Number.isFinite(totalPrice) || totalPrice < 0) {
            return res.status(400).send('Unable to calculate the booking price.');
        }

        const confirmation = await createConfirmation({
            id: generateConfirmationCode(),
            scheduleId,
            tripId: schedule.tripId,
            ticketClass: ticketClass.class,
            totalPrice,
            selectedDay,
            passengers
        });

        return res.redirect(`/trips/confirmation/${confirmation.id}`);
    } catch (error) {
        console.error('Error processing booking:', error);
        return res.status(500).send('Unable to process your booking.');
    }
};

export { bookingPage, processBookingRequest };
