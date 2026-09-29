import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  getFirestore,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

const firebaseApp = isFirebaseConfigured
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const auth = firebaseApp ? getAuth(firebaseApp) : null;
export const db = firebaseApp ? getFirestore(firebaseApp) : null;
export const storage = firebaseApp ? getStorage(firebaseApp) : null;

export type StoreProduct = {
  id: string;
  name: string;
  price: string;
  category: string;
  image: string;
  images: string[];
  tone: string;
  badge?: string;
  description?: string;
  details?: string[];
  material?: string;
  dimensions?: string;
  care?: string;
  stock?: string;
};

export type OrderItem = {
  id: string;
  name: string;
  price: string;
};

export function subscribeToProducts(
  onProducts: (products: StoreProduct[]) => void,
  onError?: (error: Error) => void,
) {
  if (!db) return () => undefined;

  return onSnapshot(
    collection(db, 'products'),
    (snapshot) => {
      const products = snapshot.docs.map((productDoc) => {
        const data = productDoc.data();
        const rawPrice = data.price ?? data.amount ?? data.cost;
        const numericPrice =
          typeof rawPrice === 'number'
            ? `₹${rawPrice.toLocaleString('en-IN')}`
            : typeof rawPrice === 'string' && /^\d[\d,\s]*$/.test(rawPrice.trim())
              ? `₹${Number(rawPrice.replace(/[,\s]/g, '')).toLocaleString('en-IN')}`
              : String(rawPrice ?? 'Price on request');
        const rawCategory = String(data.category ?? data.type ?? 'Gifting').trim();
        const category = {
          jewelry: 'Jewellery',
          jewellery: 'Jewellery',
          personalized: 'Personalised',
          personalised: 'Personalised',
          gifting: 'Gifting',
        }[rawCategory.toLowerCase()] ?? rawCategory;
        const primaryImage = String(data.image ?? data.imageUrl ?? data.photoUrl ?? '/images/gifting-set.jpg');
        const rawImages = data.images ?? data.imageUrls;
        const images = Array.isArray(rawImages)
          ? rawImages.map((image: unknown) => String(image)).filter(Boolean)
          : [];

        return {
          id: productDoc.id,
          name: String(data.name ?? data.title ?? 'Proniqa piece'),
          price: numericPrice,
          category,
          image: primaryImage,
          images: images.length > 0 ? Array.from(new Set([primaryImage, ...images])) : [primaryImage],
          tone: String(data.tone ?? 'peach'),
          ...(data.badge ? { badge: String(data.badge) } : {}),
          ...(data.description || data.shortDescription ? { description: String(data.description ?? data.shortDescription) } : {}),
          ...(Array.isArray(data.details) ? { details: data.details.map((detail: unknown) => String(detail)).filter(Boolean) } : {}),
          ...(data.material || data.materials ? { material: String(data.material ?? data.materials) } : {}),
          ...(data.dimensions || data.size ? { dimensions: String(data.dimensions ?? data.size) } : {}),
          ...(data.care ? { care: String(data.care) } : {}),
          ...(data.stock || data.availability ? { stock: String(data.stock ?? data.availability) } : {}),
        };
      });

      onProducts(products);
    },
    (error) => {
      console.error('Proniqa could not read the Firestore products collection.', error);
      onError?.(error);
    },
  );
}

export function subscribeToAuth(
  onUser: (user: User | null) => void,
  onError?: (error: Error) => void,
) {
  if (!auth) return () => undefined;
  return onAuthStateChanged(auth, onUser, onError);
}

export async function registerCustomer(email: string, password: string) {
  if (!auth) throw new Error('Firebase Auth is not configured yet.');
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signInCustomer(email: string, password: string) {
  if (!auth) throw new Error('Firebase Auth is not configured yet.');
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signOutCustomer() {
  if (!auth) throw new Error('Firebase Auth is not configured yet.');
  return signOut(auth);
}

export async function placeOrder(input: {
  items: OrderItem[];
  total: number;
  customerEmail?: string;
  userId?: string;
}) {
  if (!db) throw new Error('Firebase Firestore is not configured yet.');

  return addDoc(collection(db, 'orders'), {
    ...input,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

export async function submitFrameEnquiry(input: {
  name: string;
  email: string;
  note: string;
  file?: File;
  userId?: string;
}) {
  if (!db || !storage) {
    throw new Error('Firebase Storage and Firestore are not configured yet.');
  }

  let imageUrl: string | null = null;
  if (input.file) {
    const filePath = `frame-enquiries/${crypto.randomUUID()}-${input.file.name}`;
    const fileRef = ref(storage, filePath);
    await uploadBytes(fileRef, input.file);
    imageUrl = await getDownloadURL(fileRef);
  }

  return addDoc(collection(db, 'enquiries'), {
    name: input.name,
    email: input.email,
    note: input.note,
    imageUrl,
    userId: input.userId ?? null,
    status: 'new',
    createdAt: serverTimestamp(),
  });
}