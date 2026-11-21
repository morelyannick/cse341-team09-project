import mongoose from 'mongoose';

const passengerSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    phone: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    _id: false
  }
);

const confirmationSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    scheduleId: {
      type: Number,
      required: true
    },
    tripId: {
      type: String,
      required: true,
      trim: true
    },
    ticketClass: {
      type: String,
      required: true,
      enum: ['standard', 'premium', 'first']
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },
    selectedDay: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    passengers: {
      type: [passengerSchema],
      required: true,
      validate: {
        validator: (passengers) => passengers.length > 0,
        message: 'At least one passenger is required.'
      }
    }
  },
  {
    timestamps: true
  }
);

const confirmation = mongoose.model('Confirmation', confirmationSchema);

export default confirmation;
