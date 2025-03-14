const crypto = require("crypto");
const Memo = require("../models/Memo");
const User = require("../models/User");
const { io } = require("../server");

// Create Memo (Only CAA of the Department & CAA of the Faculty)
exports.createMemo = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    if (!["CAA_Department", "CAA_Faculty"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied. Only CAA can create memos." });
    }

    const newMemo = await Memo.create({
      title,
      content,
      createdBy: req.user.id,
      approvals: [],
      status: "Pending"
    });

    res.status(201).json(newMemo);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Edit Memo (Only the creator can edit)
exports.editMemo = async (req, res) => {
  try {
    const { memoId } = req.params;
    const { title, content } = req.body;

    const memo = await Memo.findById(memoId);
    if (!memo) return res.status(404).json({ message: "Memo not found" });

    if (req.user.id.toString() !== memo.createdBy.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this memo" });
    }

    memo.title = title || memo.title;
    memo.content = content || memo.content;
    memo.updatedAt = Date.now();
    await memo.save();

    res.json(memo);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Approve Memo with Digital Signature
exports.approveMemo = async (req, res) => {
  try {
    const { memoId } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const memo = await Memo.findById(memoId);
    if (!memo) return res.status(404).json({ message: "Memo not found" });

    // Generate digital signature using user's private key
    const sign = crypto.createSign("SHA256");
    sign.update(memo.content);
    sign.end();
    const digitalSignature = sign.sign(user.privateKey, "hex");

    // Prevent duplicate approvals
    const alreadyApproved = memo.approvals.some(approval => approval.approvedBy.toString() === user._id.toString());
    if (alreadyApproved) {
      return res.status(400).json({ message: "You have already approved this memo." });
    }

    // Add approval entry
    memo.approvals.push({
      role: user.role,
      approvedBy: user._id,
      digitalSignature,
    });

    if (memo.approvals.length >= 3) {
      memo.status = "Approved";
    }

    await memo.save();

    io.emit("memoUpdated", { memoId: memo._id, status: memo.status, approvals: memo.approvals });

    res.json({ message: "Memo approved successfully", memo });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

exports.verifySignatures = async (req, res) => {
  try {
    const { memoId } = req.params;
    const memo = await Memo.findById(memoId).populate("approvals.approvedBy");
    if (!memo) return res.status(404).json({ message: "Memo not found" });

    let valid = true;
    for (const approval of memo.approvals) {
      const user = approval.approvedBy;
      const verify = crypto.createVerify("SHA256");
      verify.update(memo.content);
      verify.end();
      const isValid = verify.verify(user.privateKey, approval.digitalSignature, "hex");

      if (!isValid) {
        valid = false;
        break;
      }
    }

    res.json({ isValid, message: valid ? "All signatures are valid" : "Invalid signatures found" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};


// Approve by Head of Department
exports.approveByHead = (req, res) => approveMemo(req, res, "Head_of_Department", "Approved by Head");

// Approve by AR of Faculty
exports.approveByAR = (req, res) => approveMemo(req, res, "AR_Faculty", "Approved by AR");

// Approve by Dean of Faculty
exports.approveByDean = (req, res) => approveMemo(req, res, "Dean_Faculty", "Approved by Dean");

// Approve by AR of Campus
exports.approveByCampusAR = (req, res) => approveMemo(req, res, "AR_Campus", "Approved by AR Campus");

// Faculty Board Decision
exports.facultyBoardDecision = async (req, res) => {
  try {
    const { memoId } = req.params;
    const { decision, signature } = req.body;

    if (!["Accepted", "Rejected"].includes(decision)) {
      return res.status(400).json({ message: "Invalid decision. Must be 'Accepted' or 'Rejected'." });
    }

    if (!signature) {
      return res.status(400).json({ message: "Signature is required for decision." });
    }

    const memo = await Memo.findById(memoId);
    if (!memo) return res.status(404).json({ message: "Memo not found" });

    memo.status = "Faculty Board Decision: " + decision;
    memo.facultyBoardDecision = { decision, signature };
    await memo.save();

    res.json(memo);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Campus Board Decision
exports.campusBoardDecision = async (req, res) => {
  try {
    const { memoId } = req.params;
    const { decision, signature } = req.body;

    if (!["Accepted", "Rejected"].includes(decision)) {
      return res.status(400).json({ message: "Invalid decision. Must be 'Accepted' or 'Rejected'." });
    }

    if (!signature) {
      return res.status(400).json({ message: "Signature is required for decision." });
    }

    const memo = await Memo.findById(memoId);
    if (!memo) return res.status(404).json({ message: "Memo not found" });

    memo.status = "Campus Board Decision: " + decision;
    memo.campusBoardDecision = { decision, signature };
    await memo.save();

    res.json(memo);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};


// Get Memo Status
exports.getMemoStatus = async (req, res) => {
  try {
    const { memoId } = req.params;
    const memo = await Memo.findById(memoId);
    if (!memo) return res.status(404).json({ message: "Memo not found" });

    res.json({
      title: memo.title,
      content: memo.content,
      status: memo.status,
      approvals: memo.approvals,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
