"use client";

import { useRef, useEffect } from "react";
import { MessageSquarePlus } from "lucide-react";
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import type { Conversation } from "@/types/chat";

interface ChatMainProps {
  conversation: Conversation | null;
  onSendText: (text: string) => void;
  onSendAudio: (file: File) => void;
  onSendImage: (file: File) => void;
  isStreaming: boolean;
}

const ChatMain = ({ conversation, onSendText, onSendAudio, onSendImage, isStreaming }: ChatMainProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages]);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 pt-20 md:pt-8 max-w-4xl mx-auto w-full">
        <div className="flex-1 flex flex-col items-center justify-center text-center w-full">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mb-4">
            <MessageSquarePlus className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Welcome to Arabic.AI Chat</h2>
          <p className="text-muted-foreground text-sm max-w-md">
            Start a new conversation using text, voice, or images. Your AI assistant supports multimodal inputs.
          </p>
        </div>
        <div className="w-[80vw] sm:w-[500px] md:w-[600px] lg:w-[700px] mt-8 pb-4">
          <ChatInput
            onSendText={onSendText}
            onSendAudio={onSendAudio}
            onSendImage={onSendImage}
            disabled={isStreaming}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header - Hidden on mobile */}
      <div className="hidden md:flex px-6 py-3 border-b border-border/50 items-center">
        <h2 className="text-sm font-medium text-foreground truncate">{conversation.title}</h2>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scrollbar p-6 pt-20 md:pt-6 space-y-6">
        {conversation.messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isStreaming && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
              <span className="text-primary text-xs">AI</span>
            </div>
            <div className="bg-card border border-border/50 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput
        onSendText={onSendText}
        onSendAudio={onSendAudio}
        onSendImage={onSendImage}
        disabled={isStreaming}
      />
    </div>
  );
};

export default ChatMain;
