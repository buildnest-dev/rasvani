import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase/client';

// Kept separate from client.ts so pages that only need Auth (most of the site) never pull in the much
// larger Firestore SDK. Import this directly wherever live Firestore data is actually read or written.
export const firestore = (): Firestore => getFirestore(firebaseApp());
