/* col/row below are only used for ordering. The map itself draws boundaries from india-shapes.ts.
   TODO(verify): the boundary dataset is not confirmed Survey-of-India approved (AGENTS 2.8).
   TODO(verify): native-script spellings with regional sources. */

export interface IndiaState {
  code: string;
  slug: string;
  name: string;
  col: number;
  row: number;
  native: string;
}

const ROWS: ReadonlyArray<readonly [string, string, number, number, string]> = [
  ['HP', 'Himachal Pradesh', 3, 0, 'हिमाचल प्रदेश'],
  ['PB', 'Punjab', 2, 1, 'ਪੰਜਾਬ'],
  ['UK', 'Uttarakhand', 4, 1, 'उत्तराखंड'],
  ['SK', 'Sikkim', 6, 1, 'सिक्किम'],
  ['AR', 'Arunachal Pradesh', 8, 1, 'अरुणाचल प्रदेश'],
  ['RJ', 'Rajasthan', 2, 2, 'राजस्थान'],
  ['HR', 'Haryana', 3, 2, 'हरियाणा'],
  ['UP', 'Uttar Pradesh', 4, 2, 'उत्तर प्रदेश'],
  ['BR', 'Bihar', 5, 2, 'बिहार'],
  ['WB', 'West Bengal', 6, 2, 'পশ্চিমবঙ্গ'],
  ['AS', 'Assam', 7, 2, 'অসম'],
  ['NL', 'Nagaland', 8, 2, ''],
  ['GJ', 'Gujarat', 2, 3, 'ગુજરાત'],
  ['MP', 'Madhya Pradesh', 3, 3, 'मध्य प्रदेश'],
  ['CG', 'Chhattisgarh', 4, 3, 'छत्तीसगढ़'],
  ['JH', 'Jharkhand', 5, 3, 'झारखंड'],
  ['ML', 'Meghalaya', 7, 3, ''],
  ['MN', 'Manipur', 8, 3, 'মণিপুর'],
  ['MH', 'Maharashtra', 3, 4, 'महाराष्ट्र'],
  ['TS', 'Telangana', 4, 4, 'తెలంగాణ'],
  ['OD', 'Odisha', 5, 4, 'ଓଡ଼ିଶା'],
  ['TR', 'Tripura', 7, 4, 'ত্রিপুরা'],
  ['MZ', 'Mizoram', 8, 4, ''],
  ['GA', 'Goa', 2, 5, 'गोवा'],
  ['KA', 'Karnataka', 3, 5, 'ಕರ್ನಾಟಕ'],
  ['AP', 'Andhra Pradesh', 4, 5, 'ఆంధ్ర ప్రదేశ్'],
  ['KL', 'Kerala', 3, 6, 'കേരളം'],
  ['TN', 'Tamil Nadu', 4, 6, 'தமிழ்நாடு'],
];

export const STATES: readonly IndiaState[] = ROWS.map(([code, name, col, row, native]) => ({
  code,
  slug: name.toLowerCase().replace(/ /g, '-'),
  name,
  col,
  row,
  native,
}));
export const STATE_BY_SLUG: Readonly<Record<string, IndiaState>> = Object.fromEntries(STATES.map((s) => [s.slug, s]));
export const STATES_ALPHA: readonly IndiaState[] = [...STATES].sort((a, b) => a.name.localeCompare(b.name));
export const STATE_BY_CODE: Readonly<Record<string, IndiaState>> = Object.fromEntries(STATES.map((s) => [s.code, s]));

export { foodCount } from './foods';

export interface RouteDish {
  name: string;
  script: string;
  desc: string;
}

/* Hedged editorial copy. TODO(verify): descriptions and associations with regional sources. */
export const ROUTE: readonly string[] = ['BR', 'JH', 'WB', 'GJ', 'MH', 'TN'];
export const ROUTE_DISHES: Readonly<Record<string, RouteDish>> = {
  BR: { name: 'Thekua', script: 'ठेकुआ', desc: 'A crisp wheat-flour sweet fried in ghee, traditionally associated with Chhath Puja.' },
  JH: { name: 'Thekua', script: 'ठेकुआ', desc: 'The same sweet is made across the border in Jharkhand. Recipes differ by family and region.' },
  WB: { name: 'Luchi', script: 'লুচি', desc: 'Soft, puffed flatbread of refined flour, fried and eaten warm.' },
  GJ: { name: 'Dhokla', script: 'ઢોકળા', desc: 'A steamed, fermented gram-flour cake, light and a little tangy.' },
  MH: { name: 'Puran Poli', script: 'पुरणपोळी', desc: 'A soft flatbread stuffed with sweet lentil and jaggery, a festival favourite.' },
  TN: { name: 'Sambar', script: 'சாம்பார்', desc: 'A lentil and vegetable stew with tamarind, eaten across South India.' },
};

export const MARQUEE: ReadonlyArray<readonly [string, string]> = [
  ['Litti Chokha', 'लिट्टी चोखा'],
  ['Luchi', 'লুচি'],
  ['Dhokla', 'ઢોકળા'],
  ['Sambar', 'சாம்பார்'],
  ['Thekua', 'ठेकुआ'],
  ['Puran Poli', 'पुरणपोळी'],
  ['Sarson da Saag', 'ਸਰ੍ਹੋਂ ਦਾ ਸਾਗ'],
];
