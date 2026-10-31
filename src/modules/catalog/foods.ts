/* Seed list: founder's "India's 28 States, Traditional Vegetarian Foods, Final List" (01-PRD §7.2).
   Representative foods, not exclusive to a state. Recipes vary by district and community.
   `confirm: true` marks entries the list flags for a meat/fish-free recipe check: they stay
   NEEDS_CONFIRMATION and cannot be sold until a maker confirms and Admin approves (AGENTS §2.1).
   TODO(verify): spellings and associations with regional sources before publication. */

export interface Food {
  name: string;
  desc: string;
  confirm?: true;
}

const f = (name: string, desc: string, confirm?: true): Food => (confirm ? { name, desc, confirm } : { name, desc });

export const FOODS: Readonly<Record<string, readonly Food[]>> = {
  AP: [
    f('Pulihora', 'Tamarind-seasoned rice.'),
    f('Pesarattu', 'Green-gram dosa.'),
    f('Gutti Vankaya Kura', 'Stuffed brinjal curry.'),
    f('Pootharekulu', 'Thin layered rice-paper sweet associated with Atreyapuram.'),
    f('Bobbatlu / Bakshalu', 'Sweet lentil-and-jaggery stuffed flatbread.'),
  ],
  AR: [
    f('Khura', 'Traditional buckwheat pancake, especially associated with Monpa cuisine.'),
    f('Thukpa', 'Vegetable noodle soup; recipes vary.', true),
    f('Chura Sabji', 'Flattened-rice and vegetable preparation.'),
    f('Vegetable bamboo-shoot curry', 'Local bamboo shoots cooked with vegetables.'),
    f('Pika Pila pickle', 'Pickle styles vary; a meat-free recipe is being confirmed.', true),
  ],
  AS: [
    f('Aloo Pitika', 'Mashed potato with mustard oil, chilli and onion.'),
    f('Til Pitha', 'Rice-flour roll filled with sesame and jaggery.'),
    f('Ghila Pitha', 'Traditional fried rice-flour snack, especially during Bihu.'),
    f('Ou Tenga Dal', 'Tangy lentil dish with elephant apple.'),
    f('Khar', 'Traditional alkaline preparation; vegetable versions exist.', true),
  ],
  BR: [
    f('Litti Chokha', 'Roasted wheat balls filled with sattu, served with mashed vegetables.'),
    f('Dal Pitha / Dal Pithi', 'Rice-flour dumplings filled with spiced lentil paste.'),
    f('Silao Khaja', 'Layered crisp sweet associated with Silao, Nalanda.'),
    f('Gaya Tilkut', 'Sesame-based winter sweet associated with Gaya.'),
    f('Thekua / Khajuria', 'Jaggery-sweetened snack associated with Chhath.'),
    f('Belgrami', 'Traditional sweet associated with Udwantnagar in Bhojpur district.'),
    f('Laung-Latika', 'Folded khoya-filled sweet sealed with a clove, associated with Bihar cuisine.'),
  ],
  CG: [
    f('Chila', 'Savory pancake made from rice or lentil batter.'),
    f('Faraa', 'Steamed rice-flour dumplings.'),
    f('Bafauri', 'Steamed chana-dal snack.'),
    f('Angakar Roti', 'Traditional thick rice-flour flatbread.'),
    f('Dubki Kadi', 'Regional kadhi preparation.'),
  ],
  GA: [
    f('Khatkhate', 'Mixed-vegetable and coconut-based stew.'),
    f('Patoleo', 'Rice and coconut-jaggery filling steamed in turmeric leaves.'),
    f('Dodol', 'Coconut-jaggery sweet.'),
    f('Vegetable Caldin', 'Mild coconut-based vegetable curry.'),
    f('Vegetable Xacuti', 'Vegetarian version of roasted-spice coconut curry.'),
  ],
  GJ: [
    f('Dhokla', 'Steamed fermented gram-flour snack.'),
    f('Khandvi', 'Thin gram-flour rolls with tempering.'),
    f('Thepla', 'Spiced flatbread, often made with fenugreek.'),
    f('Undhiyu', 'Mixed winter vegetables cooked with spices.'),
    f('Handvo', 'Savory lentil-rice cake.'),
  ],
  HR: [
    f('Bajra Khichdi', 'Pearl-millet and lentil one-pot dish.'),
    f('Bajra Roti', 'Pearl-millet flatbread.'),
    f('Kachri ki Sabzi', 'Tangy wild-cucumber vegetable preparation.'),
    f('Bathua Raita', 'Yogurt with bathua greens.'),
    f('Churma', 'Sweetened crumbled wheat or millet bread.'),
  ],
  HP: [
    f('Siddu', 'Steamed wheat bread, often served with ghee.'),
    f('Madra', 'Yogurt-based chickpea or kidney-bean preparation.'),
    f('Dham', 'Festive meal featuring rice, dal, madra and other dishes.', true),
    f('Babru', 'Fried bread often filled with black-gram paste.'),
    f('Aktori', 'Buckwheat-based pancake.'),
  ],
  JH: [
    f('Dhuska', 'Fried rice-and-lentil batter snack.'),
    f('Chilka Roti', 'Rice-and-lentil crepe or flatbread.'),
    f('Rugra', 'Seasonal wild mushroom delicacy.'),
    f('Thekua', 'Jaggery-sweetened fried snack.'),
    f('Marua Roti', 'Finger-millet flatbread.'),
  ],
  KA: [
    f('Bisi Bele Bath', 'Rice, lentils and vegetables with a spice blend.'),
    f('Ragi Mudde', 'Finger-millet balls, usually served with saaru.'),
    f('Mysore Masala Dosa', 'Dosa with spiced potato filling.'),
    f('Maddur Vada', 'Crisp onion-and-semolina snack associated with Maddur.'),
    f('Dharwad Peda', 'Milk sweet associated with Dharwad.'),
  ],
  KL: [
    f('Sadya', 'Traditional vegetarian feast served on a banana leaf.'),
    f('Avial', 'Mixed vegetables with coconut.'),
    f('Puttu and Kadala Curry', 'Steamed rice-coconut cylinders with black chickpea curry.'),
    f('Appam with Vegetable Stew', 'Fermented rice pancake with coconut-milk vegetable stew.'),
    f('Palada Payasam', 'Milk dessert with rice ada.'),
  ],
  MP: [
    f('Poha-Jalebi', 'Popular breakfast associated with Indore.'),
    f('Bhutte ka Kees', 'Grated corn cooked with milk and spices.'),
    f('Dal Bafla', 'Wheat dough balls served with dal and ghee.'),
    f('Sabudana Khichdi', 'Tapioca pearls with peanuts and potatoes.'),
    f('Mawa Bati', 'Rich khoya-based sweet.'),
  ],
  MH: [
    f('Puran Poli', 'Sweet lentil-stuffed flatbread.'),
    f('Misal Pav', 'Spiced sprout curry topped with farsan.', true),
    f('Vada Pav', 'Potato fritter in a bun with chutneys.'),
    f('Thalipeeth', 'Multigrain savory flatbread.'),
    f('Modak', 'Sweet dumpling associated with Ganesh Chaturthi.'),
  ],
  MN: [
    f('Kangshoi / Chamthong', 'Light vegetable stew.'),
    f('Eromba', 'Mashed vegetables and chilli; a fish-free recipe is being confirmed.', true),
    f('Chak-hao Kheer', 'Milk dessert made with aromatic black rice.'),
    f('Kabok', 'Puffed rice and jaggery snack.'),
    f('Paknam', 'Steamed savoury cake; a recipe without fish is being confirmed.', true),
  ],
  ML: [
    f('Pumaloi', 'Steamed powdered-rice dish.'),
    f('Pukhlein', 'Fried rice-flour and jaggery snack.'),
    f('Vegetable Tungrymbai', 'Fermented soybean preparation; a version without meat is being confirmed.', true),
    f('Vegetable Momos', 'Dumplings filled with vegetables.'),
    f('Pudoh', 'Steamed rice preparation; a meat-free recipe is being confirmed.', true),
  ],
  MZ: [
    f('Bai', 'Vegetable stew with local greens; recipes vary.'),
    f('Sawhchiar', 'Rice-and-vegetable porridge; a meat-free version is being confirmed.', true),
    f('Chhangban', 'Traditional steamed rice cake.'),
    f('Koat Pitha', 'Banana-and-rice-flour fritter.'),
    f('Bamboo-shoot vegetable curry', 'Bamboo shoots cooked with local vegetables.'),
  ],
  NL: [
    f('Galho', 'Rice porridge with vegetables and greens; a meat-free version is being confirmed.', true),
    f('Axone with vegetables', 'Fermented soybean preparation cooked with vegetables; a version without meat or fish is being confirmed.', true),
    f('Anishi with vegetables', 'Fermented leaf preparation; ingredients are being confirmed.', true),
    f('Sticky rice', 'Traditional rice staple.'),
    f('Bamboo-shoot vegetable curry', 'Bamboo shoots cooked with vegetables.'),
  ],
  OD: [
    f('Dalma', 'Lentils cooked with vegetables and traditional spices.'),
    f('Pakhala Bhata', 'Water-fermented rice, served with vegetable sides.'),
    f('Chhena Poda', 'Baked cheese dessert associated with Odisha.'),
    f('Santula', 'Light mixed-vegetable preparation.'),
    f('Puri Khaja', 'Layered crisp sweet associated with Puri.'),
  ],
  PB: [
    f('Makki di Roti and Sarson da Saag', 'Corn flatbread with mustard greens.'),
    f('Amritsari Kulcha', 'Stuffed flatbread served with chole.', true),
    f('Punjabi Chole', 'Spiced chickpea curry.'),
    f('Pinni', 'Winter sweet made with flour, ghee and nuts.'),
    f('Kadhi Pakora', 'Yogurt-and-gram-flour curry with pakoras.'),
  ],
  RJ: [
    f('Dal Baati Churma', 'Lentils, baked wheat balls and sweet crumbled wheat.'),
    f('Gatte ki Sabzi', 'Gram-flour dumplings in spiced yogurt gravy.'),
    f('Ker Sangri', 'Desert beans and berries cooked with spices.'),
    f('Pyaaz Kachori', 'Onion-stuffed fried pastry.'),
    f('Ghewar', 'Traditional festive sweet.'),
  ],
  SK: [
    f('Vegetable Momos', 'Steamed dumplings with vegetable filling.'),
    f('Vegetarian Thukpa', 'Noodle soup with vegetables.'),
    f('Gundruk Soup', 'Soup made with fermented leafy greens.'),
    f('Sinki Soup', 'Soup or preparation using fermented radish root.'),
    f('Sel Roti', 'Ring-shaped rice bread shared across Himalayan communities.'),
  ],
  TN: [
    f('Ven Pongal', 'Rice and moong dal cooked with pepper, cumin and ghee.'),
    f('Idli and Sambar', 'Steamed rice-lentil cakes with lentil-vegetable stew.'),
    f('Kuzhi Paniyaram', 'Fermented-batter dumplings.'),
    f('Kootu', 'Vegetable-and-lentil preparation.'),
    f('Paal Payasam', 'Milk-and-rice dessert.'),
  ],
  TS: [
    f('Sarva Pindi', 'Savory rice-flour pancake with peanuts and spices.'),
    f('Sakinalu', 'Crisp rice-flour festival snack.'),
    f('Pachi Pulusu', 'Tangy tamarind-based preparation.'),
    f('Mirchi ka Salan', 'Chilli curry with peanut-sesame gravy.', true),
    f('Vegetable Biryani', 'Rice cooked with vegetables and spices.'),
  ],
  TR: [
    f('Awan Bangwi', 'Traditional rice cake cooked in leaf wrapping.'),
    f('Mosdeng Serma', 'Tomato-and-chilli chutney; a recipe without fermented fish is being confirmed.', true),
    f('Chakhwi', 'Traditional vegetable preparation; recipes vary.', true),
    f('Vegetable Gudok', 'Local vegetable stew or mash; a meat- and fish-free version is being confirmed.', true),
    f('Mui Borok-style vegetable dishes', 'Traditional Tripuri cooking includes local greens and vegetables.'),
  ],
  UP: [
    f('Banarasi Tamatar Chaat', 'Tangy tomato street food associated with Varanasi.'),
    f('Bedmi Puri with Aloo Sabzi', 'Spiced lentil-flour puri with potato curry.'),
    f('Mathura Peda', 'Milk sweet associated with Mathura.'),
    f('Agra Petha', 'Ash-gourd sweet associated with Agra.'),
    f('Tehri', 'Rice cooked with vegetables and spices.'),
  ],
  UK: [
    f('Kafuli', 'Green-leaf curry, often made with spinach and fenugreek.'),
    f('Chainsoo', 'Roasted black-gram dal preparation.'),
    f('Aloo ke Gutke', 'Spiced pahadi potato preparation.'),
    f('Jhangora ki Kheer', 'Barnyard-millet pudding.'),
    f('Singal / Singhal', 'Traditional sweet spiral snack.'),
  ],
  WB: [
    f('Shukto', 'Mild bitter-sweet mixed-vegetable preparation.'),
    f('Aloo Posto', 'Potatoes cooked with poppy-seed paste.'),
    f('Luchi and Alur Dom', 'Fried flatbread with spiced potato curry.'),
    f('Shorshe Phulkopi', 'Cauliflower in mustard gravy.'),
    f('Joynagarer Moa', 'Puffed-millet and date-palm-jaggery sweet associated with Joynagar.'),
  ],
};

export const foodsFor = (code: string): readonly Food[] => FOODS[code] ?? [];
export const foodCount = (code: string) => foodsFor(code).length;
