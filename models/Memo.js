const mongoose = require("mongoose");

const approvalSchema = new mongoose.Schema({
  role: { type: String, required: true }, // Role of the approver
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  digitalSignature: { type: String, required: true }, // Store digital signature
  timestamp: { type: Date, default: Date.now }
});

const memoSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  status: { 
    type: String, 
    enum: [
      "Pending", "Under Review", "Approved by Head", "Approved by AR", 
      "Faculty Board Decision", "Approved by Dean", "Approved by AR Campus", 
      "Campus Board Decision", "Finalized", "Rejected"
    ], 
    default: "Pending" 
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  approvals: [approvalSchema], // Store all approvals
  facultyBoardDecision: { type: String, enum: ["Accepted", "Rejected"], default: null },
  campusBoardDecision: { type: String, enum: ["Accepted", "Rejected"], default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Memo", memoSchema);
