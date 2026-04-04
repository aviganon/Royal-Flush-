"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Sparkles, Lock, Star } from "lucide-react";

export interface Avatar {
  id: string;
  name: string;
  category: "free" | "premium" | "legendary";
  color: string;
  bgGradient: string;
  character: React.ReactNode;
}

// Funny cartoon character avatars as SVG components
const CoolCat = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>
      <linearGradient id="catGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ff9a56" />
        <stop offset="100%" stopColor="#ff6b35" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="url(#catGrad)" />
    {/* Ears */}
    <path d="M20 30 L30 5 L40 25 Z" fill="#ff8040" />
    <path d="M80 30 L70 5 L60 25 Z" fill="#ff8040" />
    <path d="M25 28 L32 12 L38 26 Z" fill="#ffb080" />
    <path d="M75 28 L68 12 L62 26 Z" fill="#ffb080" />
    {/* Sunglasses */}
    <rect x="18" y="38" width="25" height="18" rx="4" fill="#1a1a2e" />
    <rect x="57" y="38" width="25" height="18" rx="4" fill="#1a1a2e" />
    <rect x="43" y="42" width="14" height="4" fill="#1a1a2e" />
    <line x1="18" y1="42" x2="8" y2="38" stroke="#1a1a2e" strokeWidth="3" />
    <line x1="82" y1="42" x2="92" y2="38" stroke="#1a1a2e" strokeWidth="3" />
    {/* Reflection on glasses */}
    <rect x="22" y="42" width="8" height="3" rx="1" fill="rgba(255,255,255,0.3)" />
    <rect x="61" y="42" width="8" height="3" rx="1" fill="rgba(255,255,255,0.3)" />
    {/* Nose */}
    <ellipse cx="50" cy="60" rx="8" ry="5" fill="#ff5050" />
    {/* Mouth */}
    <path d="M35 70 Q50 82 65 70" fill="none" stroke="#1a1a2e" strokeWidth="3" strokeLinecap="round" />
    {/* Whiskers */}
    <line x1="15" y1="58" x2="32" y2="62" stroke="#1a1a2e" strokeWidth="2" />
    <line x1="15" y1="65" x2="32" y2="65" stroke="#1a1a2e" strokeWidth="2" />
    <line x1="15" y1="72" x2="32" y2="68" stroke="#1a1a2e" strokeWidth="2" />
    <line x1="85" y1="58" x2="68" y2="62" stroke="#1a1a2e" strokeWidth="2" />
    <line x1="85" y1="65" x2="68" y2="65" stroke="#1a1a2e" strokeWidth="2" />
    <line x1="85" y1="72" x2="68" y2="68" stroke="#1a1a2e" strokeWidth="2" />
  </svg>
);

const NerdDog = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>
      <linearGradient id="dogGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#8B6914" />
        <stop offset="100%" stopColor="#6B4F12" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="url(#dogGrad)" />
    {/* Floppy ears */}
    <ellipse cx="18" cy="50" rx="15" ry="25" fill="#5c3d0a" />
    <ellipse cx="82" cy="50" rx="15" ry="25" fill="#5c3d0a" />
    {/* Face patch */}
    <ellipse cx="50" cy="60" rx="25" ry="20" fill="#c9a654" />
    {/* Glasses */}
    <circle cx="35" cy="42" r="14" fill="none" stroke="#1a1a2e" strokeWidth="4" />
    <circle cx="65" cy="42" r="14" fill="none" stroke="#1a1a2e" strokeWidth="4" />
    <line x1="49" y1="42" x2="51" y2="42" stroke="#1a1a2e" strokeWidth="4" />
    {/* Eyes behind glasses */}
    <circle cx="35" cy="42" r="6" fill="white" />
    <circle cx="65" cy="42" r="6" fill="white" />
    <circle cx="37" cy="41" r="4" fill="#1a1a2e" />
    <circle cx="67" cy="41" r="4" fill="#1a1a2e" />
    <circle cx="38" cy="40" r="1.5" fill="white" />
    <circle cx="68" cy="40" r="1.5" fill="white" />
    {/* Nose */}
    <ellipse cx="50" cy="62" rx="10" ry="7" fill="#1a1a2e" />
    <ellipse cx="48" cy="60" rx="3" ry="2" fill="rgba(255,255,255,0.3)" />
    {/* Tongue */}
    <path d="M45 72 Q50 85 55 72" fill="#ff6b6b" />
    {/* Mouth */}
    <path d="M40 70 L50 74 L60 70" fill="none" stroke="#1a1a2e" strokeWidth="2" />
  </svg>
);

