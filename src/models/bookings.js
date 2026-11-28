import Booking from './schemas/bookings.js';

export async function createBooking(booking) {
  return Booking.create(booking);
}

export async function getAllBookings() {
  return Booking.find({}).sort({ createdAt: -1 }).lean();
}

export async function getBookingById(id) {
  return Booking.findOne({ id }).lean();
}
