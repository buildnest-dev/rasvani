import { biharDrySnackDistricts } from '@/lib/bihar-dry-snacks';
import { biharFoodResearchLeads } from '@/lib/bihar-food-research';
import { siwanFoods } from '@/lib/siwan-foods';

export type HomeFoodOrigin = 'district-linked-candidate' | 'bihar-wide-fallback' | 'siwan-existing' | 'research-pending';
export type HomeFoodAssociation = {
  label: string;
  districtSlug?: string;
  kind: 'district-linked-candidate' | 'bihar-wide-fallback' | 'siwan-source' | 'siwan-local-coverage' | 'research-location-pending';
};
export type HomeFoodItem = {
  id: string;
  name: string;
  category: string;
  image: string;
  imageAlt: string;
  description: string;
  associations: HomeFoodAssociation[];
  labels: HomeFoodOrigin[];
  aliases: string[];
  notes: string[];
  isPdfDrySnack: boolean;
  isOriginalSiwanFood: boolean;
  isResearchLead: boolean;
  href: string;
};

type MutableFood = Omit<HomeFoodItem, 'associations' | 'labels' | 'aliases' | 'notes'> & {
  associations: HomeFoodAssociation[];
  labels: Set<HomeFoodOrigin>;
  aliases: Set<string>;
  notes: Set<string>;
};

const identityAliases: Record<string, string> = {
  'til-laddoo': 'til-ladoo',
  'maner-laddoo': 'maner-laddu',
};

const researchIdentity: Record<string, string> = {
  'Maner Laddoo': 'dry:maner-laddu',
  'Khoye-ki-Lai': 'research:khoye-ki-lai',
  'Silao Khaja': 'dry:silao-khaja',
  'Gaya Tilkut': 'dry:tilkut',
  'Kheer-Makhana': 'research:kheer-makhana',
  Belgrami: 'dry:belgrami',
};

const researchDistricts: Record<string, { label: string; slug?: string }> = {
  'Maner Laddoo': { label: 'Maner · Patna district', slug: 'patna' },
  'Khoye-ki-Lai': { label: 'Barh · district mapping pending' },
  'Silao Khaja': { label: 'Silao · Nalanda district', slug: 'nalanda' },
  'Gaya Tilkut': { label: 'Gaya district', slug: 'gaya' },
  'Kheer-Makhana': { label: 'Darbhanga region · district-level mapping pending' },
  Belgrami: { label: 'Udwantnagar · Bhojpur district', slug: 'bhojpur' },
};

const items = new Map<string, MutableFood>();

function addItem(key: string, seed: Omit<MutableFood, 'associations' | 'labels' | 'aliases' | 'notes'>) {
  let current = items.get(key);
  if (!current) {
    current = { ...seed, associations: [], labels: new Set(), aliases: new Set(), notes: new Set() };
    items.set(key, current);
  }
  return current;
}

function addAssociation(item: MutableFood, association: HomeFoodAssociation) {
  const signature = `${association.label}|${association.kind}|${association.districtSlug ?? ''}`;
  if (!item.associations.some((entry) => `${entry.label}|${entry.kind}|${entry.districtSlug ?? ''}` === signature)) {
    item.associations.push(association);
  }
}

// Start with the precise snack entries from the supplied three-page PDF.
for (const district of biharDrySnackDistricts) {
  for (const snack of district.snacks) {
    const identity = identityAliases[snack.slug] ?? snack.slug;
    const key = `dry:${identity}`;
    const category = 'Traditional dry snack';
    const entry = addItem(key, {
      id: key,
      name: snack.name,
      category,
      image: snack.image,
      imageAlt: snack.imageAlt,
      description: 'Candidate vegetarian dry-snack entry from the supplied Rasvani district research list. This is not an approved sellable product.',
      isPdfDrySnack: true,
      isOriginalSiwanFood: false,
      isResearchLead: false,
      href: `/explore-india/bihar/district/${encodeURIComponent(district.slug)}`,
    });
    if (entry.name !== snack.name) entry.aliases.add(snack.name);
    entry.labels.add(snack.basis === 'district-linked' ? 'district-linked-candidate' : 'bihar-wide-fallback');
    if (snack.caution) entry.notes.add(snack.caution);
    addAssociation(entry, {
      label: district.district,
      districtSlug: district.slug,
      kind: snack.basis === 'district-linked' ? 'district-linked-candidate' : 'bihar-wide-fallback',
    });
  }
}

