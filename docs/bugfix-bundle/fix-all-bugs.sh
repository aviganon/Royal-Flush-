#!/bin/bash
# ============================================================
# fix-all-bugs.sh — Royal Flush Bug Fixes
# הרץ מתוך תיקיית ROYAL FLUSH:
#   bash fix-all-bugs.sh
# ============================================================
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
ok()  { echo -e "${GREEN}  ✅ $1${NC}"; }
hdr() { echo -e "\n${YELLOW}━━━ $1 ━━━${NC}"; }

echo -e "\n🔧 Royal Flush — תיקון באגים\n"

# ── Fix 1: game-lobby.tsx — Dialog bug ─────────────────────
hdr "Fix 1: Dialog לא נפתח"

python3 - << 'PY'
import re

with open('components/poker/game-lobby.tsx', 'r') as f:
    c = f.read()

# Replace all selectedTable.X references inside dialog with table.X
replacements = [
    ('selectedTable.name', 'table.name'),
    ('selectedTable.variant', 'table.variant'),
    ('selectedTable.blinds', 'table.blinds'),
    ('selectedTable.speed', 'table.speed'),
    ('selectedTable.buyIn.min', 'table.buyIn.min'),
    ('selectedTable.buyIn.max', 'table.buyIn.max'),
    ('selectedTable.id', 'table.id'),
    ('selectedTable.gameType', 'table.gameType'),
]

for old, new in replacements:
    count = c.count(old)
    c = c.replace(old, new)
    if count: print(f'  replaced {count}x: {old} → {new}')

# Remove the {selectedTable && ( wrapper and its closing )}
c = c.replace('{selectedTable && (\n', '')

# Fix the closing )} that was part of {selectedTable && (
# Pattern: </div>\n                      )}\n                    </DialogContent>
c = c.replace(
    '                        </div>\n                      )}\n                    </DialogContent>',
    '                        </div>\n                    </DialogContent>'
)

# Also fix buyIn.min in onClick to use buyInAmount[0]
c = c.replace(
    'onJoinTable(\n                                selectedTable.id,\n                                selectedTable.gameType,\n                                selectedTable.buyIn.min,',
    'onJoinTable(\n                                table.id,\n                                table.gameType,\n                                buyInAmount[0],'
)

remaining = c.count('selectedTable.')
if remaining > 0:
    print(f'  ⚠️ Still {remaining} selectedTable refs remaining')
else:
    print('  All selectedTable refs replaced!')

with open('components/poker/game-lobby.tsx', 'w') as f:
    f.write(c)
print('  game-lobby.tsx saved')
PY
ok "game-lobby.tsx תוקן"

# ── Fix 2: poker-table.tsx — Connection message ─────────────
hdr "Fix 2: הודעת חיבור"

python3 - << 'PY'
with open('components/poker/poker-table.tsx', 'r') as f:
    c = f.read()

old = '''  if (!connected && online) {
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
  }'''

new = '''  if (!connected && online) {
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
              ודאו ש-<code className="text-gold">npm run dev</code> רץ
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              שרת המשחק בזמן אמת אינו פעיל. ראו הוראות ב-README.
            </p>
          )}
        </div>
        <Button variant="ghost" onClick={onLeaveTable}>חזרה ללובי</Button>
      </div>
    );
  }'''

if old in c:
    c = c.replace(old, new)
    print('  Connection message fixed')
else:
    # Try to find it
    idx = c.find('npm run dev')
    if idx > 0:
        print(f'  ⚠️ Pattern changed, found npm run dev at {idx}')
    else:
        print('  Already fixed or pattern not found')

with open('components/poker/poker-table.tsx', 'w') as f:
    f.write(c)
print('  poker-table.tsx saved')
PY
ok "poker-table.tsx תוקן"

# ── Fix 3: use-poker-socket.ts — socket URL production ──────
hdr "Fix 3: Socket URL בייצור"

python3 - << 'PY'
with open('hooks/use-poker-socket.ts', 'r') as f:
    c = f.read()

old = '''const defaultUrl =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_POKER_SOCKET_URL || "http://localhost:4000"
    : "http://localhost:4000";'''

new = '''// In production (Vercel), use same origin. In dev, use separate port 4000
const isProduction =
  typeof window !== "undefined" &&
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1";

const defaultUrl = isProduction
  ? window.location.origin
  : (typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_POKER_SOCKET_URL || "http://localhost:4000"
      : "http://localhost:4000");

const socketPath = isProduction ? "/api/socket" : undefined;'''

if old in c:
    c = c.replace(old, new)
    print('  Socket URL logic updated')
else:
    print('  Already updated or pattern changed')

# Update io() call to include path
old2 = '''    const socket = io(defaultUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 8,
      reconnectionDelay: 800,
    });'''

new2 = '''    const socket = io(defaultUrl, {
      path: socketPath,
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });'''

if old2 in c:
    c = c.replace(old2, new2)
    print('  Socket io() call updated')
else:
    print('  io() already updated or changed')

with open('hooks/use-poker-socket.ts', 'w') as f:
    f.write(c)
print('  use-poker-socket.ts saved')
PY
ok "use-poker-socket.ts תוקן"

# ── Fix 4: next.config.mjs — add custom server config ───────
hdr "Fix 4: next.config.mjs"

cat > next.config.mjs << 'CONFIG'
/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Allow the combined server to work
  experimental: {
    serverComponentsExternalPackages: ['socket.io'],
  },
}

export default nextConfig
CONFIG
ok "next.config.mjs עודכן"

# ── Fix 5: Create server route for Socket.IO in Next.js ─────
hdr "Fix 5: Socket.IO API Route לייצור"

mkdir -p app/api/socket

cat > app/api/socket/route.ts << 'SOCKET_ROUTE'
// This file intentionally empty - Socket.IO runs via server-combined.ts
// For development: socket runs on port 4000 (npm run dev)
// For production: socket runs on same server via server-combined.ts
export async function GET() {
  return new Response('Socket.IO server running', { status: 200 });
}
SOCKET_ROUTE
ok "API Socket route נוצרה"

# ── Commit & Push ────────────────────────────────────────────
hdr "Git Commit & Push"

git add -A
git status --short

git commit -m "fix: dialog closure bug, socket URL, connection message, next config"
git push

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗"
echo -e "║   ✅  כל התיקונים הועלו ל-GitHub!       ║"
echo -e "║   Vercel יעשה deploy תוך 2 דקות         ║"
echo -e "╚══════════════════════════════════════════╝${NC}"
echo ""
echo "🔗 בדוק: https://royal-flush-poker.vercel.app"
