"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const AGENTS = {
  lexi: {
    name: "Lexi",
    subtitle: "Fashion & Story Companion",
    emoji: "✨",
    gradient: "from-rose-400 via-pink-400 to-fuchsia-500",
    bgGradient: "from-rose-50 via-pink-50 to-fuchsia-50",
    bubbleColor: "bg-gradient-to-br from-rose-100 to-pink-100",
    accentColor: "text-rose-500",
    borderColor: "border-rose-200",
    buttonBg: "bg-rose-500 hover:bg-rose-600",
    inputRing: "focus:ring-rose-300",
    avatarBg: "bg-gradient-to-br from-rose-400 to-fuchsia-500",
    kidName: "Emma",
  },
  kate: {
    name: "Kate",
    subtitle: "Fishing & Mechanics Companion",
    emoji: "🎣",
    gradient: "from-teal-400 via-cyan-400 to-blue-500",
    bgGradient: "from-teal-50 via-cyan-50 to-blue-50",
    bubbleColor: "bg-gradient-to-br from-teal-100 to-cyan-100",
    accentColor: "text-teal-500",
    borderColor: "border-teal-200",
    buttonBg: "bg-teal-500 hover:bg-teal-600",
    inputRing: "focus:ring-teal-300",
    avatarBg: "bg-gradient-to-br from-teal-400 to-blue-500",
    kidName: "Erik",
  },
} as const;

type AgentKey = keyof typeof AGENTS;
type Agent = (typeof AGENTS)[AgentKey];

interface Message {
  role: "user" | "assistant";
  content: string;
  time?: string;
  image?: string; // base64 or URL
}

interface ChatInterfaceProps {
  agentId: string;
}

function AgentAvatar({ agent, size = "md" }: { agent: Agent; size?: "sm" | "md" | "lg" }) {
  const sizeClasses =
    size === "lg"
      ? "w-14 h-14 text-2xl"
      : size === "md"
      ? "w-10 h-10 text-lg"
      : "w-8 h-8 text-sm";
  return (
    <div
      className={`${sizeClasses} ${agent.avatarBg} rounded-2xl flex items-center justify-center shadow-lg shadow-black/10 flex-shrink-0`}
    >
      <span>{agent.emoji}</span>
    </div>
  );
}

