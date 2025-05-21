import ChatRequest from "../models/chatRequest.models.js";
import User from "../models/user.models.js";
import { io, getReceiverSocketId } from "../lib/socket.js";

export const sendChatRequest = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user._id;

    const existingRequest = await ChatRequest.findOne({
      senderId,
      receiverId,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({ msg: "Chat request already sent." });
    }

    const chatRequest = new ChatRequest({ senderId, receiverId });
    await chatRequest.save();
    const populatedRequest = await ChatRequest.findById(chatRequest._id).populate("senderId", "fullName profilePic");


    // Emit socket event for real-time notification
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newChatRequest", {
        requestId: chatRequest._id,
        senderId,
        receiverId,
        status: "pending",
        createdAt: chatRequest.createdAt
      });
      res.status(201).json(populatedRequest);
      return;
    }

    res.status(201).json(chatRequest);
  } catch (error) {
    console.error("Error sending chat request:", error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

export const acceptChatRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const chatRequest = await ChatRequest.findByIdAndUpdate(
      requestId,
      { status: "accepted" },
      { new: true }
    );

    if (!chatRequest) {
      return res.status(404).json({ msg: "Chat request not found." });
    }

    // Emit socket event for real-time notification
    const senderSocketId = getReceiverSocketId(chatRequest.senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("chatRequestAccepted", {
        requestId: chatRequest._id,
        senderId: chatRequest.senderId,
        receiverId: chatRequest.receiverId,
        status: "accepted",
        updatedAt: chatRequest.updatedAt
      });
    }

    res.status(200).json(chatRequest);
  } catch (error) {
    console.error("Error accepting chat request:", error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

export const getChatRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const chatRequests = await ChatRequest.find({ receiverId: userId, status: "pending" })
      .populate("senderId", "fullName profilePic")
      .sort({ createdAt: -1 });

    res.status(200).json(chatRequests);
  } catch (error) {
    console.error("Error fetching chat requests:", error.message);
    res.status(500).json({ msg: "Internal server error" });
  }
};

export const rejectChatRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const chatRequest = await ChatRequest.findByIdAndUpdate(
      requestId,
      { status: "rejected" },
      { new: true }
    );

    if (!chatRequest) {
      return res.status(404).json({ msg: "Chat request not found." });
    }

    // Emit socket event for real-time notification
    const senderSocketId = getReceiverSocketId(chatRequest.senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("chatRequestRejected", {
        requestId: chatRequest._id,
        senderId: chatRequest.senderId,
        receiverId: chatRequest.receiverId,
        status: "rejected",
        updatedAt: chatRequest.updatedAt
      });
    }

    res.status(200).json(chatRequest);
  } catch (error) {
    console.error("Error rejecting chat request:", error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

export const checkChatRequestStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    const chatRequest = await ChatRequest.findOne({
      $or: [
        { senderId: myId, receiverId: userId },
        { senderId: userId, receiverId: myId }
      ]
    }).sort({ createdAt: -1 });

    if (!chatRequest) {
      return res.status(200).json({ status: "none" });
    }

    res.status(200).json({ status: chatRequest.status });
  } catch (error) {
    console.error("Error checking chat request status:", error);
    res.status(500).json({ msg: "Internal server error" });
  }
};

export const getAcceptedChatUsers = async (req, res) => {
    try {
        const myId = req.user._id;

        // Find accepted chat requests where the user is sender or receiver
        const acceptedRequests = await ChatRequest.find({
            status: "accepted",
            $or: [{ senderId: myId }, { receiverId: myId }]
        });

        // Get the other user's IDs
        const userIds = acceptedRequests.map(r =>
            r.senderId.toString() === myId.toString() ? r.receiverId : r.senderId
        );

        // Get user details (no message check)
        const users = await User.find({ _id: { $in: userIds } }).select("-password");
        res.status(200).json(users);
    } catch (error) {
        console.error("Error in getAcceptedChatUsers:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};