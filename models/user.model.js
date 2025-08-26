// server/models/user.model.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  mobile: { type: String, required: true, unique: true },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profilePicture: { type: String, default: '' },
  status: { type: String, default: 'Hey there! I am using ChatApp.' },
  preferences: {
    theme: { type: String, default: 'light' },
    notifications: { type: Boolean, default: true }
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, { timestamps: true });

// Password hashing middleware
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate auth token method
userSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      userId: this._id.toString(), // Force consistent field name
      email: this.email 
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

const User = mongoose.model('User', userSchema);

export default User;