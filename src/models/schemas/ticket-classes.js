import mongoose from 'mongoose';

export const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
];

const ticketClassSchema = new mongoose.Schema(
  {
    class: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    pricePerKm: { type: Number, required: true, min: 0 },
    amenities: { type: [String], default: [] },
    description: { type: String, trim: true },
    // Days of the week this ticket class is sold. Uses the same lowercase
    // day names as schedules.daysOfWeek so the two can be compared directly.
    availableDays: {
      type: [{ type: String, enum: DAYS_OF_WEEK }],
      default: () => [...DAYS_OF_WEEK]
    }
  },
  { timestamps: true }
);

// The seed data lives in the existing "ticketClasses" collection. Without the
// third argument, Mongoose would pluralize the model name to "ticketclasses"
// and read from an empty collection.
const TicketClass = mongoose.model('TicketClass', ticketClassSchema, 'ticketClasses');

export default TicketClass;
