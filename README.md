# Royal Flush

פלטפורמת פוקר אונליין (Next.js): לובי, שולחן Texas Hold’em בזמן אמת (Socket.IO), אימות Firebase (Google / Facebook / אימייל), ארנק ו-Firestore, תשלומים עם Stripe.

## התחלה מהירה

```bash
npm install
cp .env.local.example .env.local
# מלא את המפתחות — ראה CLAUDE.md
npm run dev
```

הוראות מלאות להגדרה ובדיקות: **[CLAUDE.md](./CLAUDE.md)**.

## סנכרון עם GitHub (לפני עבודה)

```bash
npm run sync:git
```

או ידנית: `git fetch origin && git pull origin main`. פרטים: [CLAUDE.md §10](./CLAUDE.md#10-סנכרון-קבצים-מקומי-github-ו-google-cloud).

## CI (GitHub Actions)

בכל push/PR ל-`main` רץ workflow **CI** (TypeScript + `next build`). אחרי הדחיפה הבאה, ב-GitHub: **Actions** לצפייה בתוצאות.

הגנת ענף (אופציונלי): [`.github/BRANCH_PROTECTION.md`](./.github/BRANCH_PROTECTION.md).

## רישיון

פרטי / פנימי — עדכן לפי הצורך.
