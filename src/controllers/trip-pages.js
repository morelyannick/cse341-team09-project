import { getDb } from '../db/connect.js';

export async function trainsPage(req, res) {
  return res.render('trains', { title: 'Trains' });
}

export async function tripListPage(req, res) {
  return res.render('trips/list', { title: 'Scenic Train Trips' });
}

export async function tripDetailsPage(req, res) {
  const { tripId } = req.params;
  const details = await getDb().collection('trips').findOne({ id: tripId });
  if (!details) {
    const error = new Error('Trip not found');
    error.status = 404;
    throw error;
  }
  return res.render('trips/details', { title: 'Trip Details', details });
}
