"use client";

import { Menu, X, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import ChatSidebar from "./ChatSidebar";
import type { Conversation } from "@/types/chat";

interface MobileSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onLogout: () => void;
  username: string;
}

const MobileSidebar = (props: MobileSidebarProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="md:hidden fixed top-3 left-3 z-50 flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="text-foreground"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-foreground"
          onClick={props.onNewChat}
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden" onClick={() => setOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 md:hidden">
            <ChatSidebar
              {...props}
              onSelect={(id) => {
                props.onSelect(id);
                setOpen(false);
              }}
            />
          </div>
        </>
      )}
    </>
  );
};

export default MobileSidebar;