const CrazyRabbit = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>
      <linearGradient id="rabbitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f5f5f5" />
        <stop offset="100%" stopColor="#e0e0e0" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="55" r="40" fill="url(#rabbitGrad)" />
    {/* Long ears */}
    <ellipse cx="30" cy="15" rx="10" ry="30" fill="#f5f5f5" />
    <ellipse cx="70" cy="15" rx="10" ry="30" fill="#f5f5f5" />
    <ellipse cx="30" cy="15" rx="5" ry="22" fill="#ffb6c1" />
    <ellipse cx="70" cy="15" rx="5" ry="22" fill="#ffb6c1" />
    {/* Crazy eyes */}
    <circle cx="35" cy="50" r="12" fill="white" stroke="#1a1a2e" strokeWidth="2" />
    <circle cx="65" cy="50" r="12" fill="white" stroke="#1a1a2e" strokeWidth="2" />
    {/* Spiral pupils */}
    <circle cx="35" cy="50" r="6" fill="#ff4757" />
    <circle cx="65" cy="50" r="6" fill="#ff4757" />
    <circle cx="35" cy="50" r="2" fill="#1a1a2e" />
    <circle cx="65" cy="50" r="2" fill="#1a1a2e" />
    {/* Pink nose */}
    <ellipse cx="50" cy="68" rx="6" ry="4" fill="#ffb6c1" />
    {/* Buck teeth */}
    <rect x="44" y="75" width="6" height="10" rx="2" fill="white" stroke="#ddd" strokeWidth="1" />
    <rect x="50" y="75" width="6" height="10" rx="2" fill="white" stroke="#ddd" strokeWidth="1" />
    {/* Cheeks */}
    <circle cx="22" cy="65" r="8" fill="#ffb6c1" opacity="0.5" />
    <circle cx="78" cy="65" r="8" fill="#ffb6c1" opacity="0.5" />
  </svg>
);

const GangsterPanda = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <circle cx="50" cy="50" r="45" fill="white" />
    {/* Ears */}
    <circle cx="20" cy="20" r="12" fill="#1a1a2e" />
    <circle cx="80" cy="20" r="12" fill="#1a1a2e" />
    {/* Eye patches */}
    <ellipse cx="32" cy="45" rx="15" ry="12" fill="#1a1a2e" />
    <ellipse cx="68" cy="45" rx="15" ry="12" fill="#1a1a2e" />
    {/* Eyes with cool look */}
    <ellipse cx="32" cy="45" rx="6" ry="5" fill="white" />
    <ellipse cx="68" cy="45" rx="6" ry="5" fill="white" />
    <circle cx="34" cy="44" r="3" fill="#1a1a2e" />
    <circle cx="70" cy="44" r="3" fill="#1a1a2e" />
    {/* Eyebrow scar */}
    <line x1="22" y1="32" x2="32" y2="36" stroke="#ff4757" strokeWidth="2" />
    {/* Nose */}
    <ellipse cx="50" cy="58" rx="8" ry="5" fill="#1a1a2e" />
    {/* Cool smirk */}
    <path d="M40 70 Q50 75 60 68" fill="none" stroke="#1a1a2e" strokeWidth="3" strokeLinecap="round" />
    {/* Gold chain hint */}
    <path d="M30 88 Q50 95 70 88" fill="none" stroke="#ffd700" strokeWidth="4" />
    {/* Bandana */}
    <path d="M15 32 Q50 20 85 32" fill="#ff4757" />
    <circle cx="50" cy="26" r="4" fill="#ffd700" />
  </svg>
);