function TypingIndicator({ agent }: { agent: Agent }) {
  return (
    <div className="flex items-end gap-3 px-5">
      <AgentAvatar agent={agent} size="sm" />
      <div className={`${agent.bubbleColor} rounded-2xl rounded-bl-md px-4 py-3`}>
        <div className="flex gap-1.5 items-center h-5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-gray-400"
              style={{
                animation: "bounce 1.2s ease-in-out infinite",
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export default function ChatInterface({ agentId }: ChatInterfaceProps) {
  const agent = AGENTS[agentId as AgentKey];
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
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

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscript) {
            setInput(finalTranscript);
            setIsRecording(false);
          } else if (interimTranscript) {
            setInput(interimTranscript);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsRecording(false);
          if (event.error === "not-allowed") {
            alert("Microphone permission denied. Please allow access in your browser settings.");
          } else if (event.error === "no-speech") {
            // Silent timeout, just stop recording
          } else {
            alert(`Voice recognition error: ${event.error}`);
          }
        };

        recognitionRef.current.onend = () => {
          setIsRecording(false);
        };
      }
    }
  }, []);

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      alert("Voice input is not supported on this device.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSelectedImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const sendMessage = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMessage = input.trim();
    const imageToSend = selectedImage;
    const now = formatTime(new Date());
    setInput("");
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    setMessages((prev) => [...prev, { role: "user", content: userMessage || "", time: now, image: imageToSend || undefined }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chat/${agentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMessage || (imageToSend ? "What do you think of this?" : ""), 
          image: imageToSend 
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      const responseTime = formatTime(new Date());

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  assistantMessage += parsed.content;
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    if (newMessages[newMessages.length - 1]?.role === "assistant") {
                      newMessages[newMessages.length - 1].content = assistantMessage;
                    } else {
                      newMessages.push({ role: "assistant", content: assistantMessage, time: responseTime });
                    }
                    return newMessages;
                  });
                }
                if (parsed.count !== undefined) setMessageCount(parsed.count);
              } catch {
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
        { role: "assistant", content: "Sorry, I had trouble connecting. Try again?", time: formatTime(new Date()) },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!agent) return null;

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        * { -webkit-tap-highlight-color: transparent; }
        body { overscroll-behavior: none; }
      `}</style>

      <div className="flex flex-col h-screen bg-white">
        {/* Header */}
        <div className={`bg-gradient-to-r ${agent.gradient} px-5 pt-12 pb-5 shadow-lg`}>
          <div className="flex items-center gap-4">
            <Link
              href="/app"
              className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 active:scale-95 transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </Link>
            <AgentAvatar agent={{ ...agent, avatarBg: "bg-white/20 backdrop-blur-sm" } as unknown as Agent} size="lg" />
            <div className="flex-1">
              <h1 className="text-white font-bold text-xl" style={{ fontFamily: "'Nunito', sans-serif" }}>
                {agent.name}
              </h1>
              <p className="text-white/80 text-sm">{agent.subtitle}</p>
            </div>
            <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5">
              <div className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
              <span className="text-white/90 text-xs font-medium">Online</span>
            </div>
          </div>
          {messageCount >= 40 && (
            <p className="text-white/80 text-xs mt-2 text-center">
              {messageCount >= 50
                ? `${agent.name} is resting for today! Back tomorrow morning.`
                : `${50 - messageCount} messages left today`}
            </p>
          )}
        </div>

        {/* Messages */}
        <div className={`flex-1 overflow-y-auto bg-gradient-to-b ${agent.bgGradient} to-white`}>
          <div className="flex justify-center py-4">
            <span className="bg-white/80 backdrop-blur-sm text-gray-400 text-xs font-medium px-4 py-1.5 rounded-full shadow-sm">
              Today
            </span>
          </div>

          <div className="flex flex-col gap-4 pb-4">
            {messages.length === 0 && !isLoading && (
              <div className="text-center text-gray-400 mt-8 px-6">
                <p className="text-lg">Say hi to {agent.name}! {agent.emoji}</p>
              </div>
            )}
            {messages.map((msg, i) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={i}
                  className={`flex items-end gap-3 px-5 ${isUser ? "flex-row-reverse" : ""}`}
                  style={{ animation: i === messages.length - 1 ? "slideUp 0.3s ease-out" : "none" }}
                >
                  {!isUser && <AgentAvatar agent={agent} size="sm" />}
                  <div
                    className={`max-w-[75%] ${
                      isUser
                        ? "bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-2xl rounded-br-md"
                        : `${agent.bubbleColor} text-gray-800 rounded-2xl rounded-bl-md`
                    } px-4 py-3 shadow-sm`}
                  >
                    {msg.image && (
                      <img 
                        src={msg.image} 
                        alt="Uploaded" 
                        className="rounded-xl mb-2 max-w-full h-auto"
                        style={{ maxHeight: "300px" }}
                      />
                    )}
                    {msg.content && (
                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    )}
                    {msg.time && (
                      <p className={`text-[11px] mt-1.5 ${isUser ? "text-gray-400" : "text-gray-500"} text-right`}>
                        {msg.time}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            {isLoading && <TypingIndicator agent={agent} />}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-gray-100 bg-white px-4 py-3 pb-8">
          {/* Image preview */}
          {selectedImage && (
            <div className="mb-3 relative inline-block">
              <img 
                src={selectedImage} 
                alt="Preview" 
                className="rounded-xl max-h-32 border-2 border-gray-200"
              />
              <button
                onClick={removeSelectedImage}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 active:scale-95"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelect}
              className="hidden"
            />

            {/* Image button */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="w-12 h-12 rounded-2xl flex items-center justify-center bg-gray-100 text-gray-500 hover:bg-gray-200 active:scale-95 transition-all duration-200 disabled:opacity-50"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </button>

            {/* Voice button */}
            <button
              onClick={toggleVoiceRecording}
              disabled={isLoading}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 relative ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600 text-white scale-110 shadow-lg"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200 active:scale-95"
              } disabled:opacity-50`}
            >
              {isRecording ? (
                <div className="w-5 h-5 rounded-sm bg-white" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                </svg>
              )}
              {isRecording && (
                <span className="absolute inset-0 rounded-2xl animate-ping opacity-20 bg-red-500" />
              )}
            </button>

            {/* Text input */}
            <div className="flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder={`Message ${agent.name}...`}
                disabled={isLoading || messageCount >= 50}
                className={`w-full bg-gray-100 rounded-2xl px-5 py-3.5 text-[15px] text-gray-800 placeholder-gray-400 outline-none ring-2 ring-transparent ${agent.inputRing} transition-all duration-200 disabled:opacity-50`}
              />
            </div>

            {/* Send button */}
            <button
              onClick={sendMessage}
              disabled={(!input.trim() && !selectedImage) || isLoading || messageCount >= 50}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                (input.trim() || selectedImage)
                  ? `${agent.buttonBg} text-white shadow-lg active:scale-95`
                  : "bg-gray-100 text-gray-300"
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>

          {isRecording && (
            <button 
              onClick={toggleVoiceRecording}
              className={`mt-3 w-full flex items-center justify-center gap-3 ${agent.buttonBg} text-white rounded-2xl px-4 py-4 active:scale-95 transition-all`}
            >
              <div className="w-4 h-4 rounded-sm bg-white animate-pulse" />
              <span className="text-base font-semibold">Tap to stop listening</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
