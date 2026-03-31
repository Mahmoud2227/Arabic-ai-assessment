import { useState, useCallback, useEffect } from "react";
import type { Conversation, Message } from "@/types/chat";
import { fetchWithAuth, API_BASE_URL } from "@/lib/api";

const uid = () => Math.random().toString(36).slice(2, 10);

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // Load conversations on mount
  useEffect(() => {
    fetchWithAuth("/conversations")
      .then((res) => res.json())
      .then((data) => {
        const transformed = data.map((c: any) => ({
          id: c.id,
          title: c.title,
          lastMessage: c.last_message,
          updatedAt: new Date(c.updated_at),
          messages: [],
        }));
        setConversations(transformed);
        if (transformed.length > 0) {
          loadConversation(transformed[0].id);
        }
      })
      .catch((err) => console.error("Failed to load conversations", err));
  }, []);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  const loadConversation = useCallback((id: string) => {
    setActiveId(id);
    setConversations((prev) => {
      const conv = prev.find((c) => c.id === id);
      if (conv && conv.messages.length > 0) return prev; // already loaded
      return prev;
    });

    fetchWithAuth(`/conversations/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                ...c,
                messages: data.messages.map((m: any) => ({
                  id: m.id,
                  role: m.role,
                  content: m.content,
                  type: m.type,
                  imageUrl: m.media_url,
                  timestamp: new Date(m.created_at),
                })),
              }
              : c
          )
        );
      })
      .catch((err) => console.error("Failed to load messages", err));
  }, []);

  const addMessageToConversation = useCallback(
    (convId: string, message: Message) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? {
              ...c,
              messages: [...c.messages, message],
              lastMessage: message.content.slice(0, 60),
              updatedAt: new Date(),
            }
            : c
        )
      );
    },
    []
  );

  const updateLastMessage = useCallback((convId: string, msgId: string, chunk: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
            ...c,
            messages: c.messages.map((m) =>
              m.id === msgId ? { ...m, content: m.content + chunk } : m
            ),
            lastMessage: (c.messages.find(m => m.id === msgId)?.content + chunk).slice(0, 60),
          }
          : c
      )
    );
  }, []);

  const createConversation = useCallback(async (): Promise<string> => {
    try {
      const res = await fetchWithAuth("/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Conversation" }),
      });
      const data = await res.json();
      const newConv: Conversation = {
        id: data.id,
        title: data.title,
        lastMessage: "",
        updatedAt: new Date(data.updated_at),
        messages: [],
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveId(data.id);
      return data.id;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, []);

  const handleStreamRequest = useCallback(async (
    convId: string,
    endpoint: string,
    body: FormData | string,
    isFormData: boolean
  ) => {
    setIsStreaming(true);

    // Create placeholder for AI response
    const aiMessageId = uid();
    const aiMessage: Message = {
      id: aiMessageId,
      role: "assistant",
      content: "",
      type: "text",
      timestamp: new Date(),
    };
    addMessageToConversation(convId, aiMessage);

    try {
      const token = localStorage.getItem("arabic_ai_token");
      const headers: Record<string, string> = {
        "Authorization": `Bearer ${token}`,
        "X-Accel-Buffering": "no",
      };
      if (!isFormData) {
        headers["Content-Type"] = "application/json";
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers,
        body,
        cache: "no-store",
      });

      if (!response.ok) throw new Error("Stream failed");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        console.log(lines)

        // Keep the last partial line in the buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          if (trimmedLine.startsWith("data:")) {
            const dataStr = trimmedLine.slice(5).trim();
            if (dataStr === "[DONE]") {
              // We're finished
              setIsStreaming(false);
              return;
            }

            try {
              const data = JSON.parse(dataStr);
              if (data.transcription) {
                // Update the user's previously sent message
                setConversations((prev) =>
                  prev.map((c) =>
                    c.id === convId
                      ? {
                        ...c,
                        messages: c.messages.map((m) => {
                          if (m.role === "user" && m.type !== "text" && m.content.includes("pending")) {
                            return { ...m, content: data.transcription };
                          }
                          return m;
                        }),
                      }
                      : c
                  )
                );
              } else if (data.content) {
                updateLastMessage(convId, aiMessageId, data.content);
              }
            } catch (e) {
              console.warn("Failed to parse SSE data line:", trimmedLine, e);
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      updateLastMessage(convId, aiMessageId, "\n\n[Error communicating with AI service]");
    } finally {
      setIsStreaming(false);
      // Reload conversation list to get updated titles
      fetchWithAuth("/conversations")
        .then((res) => res.json())
        .then((data) => {
          setConversations((prev) => {
            const currentMessages = new Map(prev.map(c => [c.id, c.messages]));
            return data.map((c: any) => ({
              id: c.id,
              title: c.title,
              lastMessage: c.last_message,
              updatedAt: new Date(c.updated_at),
              messages: currentMessages.get(c.id) || [],
            }));
          });
        });
    }
  }, [addMessageToConversation, updateLastMessage]);

  const sendText = useCallback(
    async (text: string) => {
      let convId = activeId;
      if (!convId) {
        convId = await createConversation();
      }
      const msg: Message = {
        id: uid(),
        role: "user",
        content: text,
        type: "text",
        timestamp: new Date(),
      };
      addMessageToConversation(convId, msg);
      handleStreamRequest(convId, "/chat/text", JSON.stringify({ conversation_id: convId, query: text }), false);
    },
    [activeId, createConversation, addMessageToConversation, handleStreamRequest]
  );

  const sendAudio = useCallback(
    async (file: File) => {
      let convId = activeId;
      if (!convId) convId = await createConversation();
      const msg: Message = {
        id: uid(),
        role: "user",
        content: "🎤 Voice message sent (transcription pending...)",
        type: "audio",
        timestamp: new Date(),
      };
      addMessageToConversation(convId, msg);

      const formData = new FormData();
      formData.append("conversation_id", convId);
      formData.append("file", file);

      handleStreamRequest(convId, "/chat/audio", formData, true);
    },
    [activeId, createConversation, addMessageToConversation, handleStreamRequest]
  );

  const sendImage = useCallback(
    async (file: File) => {
      let convId = activeId;
      if (!convId) convId = await createConversation();
      const imageUrl = URL.createObjectURL(file);
      const msg: Message = {
        id: uid(),
        role: "user",
        content: "📷 Image uploaded (generating caption pending...)",
        type: "image",
        imageUrl,
        timestamp: new Date(),
      };
      addMessageToConversation(convId, msg);

      const formData = new FormData();
      formData.append("conversation_id", convId);
      formData.append("file", file);

      handleStreamRequest(convId, "/chat/image", formData, true);
    },
    [activeId, createConversation, addMessageToConversation, handleStreamRequest]
  );

  return {
    conversations,
    activeConversation,
    activeId,
    isStreaming,
    setActiveId: loadConversation,
    clearActiveChat: () => setActiveId(null),
    createConversation,
    sendText,
    sendAudio,
    sendImage,
  };
}
