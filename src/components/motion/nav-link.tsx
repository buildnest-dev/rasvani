'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { AnchorHTMLAttributes } from 'react';
import { AnchorLink } from './anchor-link';

interface Props extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: `#${string}`;
}

/* A section link that smooth-scrolls on the home page and goes home first from any other page. */
export function NavLink({ href, ...rest }: Props) {
  const path = usePathname();
  if (path === '/') return <AnchorLink href={href} {...rest} />;
  return <Link href={href === '#top' ? '/' : `/${href}`} {...rest} />;
}
