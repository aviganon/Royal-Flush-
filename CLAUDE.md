# הוראות ל-Claude / למפתח: בנייה, הגדרה ובדיקות — Royal Flush

מסמך זה מתאר מה צריך לבנות, להגדיר ולבדוק כדי שהמערכת (Next.js + Firebase + Socket.IO + Stripe אופציונלי) תעבוד מקצה לקצה.

---

## 1. דרישות מקדימות

- **Node.js** LTS (מומלץ 20+)
- **npm** (או pnpm/yarn — הסקריפטים בפרויקט מניחים `npm`)
- חשבון **Google** ל-Firebase Console
- (אופציונלי) חשבון **Stripe** לתשלומים
- (אופציונלי) **Firebase CLI** — או שימוש ב-`npm run firebase:deploy-rules` (מריץ `npx firebase-tools`)

---

## 2. שכפול והתקנה

```bash
cd /path/to/ROYAL-FLUSH
npm install
```

---

## 3. משתני סביבה (חובה לפני אימות משתמשים)

1. העתק `cp .env.local.example .env.local`
2. מלא לפי הסעיפים הבאים. **אל תעלה `.env.local` ל-git** (מבוטל ב-`.gitignore`).

### 3.1 Firebase Web (לקוח)

מ-[Firebase Console](https://console.firebase.google.com/project/royal-flush-32cbb/settings/general) → **Project settings** → **Your apps** → אפליקציית Web → ה-snippet של ה-SDK:

| משתנה | מקור |
|--------|------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `apiKey` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `appId` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | בדוגמה: `royal-flush-32cbb` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | בדוגמה: `royal-flush-32cbb.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | מה-snippet (לעיתים `*.appspot.com` או `*.firebasestorage.app`) |

אם אחד מה-`NEXT_PUBLIC_*` חסר — `isFirebaseConfigured()` מחזיר false והאפליקציה תציג מסך "Firebase לא מוגדר".

### 3.2 Firebase Admin (שרת Next + Webhook + אימות Socket)

- **Project settings** → **Service accounts** → **Generate new private key**
- את **כל** תוכן קובץ ה-JSON מדביקים בשורה אחת ב-`FIREBASE_SERVICE_ACCOUNT_JSON` (בתוך `.env.local`)
- בלי זה:
  - `POST /api/auth/bootstrap` יחזיר 503 — מסמך `users/{uid}` לא נוצר בשרת
  - Webhook של Stripe לא יעדכן צ'יפים
  - אימות JWT בשרת הפוקר לא יפעל (אם נשלח `idToken`)

### 3.3 אפליקציה ו-Socket

| משתנה | דוגמה מקומית |
|--------|----------------|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` |
| `NEXT_PUBLIC_POKER_SOCKET_URL` | `http://localhost:4000` |

בפריסה לייצור: עדכן לדומיין האמיתי והוסף `POKER_CORS_ORIGIN` עם רשימת מקורות מופרדת בפסיקים.

### 3.4 Stripe (אופציונלי)

| משתנה | תיאור |
|--------|--------|
| `STRIPE_SECRET_KEY` | מפתח סודי (למשל `sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | אחרי יצירת endpoint ל-`/api/stripe/webhook` |

בלי Stripe: מסך הארנק עדיין נטען; כפתורי הפקדה יחזירו שגיאה מה-API — זה צפוי.

---

## 4. הגדרות Firebase Console (לא בקוד)

### 4.1 Authentication

- הפעל: **Email/Password**, **Google**, **Facebook** (אם נדרש — עם App ב-Meta)
- **Authentication → Settings → Authorized domains**: ודא `localhost` ודומיין הייצור

### 4.2 Firestore

- צור מסד נתונים אם עדיין לא קיים
- פרוס חוקים מהריפו:

```bash
firebase login   # פעם אחת
npm run firebase:deploy-rules
```

הפרויקט ב-`.firebaserc` מוגדר כ-`royal-flush-32cbb`. החוקים ב-`firestore.rules` אוסרים כתיבת `chips` מהלקוח — רק Admin SDK.

---

## 5. הרצה מקומית

```bash
npm run dev
```

מריץ במקביל:

- **Next.js** — בדרך כלל `http://localhost:3000`
- **שרת Socket.IO** — `http://localhost:4000`

אם פורט 3000 תפוס: עצור תהליך ישן או השתמש ב-`npm run dev:next` / `dev:socket` בנפרד.

---

## 6. בדיקות שכדאי לבצע (Checklist)

### 6.1 בלי `.env.local` מלא

- [ ] נטען מסך "Firebase לא מוגדר" או הוראות — צפוי

### 6.2 עם Firebase Web בלבד (בלי Admin JSON)

- [ ] התחברות עם Google/מייל עשויה לעבוד ב-Auth
- [ ] פרופיל/צ'יפים עלולים לא להיסנכרן; bootstrap עלול להיכשל — צפוי

### 6.3 עם Web + Admin מלא

- [ ] כניסה עם **אימייל וסיסמה** (הרשמה + כניסה)
- [ ] כניסה עם **Google**
- [ ] כניסה עם **Facebook** (אם הופעל בקונסול)
- [ ] **שכחתי סיסמה** — מייל מאימות Firebase
- [ ] אחרי כניסה: ב-Firestore מופיע מסמך `users/{uid}` עם שדה `chips` (ברירת מחדל מה-bootstrap)
- [ ] ניווט: לובי, ארנק, טבלת מובילים

### 6.4 שולחן פוקר (Hold'em)

- [ ] שני דפדפנים / רגיל + אינקוגניטו, אותו שולחן מלובי
- [ ] שני משתמשים מחוברים — יד מתחילה כשיש לפחות 2 שחקנים עם צ'יפים
- [ ] פעולות: פולד, צ'ק/קול, רייז
- [ ] אם `FIREBASE_SERVICE_ACCOUNT_JSON` מוגדר גם לתהליך של `server/poker-server.ts` — `join` עם `idToken` מאומת; בלי JSON — השרת מדלג על אימות (התאמה לאחור)

### 6.5 Stripe (אם הוגדר)

- [ ] `POST /api/stripe/create-checkout-session` עם `Authorization: Bearer <idToken>` וגוף `{ "amountUsd": 10 }` — מחזיר `{ url }`
- [ ] Webhook: אירוע `checkout.session.completed` מגיע ל-`/api/stripe/webhook` — `chips` ב-`users/{uid}` עולה; רשומה תחת `users/{uid}/transactions`

### 6.6 Build ייצור

```bash
npx next build
```

- [ ] הבנייה מסתיימת ללא שגיאות קומפילציה קריטיות (בפרויקט ייתכן `ignoreBuildErrors` ב-next.config — עדיין כדאי להריץ `npx tsc --noEmit` לבדיקת טיפוסים)

```bash
npx tsc --noEmit
```

---

## 7. מבנה קוד רלוונטי (לא לשנות בלי סיבה)

| אזור | תפקיד |
|------|--------|
| `app/page.tsx` | זרימת אפליקציה, חיבור ל-`useFirebaseAuth`, לובי/שולחן |
| `components/providers/firebase-auth-provider.tsx` | Auth + onSnapshot לפרופיל |
| `lib/firebase/*` | אתחול Web, Admin, bootstrap לוגיקה בצד לקוח |
| `app/api/auth/bootstrap` | יצירת/עדכון `users/{uid}` |
| `app/api/stripe/*` | תשלום + webhook |
| `server/poker-server.ts` | חדרי משחק, Socket.IO |
| `server/firebase-verify.ts` | אימות JWT אופציונלי ב-join |
| `lib/poker/holdem-engine.ts` | לוגיקת Texas Hold'em |
| `hooks/use-poker-socket.ts` | לקוח Socket + `idToken` ב-join |
| `firestore.rules` | אבטחת קריאה/כתיבה |

---

## 8. כשלים נפוצים

| תסמין | כיוון בדיקה |
|--------|-------------|
| מסך Firebase חסר | מלא `NEXT_PUBLIC_FIREBASE_*` ב-`.env.local` והפעל מחדש `npm run dev` |
| התחברות נחסמת ב-localhost | Authorized domains ב-Firebase Auth |
| אין צ'יפים / אין מסמך user | `FIREBASE_SERVICE_ACCOUNT_JSON` + פריסת `firestore.rules` |
| Socket לא מתחבר | פורט 4000, `NEXT_PUBLIC_POKER_SOCKET_URL`, CORS `POKER_CORS_ORIGIN` בייצור |
| `EADDRINUSE :4000` | סגור תהליך ישן או שנה `POKER_SOCKET_PORT` |
| Stripe נדחה | מפתחות, webhook secret, URL ציבורי ל-webhook (לא localhost בלי Stripe CLI) |

---

## 9. הערות מוצר / משפטיות

- תשלומים ו"צ'יפים" הם לוגיקה טכנית; יש לוודא עמידה ברגולציה מקומית להימורים ותשלומים.
- סנכרון יתרה בין שולחן הפוקר בזיכרון לבין Firestore — כרגע חלקי; שיפור עתידי: עדכון צ'יפים מהשרת אחרי סיום יד.

---

**סיכום ל-Claude:** הרץ `npm install`, הגדר `.env.local`, הגדר Firebase Auth + Firestore + פרוס rules, הרץ `npm run dev`, ועבור על סעיף 6. אם משהו נכשל — השווה לטבלת כשלים בסעיף 8.
