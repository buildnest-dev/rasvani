import { collection, getDocs, query, where } from 'firebase/firestore';
import { firebaseConfigured, firestore } from '@/lib/firebase/client';

export type Product = {
  id: string; name: string; slug: string; sku: string; description: string | null; makerName: string | null; makerDistrict?: string | null;
  pricePaise: number; storage: string;
};

// Public read of visible products only (Firestore rules allow exactly this query).
export async function loadVisibleProducts(): Promise<{ products: Product[]; configured: boolean; failed: boolean }> {
  if (!firebaseConfigured) return { products: [], configured: false, failed: false };
  try {
    const snap = await getDocs(query(collection(firestore(), 'products'), where('visible', '==', true)));
    const products = snap.docs.map((doc) => ({ ...(doc.data() as Omit<Product, 'id'>), id: doc.id }));
    products.sort((a, b) => a.name.localeCompare(b.name));
    return { products, configured: true, failed: false };
  } catch { return { products: [], configured: true, failed: true }; }
}
