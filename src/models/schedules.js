import Schedule from './schemas/schedules.js';

export async function getSchedulesByTripId(tripId) {
  return Schedule.find({ tripId }).sort({ departureTime: 1 }).lean();
}

export async function getAllSchedules() {
  return Schedule.find({}).select('-_id -__v -createdAt -updatedAt').sort({ id: 1 }).lean();
}

export async function countSchedulesForTrip(tripId) {
  return Schedule.countDocuments({ tripId });
}

// Returns the ids from scheduleIds that do not belong to any schedule.
export async function findMissingScheduleIds(scheduleIds) {
  const found = await Schedule.find({ id: { $in: scheduleIds } }).select('id').lean();
  const foundIds = new Set(found.map((schedule) => schedule.id));
  return scheduleIds.filter((scheduleId) => !foundIds.has(scheduleId));
}

// Moves the given schedules onto a trip. Every schedule must belong to a trip,
// so schedules are moved between trips rather than removed from one.
export async function assignSchedulesToTrip(tripId, scheduleIds) {
  if (scheduleIds.length === 0) {
    return 0;
  }
  const result = await Schedule.updateMany({ id: { $in: scheduleIds } }, { $set: { tripId } });
  return result.modifiedCount;
}