// Keep all food records that were already present in the original Siwan page.
for (const food of siwanFoods) {
  const normalized = food.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const key = food.name === 'Khaja' ? 'dry:khaja' : `siwan:${normalized}`;
  const entry = addItem(key, {
    id: key,
    name: food.name,
    category: food.category,
    image: food.image,
    imageAlt: `${food.imageAlt}; illustrative artwork, not a producer product photograph`,
    description: food.description,
    isPdfDrySnack: false,
    isOriginalSiwanFood: true,
    isResearchLead: false,
    href: '/explore-india/bihar/district/siwan',
  });
  entry.isOriginalSiwanFood = true;
  entry.category = entry.isPdfDrySnack ? 'Traditional dry snack' : food.category;
  if (entry.name !== food.name) entry.aliases.add(food.name);
  entry.notes.add(food.relation);
  addAssociation(entry, {
    label: 'Siwan',
    districtSlug: 'siwan',
    kind: food.status === 'district-source' ? 'siwan-source' : 'siwan-local-coverage',
  });
}

// Keep the six original research leads; merge exact overlaps with the PDF item
// list without losing the research spelling, location, or review status.
for (const leads of Object.values(biharFoodResearchLeads)) {
  for (const lead of leads) {
    const key = researchIdentity[lead.name] ?? `research:${lead.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const location = researchDistricts[lead.name] ?? { label: lead.place };
    const entry = addItem(key, {
      id: key,
      name: lead.name,
      category: 'Traditional food · research lead',
      image: lead.image,
      imageAlt: `${lead.imageAlt}; illustrative research artwork, not a producer product photograph`,
      description: lead.evidenceNote,
      isPdfDrySnack: false,
      isOriginalSiwanFood: false,
      isResearchLead: true,
      href: location.slug ? `/explore-india/bihar/district/${location.slug}` : '/explore-india/bihar',
    });
    entry.isResearchLead = true;
    if (entry.name !== lead.name) entry.aliases.add(lead.name);
    entry.notes.add(lead.reviewNote);
    addAssociation(entry, {
      label: location.label,
      ...(location.slug ? { districtSlug: location.slug } : {}),
      kind: location.slug ? 'research-location-pending' : 'research-location-pending',
    });
    // Preserve the source's own location statement (e.g. Barh) in the searchable aliases.
    if (lead.place && lead.place !== location.label) entry.aliases.add(lead.place);
    if (lead.name === 'Kheer-Makhana') entry.notes.add('Excluded from the supplied dry-snack list because it is a moist dairy preparation; retained here only because it existed in the original project research leads.');
  }
}

const priority = (item: MutableFood) => item.isPdfDrySnack ? 0 : item.isOriginalSiwanFood ? 1 : 2;

const additionalHomepageFoods: HomeFoodItem[] = [
  { id: 'homepage:perukia', name: 'Perukia', category: 'Traditional Bihari sweet', image: '/images/homepage-perukia.webp', imageAlt: 'Illustrative golden crescent-shaped Perukia pastries on a brass plate', description: 'A traditional filled pastry sweet added to the Rasvani homepage food discovery collection.', associations: [{ label: 'Bihar', kind: 'bihar-wide-fallback' }], labels: ['bihar-wide-fallback'], aliases: ['Pedakiya'], notes: ['Illustrative artwork; recipe and district associations require editorial verification.'], isPdfDrySnack: false, isOriginalSiwanFood: false, isResearchLead: false, href: '/explore-india/bihar' },
  { id: 'homepage:gujiya', name: 'Gujiya', category: 'Traditional Indian sweet', image: '/images/homepage-gujiya.webp', imageAlt: 'Illustrative golden crescent-shaped Gujiya pastries with visible nut and coconut filling', description: 'A festive filled pastry sweet included in the Rasvani homepage discovery collection.', associations: [{ label: 'Bihar · wider regional food discovery', kind: 'bihar-wide-fallback' }], labels: ['bihar-wide-fallback'], aliases: [], notes: ['Illustrative artwork; local recipe and district associations require editorial verification.'], isPdfDrySnack: false, isOriginalSiwanFood: false, isResearchLead: false, href: '/explore-india/bihar' },
];

export const biharHomeFoodItems: HomeFoodItem[] = [...Array.from(items.values())
  .filter((item) => !['kadhi', 'litti-chokha'].includes(item.name.toLowerCase().replaceAll(' ', '-')))
  .map((item) => ({
    ...item,
    associations: item.associations,
    labels: Array.from(item.labels),
    aliases: Array.from(item.aliases).filter((alias) => alias !== item.name),
    notes: Array.from(item.notes),
  }))
  .sort((a, b) => priority(a as unknown as MutableFood) - priority(b as unknown as MutableFood) || a.name.localeCompare(b.name)), ...additionalHomepageFoods];

export const biharHomeFoodCounts = {
  totalItems: biharHomeFoodItems.length,
  drySnackItems: biharHomeFoodItems.filter((item) => item.isPdfDrySnack).length,
  originalSiwanItems: biharHomeFoodItems.filter((item) => item.isOriginalSiwanFood).length,
  researchLeads: biharHomeFoodItems.filter((item) => item.isResearchLead).length,
};
