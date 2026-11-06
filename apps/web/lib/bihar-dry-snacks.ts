import { slugifyDistrict } from '@/lib/bihar-districts';

/**
 * Bihar vegetarian dry-snack research catalogue transcribed from the supplied
 * three-page Rasvani research PDF (DOC-20261105-WA0005.pdf, 5 Nov 2026).
 * It is a candidate editorial list, NOT a verified origin register or sellable SKU list.
 * Bihar-wide fallback snacks must never be described as originating in the district.
 */
export type BiharDrySnackBasis = 'district-linked' | 'bihar-wide-fallback';

export type BiharDrySnack = {
  name: string;
  slug: string;
  basis: BiharDrySnackBasis;
  image: string;
  imageAlt: string;
  caution?: string;
};

export type BiharDrySnackDistrict = {
  number: number;
  district: string;
  slug: string;
  districtLinkedSpeciality: string;
  linkedSnackNote: string;
  snacks: BiharDrySnack[];
};

const artwork: Record<string, { image: string; description: string }> = {
  'roasted-makhana': { image: '/images/snack-makhana.webp', description: 'plain roasted fox nuts' },
  'masala-makhana': { image: '/images/snack-masala-makhana.webp', description: 'spiced roasted makhana fox nuts' },
  'sattu-ladoo': { image: '/images/snack-sattu-ladoo.webp', description: 'golden roasted-gram flour ladoo balls' },
  'sattu-mathri': { image: '/images/snack-sattu-mathri.webp', description: 'round flaky baked or fried sattu mathri' },
  thekua: { image: '/images/snack-thekua.webp', description: 'patterned wheat-flour and jaggery thekua biscuits' },
  anarsa: { image: '/images/snack-anarsa.webp', description: 'traditional rice-flour anarsa sweets' },
  'chana-bhunja': { image: '/images/snack-chana-bhunja.webp', description: 'dry roasted chickpeas' },
  'katarni-chura': { image: '/images/snack-katarni-chura.webp', description: 'flattened aromatic Katarni rice flakes' },
  'chura-bhunja': { image: '/images/snack-chura-bhunja.webp', description: 'roasted flattened rice snack' },
  nimki: { image: '/images/snack-nimki.webp', description: 'diamond-cut savoury nimki crackers' },
  tilkut: { image: '/images/research-gaya-tilkut.webp', description: 'sesame and jaggery Gaya tilkut discs' },
  'til-laddoo': { image: '/images/snack-til-ladoo.webp', description: 'sesame-jaggery ladoo sweets' },
  'til-ladoo': { image: '/images/snack-til-ladoo.webp', description: 'sesame-jaggery ladoo sweets' },
  khurma: { image: '/images/snack-khurma-dry-thekua.webp', description: 'Bihar-style khurma sweet snack' },
  belgrami: { image: '/images/research-belgrami.webp', description: 'Belgrami traditional sweet pieces' },
  batisa: { image: '/images/snack-batisa.webp', description: 'illustrative pale square Batisa sweet pieces' },
  papdi: { image: '/images/snack-batisa-papdi.webp', description: 'traditional flaky sweet papdi pieces' },
  murmura: { image: '/images/snack-murmura.webp', description: 'plain puffed rice grains' },
  'dry-chura-mixture': { image: '/images/snack-dry-chura-mixture.webp', description: 'dry flattened-rice snack mixture' },
  'murmura-ladoo': { image: '/images/snack-murmura-ladoo.webp', description: 'puffed-grain and jaggery ladoo clusters' },
  'makhana-ladoo': { image: '/images/snack-makhana-ladoo.webp', description: 'round makhana ladoo sweets' },
  'silao-khaja': { image: '/images/research-silao-khaja.webp', description: 'Silao Khaja layered pastries' },
  khaja: { image: '/images/khaja.jpg', description: 'traditional layered khaja pastry' },
  'maner-laddu': { image: '/images/research-maner-laddoo.webp', description: 'Maner-style gram-flour laddoo' },
  'dry-thekua': { image: '/images/snack-thekua.webp', description: 'dry-pack Thekua snack' },
  'makai-ke-lawa': { image: '/images/snack-maize.webp', description: 'popped maize or makai ke lawa' },
  'roasted-maize': { image: '/images/snack-maize.webp', description: 'roasted maize kernels and corn' },
  'besan-sev': { image: '/images/snack-besan-sev.webp', description: 'fine golden chickpea-flour sev strands' },
  'gur-chikki': { image: '/images/snack-gur-chikki.webp', description: 'jaggery brittle or gur chikki' },
  'til-gur-ladoo': { image: '/images/snack-til-gur-ladoo.webp', description: 'sesame seeds bound with jaggery into ladoo' },
};

