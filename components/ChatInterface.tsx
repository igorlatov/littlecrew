"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  agentId: string;
  agentName: string;
  agentColor: "purple" | "blue";
  agentEmoji: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function ChatInterface({
  agentId,
  agentName,
  agentColor,
  agentEmoji,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const colorClasses = {
    purple: {
      bg: "bg-purple-600",
      border: "border-purple-500",
      hover: "hover:bg-purple-700",
    },
    blue: {
      bg: "bg-blue-600",
      border: "border-blue-500",
      hover: "hover:bg-blue-700",
    },
  };

  const colors = colorClasses[agentColor];

  useEffect(() => {
    // Load chat history
    fetch(`${API_URL}/api/history/${agentId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.messages) {
          setMessages(data.messages);
        }
        if (data.count !== undefined) {
          setMessageCount(data.count);
        }
      })
      .catch((err) => console.error("Failed to load history:", err));
  }, [agentId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chat/${agentId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                continue;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  assistantMessage += parsed.content;
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    if (
                      newMessages[newMessages.length - 1]?.role === "assistant"
                    ) {
                      newMessages[newMessages.length - 1].content =
                        assistantMessage;
                    } else {
                      newMessages.push({
                        role: "assistant",
                        content: assistantMessage,
                      });
                    }
                    return newMessages;
                  });
                }
                if (parsed.count !== undefined) {
                  setMessageCount(parsed.count);
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I had trouble connecting. Try again?",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className={`${colors.bg} p-4 flex items-center gap-4 shadow-lg`}>
        <Link
          href="/app"
          className="text-2xl hover:opacity-80 transition-opacity p-2"
        >
          ←
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-2xl">
            {agentEmoji}
          </div>
          <div>
            <h1 className="text-xl font-bold">{agentName}</h1>
            {messageCount >= 40 && (
              <p className="text-xs text-white/80">
                {messageCount >= 50
                  ? "Daily limit reached - back tomorrow!"
                  : `${50 - messageCount} messages left today`}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 mt-8">
            <p className="text-lg">Say hi to {agentName}!</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-lg flex-shrink-0">
                {agentEmoji}
              </div>
            )}
            <div
              className={`max-w-[80%] md:max-w-[70%] p-4 rounded-2xl ${
                msg.role === "user"
                  ? "bg-slate-700 text-white"
                  : "bg-slate-800 text-slate-100"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-lg">
              {agentEmoji}
            </div>
            <div className="bg-slate-800 p-4 rounded-2xl">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 border-t border-slate-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${agentName}...`}
            disabled={isLoading || messageCount >= 50}
            className="flex-1 px-4 py-3 bg-slate-800 text-white rounded-2xl border border-slate-700 focus:outline-none focus:border-slate-600 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || messageCount >= 50}
            className={`px-6 py-3 ${colors.bg} ${colors.hover} text-white rounded-2xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[80px]`}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
