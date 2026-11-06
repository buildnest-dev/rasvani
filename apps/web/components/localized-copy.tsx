'use client';

import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { useLocale } from '@/components/locale-provider';

const localizedProps = ['aria-label', 'aria-description', 'placeholder', 'title', 'alt'] as const;

function preserveWhitespace(source: string, translated: string) {
  const leading = source.match(/^\s*/)?.[0] ?? '';
  const trailing = source.match(/\s*$/)?.[0] ?? '';
  return `${leading}${translated}${trailing}`;
}

function translateNode(node: ReactNode, translate: (text: string) => string): ReactNode {
  if (typeof node === 'string') return preserveWhitespace(node, translate(node));
  if (typeof node === 'number' || node === null || node === undefined || typeof node === 'boolean') return node;
  if (Array.isArray(node)) return node.map((child) => translateNode(child, translate));
  if (!isValidElement(node)) return node;

  const props = node.props as Record<string, unknown>;
  if (props['data-locale-skip'] === true || props.dangerouslySetInnerHTML) return node;

  const nextProps: Record<string, unknown> = {};
  for (const name of localizedProps) {
    const value = props[name];
    if (typeof value === 'string') nextProps[name] = translate(value);
  }
  if ('children' in props) nextProps.children = translateNode(props.children as ReactNode, translate);
  return cloneElement(node as ReactElement<Record<string, unknown>>, nextProps);
}

/**
 * Applies the active site language to static UI copy in server-rendered pages
 * and component-owned markup. Names of foods, places and producers remain as
 * entered; only reviewed UI phrase entries in the shared glossary are changed.
 */
export function LocalizedCopy({ children }: { children: ReactNode }) {
  const { translate } = useLocale();
  return <>{Children.map(children, (child) => translateNode(child, translate))}</>;
}
