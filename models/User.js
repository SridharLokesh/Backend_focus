import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema({
  label:     { type: String, default: 'Home' },
  street:    String,
  city:      String,
  state:     String,
  pincode:   String,
  country:   { type: String, default: 'India' },
  isDefault: { type: Boolean, default: false },
});

const userSchema = new mongoose.Schema(
  {
    name:           { type: String, required: true, trim: true },
    email:          { type: String, required: true, unique: true, lowercase: true },
    password:       { type: String, required: true, minlength: 6 },
    phone:          { type: String, default: '' },
    secondaryPhone: { type: String, default: '' },
    role:           { type: String, enum: ['user', 'admin', 'dealer'], default: 'user' },
    addresses:      { type: [addressSchema], validate: [v => v.length <= 10, 'Max 10 addresses'] },
    avatar:         { type: String, default: '' },
    isActive:       { type: Boolean, default: true },

    // Dealer-specific fields
    dealerId:       { type: String, default: '' },           // e.g. TVSD-0001
    businessName:   { type: String, default: '' },
    businessLocation: { type: String, default: '' },
    dealerState:    { type: String, default: '' },
    dealerApproved: { type: Boolean, default: false },
    dealerRequestedAt: Date,
  },
  { timestamps: true }
);

// Fixed pre-save hook — only hash when modified
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
