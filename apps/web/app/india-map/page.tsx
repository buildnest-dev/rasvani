import type { Metadata } from 'next';
import { IndiaMapExperience } from '@/components/india-map-experience';
export const metadata: Metadata = { title: 'Interactive India Map', description: 'Discover India through an interactive regional atlas, district guides and approved traditional vegetarian food collections.' };
export default function IndiaMapPage() { return <IndiaMapExperience />; }
