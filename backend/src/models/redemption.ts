import mongoose from 'mongoose';
const { Schema } = mongoose;

const addressSchema = new Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
}, { _id: false });

const statusHistorySchema = new Schema({
  status: { type: String, required: true },
  note: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now },
}, { _id: false });

const redemptionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: Number, required: true },
  productName: { type: String, required: true },
  pointsSpent: { type: Number, required: true },
  address: { type: addressSchema, required: true },
  status: {
    type: String,
    enum: ['pending', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  statusHistory: [statusHistorySchema],
}, { timestamps: true });

export default mongoose.model('Redemption', redemptionSchema) as any;
