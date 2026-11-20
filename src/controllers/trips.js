import { getTripById as findTripById, getAllTrips as findAllTrips } from '../models/trips.js';

export async function getTripById(req, res) {
  const trip = await findTripById(req.params.id);
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }
  return res.status(200).json(trip);
}

export async function getAllTrips(req, res) {
  const { region, season } = req.query;
  if ((region !== undefined && typeof region !== 'string')
      || (season !== undefined && typeof season !== 'string')) {
    return res.status(400).json({ error: 'Region and season filters must be strings' });
  }

  const trips = await findAllTrips({ region, season });
  return res.status(200).json(trips);
}
