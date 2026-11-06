import type { Metadata } from 'next';
import { HomeLanding } from '@/components/home-landing';
export const metadata: Metadata = { title: 'Taste India From Home', description: 'Authentic regional vegetarian foods from home bakers. For all of India, live in Bihar today.' };
export default function HomePage() { return <HomeLanding />; }
