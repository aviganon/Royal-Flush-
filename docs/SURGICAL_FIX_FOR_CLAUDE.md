# הוראות כירורגיות לקלוד — Royal Flush
## תיקון 3 שינויים בלבד, אל תיגע בשום דבר אחר!

---

## 🔧 תיקון 1: `components/poker/game-lobby.tsx`

**הבאג:** ה-Dialog מציג תוכן ריק כי `selectedTable` הוא `null` כשה-Dialog נפתח.
**הפתרון:** השתמש ב-`table` מה-closure של `.map()` ישירות — זה הערך הנכון.

### שינוי מדויק — החלף את הבלוק הזה (שורות ~525-595):

**לפני:**
```tsx
                      {selectedTable && (
                        <div className="space-y-6 pt-4">
                          <div className="p-4 rounded-xl bg-muted/50 border border-border">
                            <h4 className="font-semibold mb-2">
                              {selectedTable.name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {getVariantName(selectedTable.variant)}{" "}
                              • {selectedTable.blinds}
                            </p>
                            {selectedTable.speed && selectedTable.speed !== "normal" && (
                              <span className={`inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-xs font-medium ${getSpeedInfo(selectedTable.speed)?.color}`}>
                                {(() => {
                                  const speedInfo = getSpeedInfo(selectedTable.speed);
                                  if (!speedInfo) return null;
                                  const SpeedIcon = speedInfo.icon;
                                  return (
                                    <>
                                      <SpeedIcon className="w-3 h-3" />
                                      {speedInfo.text}
                                    </>
                                  );
                                })()}
                              </span>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <label className="text-sm text-muted-foreground">
                                סכום כניסה
                              </label>
                              <span className="text-xl font-bold text-gold font-[family-name:var(--font-orbitron)]">
                                ${buyInAmount[0]}
                              </span>
                            </div>
                            <Slider
                              value={buyInAmount}
                              onValueChange={setBuyInAmount}
                              min={selectedTable.buyIn.min}
                              max={selectedTable.buyIn.max}
                              step={10}
                              className="mb-2"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>מינימום: ${selectedTable.buyIn.min}</span>
                              <span>מקסימום: ${selectedTable.buyIn.max}</span>
                            </div>
                          </div>

                          <div className="p-3 rounded-lg bg-gold/10 border border-gold/30">
                            <p className="text-sm text-gold text-center">
                              הסכום יינעל בקופה עד סיום המשחק
                            </p>
                          </div>

                          <Button
                            className="w-full bg-emerald text-foreground hover:bg-emerald-light"
                            onClick={() =>
                              onJoinTable(
                                selectedTable.id,
                                selectedTable.gameType,
                                selectedTable.buyIn.min,
                              )
                            }
                          >
                            אישור והצטרפות
                          </Button>
                        </div>
                      )}
```

**אחרי:**
```tsx
                      <div className="space-y-6 pt-4">
                        <div className="p-4 rounded-xl bg-muted/50 border border-border">
                          <h4 className="font-semibold mb-2">
                            {table.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {getVariantName(table.variant)}{" "}
                            • {table.blinds}
                          </p>
                          {table.speed && table.speed !== "normal" && (
                            <span className={`inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-xs font-medium ${getSpeedInfo(table.speed)?.color}`}>
                              {(() => {
                                const speedInfo = getSpeedInfo(table.speed);
                                if (!speedInfo) return null;
                                const SpeedIcon = speedInfo.icon;
                                return (
                                  <>
                                    <SpeedIcon className="w-3 h-3" />
                                    {speedInfo.text}
                                  </>
                                );
                              })()}
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <label className="text-sm text-muted-foreground">
                              סכום כניסה
                            </label>
                            <span className="text-xl font-bold text-gold font-[family-name:var(--font-orbitron)]">
                              ${buyInAmount[0]}
                            </span>
                          </div>
                          <Slider
                            value={buyInAmount}
                            onValueChange={setBuyInAmount}
                            min={table.buyIn.min}
                            max={table.buyIn.max}
                            step={10}
                            className="mb-2"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>מינימום: ${table.buyIn.min}</span>
                            <span>מקסימום: ${table.buyIn.max}</span>
                          </div>
                        </div>

                        <div className="p-3 rounded-lg bg-gold/10 border border-gold/30">
                          <p className="text-sm text-gold text-center">
                            הסכום יינעל בקופה עד סיום המשחק
                          </p>
                        </div>

                        <Button
                          className="w-full bg-emerald text-foreground hover:bg-emerald-light"
                          onClick={() =>
                            onJoinTable(
                              table.id,
                              table.gameType,
                              buyInAmount[0],
                            )
                          }
                        >
                          אישור והצטרפות
                        </Button>
                      </div>
```

**סיכום השינויים:**
- הסר: `{selectedTable && (` ואת הסוגר הסוגר `)}` שלפני `</DialogContent>`
- החלף כל `selectedTable.X` → `table.X` (table מה-closure של map)
- החלף `selectedTable.buyIn.min` ב-`onJoinTable` → `buyInAmount[0]` (כדי שה-slider יעבוד)

---

## 🔧 תיקון 2: `components/poker/poker-table.tsx`

**הבאג:** הודעת "npm run dev" מופיעה בייצור ב-Vercel.

### שינוי מדויק:

**לפני** (שורות ~196-207):
```tsx
  if (!connected && online) {
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-gold" />
        <p className="text-muted-foreground text-center px-4">
          מתחבר לשרת משחק… ודאו ש-{" "}
          <code className="text-gold">npm run dev</code> רץ (Next + Socket)
        </p>
        <Button variant="ghost" onClick={onLeaveTable}>
          ביטול
        </Button>
      </div>
    );
  }
```

**אחרי:**
```tsx
  if (!connected && online) {
    const isLocal =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1");
    return (
      <div className="min-h-screen pt-20 flex flex-col items-center justify-center gap-6 px-4">
        <Loader2 className="w-10 h-10 animate-spin text-gold" />
        <div className="text-center max-w-md">
          <p className="text-foreground font-semibold mb-2">מתחבר לשרת המשחק…</p>
          {isLocal ? (
            <p className="text-sm text-muted-foreground">
              ודאו ש-<code className="text-gold">npm run dev</code> רץ (Next + Socket)
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              שרת המשחק בזמן אמת אינו פעיל כרגע. המשחק זמין מקומית בלבד.
            </p>
          )}
        </div>
        <Button variant="ghost" onClick={onLeaveTable}>
          חזרה ללובי
        </Button>
      </div>
    );
  }
```

---

## ✅ לאחר השינויים:

```bash
git add components/poker/game-lobby.tsx components/poker/poker-table.tsx
git commit -m "fix: dialog uses table closure, fix connection message for production"
git push
```

---

## ⚠️ מה לא לשנות:
- `next.config.mjs` — השאר כמו שהוא
- `hooks/use-poker-socket.ts` — השאר כמו שהוא  
- `server/poker-server.ts` — השאר כמו שהוא
- **אל תיגע** ב-Omaha, game-type-selector, navigation, או כל קובץ אחר

---

## 🎯 למה זה מתקן את הבאג?

ב-React, `setSelectedTable(table)` ו-Dialog פותח — מתרחשים באותו render.
Dialog מציג את תוכנו לפי `selectedTable` state — שעדיין `null` באותו render.
`table` מה-closure תמיד מכיל את הטבלה הנכונה — ישירות, ללא state.
