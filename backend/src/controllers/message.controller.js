import User from '../models/user.models.js';
import Message from '../models/message.models.js';
import cloudinary from '../lib/cloudinary.js';
import { getReceiverSocketId, io } from '../lib/socket.js';

export const getUserForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        console.log("Logged in user ID:", loggedInUserId);

        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

        res.status(200).json(filteredUsers);
    } catch (error) {
        console.error("Error in message controller:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const getMessage = async (req, res) => {
    try {
        const { id: userToChatId } = req.params
        const myId = req.user._id;

        const message = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId },
            ]

        });
        res.status(200).json(message);
    } catch (error) {
        console.error("Error in message controller:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { text, file, fileType, fileName } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        let fileUrl;
        if (file) {
            let resourceType = "auto";
            if (fileType === "video") resourceType = "video";
            else if (fileType === "audio") resourceType = "video";
            else if (fileType === "file") resourceType = "raw"; // <-- THIS IS THE KEY LINE

            const uploadResponse = await cloudinary.uploader.upload(file, {
                resource_type: resourceType
            });
            fileUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            fileUrl,
            fileType,
            fileName
        });

        await newMessage.save();

        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Error in message controller:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};