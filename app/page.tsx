"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Navigation } from "@/components/poker/navigation";
import { GameLobby } from "@/components/poker/game-lobby";
import { PokerTable } from "@/components/poker/poker-table";
import { WalletDashboard } from "@/components/poker/wallet-dashboard";
import { Leaderboard } from "@/components/poker/leaderboard";
import { LoginScreen } from "@/components/poker/login-screen";
import { FirebaseConfigRequired } from "@/components/poker/firebase-config-required";
import {
  GameTypeSelector,
  type GameVariant,
} from "@/components/poker/game-type-selector";
import { AdminPanel } from "@/components/poker/admin-panel";
import { UserSettings } from "@/components/poker/user-settings";
import { AvatarSelector, type Avatar, avatars } from "@/components/poker/avatar-selector";
import { useFirebaseAuth } from "@/components/providers/firebase-auth-provider";
import { useWalletTransactions } from "@/hooks/use-wallet-transactions";
import { Loader2 } from "lucide-react";

function socketGameTypeFromVariant(v: GameVariant): "holdem" | "omaha" {
  if (v === "omaha" || v === "omaha-hi-lo" || v === "5-card-omaha") {
    return "omaha";
  }
  return "holdem";
}

export default function PokerApp() {
  const { configured, loading, user, profile, getIdToken, logout, refreshBootstrap } =
    useFirebaseAuth();
  const isAdmin =
    !!user && (
      profile?.role === "admin" ||
      (!!process.env.NEXT_PUBLIC_ADMIN_UID && user.uid === process.env.NEXT_PUBLIC_ADMIN_UID)
    );
  const [currentView, setCurrentView] = useState("lobby");
  const [selectedGameType, setSelectedGameType] =
    useState<GameVariant>("texas-holdem");
  const [showGameSelector, setShowGameSelector] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar>(avatars[0]!);
  const [roomId, setRoomId] = useState("royal-holdem-1");
  const [tableBuyIn, setTableBuyIn] = useState(2000);
  const [tableBlinds, setTableBlinds] = useState<{ smallBlind: number; bigBlind: number }>({
    smallBlind: 1,
    bigBlind: 2,
  });
  /** סוג משחק ל־Socket / מנוע — תמיד מהצטרפות בלובי או מבורר המשחק בכניסה לשולחן מהתפריט */
  const [tableSocketGameType, setTableSocketGameType] = useState<"holdem" | "omaha">("holdem");

  const txRows = useWalletTransactions(user?.uid);

  const particlesRef = useRef(
    [...Array(12)].map(() => ({
      x: `${Math.random() * 100}%`,
      y1: `${Math.random() * 100}%`,
      y2: `${Math.random() * 100}%`,
      duration: 5 + Math.random() * 5,
      delay: Math.random() * 3,
    })),
  );

  useEffect(() => {
    if (!user || typeof window === "undefined") return;
    if (sessionStorage.getItem("rf_game_selector_shown")) return;
    sessionStorage.setItem("rf_game_selector_shown", "1");
    setShowGameSelector(true);
  }, [user]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    if (q.get("wallet") === "success") {
      toast.success("התשלום התקבל — היתרה תתעדכן מיד");
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (q.get("wallet") === "cancel") {
      toast.message("התשלום בוטל");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const chipBalance = profile?.chips ?? 0;
  const displayName =
    profile?.displayName ??
    user?.displayName ??
    user?.email?.split("@")[0] ??
    "שחקן";

  const handleGameSelect = (gameType: GameVariant) => {
    setSelectedGameType(gameType);
    setShowGameSelector(false);
  };

  const handleJoinTable = (
    roomIdParam: string,
    gameType?: "holdem" | "omaha",
    buyIn?: number,
    blinds?: { smallBlind: number; bigBlind: number },
  ) => {
    const engineGt: "holdem" | "omaha" =
      gameType === "omaha" ? "omaha" : "holdem";
    setTableSocketGameType(engineGt);
    setSelectedGameType(engineGt === "omaha" ? "omaha" : "texas-holdem");
    setRoomId(roomIdParam);
    setTableBlinds(
      blinds ?? {
        smallBlind: 1,
        bigBlind: 2,
      },
    );
    const minBuy = typeof buyIn === "number" && buyIn > 0 ? buyIn : 80;
    const capped = Math.min(
      Math.max(minBuy, 80),
      Math.max(chipBalance, 80),
    );
    setTableBuyIn(capped);
    setCurrentView("table");
  };

  const handleLeaveTable = () => {
    setCurrentView("lobby");
    setTableBlinds({ smallBlind: 1, bigBlind: 2 });
  };

  const handleLogout = () => {
    void logout();
    setCurrentView("lobby");
  };

  const handleMainViewChange = (view: string) => {
    if (view === "table") {
      setTableSocketGameType(socketGameTypeFromVariant(selectedGameType));
    }
    setCurrentView(view);
  };

  if (!configured) {
    return <FirebaseConfigRequired />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-charcoal">
        <Loader2 className="w-10 h-10 animate-spin text-gold" />
        <p className="text-muted-foreground text-sm">טוען…</p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gold/5 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald/5 blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-[40%] left-[30%] w-[400px] h-[400px] rounded-full bg-neon-blue/3 blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <GameTypeSelector
        isOpen={showGameSelector}
        onClose={() => setShowGameSelector(false)}
        onSelect={handleGameSelect}
        selectedGame={selectedGameType}
      />

      <AvatarSelector
        isOpen={showAvatarSelector}
        onClose={() => setShowAvatarSelector(false)}
        onSelect={(a) => setSelectedAvatar(a)}
        selectedAvatarId={selectedAvatar.id}
      />

      <Navigation
        currentView={currentView}
        onViewChange={handleMainViewChange}
        walletBalance={chipBalance}
        onLogout={handleLogout}
        isAdmin={isAdmin}
        onOpenAvatarSelector={() => setShowAvatarSelector(true)}
        selectedAvatar={selectedAvatar}
      />

      <main className="relative z-10">
        <AnimatePresence mode="wait">
          {currentView === "lobby" && (
            <motion.div
              key="lobby"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <GameLobby
                onJoinTable={handleJoinTable}
                onOpenGameSelector={() => setShowGameSelector(true)}
              />
            </motion.div>
          )}

          {currentView === "table" && (
            <motion.div
              key="table"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <PokerTable
                gameType={tableSocketGameType}
                onLeaveTable={handleLeaveTable}
                roomId={roomId}
                playerId={user.uid}
                playerName={displayName}
                buyIn={tableBuyIn}
                getIdToken={getIdToken}
                tableConfig={tableBlinds}
              />
            </motion.div>
          )}

          {currentView === "wallet" && (
            <motion.div
              key="wallet"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <WalletDashboard
                balance={chipBalance}
                getIdToken={getIdToken}
                userEmail={user.email}
                txRows={txRows}
              />
            </motion.div>
          )}

          {currentView === "leaderboard" && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Leaderboard
                currentUserId={user.uid}
                currentChips={chipBalance}
                currentDisplayName={displayName}
              />
            </motion.div>
          )}

          {currentView === "settings" && user && profile && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <UserSettings
                profile={profile}
                getIdToken={getIdToken}
                onProfileUpdated={refreshBootstrap}
              />
            </motion.div>
          )}

          {currentView === "admin" && isAdmin && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AdminPanel
                getIdToken={getIdToken}
                currentAdminUid={user.uid}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating gold particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {particlesRef.current.map((p, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-gold/20"
            initial={{ x: p.x, y: p.y1 }}
            animate={{
              y: [p.y1, p.y2],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}
