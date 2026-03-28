const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [150, 'Name cannot exceed 150 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[+\d\s\-().]{7,20}$/, 'Please provide a valid phone number'],
    },
    company: {
      type: String,
      trim: true,
      maxlength: [150, 'Company name cannot exceed 150 characters'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals for related documents
customerSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'customer',
});

customerSchema.virtual('invoices', {
  ref: 'Invoice',
  localField: '_id',
  foreignField: 'customer',
});

// Indexes for performant queries
customerSchema.index({ email: 1 });
customerSchema.index({ company: 1 });
customerSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Customer', customerSchema);
