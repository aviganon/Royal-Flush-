"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  Coins,
  ShieldAlert,
  ShieldCheck,
  Loader2,
  RefreshCw,
  Search,
  Crown,
  TrendingUp,
  KeyRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface AdminUser {
  uid: string;
  displayName: string;
  email: string | null;
  photoURL: string | null;
  chips: number;
  banned: boolean;
  createdAt: string | null;
}

interface AdminPanelProps {
  getIdToken: () => Promise<string | null>;
  currentAdminUid: string;
}

type ModalMode = "create" | "edit" | "chips" | "delete" | null;

async function adminFetch(
  path: string,
  method: string,
  token: string,
  body?: object,
) {
  const res = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { error?: string }).error ?? "שגיאה");
  return json;
}

export function AdminPanel({ getIdToken, currentAdminUid }: AdminPanelProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalMode>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [saving, setSaving] = useState(false);

  const [createForm, setCreateForm] = useState({
    email: "",
    password: "",
    displayName: "",
    chips: "10000",
  });

  const [editForm, setEditForm] = useState({
    displayName: "",
    resetPassword: "",
  });

  const [chipsForm, setChipsForm] = useState({
    mode: "set" as "set" | "add" | "subtract",
    value: "",
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getIdToken();
      if (!token) return;
      const data = await adminFetch("/api/admin/users", "GET", token) as { users: AdminUser[] };
      setUsers(data.users ?? []);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const openEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setEditForm({ displayName: user.displayName, resetPassword: "" });
    setModal("edit");
  };

  const openChips = (user: AdminUser) => {
    setSelectedUser(user);
    setChipsForm({ mode: "set", value: String(user.chips) });
    setModal("chips");
  };

  const openDelete = (user: AdminUser) => {
    setSelectedUser(user);
    setModal("delete");
  };

  const closeModal = () => {
    setModal(null);
    setSelectedUser(null);
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const token = await getIdToken();
      if (!token) return;
      await adminFetch("/api/admin/users", "POST", token, {
        email: createForm.email.trim(),
        password: createForm.password,
        displayName: createForm.displayName.trim() || undefined,
        chips: Number(createForm.chips) || 10000,
      });
      toast.success(`משתמש נוצר: ${createForm.email}`);
      setCreateForm({ email: "", password: "", displayName: "", chips: "10000" });
      closeModal();
      await loadUsers();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const token = await getIdToken();
      if (!token) return;
      const body: Record<string, unknown> = {};
      if (editForm.displayName.trim()) body.displayName = editForm.displayName.trim();
      if (editForm.resetPassword.length >= 6) body.resetPassword = editForm.resetPassword;
      await adminFetch(`/api/admin/users/${selectedUser.uid}`, "PATCH", token, body);
      toast.success("המשתמש עודכן");
      closeModal();
      await loadUsers();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleChips = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const token = await getIdToken();
      if (!token) return;
      const val = Number(chipsForm.value);
      if (isNaN(val)) { toast.error("ערך לא תקין"); return; }
      const body =
        chipsForm.mode === "set"
          ? { chips: val }
          : { chipsAdjust: chipsForm.mode === "add" ? val : -val };
      await adminFetch(`/api/admin/users/${selectedUser.uid}`, "PATCH", token, body);
      toast.success("הצ'יפים עודכנו");
      closeModal();
      await loadUsers();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBan = async (user: AdminUser) => {
    if (user.uid === currentAdminUid) { toast.error("לא ניתן לחסום את עצמך"); return; }
    try {
      const token = await getIdToken();
      if (!token) return;
      await adminFetch(`/api/admin/users/${user.uid}`, "PATCH", token, { banned: !user.banned });
      toast.success(user.banned ? "המשתמש שוחרר" : "המשתמש חסום");
      await loadUsers();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const token = await getIdToken();
      if (!token) return;
      await adminFetch(`/api/admin/users/${selectedUser.uid}`, "DELETE", token);
      toast.success("המשתמש נמחק");
      closeModal();
      await loadUsers();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(search.toLowerCase()) ||
      (u.email ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const totalChips = users.reduce((s, u) => s + u.chips, 0);
  const bannedCount = users.filter((u) => u.banned).length;

  return (
    <div className="min-h-screen pt-20 lg:pt-24 pb-8 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-8 h-8 text-gold" />
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground font-[family-name:var(--font-orbitron)]">
              פאנל <span className="text-gold animate-neon-pulse">בעלים</span>
            </h1>
          </div>
          <p className="text-muted-foreground">ניהול משתמשים, צ'יפים והרשאות</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: "סה\"כ משתמשים", value: users.length, icon: Users, color: "text-gold" },
            { label: "סה\"כ צ'יפים", value: totalChips.toLocaleString(), icon: Coins, color: "text-emerald" },
            { label: "משתמשים פעילים", value: users.length - bannedCount, icon: ShieldCheck, color: "text-blue-400" },
            { label: "חסומים", value: bannedCount, icon: ShieldAlert, color: "text-destructive" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.08 + i * 0.04 }}
              className="glass-effect rounded-2xl p-4 border border-border"
            >
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className={`text-2xl font-bold font-[family-name:var(--font-orbitron)] ${s.color}`}>
                {s.value}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col sm:flex-row gap-3 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="חיפוש לפי שם או אימייל…"
              className="pr-9 bg-muted border-border text-right"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => void loadUsers()}
            disabled={loading}
            title="רענון"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            className="bg-gold text-charcoal hover:bg-gold-light gap-2"
            onClick={() => { setCreateForm({ email: "", password: "", displayName: "", chips: "10000" }); setModal("create"); }}
          >
            <Plus className="w-4 h-4" />
            משתמש חדש
          </Button>
        </motion.div>

        {/* Users Table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-gold" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-effect rounded-2xl border border-border overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["משתמש", "אימייל", "צ'יפים", "סטטוס", "נוצר", "פעולות"].map((h) => (
                      <th key={h} className="px-4 py-3 text-right text-xs text-muted-foreground font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-muted-foreground py-12">
                          אין משתמשים
                        </td>
                      </tr>
                    ) : (
                      filtered.map((user, i) => (
                        <motion.tr
                          key={user.uid}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ delay: i * 0.02 }}
                          className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${user.banned ? "opacity-50" : ""}`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {user.photoURL ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold text-xs">
                                  {user.displayName.slice(0, 1)}
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-foreground">
                                  {user.displayName}
                                  {user.uid === currentAdminUid && (
                                    <Crown className="inline w-3 h-3 text-gold mr-1" />
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground font-mono">{user.uid.slice(0, 8)}…</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{user.email ?? "—"}</td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-gold font-[family-name:var(--font-orbitron)]">
                              {user.chips.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs border ${
                              user.banned
                                ? "text-destructive bg-destructive/10 border-destructive/30"
                                : "text-emerald bg-emerald/10 border-emerald/30"
                            }`}>
                              {user.banned ? "חסום" : "פעיל"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString("he-IL") : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-gold"
                                title="עריכה"
                                onClick={() => openEdit(user)}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-emerald"
                                title="עדכון צ'יפים"
                                onClick={() => openChips(user)}
                              >
                                <TrendingUp className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={`h-7 w-7 ${user.banned ? "text-emerald hover:text-emerald-light" : "text-amber-500 hover:text-amber-400"}`}
                                title={user.banned ? "שחרר חסימה" : "חסום משתמש"}
                                onClick={() => void handleToggleBan(user)}
                                disabled={user.uid === currentAdminUid}
                              >
                                {user.banned ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                              </Button>
                              {user.uid !== currentAdminUid && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  title="מחיקה"
                                  onClick={() => openDelete(user)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Create User Modal ── */}
      <Dialog open={modal === "create"} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent className="glass-effect border-border">
          <DialogHeader>
            <DialogTitle className="text-gold font-[family-name:var(--font-orbitron)]">
              משתמש חדש
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">אימייל *</label>
              <Input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="user@example.com"
                className="bg-muted border-border"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">סיסמה * (מינימום 6 תווים)</label>
              <Input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="••••••"
                className="bg-muted border-border"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">שם תצוגה</label>
              <Input
                value={createForm.displayName}
                onChange={(e) => setCreateForm((p) => ({ ...p, displayName: e.target.value }))}
                placeholder="שם השחקן"
                className="bg-muted border-border text-right"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">צ'יפים התחלתיים</label>
              <Input
                type="number"
                value={createForm.chips}
                onChange={(e) => setCreateForm((p) => ({ ...p, chips: e.target.value }))}
                min={0}
                className="bg-muted border-border"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1 bg-gold text-charcoal hover:bg-gold-light"
                onClick={() => void handleCreate()}
                disabled={saving || !createForm.email || !createForm.password}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "צור משתמש"}
              </Button>
              <Button variant="outline" onClick={closeModal} disabled={saving}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit User Modal ── */}
      <Dialog open={modal === "edit"} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent className="glass-effect border-border">
          <DialogHeader>
            <DialogTitle className="text-gold font-[family-name:var(--font-orbitron)]">
              עריכת משתמש
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">שם תצוגה</label>
                <Input
                  value={editForm.displayName}
                  onChange={(e) => setEditForm((p) => ({ ...p, displayName: e.target.value }))}
                  className="bg-muted border-border text-right"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <KeyRound className="w-3 h-3" /> איפוס סיסמה (השאר ריק לדלג)
                </label>
                <Input
                  type="password"
                  value={editForm.resetPassword}
                  onChange={(e) => setEditForm((p) => ({ ...p, resetPassword: e.target.value }))}
                  placeholder="סיסמה חדשה (מינימום 6)"
                  className="bg-muted border-border"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1 bg-gold text-charcoal hover:bg-gold-light"
                  onClick={() => void handleEdit()}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "שמור"}
                </Button>
                <Button variant="outline" onClick={closeModal} disabled={saving}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Chips Modal ── */}
      <Dialog open={modal === "chips"} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent className="glass-effect border-border">
          <DialogHeader>
            <DialogTitle className="text-gold font-[family-name:var(--font-orbitron)]">
              עדכון צ'יפים
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                {selectedUser.displayName} — יתרה נוכחית:{" "}
                <span className="text-gold font-bold">{selectedUser.chips.toLocaleString()}</span>
              </p>
              <div className="flex gap-2">
                {(["set", "add", "subtract"] as const).map((m) => (
                  <Button
                    key={m}
                    size="sm"
                    variant={chipsForm.mode === m ? "default" : "outline"}
                    className={chipsForm.mode === m ? "bg-gold text-charcoal" : "border-border"}
                    onClick={() => setChipsForm((p) => ({ ...p, mode: m }))}
                  >
                    {m === "set" ? "קבע" : m === "add" ? "+ הוסף" : "− הפחת"}
                  </Button>
                ))}
              </div>
              <Input
                type="number"
                value={chipsForm.value}
                onChange={(e) => setChipsForm((p) => ({ ...p, value: e.target.value }))}
                min={0}
                placeholder="כמות צ'יפים"
                className="bg-muted border-border"
              />
              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1 bg-emerald text-foreground hover:bg-emerald-light"
                  onClick={() => void handleChips()}
                  disabled={saving || !chipsForm.value}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "עדכן צ'יפים"}
                </Button>
                <Button variant="outline" onClick={closeModal} disabled={saving}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Modal ── */}
      <Dialog open={modal === "delete"} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent className="glass-effect border-border">
          <DialogHeader>
            <DialogTitle className="text-destructive font-[family-name:var(--font-orbitron)]">
              מחיקת משתמש
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                האם למחוק לצמיתות את{" "}
                <span className="text-foreground font-semibold">{selectedUser.displayName}</span>?
                <br />
                פעולה זו תמחק את כל נתוני המשתמש מ-Firestore ומ-Firebase Auth.
              </p>
              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1 bg-destructive text-white hover:bg-destructive/80"
                  onClick={() => void handleDelete()}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "מחק לצמיתות"}
                </Button>
                <Button variant="outline" onClick={closeModal} disabled={saving}>
                  ביטול
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