function snack(name: string, basis: BiharDrySnackBasis, caution?: string): BiharDrySnack {
  const normalized = name.toLowerCase();
  const slug = normalized.includes('roasted makhana') ? 'roasted-makhana'
    : normalized.includes('masala makhana') ? 'masala-makhana'
    : normalized.includes('sattu ladoo') ? 'sattu-ladoo'
    : normalized.includes('sattu mathri') ? 'sattu-mathri'
    : normalized.includes('katarni chura') ? 'katarni-chura'
    : normalized.includes('chura bhunja') ? 'chura-bhunja'
    : normalized.includes('dry chura mixture') ? 'dry-chura-mixture'
    : normalized.includes('chana bhunja') ? 'chana-bhunja'
    : normalized.includes('murmura ladoo') ? 'murmura-ladoo'
    : normalized.includes('makhana ladoo') ? 'makhana-ladoo'
    : normalized.includes('murmura') ? 'murmura'
    : normalized.includes('til laddoo') ? 'til-laddoo'
    : normalized.includes('til ladoo') ? 'til-ladoo'
    : normalized.includes('til-gur ladoo') ? 'til-gur-ladoo'
    : normalized.includes('gur chikki') ? 'gur-chikki'
    : normalized.includes('silao khaja') ? 'silao-khaja'
    : normalized.includes('maner laddu') ? 'maner-laddu'
    : normalized.includes('dry thekua') ? 'dry-thekua'
    : normalized.includes('thekua') ? 'thekua'
    : normalized.includes('anarsa') ? 'anarsa'
    : normalized.includes('nimki') ? 'nimki'
    : normalized.includes('tilkut') ? 'tilkut'
    : normalized.includes('khurma') ? 'khurma'
    : normalized.includes('belgrami') ? 'belgrami'
    : normalized.includes('batisa') ? 'batisa'
    : normalized.includes('papdi') ? 'papdi'
    : normalized.includes('khaja') ? 'khaja'
    : normalized.includes('besan sev') ? 'besan-sev'
    : normalized.includes('makai ke lawa') ? 'makai-ke-lawa'
    : normalized.includes('roasted maize') ? 'roasted-maize'
    : null;
  if (!slug || !artwork[slug]) throw new Error(`No exact snack artwork mapping for: ${name}`);
  const art = artwork[slug];
  return {
    name,
    slug,
    basis,
    image: art.image,
    imageAlt: `Illustrative AI artwork accompanying the ${name} research entry; not an actual producer product photograph`,
    ...(caution ? { caution } : {}),
  };
}

const districtSlug = (name: string) => name === 'Kaimur' ? slugifyDistrict('Kaimur (Bhabua)') : slugifyDistrict(name);

