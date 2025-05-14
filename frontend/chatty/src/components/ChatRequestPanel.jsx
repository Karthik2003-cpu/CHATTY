import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import toast from "react-hot-toast";

const ChatRequestPanel = () => {
  const { users, getUsers } = useChatStore();
  const { authUser } = useAuthStore();
  const [sentRequests, setSentRequests] = useState(
    JSON.parse(localStorage.getItem("sentRequests")) || {}
  );

  const sendChatRequest = async (receiverId) => {
    try {
      const res = await axiosInstance.post("/chat-requests", { receiverId });
      setSentRequests((prev) => {
        const updated = { ...prev, [receiverId]: "pending" };
        localStorage.setItem("sentRequests", JSON.stringify(updated));
        return updated;
      });
      toast.success("Chat request sent!");
    } catch (error) {
      toast.error("Failed to send chat request.");
    }
  };

  return (
    <div>
      <h2>Send Chat Request</h2>
      <ul>
        {users.map((user) => (
          <li key={user._id}>
            <span>{user.fullName}</span>
            {sentRequests[user._id] === "pending" ? (
              <span>Request Sent</span>
            ) : (
              <button onClick={() => sendChatRequest(user._id)}>Send Request</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChatRequestPanel;