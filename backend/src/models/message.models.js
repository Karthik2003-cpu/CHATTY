import mongoose from "mongoose";
const messageSchema = new mongoose.Schema({
    senderId: {
        type: String,
        ref: "User",
        required: true
    },
    receiverId: {
        type: String,
        ref: "User",
        required: true
    },
    text: {
        type: String,
    },
    fileUrl: {
        type: String,
    },
    fileType: {
        type: String, // e.g. "image", "video", "audio", "file"
    },
    fileName: {
        type: String,
    }
},
{timestamps: true});

const Message = mongoose.model("Message", messageSchema);
export default Message;