const RichFox = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>
      <linearGradient id="foxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ff9f43" />
        <stop offset="100%" stopColor="#ee5a24" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="url(#foxGrad)" />
    {/* Pointy ears */}
    <path d="M15 35 L25 0 L40 30 Z" fill="#ee5a24" />
    <path d="M85 35 L75 0 L60 30 Z" fill="#ee5a24" />
    <path d="M20 32 L27 8 L37 28 Z" fill="#ffcc80" />
    <path d="M80 32 L73 8 L63 28 Z" fill="#ffcc80" />
    {/* White face patch */}
    <ellipse cx="50" cy="65" rx="22" ry="18" fill="#fff5e6" />
    {/* Monocle */}
    <circle cx="65" cy="42" r="12" fill="none" stroke="#ffd700" strokeWidth="3" />
    <line x1="77" y1="42" x2="90" y2="55" stroke="#ffd700" strokeWidth="2" />
    {/* Eyes */}
    <ellipse cx="35" cy="42" rx="7" ry="8" fill="white" />
    <ellipse cx="65" cy="42" rx="7" ry="8" fill="white" />
    <circle cx="36" cy="41" r="4" fill="#2d3436" />
    <circle cx="66" cy="41" r="4" fill="#2d3436" />
    <circle cx="37" cy="40" r="1.5" fill="white" />
    <circle cx="67" cy="40" r="1.5" fill="white" />
    {/* Raised eyebrow */}
    <path d="M28 32 Q35 28 42 32" fill="none" stroke="#2d3436" strokeWidth="2" />
    {/* Nose */}
    <ellipse cx="50" cy="58" rx="5" ry="3" fill="#2d3436" />
    {/* Smug smile */}
    <path d="M40 68 Q50 76 60 68" fill="none" stroke="#2d3436" strokeWidth="2" />
    {/* Top hat outline at top */}
    <rect x="35" y="0" width="30" height="8" fill="#2d3436" />
    <rect x="40" y="-15" width="20" height="15" fill="#2d3436" />
    <rect x="42" y="-8" width="4" height="4" fill="#ffd700" />
  </svg>
);

const PirateParrot = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>
      <linearGradient id="parrotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00d2d3" />
        <stop offset="100%" stopColor="#0abde3" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="url(#parrotGrad)" />
    {/* Feather tuft */}
    <ellipse cx="50" cy="8" rx="8" ry="15" fill="#ff6b6b" />
    <ellipse cx="42" cy="12" rx="6" ry="12" fill="#feca57" />
    <ellipse cx="58" cy="12" rx="6" ry="12" fill="#48dbfb" />
    {/* Eye patch */}
    <circle cx="35" cy="40" r="14" fill="#1a1a2e" />
    <line x1="20" y1="30" x2="50" y2="25" stroke="#1a1a2e" strokeWidth="3" />
    {/* Good eye */}
    <circle cx="65" cy="40" r="12" fill="white" />
    <circle cx="67" cy="39" r="6" fill="#1a1a2e" />
    <circle cx="68" cy="38" r="2" fill="white" />
    {/* Skull on eye patch */}
    <circle cx="35" cy="40" r="5" fill="white" />
    <circle cx="33" cy="39" r="1.5" fill="#1a1a2e" />
    <circle cx="37" cy="39" r="1.5" fill="#1a1a2e" />
    {/* Big curved beak */}
    <path d="M45 55 Q30 60 35 75 Q50 78 55 65 Z" fill="#ffd700" />
    <path d="M45 57 Q35 62 38 70" fill="none" stroke="#e67e22" strokeWidth="2" />
    {/* Cheek feathers */}
    <path d="M75 50 Q90 55 85 65 Q78 62 75 55" fill="#ff6b6b" />
  </svg>
);

