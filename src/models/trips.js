import Trip from './schemas/trips.js';

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
