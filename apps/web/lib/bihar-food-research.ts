/**
 * Evidence-backed Bihar food research leads. These are deliberately NOT published
 * product or verified district-food records. Keep the pending state until editorial
 * review confirms the district mapping, vegetarian recipe, cultural context and image.
 */
export type BiharFoodResearchLead = {
  name: string;
  place: string;
  evidenceNote: string;
  ingredients: string[];
  sourceLabel: string;
  sourceUrl: string;
  reviewNote: string;
  image: string;
  imageAlt: string;
};

const biharCuisineSource = 'https://betastate.bihar.gov.in/iprdwebsite/Cuisineofbihar';
const tourismCuisineSource = 'https://tourism.bihar.gov.in/content/dam/bihar-tourism/e_brochures/magnificient_bihar/magnificent_bihar_english_2017.pdf';

export const biharFoodResearchLeads: Record<string, BiharFoodResearchLead[]> = {
  patna: [
    {
      name: 'Maner Laddoo', place: 'Maner',
      evidenceNote: 'A Government of Bihar cuisine page identifies Maner as a place known for this laddoo.',
      ingredients: ['Gram flour', 'Sugar', 'Ghee'],
      sourceLabel: 'Government of Bihar · Cuisine of Bihar', sourceUrl: biharCuisineSource,
      reviewNote: 'Local producer corroboration, recipe variants and editorial review are still required.',
      image: '/images/research-maner-laddoo.webp', imageAlt: 'Illustrative food artwork of Maner-style gram-flour laddoo with saffron and pistachio',
    },
    {
      name: 'Khoye-ki-Lai', place: 'Barh',
      evidenceNote: 'A Government of Bihar cuisine page names Barh in connection with this amaranth-and-khoa sweet.',
      ingredients: ['Ramdana / amaranth seeds', 'Khoa', 'Sugar'],
      sourceLabel: 'Government of Bihar · Cuisine of Bihar', sourceUrl: biharCuisineSource,
      reviewNote: 'Confirm town-to-district mapping, local recipe variants and editorial review before publication.',
      image: '/images/research-khoye-ki-lai.webp', imageAlt: 'Illustrative food artwork of puffed amaranth and khoya lai clusters',
    },
  ],
  nalanda: [
    {
      name: 'Silao Khaja', place: 'Silao',
      evidenceNote: 'A Government of Bihar cuisine page describes Silao as having a longstanding khaja-making tradition.',
      ingredients: ['Maida', 'Sugar', 'Ghee'],
      sourceLabel: 'Government of Bihar · Cuisine of Bihar', sourceUrl: biharCuisineSource,
      reviewNote: 'Named variants and local recipe details require review; do not imply exclusive origin.',
      image: '/images/research-silao-khaja.webp', imageAlt: 'Illustrative food artwork of flaky, layered Silao Khaja pastries',
    },
  ],
  gaya: [
    {
      name: 'Gaya Tilkut', place: 'Gaya',
      evidenceNote: 'The Bihar Tourism cuisine brochure associates Gaya with tilkut.',
      ingredients: ['Sesame seeds', 'Sugar or jaggery'],
      sourceLabel: 'Bihar Tourism · Magnificent Bihar', sourceUrl: tourismCuisineSource,
      reviewNote: 'Confirm local varieties, ingredients and seasonal/cultural context with additional sources.',
      image: '/images/research-gaya-tilkut.webp', imageAlt: 'Illustrative food artwork of sesame and jaggery Gaya Tilkut discs',
    },
  ],
  darbhanga: [
    {
      name: 'Kheer-Makhana', place: 'Darbhanga region',
      evidenceNote: 'A Government of Bihar cuisine page describes kheer-makhana as a specialty of the Darbhanga region.',
      ingredients: ['Makhana', 'Milk', 'Sugar'],
      sourceLabel: 'Government of Bihar · Cuisine of Bihar', sourceUrl: biharCuisineSource,
      reviewNote: 'The source says “region”; confirm district-level association and local preparation before publication.',
      image: '/images/research-kheer-makhana.webp', imageAlt: 'Illustrative food artwork of creamy makhana kheer with nuts and saffron',
    },
  ],
  bhojpur: [
    {
      name: 'Belgrami', place: 'Udwantnagar',
      evidenceNote: 'A Government of Bihar cuisine page names Udwantnagar for this sweet and locates it between Arrah and Buxar.',
      ingredients: ['Chhena / cheese', 'Sugar', 'Ghee'],
      sourceLabel: 'Government of Bihar · Cuisine of Bihar', sourceUrl: biharCuisineSource,
      reviewNote: 'Udwantnagar is listed among Bhojpur district blocks in the Government of India directory; local recipe corroboration and editorial review remain pending.',
      image: '/images/research-belgrami.webp', imageAlt: 'Illustrative food artwork of golden Belgrami milk-sweet pieces',
    },
  ],
};
