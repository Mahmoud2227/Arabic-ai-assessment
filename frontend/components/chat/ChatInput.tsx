"use client";

import { useState, useRef } from "react";
import { Send, Mic, Image, X, MicOff, Upload, Paperclip, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatInputProps {
  onSendText: (text: string) => void;
  onSendAudio: (file: File) => void;
  onSendImage: (file: File) => void;
  disabled?: boolean;
}

const ChatInput = ({ onSendText, onSendAudio, onSendImage, disabled }: ChatInputProps) => {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendText(text.trim());
    setText("");
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onSendImage(file);
    e.target.value = "";
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onSendAudio(file);
    e.target.value = "";
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], "recording.webm", { type: "audio/webm" });
        onSendAudio(file);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      console.error("Microphone access denied");
    }
  };

  return (
    <div className="border-t border-border/50 p-4">

      {isRecording && (
        <div className="mb-3 flex items-center gap-2 text-destructive text-sm animate-pulse">
          <MicOff className="w-4 h-4" />
          <span>Recording... Click stop to send</span>
          <Button variant="outline" size="sm" onClick={toggleRecording} className="ml-2 border-destructive text-destructive hover:bg-destructive/10">
            Stop
          </Button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground shrink-0"
              disabled={disabled || isRecording}
            >
              <Paperclip className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-48">
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="gap-2 cursor-pointer">
              <Image className="w-4 h-4" />
              Upload Image
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2 cursor-pointer">
                <Mic className="w-4 h-4" />
                Audio
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={toggleRecording} className="gap-2 cursor-pointer">
                  <Mic className="w-4 h-4" />
                  Record
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => audioInputRef.current?.click()} className="gap-2 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Upload File
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
        <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} />

        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Type a message..."
            rows={1}
            className="w-full resize-none bg-secondary/50 border border-border/50 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            disabled={disabled}
          />
        </div>
        <Button
          type="submit"
          size="icon"
          className="gradient-primary border-0 shrink-0"
          disabled={disabled || !text.trim()}
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
};

export default ChatInput;
