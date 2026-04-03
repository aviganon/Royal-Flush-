# הוראות לקלוד — Royal Flush Bug Fixes

## מה יש כאן:
1. `fix-all-bugs.sh` — סקריפט שמתקן את כל הבאגים
2. `royal-flush-bugfix.zip` — קבצים מתוקנים (גיבוי)

## מה לעשות:

### אפשרות א׳ — הכי מהיר (מומלץ):
```bash
cd "/Users/aviganonm5/Library/Mobile Documents/com~apple~CloudDocs/ROYAL FLUSH"
bash fix-all-bugs.sh
```

### אפשרות ב׳ — ידני (חלץ ZIP והחלף קבצים):
מה שב-ZIP מחליף את הקבצים הישנים:
- `components/poker/game-lobby.tsx`
- `components/poker/poker-table.tsx`  
- `hooks/use-poker-socket.ts`
- `next.config.mjs`
- `server-combined.ts` (חדש)
- `package.json`

ואז: `git add -A && git commit -m "fix bugs" && git push`

---

## מה הבאגים שתוקנו:

### Bug 1 — Dialog לא נפתח בלחיצה על "הצטרף לשולחן" ❌
**סיבה:** הקוד השתמש ב-`selectedTable` (shared state) שהיה `null` כשה-Dialog נפתח.
**תיקון:** עכשיו משתמש ב-`table` מתוך ה-closure ישירות — גישה ישירה לאובייקט.

קוד לפני:
```jsx
{selectedTable && (
  <div>
    <h4>{selectedTable.name}</h4>
    ...onJoinTable(selectedTable.id, selectedTable.gameType, selectedTable.buyIn.min)
```

קוד אחרי:
```jsx
<div>
  <h4>{table.name}</h4>  {/* table מה-closure */}
  ...onJoinTable(table.id, table.gameType, buyInAmount[0])
```

### Bug 2 — הודעת "npm run dev" מופיעה בייצור ❌
**תיקון:** עכשיו מזהה localhost vs ייצור ומציג הודעה מתאימה.

### Bug 3 — Socket.IO לא מתחבר בייצור ❌
**תיקון:** ב-production מתחבר ל-`/api/socket` על אותו שרת.
**הערה:** Socket.IO עדיין צריך שרת נפרד (Railway) לעבודה מלאה בייצור.

---

## אחרי ה-push — Vercel יעשה deploy אוטומטי תוך 2 דקות
