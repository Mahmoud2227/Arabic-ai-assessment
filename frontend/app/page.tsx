"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatMain from "@/components/chat/ChatMain";
import MobileSidebar from "@/components/chat/MobileSidebar";
import { useChat } from "@/hooks/useChat";

export default function ChatPage() {
  const router = useRouter();
  const [username, setUsername] = useState("User");

  useEffect(() => {
    const user = localStorage.getItem("arabic_ai_user");
    if (!user) {
      router.push("/login");
    } else {
      setUsername(user);
    }
  }, [router]);

  const {
    conversations,
    activeConversation,
    activeId,
    isStreaming,
    setActiveId,
    clearActiveChat,
    createConversation,
    sendText,
    sendAudio,
    sendImage,
  } = useChat();

  const handleLogout = () => {
    document.cookie = "arabic_ai_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
    localStorage.removeItem("arabic_ai_token");
    localStorage.removeItem("arabic_ai_user");
    router.push("/login");
  };

  return (
    <div className="h-screen flex overflow-hidden">
      <div className="hidden md:block">
        <ChatSidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={setActiveId}
          onNewChat={clearActiveChat}
          onLogout={handleLogout}
          username={username}
        />
      </div>

      <MobileSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
        onNewChat={clearActiveChat}
        onLogout={handleLogout}
        username={username}
      />

      <main className="flex-1 flex flex-col min-w-0">
        <ChatMain
          conversation={activeConversation}
          onSendText={sendText}
          onSendAudio={sendAudio}
          onSendImage={sendImage}
          isStreaming={isStreaming}
        />
      </main>
    </div>
  );
}
