const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ["CAA_Department", "Head_Department", "AR_Faculty", "CAA_Faculty", "Dean_Faculty", "AR_Campus", "Rector"], 
    required: true 
  },
  privateKey: { type: String }, // Store private key for signing
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Generate private key when creating a user
userSchema.pre("save", function (next) {
  if (!this.privateKey) {
    const { privateKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
    });
    this.privateKey = privateKey.export({ type: "pkcs1", format: "pem" });
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
