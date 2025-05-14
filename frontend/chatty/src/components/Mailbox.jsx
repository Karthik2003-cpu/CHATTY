import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const Mailbox = () => {
  const { socket } = useAuthStore();
  const [incomingRequests, setIncomingRequests] = useState([]);

  useEffect(() => {
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
      socket.on("chatRequestSent", (request) => {
        setIncomingRequests((prev) => [...prev, request]);
      });

      return () => {
        socket.off("chatRequestSent");
      };
    }
  }, [socket]);

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

  return (
    <div className="relative">
      <button className="btn btn-sm btn-circle">
        <span className="badge badge-primary">{incomingRequests.length}</span>
      </button>
      <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg rounded-lg p-4">
        <h3 className="text-sm font-bold mb-2">Incoming Requests</h3>
        {incomingRequests.length === 0 ? (
          <p className="text-sm text-gray-500">No new requests</p>
        ) : (
          <ul className="space-y-2">
            {incomingRequests.map((request) => (
              <li key={request._id} className="flex items-center justify-between">
                <span className="text-sm font-medium">{request.senderId.fullName}</span>
                <div className="flex gap-2">
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
    </div>
  );
};

export default Mailbox;