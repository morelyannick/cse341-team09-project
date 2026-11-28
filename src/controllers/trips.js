import {
  getTripById as findTripById,
  getAllTrips as findAllTrips,
  updateTrip as saveTripChanges,
  deleteTrip as removeTrip,
  getStationOptions
} from '../models/trips.js';
import {
  getAllSchedules,
  countSchedulesForTrip,
  findMissingScheduleIds,
  assignSchedulesToTrip
} from '../models/schedules.js';
import { countBookingsForTrip } from '../models/bookings.js';

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

// ---------- Trip admin (Feature Set 5): admin-only update and delete ----------

const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const REQUIRED_TEXT_FIELDS = ['name', 'description', 'region', 'startStation', 'endStation', 'duration'];

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

// Checks the request body and builds the changes to save. Station and schedule
// existence are checked later, against the database.
function validateTripUpdate(body) {
  const errors = [];
  const changes = {};

  for (const field of REQUIRED_TEXT_FIELDS) {
    if (isNonEmptyString(body[field])) {
      changes[field] = body[field].trim();
    } else {
      errors.push(`${field} is required and must be a non-empty string`);
    }
  }

  if (typeof body.distance === 'number' && Number.isFinite(body.distance) && body.distance >= 0) {
    changes.distance = body.distance;
  } else {
    errors.push('distance is required and must be a number of 0 or more');
  }

  const season = typeof body.bestSeason === 'string' ? body.bestSeason.trim().toLowerCase() : '';
  if (SEASONS.includes(season)) {
    changes.bestSeason = season;
  } else {
    errors.push(`bestSeason must be one of: ${SEASONS.join(', ')}`);
  }

  if (body.highlights !== undefined) {
    if (Array.isArray(body.highlights) && body.highlights.every(isNonEmptyString)) {
      changes.highlights = body.highlights.map((highlight) => highlight.trim());
    } else {
      errors.push('highlights must be an array of non-empty strings');
    }
  }

  if (body.operatingMonths !== undefined) {
    const validMonths = Array.isArray(body.operatingMonths)
      && body.operatingMonths.every((month) => Number.isInteger(month) && month >= 1 && month <= 12);
    if (validMonths) {
      changes.operatingMonths = [...new Set(body.operatingMonths)].sort((a, b) => a - b);
    } else {
      errors.push('operatingMonths must be an array of whole numbers from 1 to 12');
    }
  }

  let scheduleIds = [];
  if (body.scheduleIds !== undefined) {
    if (Array.isArray(body.scheduleIds) && body.scheduleIds.every((id) => Number.isInteger(id) && id > 0)) {
      scheduleIds = [...new Set(body.scheduleIds)];
    } else {
      errors.push('scheduleIds must be an array of schedule ids (positive whole numbers)');
    }
  }

  if (changes.startStation && changes.startStation === changes.endStation) {
    errors.push('startStation and endStation must be different stations');
  }

  return { errors, changes, scheduleIds };
}

export async function updateTrip(req, res) {
  const { errors, changes, scheduleIds } = validateTripUpdate(req.body ?? {});
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Invalid trip data', errors });
  }

  try {
    const existing = await findTripById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const stationIds = new Set((await getStationOptions()).map((station) => station.id));
    for (const field of ['startStation', 'endStation']) {
      if (!stationIds.has(changes[field])) {
        errors.push(`${field} "${changes[field]}" does not match an existing station`);
      }
    }
    const missingSchedules = await findMissingScheduleIds(scheduleIds);
    if (missingSchedules.length > 0) {
      errors.push(`No schedule exists with id: ${missingSchedules.join(', ')}`);
    }
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Invalid trip data', errors });
    }

    const updated = await saveTripChanges(req.params.id, changes);
    await assignSchedulesToTrip(req.params.id, scheduleIds);
    return res.status(200).json(updated);
  } catch (error) {
    console.error(`Error updating trip ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Failed to update trip' });
  }
}

export async function deleteTrip(req, res) {
  try {
    const existing = await findTripById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Schedules and bookings point to a trip by its id. Deleting a trip they
    // still point to would break the booking and confirmation pages.
    const [scheduleCount, bookingCount] = await Promise.all([
      countSchedulesForTrip(req.params.id),
      countBookingsForTrip(req.params.id)
    ]);
    if (scheduleCount > 0) {
      return res.status(409).json({
        error: `This trip still has ${scheduleCount} schedule(s). Move them to another trip before deleting it.`
      });
    }
    if (bookingCount > 0) {
      return res.status(409).json({
        error: `This trip has ${bookingCount} booking(s) and cannot be deleted.`
      });
    }

    await removeTrip(req.params.id);
    return res.status(204).send();
  } catch (error) {
    console.error(`Error deleting trip ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Failed to delete trip' });
  }
}

// Station and schedule choices for the trip editor.
export async function getTripAdminOptions(req, res) {
  try {
    const [stations, schedules] = await Promise.all([getStationOptions(), getAllSchedules()]);
    return res.status(200).json({ stations, schedules });
  } catch (error) {
    console.error('Error loading trip admin options:', error);
    return res.status(500).json({ error: 'Failed to load trip options' });
  }
}

// EJS page. The trip list is loaded by public/js/trip-admin.js from the API.
export function tripAdminPage(req, res) {
  return res.render('admin/trips', { title: 'Trip Administration' });
}
