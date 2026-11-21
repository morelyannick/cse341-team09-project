
import { getDb } from '../db/connect.js';
import { getConfirmationById } from '../models/confirmations.js';

const confirmationPage = async (req, res) => {
    try {
        const { confirmationId } = req.params;

        const confirmation = await getConfirmationById(confirmationId);

        if (!confirmation) {
            return res.status(404).send('Confirmation not found.');
        }

        const db = getDb();

        const trip = await db.collection('trips').findOne({
            id: confirmation.tripId
        });

        const schedule = await db.collection('schedules').findOne({
            id: confirmation.scheduleId
        });

        return res.render('trips/confirm', {
            title: 'Trip Confirmation',
            confirmation,
            trip,
            schedule
        });
    } catch (error) {
        console.error('Error loading confirmation:', error);
        return res.status(500).send('Unable to load the confirmation.');
    }
};

export default confirmationPage;