const ZombieBear = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>
      <linearGradient id="zombieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a8e6cf" />
        <stop offset="100%" stopColor="#88d8b0" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="url(#zombieGrad)" />
    {/* Ears */}
    <circle cx="20" cy="20" r="12" fill="#88d8b0" />
    <circle cx="80" cy="20" r="12" fill="#88d8b0" />
    <circle cx="20" cy="20" r="6" fill="#6bbf9f" />
    <circle cx="80" cy="20" r="6" fill="#6bbf9f" />
    {/* Stitches on head */}
    <line x1="30" y1="25" x2="30" y2="40" stroke="#2d3436" strokeWidth="2" />
    <line x1="26" y1="28" x2="34" y2="28" stroke="#2d3436" strokeWidth="1.5" />
    <line x1="26" y1="33" x2="34" y2="33" stroke="#2d3436" strokeWidth="1.5" />
    <line x1="26" y1="38" x2="34" y2="38" stroke="#2d3436" strokeWidth="1.5" />
    {/* Crazy eyes */}
    <circle cx="35" cy="45" r="12" fill="white" />
    <circle cx="65" cy="45" r="10" fill="#ffff00" />
    <circle cx="35" cy="45" r="6" fill="#ff4757" />
    <circle cx="65" cy="44" r="5" fill="#1a1a2e" />
    {/* X eye */}
    <line x1="31" y1="41" x2="39" y2="49" stroke="#1a1a2e" strokeWidth="2" />
    <line x1="39" y1="41" x2="31" y2="49" stroke="#1a1a2e" strokeWidth="2" />
    {/* Nose */}
    <ellipse cx="50" cy="60" rx="8" ry="5" fill="#2d3436" />
    {/* Goofy smile */}
    <path d="M35 72 Q50 85 65 72" fill="#1a1a2e" />
    <rect x="42" y="72" width="5" height="8" fill="white" />
    <rect x="52" y="72" width="5" height="8" fill="white" />
    {/* Drool */}
    <path d="M60 78 Q62 88 58 92" fill="#88d8b0" stroke="#6bbf9f" strokeWidth="2" />
  </svg>
);

const RobotOwl = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>
      <linearGradient id="robotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a29bfe" />
        <stop offset="100%" stopColor="#6c5ce7" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="url(#robotGrad)" />
    {/* Ear tufts / antennas */}
    <rect x="22" y="5" width="4" height="20" rx="2" fill="#dfe6e9" />
    <rect x="74" y="5" width="4" height="20" rx="2" fill="#dfe6e9" />
    <circle cx="24" cy="5" r="5" fill="#ff6b6b" />
    <circle cx="76" cy="5" r="5" fill="#00d2d3" />
    {/* Big robot eyes */}
    <circle cx="32" cy="45" r="16" fill="#dfe6e9" stroke="#636e72" strokeWidth="3" />
    <circle cx="68" cy="45" r="16" fill="#dfe6e9" stroke="#636e72" strokeWidth="3" />
    {/* Digital pupils */}
    <circle cx="32" cy="45" r="10" fill="#00cec9" />
    <circle cx="68" cy="45" r="10" fill="#00cec9" />
    <circle cx="32" cy="45" r="5" fill="#0984e3" />
    <circle cx="68" cy="45" r="5" fill="#0984e3" />
    {/* Scanning line */}
    <rect x="22" y="43" width="20" height="2" fill="rgba(255,255,255,0.5)" />
    <rect x="58" y="43" width="20" height="2" fill="rgba(255,255,255,0.5)" />
    {/* Beak */}
    <path d="M40 62 L50 75 L60 62 Z" fill="#fdcb6e" />
    {/* Metal plate marks */}
    <line x1="15" y1="55" x2="25" y2="55" stroke="#636e72" strokeWidth="2" />
    <line x1="75" y1="55" x2="85" y2="55" stroke="#636e72" strokeWidth="2" />
    {/* Screws */}
    <circle cx="18" cy="70" r="3" fill="#636e72" />
    <circle cx="82" cy="70" r="3" fill="#636e72" />
  </svg>
);

