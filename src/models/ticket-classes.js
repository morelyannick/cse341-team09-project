import TicketClass from './schemas/ticket-classes.js';

// Return the fields the app uses, without Mongo's internal _id and __v.
const PUBLIC_FIELDS = '-_id -__v -createdAt -updatedAt';

export async function getAllTicketClasses() {
  return TicketClass.find({}).select(PUBLIC_FIELDS).sort({ pricePerKm: 1 }).lean();
}

// day must already be a lowercase day name such as "monday".
// A ticket class with no availableDays field is treated as available every day,
// so older documents keep working until they are updated.
export async function getTicketClassesForDay(day) {
  return TicketClass.find({
    $or: [{ availableDays: day }, { availableDays: { $exists: false } }]
  })
    .select(PUBLIC_FIELDS)
    .sort({ pricePerKm: 1 })
    .lean();
}
