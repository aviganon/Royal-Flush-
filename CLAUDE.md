# CLAUDE.md — Royal Flush Poker
## 📖 קרא קובץ זה לפני כל שינוי!

---

## 🏗️ ארכיטקטורה — מה רץ איפה

| שכבה | שירות | URL |
|------|--------|-----|
| **Frontend** | Vercel (Next.js) | https://royal-flush-poker.vercel.app |
| **Socket Server** | Railway (Node.js) | https://royal-flush-production-17d4.up.railway.app |
| **Database + Auth** | Firebase | royal-flush-32cbb |

### זרימת Deploy
- `git push` לגיטהאב → Vercel מ-deploy אוטומטית (Next.js)
- `git push` לגיטהאב → Railway מ-deploy אוטומטית (Socket server)
- **שני השירותים מאותו repo** — שינוי ב-server/ משפיע על Railway

---

## ✅ מה עובד עכשיו — אל תשבור!

### Frontend (Vercel)
- ✅ Login — Email/Password + Google
- ✅ Lobby — כרטיסי שולחן עם נתונים חיים
- ✅ Dialog "הצטרף לשולחן" — **תוקן ב-Apr 2026** (משתמש ב-`table` מה-closure)
- ✅ Leaderboard — נתונים אמיתיים מ-Firestore
- ✅ Wallet Dashboard — היסטוריית טרנזקציות + Rebuy
- ✅ הודעת חיבור Socket — מבחינה בין localhost לייצור

### Socket Server (Railway)
- ✅ Texas Hold'em + Omaha מלא
- ✅ Chip sync לFirestore אחרי כל יד
- ✅ Rebuy (10,000 chips כשנגמר)
- ✅ Turn timeout אוטומטי
- ✅ CORS מוגדר ל-Vercel URL

---

## ⚠️ כללי זהב — לפני כל שינוי

### 1. Dialog בלובי — באג שתוקן, אל תחזיר!
```tsx
// ❌ לא לשנות ל:
{selectedTable && (
  <h4>{selectedTable.name}</h4>
)}

// ✅ הגרסה הנכונה:
<h4>{table.name}</h4>  // table מה-.map() closure
```
**הסבר:** `selectedTable` state הוא `null` כשה-Dialog נפתח. `table` מה-closure תמיד נכון.

### 2. Socket URL — לא לשנות ידנית
`NEXT_PUBLIC_POKER_SOCKET_URL` מוגדר ב-Vercel ל-Railway URL.
**אל תכניס URL קשיח בקוד** — השתמש תמיד ב-env var.

### 3. start command ב-Railway
Railway מריץ: `tsx server/poker-server.ts`
**לא** `npm run dev` ולא `npm start`.

### 4. next.config.mjs
```js
// הגרסה הנכונה — אל תשנה:
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
}
```
אל תוסיף `turbopack` — גורם לבעיות עם Socket.IO.

---

## 📁 קבצים קריטיים ומה תפקידם

### קבצים שנוצרו — אל תמחק
| קובץ | תפקיד |
|------|--------|
| `server/poker-server.ts` | Socket.IO — רץ ב-Railway |
| `server/chip-sync.ts` | מסנכרן chips ל-Firestore אחרי יד |
| `server/firebase-verify.ts` | אימות Firebase JWT |
| `app/api/poker/sync-chips/route.ts` | API לעדכון chips |
| `app/api/poker/rebuy/route.ts` | API ל-rebuy (10k chips) |
| `app/api/leaderboard/route.ts` | Top 20 שחקנים מ-Firestore |
| `app/api/rooms/route.ts` | Proxy לסטטוס חדרים |

### קבצים ששונו — שמור על הגרסה הנוכחית
| קובץ | מה שונה |
|------|---------|
| `components/poker/game-lobby.tsx` | Dialog משתמש ב-`table` מ-closure |
| `components/poker/poker-table.tsx` | הודעת חיבור מבחינה localhost/ייצור |
| `components/poker/leaderboard.tsx` | נתונים אמיתיים מ-Firestore |
| `components/poker/wallet-dashboard.tsx` | כפתור Rebuy + היסטוריית win/loss |
| `hooks/use-poker-socket.ts` | קורא ל-Railway URL מ-env var |

---

## 🔑 משתני סביבה

