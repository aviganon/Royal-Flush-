// env נטען דרך --env-file
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envRaw = readFileSync(join(__dirname, "../.env.local"), "utf8");

// חלץ JSON ישירות מהקובץ — מצא את ה-{ הראשון וספור עד לסגירה
const keyIdx = envRaw.indexOf("FIREBASE_SERVICE_ACCOUNT_JSON=");
const start = envRaw.indexOf("{", keyIdx);
let depth = 0;
let end = start;
for (let i = start; i < envRaw.length; i++) {
  if (envRaw[i] === "{") depth++;
  else if (envRaw[i] === "}") {
    depth--;
    if (depth === 0) { end = i; break; }
  }
}
const jsonStr = envRaw.slice(start, end + 1);
const sa = JSON.parse(jsonStr) as {
  project_id: string;
  client_email: string;
  private_key: string;
};

async function main() {
  const app =
    getApps().length > 0
      ? getApps()[0]!
      : initializeApp({
          credential: cert({
            projectId: sa.project_id,
            clientEmail: sa.client_email,
            privateKey: sa.private_key.replace(/\\n/g, "\n"),
          }),
        });

  const db = getFirestore(app);
  const ADMIN_UID = "N3pjNsXqalT4x2rWes8ZWG9p4cE2";

  await db.collection("users").doc(ADMIN_UID).set(
    { role: "admin", isAdmin: true },
    { merge: true },
  );

  console.log("✅ role:admin הוגדר ב-Firestore עבור UID:", ADMIN_UID);
}

main()
  .then(() => process.exit(0))
  .catch((e: Error) => { console.error("❌", e.message); process.exit(1); });
