import { getDb } from '../db/connect.js';
import { generateBookingCode } from '../includes/helpers.js';
import { createBooking as saveBooking, getAllBookings as findAllBookings, getBookingById as findBookingById } from '../models/bookings.js';
import { getAllTicketClasses } from '../models/ticket-classes.js';

export async function getAllBookings(req, res) {
  const bookings = await findAllBookings();
  return res.status(200).json({ bookings });
}

export async function bookingPage(req, res) {
  const scheduleId = Number(req.params.scheduleId);
  const db = getDb();
  const schedule = await db.collection('schedules').findOne({ id: scheduleId });
  if (!schedule) {
    const error = new Error('Schedule not found');
    error.status = 404;
    throw error;
  }

  const trip = await db.collection('trips').findOne({ id: schedule.tripId });
  if (!trip) {
    const error = new Error('Trip not found');
    error.status = 404;
    throw error;
  }

  const ticketClasses = await getAllTicketClasses();
  const ticketOptions = ticketClasses.map((ticketClass) => ({
    class: ticketClass.class,
    name: ticketClass.name,
    price: trip.distance * ticketClass.pricePerKm,
    amenities: ticketClass.amenities,
    description: ticketClass.description
  }));

  return res.render('trips/book', { title: 'Book Trip', schedule, ticketOptions });
}

export async function processBookingRequest(req, res) {
  const booking = await saveBooking({
    ...req.body,
    id: generateBookingCode(),
    createdAt: new Date()
  });
  return res.redirect(`/trips/confirmation/${booking.id}`);
}

export async function bookingConfirmationPage(req, res) {
  const confirmation = await findBookingById(req.params.bookingId);
  if (!confirmation) {
    const error = new Error('Booking not found');
    error.status = 404;
    throw error;
  }
  return res.render('trips/confirm', { title: 'Trip Confirmation', confirmation });
}