const district = (
  number: number,
  name: string,
  speciality: string,
  linked: string[],
  fallback: string[],
  linkedSnackNote = '',
): BiharDrySnackDistrict => ({
  number,
  district: name,
  slug: districtSlug(name),
  districtLinkedSpeciality: speciality,
  linkedSnackNote,
  snacks: [
    ...linked.map((item) => snack(item, 'district-linked',
      item === 'Belgrami' ? 'Confirm the exact recipe and batch shelf life; the source warns that recipes may contain chhena.'
      : ['Batisa', 'Papdi'].includes(item) ? 'Confirm the exact recipe and batch shelf life before treating it as a long-lasting dry snack.'
      : undefined)),
    ...fallback.map((item) => snack(item, 'bihar-wide-fallback')),
  ],
});

export const biharDrySnackDistricts: BiharDrySnackDistrict[] = [
  district(1, 'Araria', 'Makhana (Fox Nuts)', ['Roasted Makhana', 'Masala Makhana'], []),
  district(2, 'Arwal', 'Sattu (Roasted Gram Flour)', ['Sattu Ladoo', 'Sattu Mathri (dry baked/fried snack)'], []),
  district(3, 'Aurangabad', 'No verified district-specific dry snack found', [], ['Thekua', 'Anarsa', 'Chana Bhunja']),
  district(4, 'Banka', 'Katarni Rice', ['Katarni Chura (Flattened Katarni Rice)'], ['Chura Bhunja']),
  district(5, 'Begusarai', 'Chilli (district ODOP)', [], ['Thekua', 'Nimki (Bihar-style savoury crackers)', 'Chana Bhunja'], 'The district focus is chilli; the listed dry snacks are Bihar-wide fallback options, not chilli-origin snacks.'),
  district(6, 'Bhagalpur', 'Jardalu Mango (fresh fruit; excluded)', [], ['Thekua', 'Anarsa', 'Tilkut'], 'Jardalu mango is fresh fruit and is excluded from this dry-snack catalogue; all listed snacks are Bihar-wide fallback options.'),
  district(7, 'Bhojpur', 'Khurma; Belgrami', ['Khurma', 'Belgrami'], []),
  district(8, 'Buxar', 'Batisa; Papdi (traditional sweets)', ['Batisa', 'Papdi'], []),
  district(9, 'Darbhanga', 'Makhana (Fox Nuts)', ['Roasted Makhana', 'Masala Makhana'], []),
  district(10, 'East Champaran', 'No verified district-specific dry vegetarian snack found', [], ['Thekua', 'Anarsa', 'Chana Bhunja']),
  district(11, 'Gaya', 'Tilkut (Sesame Sweet)', ['Tilkut', 'Til Laddoo (Sesame-Jaggery Ladoo)'], ['Anarsa']),
  district(12, 'Gopalganj', 'No verified district-specific dry snack found', [], ['Thekua', 'Khaja', 'Nimki']),
  district(13, 'Jamui', 'No verified district-specific dry snack found', [], ['Thekua', 'Sattu Ladoo', 'Chana Bhunja']),
  district(14, 'Jehanabad', 'Sattu / Besan (Roasted Gram Flour / Chickpea Flour)', ['Sattu Ladoo', 'Besan Sev'], ['Chana Bhunja']),
  district(15, 'Kaimur', 'Rice-based products', ['Murmura (Puffed Rice)', 'Chura Bhunja', 'Dry Chura Mixture'], []),
  district(16, 'Katihar', 'Makhana (Fox Nuts)', ['Roasted Makhana', 'Masala Makhana'], []),
  district(17, 'Khagaria', 'No verified district-specific dry snack found', [], ['Thekua', 'Anarsa', 'Murmura Ladoo']),
  district(18, 'Kishanganj', 'No verified district-specific dry vegetarian snack found', [], ['Thekua', 'Nimki', 'Chana Bhunja']),
  district(19, 'Lakhisarai', 'No verified district-specific dry snack found', [], ['Thekua', 'Til Ladoo', 'Nimki']),
  district(20, 'Madhepura', 'No verified district-specific dry snack found', [], ['Thekua', 'Anarsa', 'Murmura Ladoo']),
  district(21, 'Madhubani', 'Makhana (Mithila)', ['Roasted Makhana', 'Masala Makhana', 'Makhana Ladoo'], []),
  district(22, 'Munger', 'Rice-based products', ['Murmura', 'Chura Bhunja', 'Dry Chura Mixture'], []),
  district(23, 'Muzaffarpur', 'Litchi (fresh fruit; excluded)', [], ['Thekua', 'Anarsa', 'Tilkut'], 'Litchi is fresh fruit and is excluded from this dry-snack catalogue; all listed snacks are Bihar-wide fallback options.'),
  district(24, 'Nalanda', 'Silao Khaja (Nalanda speciality)', ['Silao Khaja'], ['Thekua']),
  district(25, 'Nawada', 'No verified district-specific dry vegetarian snack found', [], ['Thekua', 'Tilkut', 'Chana Bhunja']),
  district(26, 'Patna', 'Maner Laddu; Bakery products', ['Maner Laddu'], ['Khaja', 'Dry Thekua']),
  district(27, 'Purnia', 'Maize-based products', ['Makai ke Lawa (Popped Corn)', 'Roasted Maize'], []),
  district(28, 'Rohtas', 'Rice-based products', ['Murmura', 'Chura Bhunja', 'Dry Chura Mixture'], []),
  district(29, 'Saharsa', 'Makhana', ['Roasted Makhana', 'Masala Makhana'], []),
  district(30, 'Samastipur', 'No verified district-specific dry snack found (ODOP: turmeric)', [], ['Thekua', 'Nimki', 'Chana Bhunja'], 'Turmeric is listed as the district ODOP focus; the snacks listed here are Bihar-wide fallback options.'),
  district(31, 'Saran', 'No verified district-specific dry snack found', [], ['Thekua', 'Anarsa', 'Khaja']),
  district(32, 'Sheikhpura', 'No verified district-specific dry snack found', [], ['Thekua', 'Til Ladoo', 'Nimki']),
  district(33, 'Sheohar', 'No verified district-specific dry snack found', [], ['Thekua', 'Murmura Ladoo', 'Chana Bhunja']),
  district(34, 'Sitamarhi', 'No verified district-specific dry snack found', [], ['Thekua', 'Anarsa', 'Nimki']),
  district(35, 'Siwan', 'No verified district-specific dry snack found (ODOP: mentha)', [], ['Thekua', 'Sattu Ladoo', 'Chana Bhunja'], 'Mentha is listed as the district ODOP focus; the snacks listed here are Bihar-wide fallback options.'),
  district(36, 'Supaul', 'Makhana', ['Roasted Makhana', 'Masala Makhana'], []),
  district(37, 'Vaishali', 'No verified district-specific dry snack found (ODOP: honey)', [], ['Thekua', 'Anarsa', 'Tilkut'], 'Honey is listed as the district ODOP focus; the snacks listed here are Bihar-wide fallback options.'),
  district(38, 'West Champaran', 'Sugarcane / jaggery-based products', ['Gur Chikki (Jaggery Brittle)', 'Til-Gur Ladoo'], ['Thekua']),
];

export const biharDrySnackByDistrict = Object.fromEntries(
  biharDrySnackDistricts.map((item) => [item.slug, item]),
) as Record<string, BiharDrySnackDistrict>;

export const biharDrySnackResearchSource = {
  title: 'Rasvani Research List · Vegetarian Traditional & Dry Snacks',
  document: 'DOC-20261105-WA0005.pdf',
  note: 'Candidate snacks only. District associations, ingredients, recipe variants and sealed-pack shelf life must be verified before publication or sale.',
  excluded: ['Litti with chokha', 'Pittha', 'Dahi-chura', 'Makhana kheer', 'Malpua served fresh', 'fresh fruit', 'fruit juice', 'wet chutney', 'cooked vegetables', 'fish/meat', 'dairy-rich moist sweets'],
};
