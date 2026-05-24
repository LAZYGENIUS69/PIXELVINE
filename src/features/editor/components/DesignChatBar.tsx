"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { GlassCard } from "@/components/glass-card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Send,
  Loader2,
  Layout,
  Palette,
  Type,
  Monitor,
  Sparkles,
  MessageSquare,
  X,
} from "lucide-react";

interface DesignChatBarProps {
  projectId: string;
  activeFrameId: string | null;
  activeFrameName?: string;
  onClose?: () => void;
}

const suggestedPrompts = [
  { label: "Make it darker", icon: Palette },
  { label: "Add a nav bar", icon: Layout },
  { label: "Change font size", icon: Type },
  { label: "Add more spacing", icon: Monitor },
  { label: "Make it pop", icon: Sparkles },
];

// Message type is inferred from Convex query

export const DesignChatBar = ({
  projectId,
  activeFrameId,
  activeFrameName,
  onClose,
}: DesignChatBarProps) => {
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Query all messages for this project
  const allMessages = useQuery(api.chatMessages.list, {
    projectId: projectId as Id<"projects">,
  });

  // Filter messages for active frame or show all
  const messages = activeFrameId
    ? allMessages?.filter((m) => m.frameId === activeFrameId)
    : allMessages;

  // Action
  const chatEditFrame = useAction(api.designAgent.chatEditFrame);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputValue.trim() || !activeFrameId) return;

    const message = inputValue.trim();
    setInputValue("");
    setIsTyping(true);

    try {
      // Get conversation history (last 10 messages)
      const history =
        messages
          ?.slice(-10)
          .map((m) => ({ role: m.role, content: m.content })) || [];

      await chatEditFrame({
        projectId: projectId as Id<"projects">,
        frameId: activeFrameId as Id<"frames">,
        userMessage: message,
        conversationHistory: history,
      });
    } catch (error) {
      console.error("Chat edit failed:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInputValue(prompt);
  };

  return (
    <GlassCard className="h-full flex flex-col p-0 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Design Chat</h3>
            {activeFrameId && activeFrameName ? (
              <p className="text-xs text-purple-400">
                Editing: {activeFrameName}
              </p>
            ) : (
              <p className="text-xs text-white/50">
                Select a frame to start editing
              </p>
            )}
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {!activeFrameId ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Layout className="w-8 h-8 text-white/30" />
            </div>
            <p className="text-sm text-white/50 mb-2">No frame selected</p>
            <p className="text-xs text-white/30">
              Click on a frame in the canvas to start editing it via chat
            </p>
          </div>
        ) : messages?.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-purple-400/50" />
            </div>
            <p className="text-sm text-white/50 mb-2">
              Start editing {activeFrameName}
            </p>
            <p className="text-xs text-white/30">
              Type a message to modify the design
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages?.map((message) => (
              <div
                key={message._id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "flex-row" : "flex-row-reverse"
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center",
                    message.role === "user"
                      ? "bg-white/10"
                      : "bg-gradient-to-br from-purple-500 to-pink-500"
                  )}
                >
                  {message.role === "user" ? (
                    <span className="text-xs font-medium text-white">You</span>
                  ) : (
                    <Sparkles className="w-4 h-4 text-white" />
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                    message.role === "user"
                      ? "bg-white/10 text-white"
                      : "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/20"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3 flex-row-reverse">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-white border border-purple-500/20 max-w-[80%] rounded-2xl px-4 py-2.5">
                  <div className="flex gap-1">
                    <span
                      className="w-2 h-2 bg-white/50 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-white/50 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-2 h-2 bg-white/50 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Suggested Prompts */}
      {activeFrameId && !isTyping && (
        <div className="px-4 pb-2">
          <p className="text-[10px] text-white/40 mb-2 uppercase tracking-wider">
            Suggestions
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt.label}
                onClick={() => handleSuggestedPrompt(prompt.label)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs text-white/70 hover:text-white transition-all"
              >
                <prompt.icon className="w-3 h-3" />
                {prompt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              activeFrameId
                ? "Type a design change..."
                : "Select a frame first"
            }
            disabled={!activeFrameId || isTyping}
            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-purple-500/50"
          />
          <Button
            onClick={handleSend}
            disabled={!inputValue.trim() || !activeFrameId || isTyping}
            size="icon"
            className={cn(
              "bg-purple-600 hover:bg-purple-500 disabled:opacity-50",
              inputValue.trim() && activeFrameId && "animate-pulse"
            )}
          >
            {isTyping ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-white/30 mt-2 text-center">
          Press Enter to send • AI will modify the selected frame
        </p>
      </div>
    </GlassCard>
  );
};
