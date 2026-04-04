"use client";

import { motion } from "framer-motion";
import {
  Wallet,
  Users,
  Trophy,
  Settings,
  LogOut,
  Menu,
  X,
  Spade,
  Crown,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Avatar } from "./avatar-selector";

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
  walletBalance: number;
  onLogout?: () => void;
  isAdmin?: boolean;
  onOpenAvatarSelector?: () => void;
  selectedAvatar?: Avatar;
}

export function Navigation({
  currentView,
  onViewChange,
  walletBalance,
  onLogout,
  isAdmin = false,
  onOpenAvatarSelector,
  selectedAvatar,
}: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "lobby", label: "לובי משחקים", icon: Users },
    { id: "table", label: "שולחן פוקר", icon: Spade },
    { id: "wallet", label: "ארנק", icon: Wallet },
    { id: "leaderboard", label: "טבלת מובילים", icon: Trophy },
    ...(isAdmin ? [{ id: "admin", label: "פאנל בעלים", icon: Crown }] : []),
  ];

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 glass-effect"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="relative">
              <motion.div
                className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl gold-gradient flex items-center justify-center"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Spade className="w-5 h-5 lg:w-6 lg:h-6 text-charcoal" />
              </motion.div>
              <motion.div
                className="absolute -inset-1 rounded-xl bg-gold/30 blur-md -z-10"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg lg:text-xl font-bold text-gold font-[family-name:var(--font-orbitron)]">
                ROYAL FLUSH
              </h1>
              <p className="text-xs text-muted-foreground">Premium Poker</p>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item, index) => (
              <motion.button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`relative px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                  currentView === item.id
                    ? "text-gold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden lg:inline">{item.label}</span>
                {currentView === item.id && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute inset-0 bg-gold/10 border border-gold/30 rounded-lg -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </div>

          {/* Wallet & Actions */}
          <div className="flex items-center gap-2 lg:gap-4">
            {/* Avatar Button */}
            {selectedAvatar && onOpenAvatarSelector && (
              <motion.button
                onClick={onOpenAvatarSelector}
                className="w-9 h-9 lg:w-10 lg:h-10 rounded-full overflow-hidden border-2 border-gold/30 hover:border-gold/60 transition-all shrink-0"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title="שנה אווטר"
              >
                {selectedAvatar.character}
              </motion.button>
            )}

            <motion.div
              className="hidden sm:flex items-center gap-2 px-3 lg:px-4 py-2 rounded-xl glass-effect border border-gold/20"
              whileHover={{ scale: 1.02, borderColor: "rgba(212, 175, 55, 0.4)" }}
            >
              <Wallet className="w-4 h-4 text-gold" />
              <span className="text-sm font-semibold text-gold font-[family-name:var(--font-orbitron)]">
                {walletBalance.toLocaleString()} ✦
              </span>
            </motion.div>

            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex text-muted-foreground hover:text-foreground"
              title="הגדרות"
              onClick={() => onViewChange("settings")}
            >
              <Settings className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex text-muted-foreground hover:text-destructive"
              onClick={onLogout}
            >
              <LogOut className="w-5 h-5" />
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <motion.div
        initial={false}
        animate={{
          height: mobileMenuOpen ? "auto" : 0,
          opacity: mobileMenuOpen ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="md:hidden overflow-hidden glass-effect border-t border-border"
      >
        <div className="px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => {
                onViewChange(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                currentView === item.id
                  ? "bg-gold/10 text-gold border border-gold/30"
                  : "text-muted-foreground hover:bg-muted"
              }`}
              whileTap={{ scale: 0.98 }}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </motion.button>
          ))}
          {/* Avatar Selector for Mobile */}
          {selectedAvatar && onOpenAvatarSelector && (
            <motion.button
              onClick={() => { onOpenAvatarSelector(); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium bg-gold/10 text-gold border border-gold/30"
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden border border-gold/50 shrink-0">
                {selectedAvatar.character}
              </div>
              <span>שנה אווטר</span>
            </motion.button>
          )}
          <div className="pt-4 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2 text-gold">
              <Wallet className="w-4 h-4" />
              <span className="font-semibold font-[family-name:var(--font-orbitron)]">
                {walletBalance.toLocaleString()} ✦
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { onViewChange("settings"); setMobileMenuOpen(false); }}
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-destructive" onClick={onLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.nav>
  );
}
