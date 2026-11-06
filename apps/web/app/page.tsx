import type { Metadata } from 'next';
import { HomeExperience } from '@/components/home-experience';
export const metadata: Metadata = { title: 'India, Served by Region', description: 'Discover India’s regional vegetarian food stories, makers and carefully reviewed collections.' };
export default function HomePage() { return <HomeExperience />; }
