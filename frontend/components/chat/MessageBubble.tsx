"use client";

import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "@/types/chat";

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? "gradient-primary" : "bg-accent"
          }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-primary-foreground" />
        ) : (
          <Bot className="w-4 h-4 text-primary" />
        )}
      </div>

      {/* Message */}
      <div className={`max-w-[70%] space-y-2 ${isUser ? "items-end" : ""}`}>
        {message.imageUrl && (
          <div className="rounded-lg overflow-hidden border border-border/50 max-w-xs">
            <img src={message.imageUrl} alt="Uploaded" className="w-full h-auto" />
          </div>
        )}
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isUser
            ? "gradient-primary text-primary-foreground rounded-br-md"
            : "bg-card border border-border/50 text-foreground rounded-bl-md"
            }`}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap">{message.content}</div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted prose-pre:border prose-pre:border-border/50 text-foreground">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        {message.type !== "text" && (
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
            {message.type === "audio" ? "Voice" : "Image"}
          </span>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
