import express from "express";
import protectRoute from "../middleware/auth.middleware.js";
import {
  sendChatRequest,
  acceptChatRequest,
  rejectChatRequest,
  getChatRequests,
  checkChatRequestStatus,
} from "../controllers/chatRequest.controller.js";

const router = express.Router();

router.post("/", protectRoute, sendChatRequest);
router.get("/", protectRoute, getChatRequests);
router.get("/status/:userId", protectRoute, checkChatRequestStatus);
router.put("/:requestId/accept", protectRoute, acceptChatRequest);
router.put("/:requestId/reject", protectRoute, rejectChatRequest);

export default router;