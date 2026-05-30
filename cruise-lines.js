// CRUISE PARTNERS
// SmartFlyer / Virtuoso preferred-partner cruise lines.
// Used by the matchmaker quiz on /cruises to surface specific
// brand recommendations once the user picks their style.
//
// Schema:
//   key         — slug (used in quiz routing + URLs)
//   name        — display name
//   type        — primary style this fits: river / ocean / expedition / charter / yacht-style
//   tagline     — short positioning line
//   perks       — short string of advisor-booked perks (client-facing, plain language)
//   passengers  — approximate capacity
//   priceFrom   — "$X per person per night/day" or similar
//   image       — hero image path
//   feeling     — quiz-result tone descriptor
const CRUISE_LINES = {

  // ─── YACHT-STYLE / HOTEL-BRAND ──────────────────────────────────────
  'orient-express-sailing-yachts': {
    name: 'Orient Express Sailing Yachts',
    type: 'yacht-style',
    tagline: 'The world\'s largest sailing yacht — Orient Express Corinthian. Redefines luxury at sea.',
    perks: '250 EUR onboard credit per person.',
    passengers: '110 guests · only 54 suites',
    crewRatio: '1 staff : 1.6 guests',
    priceFrom: '$2,000–$4,000 per person, per night',
    image: '/cruise-images/orient-express/01-yacht-club-lounge.jpg',
    region: ['Mediterranean', 'Caribbean'],
    affiliations: ['Virtuoso'],
    feeling: 'Legendary heritage reimagined for the sea — for travelers who love romance, ritual, and craftsmanship.'
  },

  'four-seasons-yachts': {
    name: 'Four Seasons Yachts',
    type: 'yacht-style',
    tagline: 'Four Seasons hospitality, reimagined at sea',
    perks: '$600+ onboard credit.',
    passengers: 'Only 95 suites · 222 guests onboard',
    crewRatio: 'Approx. 1:1',
    priceFrom: '$1,800 per person, per night',
    image: '/cruise-images/four-seasons-yachts/01-main-pool.jpg',
    region: ['Mediterranean', 'Caribbean', 'Worldwide'],
    affiliations: ['Virtuoso', 'Four Seasons Preferred Partner'],
    feeling: 'If you book Four Seasons hotels — this is your floating equivalent. Same service DNA.'
  },

  'ritz-carlton-yacht-collection': {
    name: 'Ritz-Carlton Yacht Collection',
    type: 'yacht-style',
    tagline: 'Three intimate yachts — Evrima, Ilma, and Luminara',
    perks: 'Complimentary dinner for two at the specialty restaurant, extra onboard credit, exclusive suite-upgrade rates + Marriott Bonvoy status alignment.',
    passengers: '298–456 guests',
    crewRatio: 'Approx. 1:1.4',
    priceFrom: '$6,000 per person for 7-night voyages',
    image: '/cruise-images/ritz-carlton-yacht/01-pitons-st-lucia.jpg',
    region: ['Caribbean', 'Mediterranean', 'Northern Europe', 'Asia'],
    affiliations: ['Virtuoso', 'Marriott STARS'],
    feeling: 'Ritz-Carlton service polish, yacht-scale intimacy. For travelers who want big-name reliability without big-ship feel.'
  },

  // ─── RIVER / BARGE ──────────────────────────────────────────────────
  'belmond-afloat-in-france': {
    name: 'Belmond — Afloat in France',
    type: 'river',
    tagline: 'Hand-crafted barge journeys through Burgundy, Champagne, Canal du Midi, Camargue & Provence',
    perks: 'Belmond Bellini Club benefits · pre-arrival concierge to customize each day\'s itinerary, regional excursions, and onboard menus.',
    passengers: '4–12 guests per barge · 7-barge fleet',
    crewRatio: 'Near 1:1 — private-staff feel',
    priceFrom: 'Charter pricing varies by barge + region (contact for rates)',
    image: '/cruise-images/belmond-afloat-in-france/01-canal-lilas.jpg',
    region: ['Burgundy', 'Champagne', 'Canal du Midi', 'Camargue', 'Provence'],
    affiliations: ['Virtuoso', 'Belmond Bellini Club'],
    feeling: 'Slow-luxury countryside cruising — your own private château on water. Six unhurried days of regional wine, chef-prepared meals, and the French countryside at five kilometres an hour.'
  },

  'riverside-luxury-cruises': {
    name: 'Riverside Luxury Cruises',
    type: 'river',
    tagline: 'Boutique river cruising through Europe — Danube, Rhine, Rhône, Saône',
    perks: '75 EUR onboard credit per guest.',
    passengers: '160 guests',
    crewRatio: 'High staff-to-guest ratio',
    priceFrom: '$5,000 per person for a 7-night sailing',
    image: '/cruise-images/riverside-luxury-cruises/01-mozart-iron-gate.jpg',
    region: ['Danube', 'Rhine', 'Rhône', 'Bordeaux'],
    affiliations: ['Virtuoso'],
    feeling: 'European river cruising at the polish of a small luxury hotel. For travelers who want true rivers — Danube, Rhine, Douro — done at boutique scale.'
  },

  // ─── EXPEDITION ─────────────────────────────────────────────────────
  'aqua-expeditions': {
    name: 'Aqua Expeditions',
    type: 'expedition',
    tagline: 'Small-ship adventures — Amazon, Mekong, Galápagos, Raja Ampat',
    perks: '$100 USD onboard credit per adult guest.',
    passengers: '16–40 guests',
    crewRatio: '1:1',
    priceFrom: '$1,200 per person, per day',
    image: '/cruise-images/aqua-expeditions/01-aria-amazon.jpg',
    region: ['Amazon', 'Mekong', 'Galápagos', 'Indonesia', 'Seychelles'],
    affiliations: ['Virtuoso', 'Signature', 'USTOA AECO', 'Ensemble'],
    feeling: 'AMAN-meets-Belmond at sea, in the world\'s wildest places. For travelers who want National Geographic energy with five-star comfort.'
  },

  // ─── OCEAN ──────────────────────────────────────────────────────────
  'explora-journeys': {
    name: 'Explora Journeys',
    type: 'ocean',
    tagline: 'Cosmopolitan boutique luxury hotel — at sea',
    perks: '$100+ onboard credit.',
    passengers: '800 guests',
    crewRatio: 'Cosmopolitan / casual-luxe',
    priceFrom: '$5,000 per person for a 7-night journey',
    image: '/cruise-images/explora-journeys/01-amalfi-coast.jpg',
    region: ['Caribbean', 'Mediterranean', 'Americas', 'Worldwide'],
    affiliations: ['Virtuoso'],
    feeling: 'Mandarin-Oriental or One&Only on water. Younger demographic, well-traveled, casual-luxe vibe.'
  },

  // ─── add more cruise lines here as Wilson adds partners ──
};

// Quiz routing — given a style, return ranked cruise line recommendations
const CRUISE_LINES_BY_STYLE = {
  'yacht-style':   ['orient-express-sailing-yachts', 'four-seasons-yachts', 'ritz-carlton-yacht-collection'],
  'expedition':    ['aqua-expeditions'],
  'ocean':         ['explora-journeys', 'ritz-carlton-yacht-collection'],
  'river':         ['belmond-afloat-in-france', 'riverside-luxury-cruises'],
  'charter':       []  // populate when charter partners added
};
