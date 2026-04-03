# הגנת ענף `main` ב-GitHub (מומלץ)

ב-[Repository settings](https://github.com/aviganon/Royal-Flush-/settings) → **Branches** → **Add branch protection rule**:

1. **Branch name pattern:** `main`
2. סמן לפחות:
   - **Require a pull request before merging** (אופציונלי לפרויקט יחיד)
   - **Do not allow bypassing the above settings**
   - **Require status checks to pass before merging** → בחר את job **build** מתוך workflow **CI**
3. מומלץ: **Include administrators** כבוי רק אם רוצים שגם בעלי הריפו יעברו בדיקות.

כך `push --force` ל-`main` נחסם כברירת מחדל, וה-CI חייב לעבור לפני merge.
