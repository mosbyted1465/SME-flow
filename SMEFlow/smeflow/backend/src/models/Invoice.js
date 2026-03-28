const mongoose = require('mongoose');

const INVOICE_STATUSES = ['DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'];

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Invoice must be linked to a customer'],
    },
    amount: {
      type: Number,
      required: [true, 'Invoice amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    status: {
      type: String,
      enum: INVOICE_STATUSES,
      default: 'DRAFT',
    },
    dueDate: {
      type: Date,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate invoice number before saving
invoiceSchema.pre('save', async function (next) {
  if (!this.isNew) return next();
  const count = await this.constructor.countDocuments();
  this.invoiceNumber = `INV-${String(count + 1).padStart(5, '0')}`;
  next();
});

invoiceSchema.index({ customer: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
module.exports.INVOICE_STATUSES = INVOICE_STATUSES;
