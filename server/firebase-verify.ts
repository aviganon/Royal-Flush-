import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let app: App | null = null;

function getAdminApp(): App | null {
  if (getApps().length > 0) return getApps()[0]!;
  if (app) return app;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw?.trim()) return null;
  try {
    const cred = JSON.parse(raw) as {
      project_id?: string;
      client_email?: string;
      private_key?: string;
    };
    app = initializeApp({
      credential: cert({
        projectId: cred.project_id,
        clientEmail: cred.client_email,
        privateKey: cred.private_key?.replace(/\\n/g, "\n"),
      }),
    });
    return app;
  } catch {
    return null;
  }
}

export async function verifyFirebaseIdToken(
  idToken: string,
  expectedUid: string,
): Promise<boolean> {
  const a = getAdminApp();
  if (!a) return true;
  try {
    const decoded = await getAuth(a).verifyIdToken(idToken);
    return decoded.uid === expectedUid;
  } catch {
    return false;
  }
}
