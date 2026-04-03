# CLAUDE.md — Royal Flush

**לפני שאתה עושה שינויים:** קרא מסמך זה במלואו. הוא מגדיר ארכיטקטורה, סודות, פריסה ומגבלות (במיוחד Socket מול Vercel).

---

## תוכן עניינים

| סעיף | תוכן |
|------|------|
| [Firebase](#firebase) | פרויקט, Auth, Firestore, Rules |
| [Vercel](#vercel) | URL, צוות, חיבור GitHub, משתני סביבה בדשבורד |
| [משתני סביבה](#משתני-סביבה-רשימה-מלאה) | כל המפתחות — **בלי ערכים אמיתיים בקוד/ב-git** |
| [קבצים חדשים](#קבצים-חדשים-תשתית-עיקרית) | מה נוצר ותפקיד כל אחד |
| [קבצים שעודכנו](#קבצים-שעודכנו-עיקריים) | שינויים מרכזיים |
| [זרימת צ'יפים (Chip Flow)](#זרימת-ציפים-chip-flow) | מקצה לקצה |
| [אזהרת Socket + Vercel](#-אזהרת-socket--vercel) | **חובה לקרוא לפני פריסה** |
| [Checklist](#checklist-מה-עובד--מה-חסר) | מה עובד / מה עדיין חסר |
| [בדיקות עכשיו](#verification-checklist) | רשימת בדיקות אחרי שינוי או לפני שחרור |
| [מבנה קבצים](#מבנה-קבצים-עץ-מוצע) | עץ עם ✅ |
| [הפעלה מקומית ובדיקות](#הפעלה-מקומית-ובדיקות) | פקודות, CI, סנכרון Git |

---

## Firebase

| נושא | פרטים |
|------|--------|
| **פרויקט (דוגמה)** | `royal-flush-32cbb` — [הגדרות כלליות](https://console.firebase.google.com/project/royal-flush-32cbb/settings/general) |
| **Authentication** | Email/Password, Google, Facebook (Facebook דורש App ב-Meta + הגדרה בקונסול) |
| **Authorized domains** | `localhost` + דומיין Vercel/ייצור תחת Auth → Settings |
| **Firestore** | אוספים: `users/{uid}` (שדות כולל `chips`, `displayName`, …), `users/{uid}/transactions/{txId}` להפקדות Stripe |
| **Rules** | קובץ `firestore.rules` — קריאה לבעלים בלבד; **אין כתיבת `chips` מהלקוח** (רק Admin SDK בשרת) |
| **פריסת Rules** | `npm run firebase:deploy-rules` (אחרי `firebase login`) — `.firebaserc` מצביע על הפרויקט |
| **Service Account** | מפתח JSON → משתנה סביבה `FIREBASE_SERVICE_ACCOUNT_JSON` (שורה אחת) — **לא ב-git** |

---

## Vercel

| נושא | פרטים |
|------|--------|
| **חיבור GitHub** | ריפו: `https://github.com/aviganon/Royal-Flush-` — ייבוא פרויקט מ-Vercel → Add Git Repository |
| **URL** | **ייצור:** [https://royal-flush-poker.vercel.app/](https://royal-flush-poker.vercel.app/) — ב-Vercel נקבע `VERCEL_URL` אוטומטית; מומלץ גם `NEXT_PUBLIC_APP_URL=https://royal-flush-poker.vercel.app` ל-Stripe ולקישורים. אותו דומיין ב-**Firebase Authorized domains** וב-**Stripe** (אם רלוונטי) |
| **Team** | לפי ארגון ב-Vercel — ללא ערך קבוע במסמך |
| **Build** | `npm run build` — ראה CI ב-`.github/workflows/ci.yml` |
| **משתני סביבה ב-Vercel** | Project → Settings → Environment Variables: `NEXT_PUBLIC_*`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `STRIPE_*`, וגם **`POKER_SERVER_SECRET`** (זהה לערך בשרת Socket) |

**חשוב:** Vercel מריץ רק את **Next.js**. את **שרת ה-Socket** (`server/poker-server.ts`) **לא** מריצים על Vercel — ראה סעיף [אזהרת Socket](#-אזהרת-socket--vercel).

---

## משתני סביבה (רשימה מלאה)

הערכים האמיתיים רק ב-`.env.local` (מקומי) או ב-Vercel Secrets — **לעולם לא בקומיט**.

| משתנה | תפקיד |
|--------|--------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web SDK |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | לרוב `{projectId}.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | מזהה פרויקט |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | מ-bucket snippet |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | מ-snippet |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | מ-snippet |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | JSON מלא של Service Account (שורה אחת) — bootstrap, Stripe webhook, אימות Socket |
| `NEXT_PUBLIC_APP_URL` | כתובת האתר (מקומי: `http://localhost:3000`; ייצור: `https://royal-flush-poker.vercel.app` — אופציונלי ב-Vercel אם משתמשים ב-`VERCEL_URL`) |
| `NEXT_PUBLIC_POKER_SOCKET_URL` | כתובת שרת Socket.IO (מקומי: `http://localhost:4000`; בייצור: URL של שרת נפרד) |
| `POKER_CORS_ORIGIN` | אופציונלי — מקורות מופרדים בפסיקים ל-CORS של Socket |
| `POKER_SOCKET_PORT` | אופציונלי — ברירת מחדל 4000 |
| `POKER_SERVER_SECRET` | **חובה בייצור** — אימות server-to-server ל-`POST /api/poker/sync-chips` (אותו ערך בשרת הפוקר וב-Vercel) |
| `STRIPE_SECRET_KEY` | תשלומים |
| `STRIPE_WEBHOOK_SECRET` | אימות חתימת webhook |

דוגמה להעתקה: `.env.local.example` בשורש הפרויקט.

---

## קבצים חדשים (תשתית עיקרית)

| קובץ / תיקייה | תפקיד |
|----------------|--------|
| `lib/firebase/` | `config`, `client-app`, `admin`, `auth-actions`, `user-profile` — חיבור Firebase Web + דפוסים ל-API |
| `components/providers/firebase-auth-provider.tsx` | הקשר React: משתמש Firebase + onSnapshot לפרופיל/צ'יפים |
| `app/api/auth/bootstrap/route.ts` | יצירת/עדכון `users/{uid}` ב-Firestore (Admin) |
| `app/api/stripe/create-checkout-session/route.ts` | יצירת סשן Stripe עם metadata ל-`firebaseUid` |
| `app/api/stripe/webhook/route.ts` | `checkout.session.completed` → עדכון `chips` + תנועה (אידמפוטנטיות לפי `stripe_webhook_events/{eventId}`) |
| `app/api/poker/sync-chips/route.ts` | סיום יד → עדכון `chips` + `transactions` (מאומת ב-`POKER_SERVER_SECRET`) |
| `app/api/poker/rebuy/route.ts` | Rebuy דרך Admin כשב-Firestore מתחת לסף |
| `app/api/leaderboard/route.ts` | טופ 20 לפי `chips` |
| `app/api/rooms/route.ts` | פרוקסי ל-`GET` על שרת הפוקר `/rooms` |
| `lib/site.ts` | `PRODUCTION_SITE_URL`, `getAppBaseUrl()` — Vercel (`VERCEL_URL`) / `NEXT_PUBLIC_APP_URL` / מקומי |
| `lib/env.ts` | `isProductionDeploy()` לבדיקות אבטחה ב-API |
| `server/poker-server.ts` | שרת Node + Socket.IO — Hold'em + **Omaha (PLO)** לפי `variant` בחדר, `rebuy`, `GET /rooms` |
| `server/chip-sync.ts` | קריאה משרת הפוקר ל-`/api/poker/sync-chips` אחרי כל יד |
| `server/firebase-verify.ts` | אימות `idToken` ב-`join` אם הוגדר Admin JSON לתהליך השרת |
| `lib/poker/` | מנוע משותף: `holdem-engine` (`variant: holdem \| omaha`), `evaluate` (`bestOmahaScore`), `deck`, `types` |
| `hooks/use-poker-socket.ts` | לקוח Socket + שליחת `idToken` ב-join |
| `hooks/use-wallet-transactions.ts` | האזנה ל-`transactions` ב-Firestore |
| `firestore.rules` + `firebase.json` + `.firebaserc` | אבטחת Firestore + פריסה |
| `.github/workflows/ci.yml` | CI: `tsc` + `next build` |
| `.github/BRANCH_PROTECTION.md` | הוראות להגנה על `main` |

---

## קבצים שעודכנו (עיקריים)

| קובץ | שינוי עיקרי |
|------|------------|
| `app/page.tsx` | זרימה עם `useFirebaseAuth`, לובי/שולחן/ארנק, `sync:git` תואם תיעוד |
| `app/layout.tsx` | `FirebaseAuthProvider`, Toaster |
| `components/poker/login-screen.tsx` | התחברות Firebase (מייל, Google, Facebook) |
| `components/poker/firebase-config-required.tsx` | מסך כשחסרים משתני Firebase Web (לא דמו) |
| `components/poker/game-lobby.tsx` | חדרים מ-`/api/rooms` + יצירת חדר אמיתית בשרת |
| `components/poker/leaderboard.tsx` | נתונים מ-`/api/leaderboard` |
| `components/poker/poker-table.tsx` | חיבור Socket + `getIdToken` |
| `components/poker/wallet-dashboard.tsx` | Stripe + תנועות אמיתיות מ-Firestore (ללא סטטיסטיקות דמה) |
| `package.json` | `dev` (Next+Socket), `typecheck`, `sync:git`, `firebase:deploy-rules` |
| `README.md` | התחלה מהירה, סנכרון, CI |
| `.gitignore` | `.env*.local`, `env.local`, `*.tsbuildinfo` |

---

## זרימת צ'יפים (Chip Flow)

```
1) הרשמה/כניסה (Firebase Auth)
        ↓
2) POST /api/auth/bootstrap (Bearer idToken) → Firestore users/{uid}
   • משתמש חדש: chips התחלתיים (ברירת מחדל בקוד bootstrap)
        ↓
3) מסך ארנק קורא chips דרך onSnapshot (FirebaseAuthProvider)
        ↓
4) הפקדה: create-checkout-session → Stripe → משתמש משלם
        ↓
5) Webhook checkout.session.completed → Admin SDK מוסיף chips + רשומה ב-transactions
        ↓
6) שולחן פוקר (Socket): buyIn ב-join — מנוע מחזיק צ'יפים בזיכרון
        ↓
7) סיום יד → `server/chip-sync.ts` → `POST /api/poker/sync-chips` (עם `POKER_SERVER_SECRET`) → Firestore `users.chips` + תנועות poker_win / poker_loss
        ↓
8) מעט צ'יפים בשולחן → כפתור «טעינת צ'יפים» → Socket `rebuy` → `/api/poker/rebuy` (מסנכרן Firestore + מושב)
```

**ייצור:** חובה `POKER_SERVER_SECRET` ב-Vercel ובשרת הפוקר; בלי זה סנכרון נחסם.

---

## ⚠️ אזהרת Socket + Vercel

- **Vercel** מריץ **פונקציות serverless / Edge** — **לא** תהליך Node קבוע שמאזין על פורט ל-Socket.IO.
- לכן **`server/poker-server.ts` לא יעבוד על Vercel** כחלק מה-deploy הסטנדרטי של Next.
- **פתרונות נפוצים:**
  - **Cloud Run** / **Railway** / **Fly.io** / **Render** / **VPS** — להריץ את שרת ה-Socket שם, ולהגדיר `NEXT_PUBLIC_POKER_SOCKET_URL` לכתובת הציבורית שלו.
  - **CORS:** `POKER_CORS_ORIGIN` חייב לכלול את דומיין ה-Vercel (וגם localhost לפיתוח).
- בלי שרת Socket נפרד: **ה-UI של האפליקציה עלול לעבוד**, אבל **שולחן הרב-משתתפים לא יתחבר**.

---

## Checklist: מה עובד / מה חסר

| סטטוס | נושא |
|--------|------|
| ✅ | Next.js App Router, UI לובי/ניווט |
| ✅ | Firebase Auth (מייל, Google, Facebook אם הופעל בקונסול) |
| ✅ | Firestore פרופיל + צ'יפים + transactions (הפקדות) |
| ✅ | API bootstrap, Stripe checkout + webhook (אם מפתחות מוגדרים) |
| ✅ | שרת Socket מקומי + מנוע Hold'em + **Omaha** (חלוקת 4 קלפים, שודאון 2 מהיד + 3 מהבורד; מבנה הימורים כמו NL Hold'em — לא pot-limit מלא) |
| ✅ | CI ב-GitHub Actions |
| ⚠️ | שולחן בייצור — **דורש** שרת Socket נפרד + env |
| ✅ | סנכרון צ'יפים אחרי יד — מנוע → `sync-chips` API → Firestore |
| ⚠️ | משיכות כסף / KYC — תיעוד בלבד ב-UI |

### וריאנטים עתידיים (רעיונות / לא ממומש)

| וריאנט | הערות טכניות |
|--------|----------------|
| **Pot-Limit אמיתי (PLO)** | הגבלת raise לגודל הפוט + קול — שינוי לוגיקת `raise`/`call` במנוע |
| **Omaha Hi-Lo (PLO8)** | שני סקופים (גבוה + נמוך 8-or-better); `evaluate.ts` — זיהוי low qualified + split pot |
| **Short Deck (6+)** | חפיסה 36 קלפים; דירוג יד שונה (Flush מעל Full House); שינוי `deck` + טבלת דירוג |
| **5-Card Omaha** | 5 קלפי יד, שודאון 2+3 כמו היום אבל קומבינטוריקה גדולה יותר |
| **Stud / Razz** | אין פלופ משותף קבוע; רחובות עם קלפים גלויים — מנוע נפרד או הרחבה גדולה |
| **טורנירים** | blind schedule, ICM, שולחנות מיזוג — שכבה מעל המנוע הנוכחי |

---

## מבנה קבצים (עץ מוצע)

```
ROYAL FLUSH/
├── .env.local.example          ✅ תבנית סודות
├── .firebaserc                 ✅ פרויקט Firebase ברירת מחדל
├── .github/
│   ├── BRANCH_PROTECTION.md    ✅
│   └── workflows/ci.yml        ✅
├── app/
│   ├── api/auth/bootstrap/     ✅
│   ├── api/poker/*             ✅ sync-chips, rebuy
│   ├── api/leaderboard/        ✅
│   ├── api/rooms/              ✅
│   ├── api/stripe/*            ✅
│   ├── layout.tsx              ✅
│   ├── page.tsx                ✅
│   └── globals.css
├── components/poker/*          ✅ מסכי משחק / התחברות
├── components/providers/       ✅ FirebaseAuthProvider
├── firestore.rules             ✅
├── firebase.json               ✅
├── hooks/use-poker-socket.ts   ✅
├── hooks/use-wallet-transactions.ts ✅
├── lib/site.ts                 ✅ getAppBaseUrl, כתובת ייצור
├── lib/env.ts                  ✅ isProductionDeploy (API)
├── lib/firebase/*              ✅
├── lib/poker/*                 ✅ מנוע משחק
├── server/
│   ├── poker-server.ts         ✅
│   ├── chip-sync.ts            ✅
│   └── firebase-verify.ts      ✅
├── next.config.mjs             ✅ turbopack.root (שורש פרויקט; נמנע בלבול מ-lockfile)
├── CLAUDE.md                   ✅ מסמך זה
├── README.md                   ✅
└── package.json                ✅
```

---

## הפעלה מקומית ובדיקות

```bash
npm install
cp .env.local.example .env.local   # ומלא ערכים
npm run dev                        # Next + Socket (פורטים 3000 ו-4000)
npm run typecheck
npm run sync:git                   # לפני עבודה: משיכה מ-main
```

- **פריסת חוקים:** `npm run firebase:deploy-rules`
- **סנכרון Git / GitHub / Cloud:** ראה סעיף קודם בגרסה המפורטת למטה.

---

## סנכרון Git, GitHub ו-Google Cloud (מפורט)

**מקור אמת:** ענף `main` ב-[GitHub](https://github.com/aviganon/Royal-Flush-).

```bash
npm run sync:git              # git fetch + pull origin main
git status && git diff
git push origin main
```

- **אל** `git push --force` ל-`main` בלי הבנה.
- ב-Cloud: `git clone` אותו ריפו; תמיד `pull` לפני עריכה במחשב אחר.
- **Branch protection + CI:** `.github/BRANCH_PROTECTION.md`

---

## כשלים נפוצים

| תסמין | בדיקה |
|--------|--------|
| מסך "Firebase לא מוגדר" | `NEXT_PUBLIC_FIREBASE_*` ב-`.env.local` |
| אין מסמך user / צ'יפים | `FIREBASE_SERVICE_ACCOUNT_JSON` + `firestore.rules` פרוסים |
| Socket לא מתחבר | פורט 4000, `NEXT_PUBLIC_POKER_SOCKET_URL`, CORS |
| שולחן לא עובד ב-Vercel | צפוי — חובה שרת Socket נפרד (סעיף אזהרה למעלה) |
| Stripe נדחה | מפתחות + Webhook URL ציבורי |
| sync-chips 401 בייצור | `POKER_SERVER_SECRET` זהה ב-Vercel ובשרת הפוקר |
| Turbopack / iCloud | אל תשמור `package-lock.json` בשורש הבית; `turbopack.root` ב-`next.config.mjs` |

---

## Verification checklist

**מה לבדוק עכשיו** — הנחיה ל-Claude / למפתח.

השתמש ברשימה הזו אחרי שינוי או לפני שחרור — סמן ✓ כשבוצע.

### מקומי (מחשב המפתח)

| # | בדיקה | איך |
|---|--------|-----|
| 1 | TypeScript | `npm run typecheck` — ללא שגיאות |
| 2 | בנייה | `npm run build` — מסתיים בהצלחה |
| 3 | הרצה משולבת | `npm run dev` — Next (3000) + Socket (4000) |
| 4 | Auth + פרופיל | התחברות → וידוא שמסמך `users/{uid}` נוצר/מתעדכן (bootstrap) |
| 5 | שולחן Hold'em / Omaha | כניסה לחדר (או יצירת חדר עם `gameType`) → פעולות → סיום יד → בלוג שרת פוקר: הודעות `[chip-sync]` או שגיאת HTTP אם חסרים env |
| 6 | Rebuy ב-UI | מתחת ל-100 צ'יפים בשולחן → כפתור «טעינת צ'יפים» → וידוא ב-Firestore ובשולחן |
| 7 | API עזר | `GET /api/rooms` (עם שרת פוקר רץ), `GET /api/leaderboard` (דורש Admin + נתונים) |

### Firebase

| # | בדיקה | איך |
|---|--------|-----|
| 8 | חוקים מעודכנים | אחרי שינוי `firestore.rules` (כולל `stripe_webhook_events`) — `npm run firebase:deploy-rules` |
| 9 | אינדקסים | אם `leaderboard` נכשל בקונסול — ייתכן שצריך אינדקס חד-שדה ל-`chips` (Firestore מציע קישור) |

### ייצור / Staging

| # | בדיקה | איך |
|---|--------|-----|
| 10 | משתני סביבה | ב-Vercel: כל `NEXT_PUBLIC_*`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `STRIPE_*`, **`POKER_SERVER_SECRET`** |
| 11 | שרת Socket נפרד | אותו `POKER_SERVER_SECRET`, `NEXT_PUBLIC_APP_URL` מצביע ל-Next הציבורי, `POKER_CORS_ORIGIN` כולל דומיין האתר |
| 12 | Stripe webhook | URL ציבורי ל-`/api/stripe/webhook`; אירוע `checkout.session.completed` מעלה צ'יפים; חזרה כפולה על אותו `event.id` לא מכפילה (אוסף `stripe_webhook_events`) |

### מה Claude צריך לשאול לפני «הכל תקין»

- האם `POKER_SERVER_SECRET` מוגדר וזהה בשני הצדדים בייצור?
- האם `firestore.rules` פרוסים אחרי השינוי האחרון?
- האם יש לוג שגיאה ב-`sync-chips` / `[chip-sync]` אחרי יד אמיתית?

---

## הערות משפטיות

צ'יפים ותשלומים הם יכולות טכניות; יש לוודא עמידה ברגולציה מקומית (הימורים, תשלומים, גיל).

---

**תזכורת ל-Claude:** לפני שינוי — קרא מסמך זה. אחרי שינוי בלוגיקת כסף/אבטחה — עדכן את הטבלאות וה-checklist כאן או ב-README בהתאם.
