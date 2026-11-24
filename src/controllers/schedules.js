import { getTripById } from '../models/trips.js';
import { getSchedulesByTripId } from '../models/schedules.js';

export async function getSchedulesForTrip(req, res) {
  const trip = await getTripById(req.params.id);
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }
  const schedules = await getSchedulesByTripId(req.params.id);
  return res.status(200).json({ schedules });
}

export async function getSchedulesForTripAndMonth(req, res) {
  const monthValue = req.query.month;
  if (typeof monthValue !== 'string' || !/^(0?[1-9]|1[0-2])$/.test(monthValue)) {
    return res.status(400).json({ error: 'Month must be an integer from 1 to 12' });
  }
  const month = Number(monthValue);

  const trip = await getTripById(req.params.id);
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  if (!trip.operatingMonths.includes(month)) {
    return res.status(200).json({ schedules: [] });
  }

  const schedules = await getSchedulesByTripId(req.params.id);
  return res.status(200).json({ schedules });
}
