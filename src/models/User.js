const mongoose = require('mongoose');

const deviceInfoSchema = new mongoose.Schema(
  {
    ipAddress: { type: String, trim: true },
    deviceType: {
      type: String,
      enum: ['Mobile', 'Desktop'],
      trim: true,
    },
    os: {
      type: String,
      enum: ['Android', 'iOS', 'Windows', 'macOS'],
      trim: true,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
      match: [/^\d{7,15}$/, 'Phone must contain only numeric digits'],
    },
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    kycStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    deviceInfo: {
      type: deviceInfoSchema,
      default: undefined,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.index({ isBlocked: 1, createdAt: -1 });

const User = mongoose.model('User', userSchema);

module.exports = User;