import React, { useState, useEffect } from "react";
import CyberGrid from "@/components/CyberGrid";
import CyberNav from "@/components/CyberNav";
import CyberFooter from "@/components/CyberFooter";

const ChatPage = () => {
  const [messages, setMessages] = useState<
    Array<{ id: string; message: string; userId: string; timestamp: string }>
  >([]);
  const [newMessage, setNewMessage] = useState("");

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "") return;

    const message = {
      id: Date.now().toString(),
      message: newMessage,
      userId: "current_user",
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage("");
  };

  return (
    <div className="min-h-screen bg-dark-bg text-foreground relative overflow-hidden flex flex-col">
      <CyberGrid />
      <CyberNav />
      <div className="relative z-10 pt-24 pb-16 px-4 flex-grow max-w-2xl mx-auto w-full">
        <h1 className="text-4xl font-mono font-black text-cyber-green mb-8 text-center animate-pulse">
          COMMUNITY CHAT
        </h1>
        <div className="flex flex-col h-[70vh] bg-black/50 backdrop-blur-sm border border-cyber-green/30 rounded-lg p-4 space-y-4">
          <div className="flex-grow overflow-y-auto space-y-4 pr-2">
            {messages.map((msg) => (
              <div key={msg.id} className="flex flex-col">
                <span className="text-xs font-mono mb-1 text-cyber-blue">
                  User: {msg.userId}
                </span>
                <div className="p-3 rounded-lg max-w-[75%] font-mono text-sm bg-cyber-blue/20 border border-cyber-blue/30 self-start">
                  {msg.message}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} className="flex mt-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-grow px-4 py-3 bg-black border border-cyber-green/30 text-cyber-green font-mono rounded-l focus:outline-none focus:border-cyber-purple"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-cyber-green/20 border border-cyber-green text-cyber-green font-mono font-bold tracking-wider hover:bg-cyber-green hover:text-black transition-all duration-300 rounded-r"
            >
              SEND
            </button>
          </form>
        </div>
      </div>
      <CyberFooter />
    </div>
  );
};

export default ChatPage;
