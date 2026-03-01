"use client";

import { useState, useEffect, useRef } from "react";
import { useConversation } from "@elevenlabs/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface CallScreenProps {
  agentId: string;
  agentName: string;
  gradient: string;
  emoji: string;
  onEnd: () => void;
}

interface TranscriptMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export default function CallScreen({
  agentId,
  agentName,
  gradient,
  emoji,
  onEnd,
}: CallScreenProps) {
  const [callState, setCallState] = useState<"permission" | "connecting" | "active">("permission");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [lastAgentMessage, setLastAgentMessage] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [textInput, setTextInput] = useState("");
  const conversationRef = useRef<any>(null);

  const elevenLabsAgentId =
    agentId === "lexi"
      ? process.env.NEXT_PUBLIC_LEXI_AGENT_ID
      : process.env.NEXT_PUBLIC_KATE_AGENT_ID;

  // Timer
  useEffect(() => {
    if (startTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedTime(elapsed);

        // 8-minute warning (480 seconds = 8 minutes, 10 min limit)
        if (elapsed === 480 && !showWarning) {
          setShowWarning(true);
          setTimeout(() => setShowWarning(false), 5000);
        }

        // Auto-end at 10 minutes
        if (elapsed >= 600) {
          handleEndCall();
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [startTime, showWarning]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const conversation = useConversation({
    onConnect: () => {
      console.log("[CALL] Connected");
      setCallState("active");
      setStartTime(Date.now());
    },
    onDisconnect: () => {
      console.log("[CALL] Disconnected");
    },
    onMessage: (message) => {
      console.log("[CALL] Message:", message);
      
      const msg: TranscriptMessage = {
        role: message.source === "ai" ? "assistant" : "user",
        content: message.message || "",
        timestamp: Date.now(),
      };

      setTranscript((prev) => [...prev, msg]);

      if (msg.role === "assistant" && msg.content) {
        setLastAgentMessage(msg.content);
      }
    },
    onError: (error) => {
      console.error("[CALL] Error:", error);
      alert(`Call error: ${error}`);
      handleEndCall();
    },
    onModeChange: (mode) => {
      // mode.mode can be "speaking" or "listening"
      setIsSpeaking(mode.mode === "speaking");
    },
  });

  conversationRef.current = conversation;

  const startCall = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());

      setCallState("connecting");

      // Fetch memory and build system prompt
      const memoryRes = await fetch(`${API_URL}/api/memory/${agentId}`);
      const memory = await memoryRes.json();

      // Build voice-optimized system prompt
      const voiceInstructions = `
You are ${agentName}, talking to a kid on a voice call.

VOICE CALL RULES:
- Keep responses SHORT (1-3 sentences max)
- Be conversational, not lecture-y
- Ask ONE question at a time
- Use natural filler like "hmm", "oh!", "right right"
- Speak like you're talking to a friend, not giving a presentation
- Don't use em-dashes, complex punctuation, or formal language

${memory.summary ? `WHAT YOU REMEMBER:\n${memory.summary}\n` : ""}
`;

      // Get signed URL from backend
      const signedUrlRes = await fetch(`${API_URL}/api/voice/signed-url/${agentId}`);
      const signedUrlData = await signedUrlRes.json();
      
      if (!signedUrlData.signedUrl) {
        throw new Error("Failed to get signed URL");
      }

      // Start the conversation with signed URL
      await conversation.startSession({
        signedUrl: signedUrlData.signedUrl,
      });
    } catch (error: any) {
      console.error("[CALL] Start failed:", error);
      if (error.name === "NotAllowedError") {
        alert("Microphone permission denied. Please allow access and try again.");
      } else {
        alert(`Failed to start call: ${error.message}`);
      }
      onEnd();
    }
  };

  const handleEndCall = async () => {
    if (conversationRef.current) {
      await conversationRef.current.endSession();
    }

    const duration = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;

    // Save transcript to backend
    if (transcript.length > 0) {
      try {
        await fetch(`${API_URL}/api/transcript/${agentId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript,
            duration,
          }),
        });
      } catch (error) {
        console.error("[CALL] Failed to save transcript:", error);
      }
    }

    // Log call duration
    try {
      await fetch(`${API_URL}/api/voice/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          duration_seconds: duration,
        }),
      });
    } catch (error) {
      console.error("[CALL] Failed to log duration:", error);
    }

    onEnd();
  };

  const toggleMute = () => {
    if (conversationRef.current) {
      if (isMuted) {
        conversationRef.current.unmute();
      } else {
        conversationRef.current.mute();
      }
      setIsMuted(!isMuted);
    }
  };

  const sendTextMessage = () => {
    if (textInput.trim() && conversationRef.current) {
      conversationRef.current.sendText(textInput.trim());
      setTextInput("");
    }
  };

  // Permission screen
  if (callState === "permission") {
    return (
      <div className={`fixed inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center z-50`}>
        <div className="bg-white rounded-3xl p-8 mx-6 max-w-md shadow-2xl">
          <div className="text-6xl text-center mb-4">{emoji}</div>
          <h2 className="text-2xl font-bold text-center mb-3 text-gray-800">
            Call {agentName}?
          </h2>
          <p className="text-gray-600 text-center mb-6 leading-relaxed">
            {agentName} would love to chat with you! We need to use your microphone so you can talk together.
          </p>
          <div className="space-y-3">
            <button
              onClick={startCall}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-4 rounded-2xl active:scale-95 transition-all shadow-lg"
            >
              Start Call
            </button>
            <button
              onClick={onEnd}
              className="w-full bg-gray-100 text-gray-700 font-semibold py-4 rounded-2xl active:scale-95 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Call screen
  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 0.4; }
          100% { transform: scale(1); opacity: 0.8; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .float { animation: float 3s ease-in-out infinite; }
        .pulse-ring { animation: pulse-ring 1.5s ease-in-out infinite; }
        .shimmer {
          background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.1) 75%);
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
      `}</style>

      <div className={`fixed inset-0 bg-gradient-to-br ${gradient} flex flex-col z-50`}>
        {/* Timer */}
        <div className="absolute top-12 left-6 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
          <p className="text-white font-semibold text-sm">{formatTime(elapsedTime)}</p>
        </div>

        {/* Warning */}
        {showWarning && (
          <div className="absolute top-12 left-0 right-0 flex justify-center px-6">
            <div className="bg-yellow-500 text-white font-semibold px-5 py-3 rounded-2xl shadow-lg">
              2 minutes left!
            </div>
          </div>
        )}

        {/* Avatar and status */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
          {/* Avatar */}
          <div className="relative mb-8">
            {/* Pulsing ring when speaking */}
            {isSpeaking && callState === "active" && (
              <div className="absolute inset-0 -m-6 rounded-full bg-white/30 pulse-ring" />
            )}
            {/* Main avatar */}
            <div
              className={`w-40 h-40 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-2xl ${
                callState === "connecting"
                  ? "shimmer"
                  : callState === "active" && !isSpeaking
                  ? "float"
                  : ""
              }`}
            >
              <span className="text-7xl">{emoji}</span>
            </div>
          </div>

          {/* Status */}
          <p className="text-white/90 text-xl font-semibold mb-2">
            {callState === "connecting"
              ? "Connecting..."
              : isSpeaking
              ? `${agentName} is speaking...`
              : "Listening..."}
          </p>

          {/* Last message transcript */}
          {lastAgentMessage && callState === "active" && (
            <div className="mt-6 bg-white/10 backdrop-blur-md rounded-2xl px-6 py-4 max-w-lg">
              <p className="text-white text-lg text-center leading-relaxed">
                {lastAgentMessage}
              </p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="pb-safe px-6 pb-8">
          {/* Text input (optional) */}
          {callState === "active" && (
            <div className="mb-4 flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendTextMessage()}
                placeholder="Type instead..."
                className="flex-1 bg-white/20 backdrop-blur-sm text-white placeholder-white/60 rounded-2xl px-5 py-3 outline-none text-base"
              />
              <button
                onClick={sendTextMessage}
                disabled={!textInput.trim()}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  textInput.trim()
                    ? "bg-white/30 text-white active:scale-95"
                    : "bg-white/10 text-white/40"
                }`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </button>
            </div>
          )}

          {/* Main buttons */}
          <div className="flex items-center justify-center gap-6">
            {/* Mute/Unmute */}
            {callState === "active" && (
              <button
                onClick={toggleMute}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg ${
                  isMuted
                    ? "bg-red-500 text-white"
                    : "bg-white/20 backdrop-blur-sm text-white"
                }`}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="22" />
                  {isMuted && (
                    <>
                      <line x1="2" y1="2" x2="22" y2="22" />
                    </>
                  )}
                </svg>
              </button>
            )}

            {/* End Call */}
            <button
              onClick={handleEndCall}
              className="w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center transition-all active:scale-95 shadow-2xl"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.68-1.36-2.66-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