const NinjaMonkey = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>
      <linearGradient id="monkeyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#b87333" />
        <stop offset="100%" stopColor="#8b5a2b" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="url(#monkeyGrad)" />
    {/* Ears */}
    <circle cx="10" cy="45" r="12" fill="#cd853f" />
    <circle cx="90" cy="45" r="12" fill="#cd853f" />
    <circle cx="10" cy="45" r="6" fill="#deb887" />
    <circle cx="90" cy="45" r="6" fill="#deb887" />
    {/* Ninja mask */}
    <rect x="10" y="35" width="80" height="25" fill="#1a1a2e" />
    {/* Eye holes */}
    <ellipse cx="32" cy="47" rx="10" ry="8" fill="#b87333" />
    <ellipse cx="68" cy="47" rx="10" ry="8" fill="#b87333" />
    {/* Intense eyes */}
    <ellipse cx="32" cy="47" rx="6" ry="5" fill="white" />
    <ellipse cx="68" cy="47" rx="6" ry="5" fill="white" />
    <circle cx="33" cy="46" r="3" fill="#1a1a2e" />
    <circle cx="69" cy="46" r="3" fill="#1a1a2e" />
    {/* Angry eyebrows */}
    <line x1="24" y1="38" x2="40" y2="42" stroke="#1a1a2e" strokeWidth="3" />
    <line x1="76" y1="38" x2="60" y2="42" stroke="#1a1a2e" strokeWidth="3" />
    {/* Face patch */}
    <ellipse cx="50" cy="72" rx="20" ry="15" fill="#deb887" />
    {/* Nose */}
    <ellipse cx="50" cy="68" rx="8" ry="4" fill="#8b5a2b" />
    {/* Determined mouth */}
    <line x1="40" y1="80" x2="60" y2="80" stroke="#5c3d1e" strokeWidth="3" strokeLinecap="round" />
    {/* Headband knot */}
    <path d="M85 40 Q95 35 92 50 Q88 48 85 45" fill="#ff4757" />
    <path d="M88 42 L95 38" stroke="#ff4757" strokeWidth="3" />
    <path d="M88 48 L96 52" stroke="#ff4757" strokeWidth="3" />
  </svg>
);

const DragonLizard = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full">
    <defs>
      <linearGradient id="dragonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2ecc71" />
        <stop offset="100%" stopColor="#27ae60" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="url(#dragonGrad)" />
    {/* Spikes */}
    <path d="M50 5 L45 15 L50 10 L55 15 Z" fill="#1abc9c" />
    <path d="M35 8 L32 18 L38 14 Z" fill="#1abc9c" />
    <path d="M65 8 L68 18 L62 14 Z" fill="#1abc9c" />
    {/* Horns */}
    <path d="M20 25 L10 10 L25 20 Z" fill="#f39c12" />
    <path d="M80 25 L90 10 L75 20 Z" fill="#f39c12" />
    {/* Big dragon eyes */}
    <ellipse cx="32" cy="45" rx="14" ry="16" fill="#f1c40f" />
    <ellipse cx="68" cy="45" rx="14" ry="16" fill="#f1c40f" />
    {/* Slit pupils */}
    <ellipse cx="32" cy="45" rx="4" ry="14" fill="#1a1a2e" />
    <ellipse cx="68" cy="45" rx="4" ry="14" fill="#1a1a2e" />
    {/* Fire glow reflection */}
    <ellipse cx="28" cy="40" rx="3" ry="2" fill="rgba(255,255,255,0.5)" />
    <ellipse cx="64" cy="40" rx="3" ry="2" fill="rgba(255,255,255,0.5)" />
    {/* Nostrils */}
    <circle cx="42" cy="62" r="4" fill="#1e8449" />
    <circle cx="58" cy="62" r="4" fill="#1e8449" />
    {/* Smoke from nostrils */}
    <ellipse cx="40" cy="55" rx="3" ry="2" fill="rgba(150,150,150,0.5)" />
    <ellipse cx="60" cy="55" rx="3" ry="2" fill="rgba(150,150,150,0.5)" />
    {/* Toothy grin */}
    <path d="M35 75 Q50 85 65 75" fill="#1a1a2e" />
    <path d="M38 75 L40 82 L42 75" fill="white" />
    <path d="M48 76 L50 84 L52 76" fill="white" />
    <path d="M58 75 L60 82 L62 75" fill="white" />
    {/* Scales */}
    <circle cx="20" cy="60" r="5" fill="#1e8449" opacity="0.5" />
    <circle cx="80" cy="60" r="5" fill="#1e8449" opacity="0.5" />
  </svg>
);

