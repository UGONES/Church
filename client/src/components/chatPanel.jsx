// src/components/ChatPanel.jsx
import React, { useEffect, useState, useRef } from "react";
import { connectSocket, getSocket } from "../utils/socket";
import useAuth from "../hooks/useAuth";

const ChatPanel = ({ label = "✉ Private Message" }) => {
  const [publicMessages, setPublicMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [privateText, setPrivateText] = useState("");
  const [showPrivate, setShowPrivate] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const listRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    const token = user?.token || null;
    const socket = connectSocket({ token });

    // Socket connection events
    socket.on("connect", () => {
      console.log("✅ ChatPanel: Socket connected");
      setIsConnected(true);
      socket.emit("join:public");
      if (user && user._id) {
        socket.emit("identify", { userId: user._id });
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ ChatPanel: Socket disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ ChatPanel: Socket connection error:", error);
      setIsConnected(false);
    });

    // Message events
    socket.on("public:message", (msg) => {
      console.log("📨 ChatPanel: Received public message:", msg);
      setPublicMessages(prev => [...prev, msg]);
      // Auto-scroll to bottom
      setTimeout(() => {
        listRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end' 
        });
      }, 100);
    });

    socket.on("public:history", (msgs) => {
      console.log("📚 ChatPanel: Received message history:", msgs);
      setPublicMessages(msgs || []);
    });

    // Private message events
    socket.on("private:sent", (data) => {
      console.log("✅ ChatPanel: Private message sent successfully:", data);
      alert.success("Private message sent to admin!");
    });

    socket.on("error", (error) => {
      console.error("❌ ChatPanel: Socket error:", error);
      alert.error(error.message || "An error occurred");
    });

    return () => {
      // Cleanup on unmount
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("public:message");
      socket.off("public:history");
      socket.off("private:sent");
      socket.off("error");
    };
  }, [user]);

  // ✅ FIXED: Enhanced send public message function
  const sendPublic = () => {
    if (!message.trim()) {
      alert.warning("Please enter a message");
      return;
    }

    if (!user) {
      alert.info("Please log in to send messages");
      return;
    }

    const socket = getSocket();
    if (!socket || !socket.connected) {
      alert.error("Connection lost. Please refresh the page.");
      return;
    }

    try {
      const messageData = {
        text: message.trim(),
        user: { 
          id: user._id || user.id, 
          name: user.name, 
          avatar: user.avatar || null 
        },
        date: new Date().toISOString()
      };

      console.log("📤 ChatPanel: Sending public message:", messageData);
      socket.emit("public:send", messageData);
      setMessage(""); // Clear input after sending
      
    } catch (error) {
      console.error("❌ ChatPanel: Error sending public message:", error);
      alert.error("Failed to send message");
    }
  };

  // ✅ FIXED: Enhanced send private message function
  const sendPrivateToAdmin = () => {
    if (!privateText.trim()) {
      alert.warning("Please enter a private message");
      return;
    }

    if (!user) {
      alert.info("Please log in to send private messages");
      return;
    }

    const socket = getSocket();
    if (!socket || !socket.connected) {
      alert.error("Connection lost. Please refresh the page.");
      return;
    }

    try {
      const privateMessageData = {
        toRole: "admin",
        text: privateText.trim(),
        user: { 
          id: user._id || user.id, 
          name: user.name, 
          email: user.email 
        },
        date: new Date().toISOString()
      };

      console.log("📤 ChatPanel: Sending private message:", privateMessageData);
      socket.emit("private:send", privateMessageData);
      setPrivateText(""); // Clear textarea
      setShowPrivate(false); // Close modal
      
    } catch (error) {
      console.error("❌ ChatPanel: Error sending private message:", error);
      alert.error("Failed to send private message");
    }
  };

  // ✅ FIXED: Handle Enter key for public messages
  const handlePublicKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent new line in input
      sendPublic();
    }
  };

  // ✅ FIXED: Handle Enter key for private messages (with Shift+Enter for new line)
  const handlePrivateKeyDown = (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      // Ctrl+Enter to send
      e.preventDefault();
      sendPrivateToAdmin();
    } else if (e.key === "Enter" && !e.shiftKey) {
      // Enter to send (without Shift)
      e.preventDefault();
      sendPrivateToAdmin();
    }
    // Shift+Enter allows new line (default behavior)
  };

  // Auto-scroll when messages change
  useEffect(() => {
    if (publicMessages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end' 
        });
      }, 100);
    }
  }, [publicMessages]);

  return (
    <div className="bg-white rounded-lg shadow p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold">Public Chat</h4>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} 
               title={isConnected ? 'Connected' : 'Disconnected'} />
        </div>
        <button
          className="text-sm text-[#FF7E45] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => setShowPrivate(true)}
          disabled={!user}
          title={!user ? "Login to send private messages" : "Send private message to admin"}
        >
          {label}
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-auto mb-3 border rounded p-3 bg-gray-50 min-h-[200px] max-h-[300px]">
        {publicMessages.length === 0 ? (
          <div className="text-gray-400 text-sm h-full flex items-center justify-center">
            No messages yet — be the first to chat!
          </div>
        ) : (
          <div className="space-y-2">
            {publicMessages.map((m, idx) => (
              <div key={idx} className="p-2 rounded hover:bg-gray-100 transition-colors">
                <div className="flex items-start gap-2">
                  {/* User Avatar/Initial */}
                  <div className="w-6 h-6 bg-[#FF7E45] text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                    {m.user?.name?.charAt(0)?.toUpperCase() || 'G'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <div className="text-sm font-semibold text-gray-800">
                        {m.user?.name || "Guest"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(m.date).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                    <div className="text-sm text-gray-700 mt-1 break-words">
                      {m.text}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={listRef} /> {/* Scroll anchor */}
          </div>
        )}
      </div>

      {/* Public Message Input */}
      <div className="space-y-2">
        <div className="text-xs text-gray-500 flex justify-between">
          <span>
            {user ? "Type your message below" : "Login to participate in chat"}
          </span>
          <span>
            {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
          </span>
        </div>
        <div className="flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handlePublicKeyDown}
            className="form-input flex-1 text-gray-600 disabled:bg-gray-100 disabled:cursor-not-allowed"
            placeholder={user ? "Type your message... (Press Enter to send)" : "Please login to chat"}
            disabled={!user || !isConnected}
          />
          <button
            className={`px-4 py-2 rounded font-medium transition-colors ${
              user && isConnected 
                ? 'bg-[#FF7E45] text-white hover:bg-[#F4B942]' 
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
            onClick={sendPublic}
            disabled={!user || !isConnected || !message.trim()}
            title={!user ? "Please login" : !isConnected ? "Connecting..." : "Send message"}
          >
            Send
          </button>
        </div>
      </div>

      {/* Private Message Modal */}
      {showPrivate && (
        <div className="fixed inset-0 bg-[#333333e9] bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-lg">✉ Private Message to Admin</h4>
              <button 
                onClick={() => setShowPrivate(false)} 
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            {!user ? (
              <div className="text-center py-6">
                <i className="fas fa-exclamation-triangle text-yellow-500 text-2xl mb-3"></i>
                <p className="text-gray-600 mb-4">Only registered users can send private messages.</p>
                <button 
                  onClick={() => setShowPrivate(false)}
                  className="btn btn-primary"
                >
                  Close
                </button>
              </div>
            ) : !isConnected ? (
              <div className="text-center py-6">
                <i className="fas fa-wifi text-red-500 text-2xl mb-3"></i>
                <p className="text-gray-600 mb-4">Connection lost. Please refresh the page and try again.</p>
                <button 
                  onClick={() => setShowPrivate(false)}
                  className="btn btn-primary"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Message to Admin
                  </label>
                  <textarea
                    value={privateText}
                    onChange={(e) => setPrivateText(e.target.value)}
                    onKeyDown={handlePrivateKeyDown}
                    rows={4}
                    className="form-input w-full text-gray-600 resize-none"
                    placeholder="Type your private message to the admin... (Press Enter to send, Shift+Enter for new line)"
                    autoFocus
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Press Enter to send • Shift+Enter for new line
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <button 
                    className="btn btn-outline border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={() => setShowPrivate(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-primary bg-[#FF7E45] hover:bg-[#F4B942] text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                    onClick={sendPrivateToAdmin}
                    disabled={!privateText.trim()}
                  >
                    Send Private Message
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPanel;