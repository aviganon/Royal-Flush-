import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "../.env.local");
const envRaw = readFileSync(envPath, "utf8");

// Parse FIREBASE_SERVICE_ACCOUNT_JSON from .env.local
const match = envRaw.match(/FIREBASE_SERVICE_ACCOUNT_JSON="([\s\S]*?)"\n/);
if (!match) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON not found in .env.local");

// The value contains literal \n sequences — replace them and then parse
const jsonStr = match[1]
  .replace(/\\\\n/g, "\\n")   // double-escaped → single
  .replace(/\\n/g, "\n");     // single-escaped → real newline

const serviceAccount = JSON.parse(jsonStr);

const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

const ADMIN_UID = "N3pjNsXqalT4x2rWes8ZWG9p4cE2";

await db.collection("users").doc(ADMIN_UID).set(
  { role: "admin", isAdmin: true, updatedAt: new Date() },
  { merge: true }
);

console.log("✅ role:admin set for UID:", ADMIN_UID);
process.exit(0);