const avatars: Avatar[] = [
  {
    id: "cool-cat",
    name: "חתול קול",
    category: "free",
    color: "text-orange-500",
    bgGradient: "from-orange-500/20 to-orange-600/20",
    character: <CoolCat />,
  },
  {
    id: "nerd-dog",
    name: "כלב נרד",
    category: "free",
    color: "text-amber-600",
    bgGradient: "from-amber-500/20 to-amber-600/20",
    character: <NerdDog />,
  },
  {
    id: "crazy-rabbit",
    name: "ארנב משוגע",
    category: "free",
    color: "text-pink-400",
    bgGradient: "from-pink-400/20 to-pink-500/20",
    character: <CrazyRabbit />,
  },
  {
    id: "gangster-panda",
    name: "פנדה גנגסטר",
    category: "premium",
    color: "text-gray-300",
    bgGradient: "from-gray-400/20 to-gray-500/20",
    character: <GangsterPanda />,
  },
  {
    id: "rich-fox",
    name: "שועל עשיר",
    category: "premium",
    color: "text-orange-400",
    bgGradient: "from-orange-400/20 to-red-500/20",
    character: <RichFox />,
  },
  {
    id: "pirate-parrot",
    name: "תוכי פיראט",
    category: "premium",
    color: "text-cyan-400",
    bgGradient: "from-cyan-400/20 to-teal-500/20",
    character: <PirateParrot />,
  },
  {
    id: "zombie-bear",
    name: "דוב זומבי",
    category: "legendary",
    color: "text-green-400",
    bgGradient: "from-green-400/20 to-emerald-500/20",
    character: <ZombieBear />,
  },
  {
    id: "robot-owl",
    name: "ינשוף רובוט",
    category: "legendary",
    color: "text-purple-400",
    bgGradient: "from-purple-400/20 to-indigo-500/20",
    character: <RobotOwl />,
  },
  {
    id: "ninja-monkey",
    name: "קוף נינג'ה",
    category: "legendary",
    color: "text-amber-700",
    bgGradient: "from-amber-600/20 to-amber-700/20",
    character: <NinjaMonkey />,
  },
  {
    id: "dragon-lizard",
    name: "דרקון קטן",
    category: "legendary",
    color: "text-emerald-500",
    bgGradient: "from-emerald-400/20 to-green-600/20",
    character: <DragonLizard />,
  },
];

interface AvatarSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (avatar: Avatar) => void;
  selectedAvatarId?: string;
  unlockedAvatars?: string[];
}

