"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Send,
  Smile,
  X,
  Users,
  Volume2,
} from "lucide-react";

interface ChatMessage {
  id: string;
  sender: string;
  avatar: string;
  message: string;
  timestamp: Date;
  isSystem?: boolean;
}

interface Player {
  id: string;
  name: string;
  avatar: string;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
}

const initialMessages: ChatMessage[] = [
  {
    id: "1",
    sender: "מערכת",
    avatar: "🎰",
    message: "ברוכים הבאים לשולחן!",
    timestamp: new Date(),
    isSystem: true,
  },
  {
    id: "2",
    sender: "דניאל",
    avatar: "🎩",
    message: "בהצלחה לכולם!",
    timestamp: new Date(),
  },
  {
    id: "3",
    sender: "מיכל",
    avatar: "👑",
    message: "בואו נשחק!",
    timestamp: new Date(),
  },
  {
    id: "4",
    sender: "אורי",
    avatar: "🎪",
    message: "מי מוכן להרים?",
    timestamp: new Date(),
  },
];

const emojis = ["👍", "👎", "😀", "😂", "🎰", "🃏", "💰", "🔥", "❤️", "🎉", "😎", "🤔"];

export function ChatPanel({ isOpen, onClose, players }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState("");
  const [isMicOn, setIsMicOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "voice">("chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!inputMessage.trim()) return;
    setMessages([
      ...messages,
      {
        id: Date.now().toString(),
        sender: "אתה",
        avatar: "🎭",
        message: inputMessage,
        timestamp: new Date(),
      },
    ]);
    setInputMessage("");
    setShowEmojis(false);
  };

  const addEmoji = (emoji: string) => {
    setInputMessage((prev) => prev + emoji);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: -350, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -350, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed top-20 left-0 bottom-24 w-80 glass-effect border-r border-border z-30 flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <MessageCircle className="w-5 h-5 text-gold" />
              </motion.div>
              <h3 className="font-semibold text-foreground font-[family-name:var(--font-orbitron)]">
                צ&apos;אט חי
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald/20 text-emerald text-xs">
                {players.length} מחוברים
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border">
            <motion.button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-3 text-sm font-medium transition-all relative ${
                activeTab === "chat"
                  ? "text-gold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <MessageCircle className="w-4 h-4 inline ml-1" />
              הודעות
              {activeTab === "chat" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"
                />
              )}
            </motion.button>
            <motion.button
              onClick={() => setActiveTab("voice")}
              className={`flex-1 py-3 text-sm font-medium transition-all relative ${
                activeTab === "voice"
                  ? "text-gold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <Mic className="w-4 h-4 inline ml-1" />
              קול ווידאו
              {activeTab === "voice" && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"
                />
              )}
            </motion.button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "chat" ? (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 flex flex-col"
              >
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg, i) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`p-3 rounded-xl ${
                        msg.isSystem
                          ? "bg-gold/10 border border-gold/20"
                          : msg.sender === "אתה"
                          ? "bg-emerald/10 border border-emerald/20 mr-4"
                          : "bg-muted/50 ml-4"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <motion.span
                          className="text-lg"
                          animate={msg.isSystem ? { scale: [1, 1.2, 1] } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {msg.avatar}
                        </motion.span>
                        <span
                          className={`text-xs font-medium ${
                            msg.isSystem ? "text-gold" : "text-muted-foreground"
                          }`}
                        >
                          {msg.sender}
                        </span>
                        <span className="text-xs text-muted-foreground mr-auto">
                          {msg.timestamp.toLocaleTimeString("he-IL", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{msg.message}</p>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Emoji Picker */}
                <AnimatePresence>
                  {showEmojis && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: 10, height: 0 }}
                      className="px-4 py-3 border-t border-border bg-muted/30"
                    >
                      <div className="flex flex-wrap gap-2 justify-center">
                        {emojis.map((emoji, i) => (
                          <motion.button
                            key={emoji}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.03 }}
                            onClick={() => addEmoji(emoji)}
                            className="text-xl hover:scale-125 transition-transform p-1"
                            whileHover={{ scale: 1.3 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {emoji}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Input */}
                <div className="p-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowEmojis(!showEmojis)}
                      className={`${
                        showEmojis ? "text-gold" : "text-muted-foreground"
                      } hover:text-gold`}
                    >
                      <Smile className="w-5 h-5" />
                    </Button>
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                      placeholder="הקלד הודעה..."
                      className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:border-gold/50 transition-colors"
                    />
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        size="icon"
                        onClick={sendMessage}
                        disabled={!inputMessage.trim()}
                        className="bg-emerald hover:bg-emerald-light disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="voice"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 p-4 overflow-y-auto"
              >
                {/* Online Players */}
                <div className="mb-6">
                  <h4 className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    שחקנים בשולחן ({players.length})
                  </h4>
                  <div className="space-y-2">
                    {players.map((player, i) => (
                      <motion.div
                        key={player.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{player.avatar}</span>
                          <span className="text-sm font-medium">{player.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <motion.div
                            className="w-2 h-2 rounded-full bg-emerald"
                            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                          <Volume2 className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* My Controls */}
                <div className="space-y-4">
                  <h4 className="text-sm text-muted-foreground">הגדרות שלי</h4>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsMicOn(!isMicOn)}
                    className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl border transition-all ${
                      isMicOn
                        ? "bg-emerald/20 border-emerald text-emerald"
                        : "bg-destructive/10 border-destructive/50 text-destructive"
                    }`}
                  >
                    {isMicOn ? (
                      <>
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <Mic className="w-6 h-6" />
                        </motion.div>
                        <span className="font-medium">מיקרופון פעיל</span>
                      </>
                    ) : (
                      <>
                        <MicOff className="w-6 h-6" />
                        <span className="font-medium">מיקרופון כבוי</span>
                      </>
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsVideoOn(!isVideoOn)}
                    className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl border transition-all ${
                      isVideoOn
                        ? "bg-emerald/20 border-emerald text-emerald"
                        : "bg-destructive/10 border-destructive/50 text-destructive"
                    }`}
                  >
                    {isVideoOn ? (
                      <>
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          <Video className="w-6 h-6" />
                        </motion.div>
                        <span className="font-medium">מצלמה פעילה</span>
                      </>
                    ) : (
                      <>
                        <VideoOff className="w-6 h-6" />
                        <span className="font-medium">מצלמה כבויה</span>
                      </>
                    )}
                  </motion.button>

                  {/* Video Preview */}
                  <AnimatePresence>
                    {isVideoOn && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, height: 0 }}
                        animate={{ opacity: 1, scale: 1, height: "auto" }}
                        exit={{ opacity: 0, scale: 0.9, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="aspect-video rounded-xl bg-charcoal-light border border-border flex items-center justify-center relative overflow-hidden">
                          {/* Animated background */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-br from-emerald/5 to-gold/5"
                            animate={{
                              opacity: [0.3, 0.6, 0.3],
                            }}
                            transition={{ duration: 3, repeat: Infinity }}
                          />
                          <div className="text-center relative z-10">
                            <motion.div
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <Video className="w-10 h-10 text-emerald mx-auto mb-2" />
                            </motion.div>
                            <p className="text-sm text-muted-foreground">
                              תצוגה מקדימה של המצלמה
                            </p>
                          </div>
                          {/* Recording indicator */}
                          <motion.div
                            className="absolute top-3 right-3 flex items-center gap-2"
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <span className="text-xs text-red-500">LIVE</span>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
