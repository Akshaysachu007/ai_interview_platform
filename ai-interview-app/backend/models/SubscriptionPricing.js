import mongoose from 'mongoose';

const subscriptionPricingSchema = new mongoose.Schema({
  planType: { type: String, required: true, enum: ['weekly', 'monthly'], unique: true },
  price: { type: Number, required: true },
  features: { type: [String], default: [] },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
}, { timestamps: true });

export default mongoose.model('SubscriptionPricing', subscriptionPricingSchema);