### Vercel (כל המשתנים מוגדרים)
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyArcLxxMqi4AuJebRC6NgNhWz33PzJWF9o
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=712722131092
NEXT_PUBLIC_FIREBASE_APP_ID=1:712722131092:web:5e20a1f89db26ba121ac81
NEXT_PUBLIC_FIREBASE_PROJECT_ID=royal-flush-32cbb
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=royal-flush-32cbb.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=royal-flush-32cbb.firebasestorage.app
FIREBASE_SERVICE_ACCOUNT_JSON=<JSON מלא>
NEXT_PUBLIC_APP_URL=https://royal-flush-poker.vercel.app
NEXT_PUBLIC_POKER_SOCKET_URL=https://royal-flush-production-17d4.up.railway.app
POKER_SERVER_SECRET=rf_secret_161ac59e912e7cef00861a2b30c399b6
NEXT_PUBLIC_ADMIN_UID=<Firebase UID של הבעלים>
ADMIN_UID=<אותו UID — לצד השרת>
```

### Railway (Socket Server)
```
NEXT_PUBLIC_FIREBASE_API_KEY=...  (זהה)
FIREBASE_SERVICE_ACCOUNT_JSON=<JSON מלא>
NEXT_PUBLIC_APP_URL=https://royal-flush-poker.vercel.app
POKER_SERVER_SECRET=rf_secret_161ac59e912e7cef00861a2b30c399b6
POKER_CORS_ORIGIN=https://royal-flush-poker.vercel.app
PORT=4000
```

---

## 🔄 Chip Flow — איך עובד הסנכרון

```
1. שחקן join → snapshotChipsBefore() שומר יתרה
2. יד מתחילה ב-HoldemEngine
3. יד מסתיימת → engine.handFinished = true
4. maybeSyncChips() → POST /api/poker/sync-chips
5. Firebase Admin → כותב chips + טרנזקציה לFirestore
6. Client onSnapshot → UI מתעדכן
```

---

## 🏗️ מבנה Repo

```
ROYAL FLUSH/
├── app/
│   ├── api/
│   │   ├── leaderboard/route.ts      ← Firestore top 20
│   │   ├── poker/sync-chips/route.ts ← chip sync
│   │   ├── poker/rebuy/route.ts      ← 10k chips
│   │   └── rooms/route.ts            ← lobby status
│   └── page.tsx
├── components/poker/
│   ├── game-lobby.tsx    ← ⚠️ table closure fix
│   ├── poker-table.tsx   ← ⚠️ connection message fix
│   ├── leaderboard.tsx
│   ├── wallet-dashboard.tsx
│   └── navigation.tsx
├── hooks/
│   └── use-poker-socket.ts  ← Railway URL מ-env
├── server/
│   ├── poker-server.ts   ← Railway entry point
│   ├── chip-sync.ts
│   └── firebase-verify.ts
├── lib/poker/
│   ├── holdem-engine.ts  ← Texas Hold'em + Omaha
│   ├── deck.ts
│   └── evaluate.ts
├── next.config.mjs       ← ⚠️ אל תוסיף turbopack
├── CLAUDE.md             ← המסמך הזה
└── .env.local            ← כל ה-keys (לא ב-git)
```

---

## 🚀 Deploy — איך לפרוס שינויים

```bash
# פרוס ל-Vercel (Next.js):
git add .
git commit -m "describe change"
git push
# Vercel ו-Railway מ-deploy אוטומטית תוך 2-3 דקות

# בדוק status:
# Vercel: https://vercel.com/ganonavi-2652s-projects/royal-flush-poker
# Railway: https://railway.com/project/863c3b44-7601-494b-ab40-7e4fa0526bff
```

---

## 🔗 לינקים חיוניים

| שירות | לינק |
|--------|------|
| **האתר** | https://royal-flush-poker.vercel.app |
| **Socket Server** | https://royal-flush-production-17d4.up.railway.app |
| **Vercel Dashboard** | https://vercel.com/ganonavi-2652s-projects/royal-flush-poker |
| **Railway Dashboard** | https://railway.com/project/863c3b44-7601-494b-ab40-7e4fa0526bff |
| **Firebase Console** | https://console.firebase.google.com/project/royal-flush-32cbb |
| **GitHub Repo** | https://github.com/aviganon/Royal-Flush- |

---

## 👑 פאנל בעלים (Admin)

| נושא | פרטים |
|------|--------|
| **הפעלה** | הגדר `NEXT_PUBLIC_ADMIN_UID` + `ADMIN_UID` ב-Vercel — אותו Firebase UID של הבעלים |
| **גישה** | כפתור "פאנל בעלים" מופיע בניווט רק לבעלים |
| **יכולות** | יצירת משתמש, עריכת שם/סיסמה, כוונון צ'יפים (קבע/הוסף/הפחת), חסימה/שחרור, מחיקה |
| **API** | `GET/POST /api/admin/users` · `PATCH/DELETE /api/admin/users/[uid]` |
| **אבטחה** | כל route מאמת idToken + בודק שה-UID === `ADMIN_UID` |

---

## ❌ מה לא לעשות — רשימה שחורה

1. **אל תשנה** `{selectedTable && (` → כבר תוקן, יגרום ל-Dialog להיות ריק
2. **אל תשנה** `tsx server/poker-server.ts` ב-Railway Start Command
3. **אל תוסיף** `turbopack: true` ל-next.config.mjs
4. **אל תשנה** `NEXT_PUBLIC_POKER_SOCKET_URL` לURL שאינו Railway
5. **אל תמחק** `server/chip-sync.ts` — Firestore sync ייפסק
6. **אל תשנה** את ה-Firestore rules ללא בדיקה — users יאבדו גישה
7. **אל תוסיף** `socketPath: "/api/socket"` ב-use-poker-socket — Railway לא מגיב לזה

---

*עודכן לאחרונה: אפריל 2026*
*גרסה: Railway Socket + Vercel Frontend + Firebase Auth/DB*
