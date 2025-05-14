import { React, useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { formatMessageTime } from "../lib/utils";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    selectedUser,
    isMessagesLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser, socket } = useAuthStore();
  const messageEndRef = useRef(null);
  const [hasMessages, setHasMessages] = useState(false);
  const [requestStatus, setRequestStatus] = useState("none");

  useEffect(() => {
    if (selectedUser) {
      // Check chat request status
      const checkStatus = async () => {
        try {
          const res = await axiosInstance.get(`/chat-requests/status/${selectedUser._id}`);
          setRequestStatus(res.data.status);
        } catch (error) {
          console.error("Error checking chat request status:", error);
        }
      };
      checkStatus();

      getMessages(selectedUser._id).then((fetchedMessages) => {
        setHasMessages(fetchedMessages.length > 0);
      });
      subscribeToMessages();
    }

    return () => unsubscribeFromMessages();
  }, [selectedUser, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Listen for chat request status changes
  useEffect(() => {
    if (!socket || !selectedUser) return;

    const handleRequestAccepted = (request) => {
      if (request.senderId === selectedUser._id || request.receiverId === selectedUser._id) {
        setRequestStatus("accepted");
      }
    };

    const handleRequestRejected = (request) => {
      if (request.senderId === selectedUser._id || request.receiverId === selectedUser._id) {
        setRequestStatus("rejected");
      }
    };

    socket.on("chatRequestAccepted", handleRequestAccepted);
    socket.on("chatRequestRejected", handleRequestRejected);

    return () => {
      socket.off("chatRequestAccepted", handleRequestAccepted);
      socket.off("chatRequestRejected", handleRequestRejected);
    };
  }, [socket, selectedUser]);

  const handleSendChatRequest = async () => {
    try {
      await axiosInstance.post("/chat-requests", { receiverId: selectedUser._id });
      setRequestStatus("pending");
      toast.success("Chat request sent!");
      socket.emit("chatRequestSent", {
        senderId: authUser._id,
        receiverId: selectedUser._id,
      });
    } catch (error) {
      console.error("Error sending chat request:", error.message);
      toast.error("Failed to send chat request.");
    }
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  const renderContent = () => {
    if (!selectedUser) return null;

    if (requestStatus === "accepted" || hasMessages) {
      return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message._id}
              className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
              ref={messageEndRef}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={
                      message.senderId === authUser._id
                        ? authUser.profilePic || "/avatar.png"
                        : selectedUser.profilePic || "/avatar.png"
                    }
                    alt="profile pic"
                  />
                </div>
              </div>
              <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>
              <div className="chat-bubble flex flex-col">
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2"
                  />
                )}
                {message.text && <p>{message.text}</p>}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (requestStatus === "pending") {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-gray-500 mb-4">Waiting for {selectedUser.fullName} to accept your chat request...</p>
        </div>
      );
    }

    if (requestStatus === "rejected") {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-gray-500 mb-4">Your chat request was rejected by {selectedUser.fullName}.</p>
          <button className="btn btn-primary" onClick={handleSendChatRequest}>
            Send New Request
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-gray-500 mb-4">No messages yet with {selectedUser.fullName}.</p>
        <button className="btn btn-primary" onClick={handleSendChatRequest}>
          Send Chat Request
        </button>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />
      {renderContent()}
      {requestStatus === "accepted" && <MessageInput />}
    </div>
  );
};

export default ChatContainer;