export function AvatarSelector({
  isOpen,
  onClose,
  onSelect,
  selectedAvatarId,
  unlockedAvatars = ["cool-cat", "nerd-dog", "crazy-rabbit"],
}: AvatarSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | "free" | "premium" | "legendary"
  >("all");
  const [previewAvatar, setPreviewAvatar] = useState<Avatar | null>(null);

  const filteredAvatars =
    selectedCategory === "all"
      ? avatars
      : avatars.filter((a) => a.category === selectedCategory);

  const isUnlocked = (avatarId: string) => unlockedAvatars.includes(avatarId);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "free":
        return "text-emerald bg-emerald/10 border-emerald/30";
      case "premium":
        return "text-gold bg-gold/10 border-gold/30";
      case "legendary":
        return "text-purple-400 bg-purple-400/10 border-purple-400/30";
      default:
        return "text-muted-foreground";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "free":
        return null;
      case "premium":
        return <Star className="w-3 h-3" />;
      case "legendary":
        return <Sparkles className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass-effect border-border max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl text-gold font-[family-name:var(--font-orbitron)] text-center flex items-center justify-center gap-3">
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-6 h-6 text-gold" />
            </motion.span>
            בחר אווטר
            <motion.span
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            >
              <Sparkles className="w-6 h-6 text-gold" />
            </motion.span>
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            בחר דמות מצחיקה לפרופיל שלך
          </DialogDescription>
        </DialogHeader>

        {/* Category Tabs */}
        <div className="flex gap-2 justify-center mb-4 flex-wrap">
          {[
            { id: "all", label: "הכל" },
            { id: "free", label: "חינם" },
            { id: "premium", label: "פרימיום" },
            { id: "legendary", label: "אגדי" },
          ].map((cat) => (
            <motion.button
              key={cat.id}
              onClick={() =>
                setSelectedCategory(cat.id as typeof selectedCategory)
              }
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                selectedCategory === cat.id
                  ? "bg-gold text-charcoal border-gold"
                  : "bg-muted/50 text-muted-foreground border-border hover:border-gold/50"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {cat.label}
            </motion.button>
          ))}
        </div>

        <div className="flex gap-4 overflow-hidden">
          {/* Avatar Grid */}
          <div className="flex-1 overflow-y-auto max-h-[60vh] pr-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredAvatars.map((avatar, index) => {
                  const unlocked = isUnlocked(avatar.id);
                  const isSelected = selectedAvatarId === avatar.id;

                  return (
                    <motion.div
                      key={avatar.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => {
                        if (unlocked) {
                          onSelect(avatar);
                        } else {
                          setPreviewAvatar(avatar);
                        }
                      }}
                      onMouseEnter={() => setPreviewAvatar(avatar)}
                      onMouseLeave={() => setPreviewAvatar(null)}
                      className={`relative p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? "border-gold bg-gold/20"
                          : unlocked
                          ? "border-border hover:border-gold/50 bg-muted/30 hover:bg-muted/50"
                          : "border-border/50 bg-muted/10 opacity-70"
                      }`}
                      whileHover={{ scale: unlocked ? 1.05 : 1.02, y: -5 }}
                      whileTap={{ scale: 0.95 }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          if (unlocked) {
                            onSelect(avatar);
                          } else {
                            setPreviewAvatar(avatar);
                          }
                        }
                      }}
                    >
                      {/* Lock overlay */}
                      {!unlocked && (
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center bg-charcoal/60 rounded-2xl z-10"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <Lock className="w-8 h-8 text-muted-foreground" />
                        </motion.div>
                      )}

                      {/* Selected check */}
                      {isSelected && (
                        <motion.div
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gold flex items-center justify-center z-20"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <Check className="w-4 h-4 text-charcoal" />
                        </motion.div>
                      )}

                      {/* Avatar Image */}
                      <motion.div
                        className="w-20 h-20 mx-auto mb-2 rounded-full overflow-hidden"
                        animate={
                          isSelected
                            ? {
                                boxShadow: [
                                  "0 0 0 0 rgba(212,175,55,0.4)",
                                  "0 0 0 10px rgba(212,175,55,0)",
                                ],
                              }
                            : {}
                        }
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        {avatar.character}
                      </motion.div>

                      {/* Name */}
                      <p className="text-sm font-medium text-foreground text-center truncate">
                        {avatar.name}
                      </p>

                      {/* Category Badge */}
                      <div
                        className={`mt-1 flex items-center justify-center gap-1 text-xs px-2 py-0.5 rounded-full border ${getCategoryColor(
                          avatar.category
                        )}`}
                      >
                        {getCategoryIcon(avatar.category)}
                        <span>
                          {avatar.category === "free"
                            ? "חינם"
                            : avatar.category === "premium"
                            ? "פרימיום"
                            : "אגדי"}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Preview Panel */}
          <motion.div
            className="hidden md:flex w-48 flex-col items-center justify-center glass-effect rounded-2xl p-4 border border-border"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <AnimatePresence mode="wait">
              {previewAvatar ? (
                <motion.div
                  key={previewAvatar.id}
                  initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.8, rotate: 10 }}
                  transition={{ type: "spring", damping: 15 }}
                  className="text-center"
                >
                  <motion.div
                    className="w-32 h-32 mx-auto mb-3 rounded-full overflow-hidden"
                    animate={{
                      y: [0, -5, 0],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {previewAvatar.character}
                  </motion.div>
                  <p className="text-lg font-semibold text-foreground">
                    {previewAvatar.name}
                  </p>
                  <div
                    className={`mt-2 inline-flex items-center gap-1 text-sm px-3 py-1 rounded-full border ${getCategoryColor(
                      previewAvatar.category
                    )}`}
                  >
                    {getCategoryIcon(previewAvatar.category)}
                    <span>
                      {previewAvatar.category === "free"
                        ? "חינם"
                        : previewAvatar.category === "premium"
                        ? "פרימיום"
                        : "אגדי"}
                    </span>
                  </div>
                  {!isUnlocked(previewAvatar.id) && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      {previewAvatar.category === "premium"
                        ? "נדרש: 5,000 נקודות"
                        : "נדרש: 20,000 נקודות"}
                    </p>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-muted-foreground"
                >
                  <div className="w-32 h-32 mx-auto mb-3 rounded-full bg-muted/30 flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm">העבר עכבר לתצוגה מקדימה</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-border hover:border-gold/50"
          >
            ביטול
          </Button>
          <Button
            onClick={onClose}
            className="flex-1 bg-emerald text-foreground hover:bg-emerald-light"
          >
            שמור בחירה
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export the avatars for use in other components
export { avatars };
