"use client";

import { Plus, MessageSquare, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Conversation } from "@/types/chat";

interface ChatSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onLogout: () => void;
  username: string;
}

const ChatSidebar = ({ conversations, activeId, onSelect, onNewChat, onLogout, username }: ChatSidebarProps) => {
  return (
    <aside className="w-72 h-screen flex flex-col gradient-sidebar border-r border-border/50">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <img src="/arabic-ai-logo.png" alt="arabic.ai" className="h-7" />
        </div>
        <Button onClick={onNewChat} className="w-full gradient-primary border-0 gap-2" size="sm">
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto chat-scrollbar p-2 space-y-1">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-start gap-2.5 group ${
              activeId === conv.id
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            }`}
          >
            <MessageSquare className="w-4 h-4 mt-0.5 shrink-0 opacity-60" />
            <div className="min-w-0">
              <p className="truncate font-medium">{conv.title}</p>
              <p className="truncate text-xs opacity-60 mt-0.5">{conv.lastMessage}</p>
            </div>
          </button>
        ))}
      </div>

      {/* User footer */}
      <div className="p-3 border-t border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-sm font-semibold text-primary-foreground shrink-0">
            {username.charAt(0).toUpperCase()}
          </div>
          <span className="text-sm truncate text-foreground/80">{username}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onLogout} className="shrink-0 text-muted-foreground hover:text-destructive">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </aside>
  );
};

export default ChatSidebar;
