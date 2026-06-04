import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  dealer:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  title:    String,
  image:    String,
  price:    Number,
  quantity: Number,
  color:    String,
  dealerPackedAt: Date,
});

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderItems:  [orderItemSchema],
    shippingAddress: {
      label:   String,
      street:  String,
      city:    String,
      state:   String,
      pincode: String,
      country: { type: String, default: 'India' },
    },
    paymentMethod: { type: String, default: 'COD' },
    itemsPrice:    Number,
    taxPrice:      { type: Number, default: 0 },
    shippingPrice: { type: Number, default: 0 },
    totalPrice:    Number,
    isPaid:        { type: Boolean, default: false },
    isDelivered:   { type: Boolean, default: false },
    orderStatus: {
      type:    String,
      enum:    ['Placed', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'Refunded'],
      default: 'Placed',
    },
    trackingNumber: String,
    deliveredAt:    Date,
    invoiceNumber:  { type: String, default: '' },
    notes:          { type: String, default: '' },
  },
  { timestamps: true }
);

// Auto-generate invoice number on save
orderSchema.pre('save', function (next) {
  if (!this.invoiceNumber) {
    const ts   = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.invoiceNumber = `TVS-INV-${ts}-${rand}`;
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
