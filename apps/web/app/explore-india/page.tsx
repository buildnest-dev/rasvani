import type { Metadata } from 'next';
import { RegionalSearchResults } from '@/components/regional-search-results';
import { ExploreIndiaExperience } from '@/components/explore-india-experience';
export const metadata: Metadata = {
  title: 'Explore India',
  description: 'Discover Indian regional vegetarian foods by state, district, story and reviewed regional names.',
};
export default async function ExploreIndiaPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const query = (await searchParams).q?.trim().slice(0, 80) ?? '';
  return <ExploreIndiaExperience query={query}>{query ? <RegionalSearchResults query={query}/> : null}</ExploreIndiaExperience>;
}
