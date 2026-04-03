"use client";

import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  type UserCredential,
} from "firebase/auth";
import { getFirebaseAuth } from "./client-app";

function authOrThrow() {
  const a = getFirebaseAuth();
  if (!a) throw new Error("Firebase לא מוגדר");
  return a;
}

export async function signInWithGoogle(): Promise<UserCredential> {
  const auth = authOrThrow();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return signInWithPopup(auth, provider);
}

export async function signInWithFacebook(): Promise<UserCredential> {
  const auth = authOrThrow();
  const provider = new FacebookAuthProvider();
  provider.addScope("email");
  provider.addScope("public_profile");
  return signInWithPopup(auth, provider);
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName?: string,
): Promise<UserCredential> {
  const auth = authOrThrow();
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName?.trim()) {
    await updateProfile(cred.user, { displayName: displayName.trim() });
  }
  return cred;
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<UserCredential> {
  const auth = authOrThrow();
  return signInWithEmailAndPassword(auth, email, password);
}

export async function sendResetEmail(email: string): Promise<void> {
  const auth = authOrThrow();
  await sendPasswordResetEmail(auth, email);
}
