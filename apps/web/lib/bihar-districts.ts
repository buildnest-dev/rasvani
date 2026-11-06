/**
 * Bihar district navigation baseline, cross-checked against the Government of Bihar
 * district directory and the Government of India's Integrated Government Online
 * Directory. Names are for navigation only; no food-origin or heritage claims are implied.
 */
export const biharDistricts = [
  'Araria', 'Arwal', 'Aurangabad', 'Banka', 'Begusarai', 'Bhagalpur', 'Bhojpur', 'Buxar',
  'Darbhanga', 'East Champaran', 'Gaya', 'Gopalganj', 'Jamui', 'Jehanabad', 'Kaimur (Bhabua)',
  'Katihar', 'Khagaria', 'Kishanganj', 'Lakhisarai', 'Madhepura', 'Madhubani', 'Munger',
  'Muzaffarpur', 'Nalanda', 'Nawada', 'Patna', 'Purnia', 'Rohtas', 'Saharsa', 'Samastipur',
  'Saran', 'Sheikhpura', 'Sheohar', 'Sitamarhi', 'Siwan', 'Supaul', 'Vaishali', 'West Champaran',
] as const;
export const slugifyDistrict = (name: string) => name.toLowerCase().normalize('NFC').replaceAll(' ', '-').replace(/[()]/g, '');
