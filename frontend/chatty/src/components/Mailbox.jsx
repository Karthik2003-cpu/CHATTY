import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Bell } from "lucide-react";

const Mailbox = () => {
  const { socket, authUser } = useAuthStore();
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!authUser) return;

    const fetchRequests = async () => {
      try {
        const res = await axiosInstance.get("/chat-requests");
        setIncomingRequests(res.data);
      } catch (error) {
        console.error("Error fetching chat requests:", error.message);
      }
    };

    fetchRequests();

    if (socket) {
      socket.on("newChatRequest", (request) => {
        setIncomingRequests((prev) => [...prev, request]);
      });

      socket.on("chatRequestAccepted", (request) => {
        setIncomingRequests((prev) =>
          prev.filter((req) => req._id !== request.requestId)
        );
      });

      socket.on("chatRequestRejected", (request) => {
        setIncomingRequests((prev) =>
          prev.filter((req) => req._id !== request.requestId)
        );
      });

      return () => {
        socket.off("newChatRequest");
        socket.off("chatRequestAccepted");
        socket.off("chatRequestRejected");
      };
    }
  }, [socket, authUser]);

  const handleAccept = async (requestId) => {
    try {
      await axiosInstance.put(`/chat-requests/${requestId}/accept`);
      setIncomingRequests((prev) =>
        prev.filter((request) => request._id !== requestId)
      );
      toast.success("Chat request accepted!");
    } catch (error) {
      console.error("Error accepting chat request:", error.message);
      toast.error("Failed to accept chat request.");
    }
  };

  const handleReject = async (requestId) => {
    try {
      await axiosInstance.put(`/chat-requests/${requestId}/reject`);
      setIncomingRequests((prev) =>
        prev.filter((request) => request._id !== requestId)
      );
      toast.success("Chat request rejected!");
    } catch (error) {
      console.error("Error rejecting chat request:", error.message);
      toast.error("Failed to reject chat request.");
    }
  };

  if (!authUser) return null;

  return (
    <div className="relative">
      <button 
        className="btn btn-sm btn-circle relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-4 h-4" />
        {incomingRequests.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-primary-content text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {incomingRequests.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-base-100 shadow-lg rounded-lg p-4 z-50 border border-base-300">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Chat Requests</h3>
            <button 
              className="btn btn-ghost btn-xs"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </div>
          
          {incomingRequests.length === 0 ? (
            <p className="text-sm text-base-content/70 text-center py-4">
              No pending requests
            </p>
          ) : (
            <ul className="space-y-2 max-h-[300px] overflow-y-auto">
              {incomingRequests.map((request) => (
                <li 
                  key={request._id} 
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-base-200"
                >
                  <div className="flex items-center gap-2">
                    <div className="avatar">
                      <div className="w-8 h-8 rounded-full">
                        <img 
                          src={request.senderId.profilePic || "/avatar.png"} 
                          alt={request.senderId.fullName}
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{request.senderId.fullName}</p>
                      <p className="text-xs text-base-content/70">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      className="btn btn-xs btn-success"
                      onClick={() => handleAccept(request._id)}
                    >
                      Accept
                    </button>
                    <button
                      className="btn btn-xs btn-error"
                      onClick={() => handleReject(request._id)}
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default Mailbox;