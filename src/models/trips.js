import Trip from './schemas/trips.js';
import { getDb } from '../db/connect.js';

export async function getTripById(id) {
  return Trip.findOne({ id }).lean();
}

export async function getAllTrips({ region, season } = {}) {
  const filters = {};

  if (region) {
    filters.region = region;
  }
  if (season) {
    filters.bestSeason = season;
  }

  return Trip.find(filters).lean();
}

// Updates the editable fields of a trip. The id is never changed.
// Returns the updated trip, or null when no trip has that id.
export async function updateTrip(id, changes) {
  return Trip.findOneAndUpdate(
    { id },
    { $set: changes },
    { returnDocument: 'after', runValidators: true }
  ).lean();
}

// Returns true when a trip was deleted, false when no trip had that id.
export async function deleteTrip(id) {
  const result = await Trip.deleteOne({ id });
  return result.deletedCount === 1;
}

// Station choices for the trip editor. Read-only, so it uses the stations
// collection directly until the stations Mongoose model is merged.
export async function getStationOptions() {
  return getDb()
    .collection('stations')
    .find({}, { projection: { _id: 0, id: 1, name: 1, region: 1 } })
    .sort({ name: 1 })
    .toArray();
}
