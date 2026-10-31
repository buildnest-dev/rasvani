import { Hero } from '@/components/features/hero';
import { Marquee } from '@/components/motion/marquee';
import { TrustBadges } from '@/components/features/trust-badges';
import { IndiaJourney } from '@/components/map/india-journey';
import { StateRail } from '@/components/features/state-rail';
import { FeaturedFoods } from '@/components/features/featured-foods';
import { Festival } from '@/components/features/festival';
import { Stories } from '@/components/features/stories';
import { HomeBand } from '@/components/features/home-band';
import { Makers } from '@/components/features/makers';
import { StatsStrip } from '@/components/features/stats-strip';
import { HowItWorks } from '@/components/features/how-it-works';
import { Promise as Principles } from '@/components/features/promise';
import { Notify } from '@/components/features/notify';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Marquee />
      <TrustBadges />
      <IndiaJourney />
      <StateRail />
      <FeaturedFoods />
      <Festival />
      <Stories />
      <HomeBand />
      <Makers />
      <StatsStrip />
      <HowItWorks />
      <Principles />
      <Notify />
    </>
  );
}
