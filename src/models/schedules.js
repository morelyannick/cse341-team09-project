//src/models/scheduls.js
import Schedule from './schemas/schedules.js';

export async function getSchedulesByTripId(tripId, month) {
  const query = {
    tripId
  };

  return Schedule.find(query).lean();
}