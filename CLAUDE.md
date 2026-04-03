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
| **URL** | Production / Preview נוצרים אוטומטית — רשום את הדומיין ב-`NEXT_PUBLIC_APP_URL` וב-**Firebase Authorized domains** וב-**Stripe** (אם רלוונטי) |
| **Team** | לפי ארגון ב-Vercel — ללא ערך קבוע במסמך |
| **Build** | `npm run build` — ראה CI ב-`.github/workflows/ci.yml` |
| **משתני סביבה ב-Vercel** | Project → Settings → Environment Variables: להעתיק את כל `NEXT_PUBLIC_*`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `STRIPE_*` מ-`.env.local` (אותם שמות) |

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
| `NEXT_PUBLIC_APP_URL` | כתובת האתר (מקומי / ייצור) |
| `NEXT_PUBLIC_POKER_SOCKET_URL` | כתובת שרת Socket.IO (מקומי: `http://localhost:4000`; בייצור: URL של שרת נפרד) |
| `POKER_CORS_ORIGIN` | אופציונלי — מקורות מופרדים בפסיקים ל-CORS של Socket |
| `POKER_SOCKET_PORT` | אופציונלי — ברירת מחדל 4000 |
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
| `app/api/stripe/webhook/route.ts` | `checkout.session.completed` → עדכון `chips` + תנועה ב-`transactions` |
| `server/poker-server.ts` | שרת Node + Socket.IO — חדרי Hold'em |
| `server/firebase-verify.ts` | אימות `idToken` ב-`join` אם הוגדר Admin JSON לתהליך השרת |
| `lib/poker/` | מנוע Hold'em: `holdem-engine`, `evaluate`, `deck`, `types` |
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
| `components/poker/poker-table.tsx` | חיבור Socket + `getIdToken` |
| `components/poker/wallet-dashboard.tsx` | Stripe + היסטוריה מ-Firestore |
| `package.json` | `dev` (Next+Socket), `typecheck`, `sync:git`, `firebase:deploy-rules` |
| `README.md` | התחלה מהירה, סנכרון, CI |
| `.gitignore` | `.env*.local`, `*.tsbuildinfo` |

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
6) שולחן פוקר (Socket): buyIn נשלח מהלקוח בעת join — מנוע המשחק מחזיק צ'יפים בזיכרון השרת
```

**פער ידוע:** סיום יד בשולחן **לא** מעדכן אוטומטית את `chips` ב-Firestore — נדרש שכבת סנכרון עתידית (API/פונקציה) אם רוצים יתרה אחת מלאה.

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
| ✅ | שרת Socket מקומי + Hold'em engine |
| ✅ | CI ב-GitHub Actions |
| ⚠️ | שולחן בייצור — **דורש** שרת Socket נפרד + env |
| ⚠️ | סנכרון צ'יפים אחרי יד — **לא מומש** מקצה לקצה |
| ⚠️ | משיכות כסף / KYC — תיעוד בלבד ב-UI |

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
├── lib/firebase/*              ✅
├── lib/poker/*                 ✅ מנוע משחק
├── server/
│   ├── poker-server.ts         ✅
│   └── firebase-verify.ts      ✅
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

---

## הערות משפטיות

צ'יפים ותשלומים הם יכולות טכניות; יש לוודא עמידה ברגולציה מקומית (הימורים, תשלומים, גיל).

---

**תזכורת ל-Claude:** לפני שינוי — קרא מסמך זה. אחרי שינוי בלוגיקת כסף/אבטחה — עדכן את הטבלאות וה-checklist כאן או ב-README בהתאם.
