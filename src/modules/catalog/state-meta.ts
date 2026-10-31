/* Region, accent hue and a one-line intro per state, adapted from the "human-centered-web-studio" design.
   Source copy that made unverified claims (GI tags, "oldest", "only in winter") was dropped (AGENTS §2.4–2.5).
   TODO(verify): intros with regional sources before publication. */

export type Region = 'North' | 'East' | 'West' | 'Central' | 'South' | 'Northeast';
export const REGIONS: readonly Region[] = ['North', 'East', 'West', 'Central', 'South', 'Northeast'];

export interface StateMeta {
  region: Region;
  hue: number;
  intro: string;
}

export const STATE_META: Readonly<Record<string, StateMeta>> = {
  'andhra-pradesh': { region: 'South', hue: 35, intro: "Coastal Andhra cooking is known for bold chilli heat, tangy leaves and delicate festival sweets." },
  'arunachal-pradesh': { region: 'Northeast', hue: 150, intro: "Mountain kitchens of the eastern Himalaya, built on millet, buckwheat, rice and forest greens." },
  'assam': { region: 'Northeast', hue: 125, intro: "The land of tea gardens and the Brahmaputra, where Bihu brings out pithas and jolpan." },
  'bihar': { region: 'East', hue: 45, intro: "From the ghats of Chhath to the sweet shops of Gaya and Nalanda, Bihar’s sweets and snacks are tied to festivals and to the towns that make them." },
  'chhattisgarh': { region: 'Central', hue: 95, intro: "Known as the rice bowl of India, Chhattisgarh turns rice into breakfasts, snacks and festival sweets." },
  'goa': { region: 'West', hue: 200, intro: "Beyond the beaches, Goa's Hindu Konkani kitchens cook with coconut, kokum and palm jaggery." },
  'gujarat': { region: 'West', hue: 85, intro: "Steamed, light and gently sweet — the Gujarati thali balances every taste on one plate." },
  'haryana': { region: 'North', hue: 70, intro: "Farm kitchens rich with milk, ghee, millet and simple, hearty food." },
  'himachal-pradesh': { region: 'North', hue: 175, intro: "Mountain valleys where breads are steamed, chickpeas simmer in yoghurt and walnuts are everywhere." },
  'jharkhand': { region: 'East', hue: 110, intro: "Forest and tribal food traditions built on rice, lentils and seasonal produce." },
  'karnataka': { region: 'South', hue: 55, intro: "From royal Mysuru sweets to Dharwad's milk pedhas and comforting bisi bele bath." },
  'kerala': { region: 'South', hue: 140, intro: "Coconut, banana leaf and the great Onam Sadya." },
  'madhya-pradesh': { region: 'Central', hue: 25, intro: "The heart of India, where Indore's street mornings begin with poha and jalebi." },
  'maharashtra': { region: 'West', hue: 15, intro: "Puran poli for festivals, fiery misal for mornings and modak for Ganpati." },
  'manipur': { region: 'Northeast', hue: 320, intro: "Where aromatic black rice, chak-hao, is traditionally cooked into a milk dessert." },
  'meghalaya': { region: 'Northeast', hue: 165, intro: "Khasi and Garo kitchens among the clouds, cooking with local rice." },
  'mizoram': { region: 'Northeast', hue: 135, intro: "Hill food that is light, herby and close to the land." },
  'nagaland': { region: 'Northeast', hue: 10, intro: "Smoky, earthy food of the Naga hills, flavoured with local chillies." },
  'odisha': { region: 'East', hue: 30, intro: "Temple kitchens, chhena sweets and the cooling pakhala of summer." },
  'punjab': { region: 'North', hue: 60, intro: "Mustard fields, white butter and the warmth of the langar." },
  'rajasthan': { region: 'West', hue: 40, intro: "Desert kitchens, generous with ghee and clever with dried beans and berries." },
  'sikkim': { region: 'Northeast', hue: 190, intro: "Himalayan kitchens of Nepali, Lepcha and Bhutia families." },
  'tamil-nadu': { region: 'South', hue: 20, intro: "Temple towns, filter coffee and a meal that begins with pongal." },
  'telangana': { region: 'South', hue: 0, intro: "Millet breads, Sankranti snacks and the sweets of Hyderabad." },
  'tripura': { region: 'Northeast', hue: 100, intro: "Tripuri and Bengali food traditions meet in this small hill state." },
  'uttar-pradesh': { region: 'North', hue: 50, intro: "Ganga ghats, Agra's petha and the winter mornings of Banaras." },
  'uttarakhand': { region: 'North', hue: 160, intro: "Pahadi kitchens of Garhwal and Kumaon." },
  'west-bengal': { region: 'East', hue: 5, intro: "Sweetness that arrives in a clay pot." },
};
