"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Navigation } from "@/components/poker/navigation";
import { GameLobby } from "@/components/poker/game-lobby";
import { PokerTable } from "@/components/poker/poker-table";
import { WalletDashboard } from "@/components/poker/wallet-dashboard";
import { Leaderboard } from "@/components/poker/leaderboard";
import { LoginScreen } from "@/components/poker/login-screen";
import { FirebaseSetupPlaceholder } from "@/components/poker/firebase-setup-placeholder";
import {
  GameTypeSelector,
  type GameVariant,
} from "@/components/poker/game-type-selector";
import { useFirebaseAuth } from "@/components/providers/firebase-auth-provider";
import { useWalletTransactions } from "@/hooks/use-wallet-transactions";
import { Loader2 } from "lucide-react";

export default function PokerApp() {
  const { configured, loading, user, profile, getIdToken, logout } =
    useFirebaseAuth();
  const [currentView, setCurrentView] = useState("lobby");
  const [selectedGameType, setSelectedGameType] =
    useState<GameVariant>("texas-holdem");
  const [showGameSelector, setShowGameSelector] = useState(false);
  const [roomId, setRoomId] = useState("royal-holdem-1");
  const [tableBuyIn, setTableBuyIn] = useState(2000);

  const txRows = useWalletTransactions(user?.uid);

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
    tableId: string,
    gameType?: "holdem" | "omaha",
    buyIn?: number,
  ) => {
    if (gameType) {
      setSelectedGameType(
        gameType === "holdem" ? "texas-holdem" : "omaha",
      );
    }
    setRoomId(`table-${tableId}`);
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
  };

  const handleLogout = () => {
    void logout();
    setCurrentView("lobby");
  };

  if (!configured) {
    return <FirebaseSetupPlaceholder />;
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

  const getTableGameType = (): "holdem" | "omaha" => {
    if (
      selectedGameType === "omaha" ||
      selectedGameType === "omaha-hi-lo" ||
      selectedGameType === "5-card-omaha"
    ) {
      return "omaha";
    }
    return "holdem";
  };

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

      <Navigation
        currentView={currentView}
        onViewChange={setCurrentView}
        walletBalance={chipBalance}
        onLogout={handleLogout}
        onOpenGameSelector={() => setShowGameSelector(true)}
        selectedGameType={selectedGameType}
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
              <GameLobby onJoinTable={handleJoinTable} />
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
                gameType={getTableGameType()}
                onLeaveTable={handleLeaveTable}
                roomId={roomId}
                playerId={user.uid}
                playerName={displayName}
                buyIn={tableBuyIn}
                getIdToken={getIdToken}
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
              <Leaderboard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-gold/30"
            initial={{
              x:
                Math.random() *
                (typeof window !== "undefined" ? window.innerWidth : 1000),
              y:
                Math.random() *
                (typeof window !== "undefined" ? window.innerHeight : 800),
            }}
            animate={{
              y: [null, -20, 20],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}
