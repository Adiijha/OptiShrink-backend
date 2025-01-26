import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  compressedImages: [
    {
      url: String,
      compressedAt: { type: Date, default: Date.now }, // Store the compression date
    }
  ],

}, { timestamps: true });

// Pre-save hook to hash password before saving
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();

  try {
    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(this.password, 10);
    console.log("Hashed Password: ", hashedPassword);
    
    this.password = hashedPassword; // Replace the plain password with the hashed password
    next();
  } catch (error) {
    next(error); // Pass error to the next middleware if any
  }
});


// Method to check if entered password matches the hashed password
userSchema.methods.isPasswordCorrect = async function (password) {
  try {
    // Compare entered password with stored hashed password
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    console.error("Error comparing password:", error);
    throw new Error("Password verification failed");
  }
};





userSchema.methods.generateAccessToken = function () {
  return jwt.sign({
      _id: this._id,
      username: this.username,
      email: this.email,
      name: this.name,
  }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
  });
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({
      _id: this._id,
  }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};


// Create and export the User model
export const User = mongoose.model("User", userSchema);