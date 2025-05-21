import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X, Paperclip } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
    const [text, setText] = useState("");
    const [filePreview, setFilePreview] = useState(null);
    const [fileType, setFileType] = useState("");
    const [fileName, setFileName] = useState("");
    const fileInputRef = useRef(null);
    const { sendMessage } = useChatStore();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFileName(file.name);

        if (file.type.startsWith("image/")) {
            setFileType("image");
        } else if (file.type.startsWith("video/")) {
            setFileType("video");
        } else if (file.type.startsWith("audio/")) {
            setFileType("audio");
        } else {
            setFileType("file");
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setFilePreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const removeFile = () => {
        setFilePreview(null);
        setFileType("");
        setFileName("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!text.trim() && !filePreview) return;

        try {
            await sendMessage({
                text: text.trim(),
                file: filePreview,
                fileType,
                fileName,
            });

            setText("");
            setFilePreview(null);
            setFileType("");
            setFileName("");
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    return (
        <div className="p-4 w-full">
            {filePreview && (
                <div className="mb-3 flex items-center gap-2">
                    <div className="relative">
                        {fileType === "image" && (
                            <img src={filePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-zinc-700" />
                        )}
                        {fileType === "video" && (
                            <video src={filePreview} controls className="w-32 h-20 rounded-lg border border-zinc-700" />
                        )}
                        {fileType === "audio" && (
                            <audio src={filePreview} controls className="w-32" />
                        )}
                        {fileType === "file" && (
                            <div className="p-2 border rounded bg-base-200">
                                <span>{fileName}</span>
                            </div>
                        )}
                        <button
                            onClick={removeFile}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
                            type="button"
                        >
                            <X className="size-3" />
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <div className="flex-1 flex gap-2">
                    <input
                        type="text"
                        className="w-full input input-bordered rounded-lg input-sm sm:input-md"
                        placeholder="Type a message..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                    <input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                    />
                    <button
                        type="button"
                        className="hidden sm:flex btn btn-circle text-zinc-400"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Paperclip size={20} />
                    </button>
                </div>
                <button
                    type="submit"
                    className="btn btn-sm btn-circle"
                    disabled={!text.trim() && !filePreview}
                >
                    <Send size={22} />
                </button>
            </form>
        </div>
    );
};

export default MessageInput;
