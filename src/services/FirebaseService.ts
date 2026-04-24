import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  deleteUser,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  Firestore,
} from 'firebase/firestore';
import { UserProfile, Shift, ManualPayment } from '../models/types';

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyBUm00LKfpbA5P2-5RgwVyWD167Y8LaFj8',
  authDomain: 'netto-f102a.firebaseapp.com',
  projectId: 'netto-f102a',
  storageBucket: 'netto-f102a.firebasestorage.app',
  messagingSenderId: '642953507370',
  appId: '1:642953507370:android:f1acf4bf3891e5091f4953',
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

function initFirebase() {
  if (!getApps().length) {
    app = initializeApp(FIREBASE_CONFIG);
  } else {
    app = getApps()[0];
  }
  auth = getAuth(app);
  db = getFirestore(app);
}

initFirebase();

export function getFirebaseAuth() { return auth; }
export function getFirebaseDb() { return db; }

// ─── Auth ──────────────────────────────────────────────────────────────────────

export async function signUp(email: string, password: string, name: string): Promise<string> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, 'users', cred.user.uid), { email, name, uid: cred.user.uid });
  return cred.user.uid;
}

export async function signIn(email: string, password: string): Promise<string> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user.uid;
}

export async function signOut(): Promise<void> {
  await fbSignOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function deleteAccount(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const email = user.email ?? '';
  // Delete all user data
  await deleteUserData(email);
  await deleteUser(user);
}

// ─── User Profile ──────────────────────────────────────────────────────────────

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await setDoc(doc(db, 'profiles', profile.email), profile);
}

export async function loadUserProfile(email: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'profiles', email));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

// ─── Shifts ────────────────────────────────────────────────────────────────────

export async function saveShift(shift: Shift): Promise<void> {
  await setDoc(doc(db, 'shifts', shift.id), shift);
}

export async function loadShifts(ownerEmail: string): Promise<Shift[]> {
  const q = query(collection(db, 'shifts'), where('ownerEmail', '==', ownerEmail));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as Shift);
}

export async function deleteShift(shiftId: string): Promise<void> {
  await deleteDoc(doc(db, 'shifts', shiftId));
}

// ─── Manual Payments ───────────────────────────────────────────────────────────

export async function saveManualPayment(payment: ManualPayment): Promise<void> {
  await setDoc(doc(db, 'payments', payment.id), payment);
}

export async function loadManualPayments(ownerEmail: string): Promise<ManualPayment[]> {
  const q = query(collection(db, 'payments'), where('ownerEmail', '==', ownerEmail));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as ManualPayment);
}

export async function deleteManualPayment(paymentId: string): Promise<void> {
  await deleteDoc(doc(db, 'payments', paymentId));
}

// ─── Delete all user data ──────────────────────────────────────────────────────

async function deleteUserData(email: string): Promise<void> {
  const [shifts, payments] = await Promise.all([
    loadShifts(email),
    loadManualPayments(email),
  ]);
  await Promise.all([
    ...shifts.map(s => deleteShift(s.id)),
    ...payments.map(p => deleteManualPayment(p.id)),
    deleteDoc(doc(db, 'profiles', email)),
  ]);
}
