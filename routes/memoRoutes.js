const express = require("express");
const { authMiddleware, authorizeRoles } = require("../middleware/authMiddleware");
const {
  createMemo,
  editMemo,
  approveByHead,
  approveByAR,
  facultyBoardDecision,
  approveByDean,
  approveByCampusAR,
  campusBoardDecision,
  getMemoStatus,
} = require("../controllers/memoController");

const router = express.Router();

// Only "CAA_Department" and "CAA_Faculty" can create memos
router.post("/create", authMiddleware, authorizeRoles(["CAA_Department", "CAA_Faculty"]), createMemo);

// Edit a memo (Only CAA_Department and Head_Department can edit)
router.put("/edit/:memoId", authMiddleware, authorizeRoles(["CAA_Department", "Head_Department"]), editMemo);

// Approve memo at different levels (Signature Required)
router.put("/approve-head/:memoId", authMiddleware, authorizeRoles(["Head_Department"]), approveByHead);
router.put("/approve-ar/:memoId", authMiddleware, authorizeRoles(["AR_Faculty"]), approveByAR);
router.put("/faculty-board/:memoId", authMiddleware, authorizeRoles(["Faculty Board"]), facultyBoardDecision);
router.put("/approve-dean/:memoId", authMiddleware, authorizeRoles(["Dean_Faculty"]), approveByDean);
router.put("/approve-campus-ar/:memoId", authMiddleware, authorizeRoles(["AR_Campus"]), approveByCampusAR);
router.put("/campus-board/:memoId", authMiddleware, authorizeRoles(["Campus Board"]), campusBoardDecision);

// Get memo status (Any authenticated user)
router.get("/status/:memoId", authMiddleware, getMemoStatus);

// Get memo status (Any authenticated user)
router.get("/status/:memoId", authMiddleware, getMemoStatus);

module.exports = router;
