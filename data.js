/**
 * Wander by Wilson — shared atlas + property data.
 * Loaded by index.html (the globe) and property.html (per-property pages).
 *
 * - ATLAS_POINTS: every property on the globe (slug, coordinates, basic label).
 * - PROPERTIES:   the full content for a property's landing page (hero, copy, perks, booking URL).
 *
 * When a property is on the globe but not yet in PROPERTIES, property.html renders
 * a branded interim page using the ATLAS_POINTS row + an "in progress" CTA.
 */

/* ---------- slug helper ------------------------------------------------- */
function slugify(s) {
    return s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/&amp;/g, ' and ')
        .replace(/&rsquo;|&lsquo;|&apos;|&quot;/g, '')
        .replace(/&[a-z]+;/gi, '')
        .replace(/[‘’]/g, '')
        .replace(/[—–]/g, '-')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

/* ---------- ATLAS_POINTS ------------------------------------------------ */
const ATLAS_POINTS = [
    // Smartflyer Top Booked 2025 (curated subset)
    { city: 'Amalfi Coast',      country: 'Italy',           hotel: 'Borgo Santandrea',                               lat:  40.612, lng:   14.568, slug: 'borgo-santandrea', live: true, url: 'https://www.virtuoso.com/advisor/wilsschu27955/hotels/16354916/borgo-santandrea?search=%22amalfi%20coast%22&mode=Gts' },
    { city: 'Anguilla',          country: 'Caribbean',       hotel: 'Cap Juluca, A Belmond Hotel',                    lat:  18.174, lng:  -63.143, slug: 'cap-juluca' },
    { city: 'Paris',             country: 'France',          hotel: 'Cheval Blanc Paris',                             lat:  48.860, lng:    2.345, live: true },
    { city: 'London',            country: 'United Kingdom',  hotel: "Claridge’s",                                lat:  51.512, lng:   -0.147, live: true },
    { city: 'Turks &amp; Caicos', country: 'Caribbean',      hotel: 'COMO Parrot Cay',                                lat:  21.895, lng:  -71.795 },
    { city: 'St. Barths',        country: 'Caribbean',       hotel: 'Eden Rock — St Barths',                     lat:  17.899, lng:  -62.833, live: true },
    { city: 'Peninsula Papagayo', country: 'Costa Rica',     hotel: 'Four Seasons Resort Costa Rica',                 lat:  10.620, lng:  -85.688 },
    { city: 'Antibes',           country: 'France',          hotel: 'Hotel du Cap-Eden-Roc',                          lat:  43.555, lng:    7.124 },
    { city: 'Antigua',           country: 'Caribbean',       hotel: 'Jumby Bay Island',                               lat:  17.141, lng:  -61.764 },
    { city: 'Kona',              country: 'Hawaiʻi',    hotel: 'Kona Village, A Rosewood Resort',                lat:  19.832, lng: -155.989, live: true },
    { city: 'Aspen',             country: 'Colorado',        hotel: 'The Little Nell',                                lat:  39.187, lng: -106.820 },
    { city: 'San José del Cabo', country: 'Mexico',     hotel: 'Las Ventanas al Paraíso, A Rosewood Resort', lat: 23.015, lng: -109.700, live: true },
    { city: 'Marbella',          country: 'Spain',           hotel: 'Marbella Club Hotel',                            lat:  36.491, lng:   -4.942 },
    { city: 'Nassau',            country: 'Bahamas',         hotel: 'Rosewood Baha Mar',                              lat:  25.067, lng:  -77.473 },
    { city: 'Virgin Gorda',      country: 'BVI',             hotel: 'Rosewood Little Dix Bay',                        lat:  18.493, lng:  -64.415, live: true },
    // Wilson's additions
    { city: 'Bangkok',           country: 'Thailand',        hotel: 'Capella Bangkok',                                lat:  13.720, lng:  100.509 },
    { city: 'Dubai',             country: 'UAE',             hotel: 'Atlantis The Royal',                             lat:  25.131, lng:   55.117 },
    { city: 'Singapore',         country: 'Singapore',       hotel: 'Raffles Singapore',                              lat:   1.294, lng:  103.854 },
    { city: 'Riviera Maya',      country: 'Mexico',          hotel: 'Maroma, A Belmond Hotel',                        lat:  20.705, lng:  -86.975 },
    { city: 'Marrakech',         country: 'Morocco',         hotel: 'Royal Mansour Marrakech',                        lat:  31.625, lng:   -8.009, live: true },
    { city: 'Tokyo',             country: 'Japan',           hotel: 'Bulgari Hotel Tokyo',                            lat:  35.682, lng:  139.767 },
    { city: 'Baa Atoll',         country: 'Maldives',        hotel: 'Soneva Fushi',                                   lat:   5.128, lng:   73.067, live: true },
    { city: 'Porto Ercole',      country: 'Italy',           hotel: 'Hotel Il Pellicano',                             lat:  42.399, lng:   11.210, live: true },
    { city: 'Riviera Nayarit',   country: 'Mexico',          hotel: 'One&amp;Only Mandarina',                         lat:  21.083, lng: -105.450, live: true },
    { city: 'Oxfordshire',       country: 'United Kingdom',  hotel: 'Estelle Manor',                                  lat:  51.773, lng:   -1.404 },
    // Additional U.S. luxury properties
    { city: 'Canyon Point',      country: 'Utah',            hotel: 'Amangiri',                                       lat:  37.015, lng: -111.471, live: true },
    { city: 'Big Sky',           country: 'Montana',         hotel: 'One&amp;Only Moonlight Basin',                   lat:  45.305, lng: -111.443 },
    { city: 'Wanship',           country: 'Utah',            hotel: 'The Lodge at Blue Sky',                          lat:  40.835, lng: -111.420 },
    { city: 'Montecito',         country: 'California',      hotel: 'Rosewood Miramar Beach',                         lat:  34.420, lng: -119.619 },
    { city: 'Napa Valley',       country: 'California',      hotel: 'Auberge du Soleil',                              lat:  38.479, lng: -122.385 },
    { city: 'Sea Island',        country: 'Georgia',         hotel: 'The Cloister at Sea Island',                     lat:  31.196, lng:  -81.340 },
    // Africa, Madagascar, Seychelles & South America
    { city: 'Thornybush',        country: 'South Africa',    hotel: 'Royal Malewane',                                 lat: -24.450, lng:   31.180, live: true },
    { city: 'Franschhoek',       country: 'South Africa',    hotel: 'La Residence',                                   lat: -33.915, lng:   19.133 },
    { city: 'Chobe',             country: 'Botswana',        hotel: 'Belmond Savute Elephant Lodge',                  lat: -18.533, lng:   24.150 },
    { city: 'Nosy Ankao',        country: 'Madagascar',      hotel: 'Time + Tide Miavana',                            lat: -12.783, lng:   49.700, live: true },
    { city: 'Volcanoes Park',    country: 'Rwanda',          hotel: "One&amp;Only Gorilla’s Nest",               lat:  -1.453, lng:   29.577 },
    { city: 'Mahé',         country: 'Seychelles',      hotel: 'Cheval Blanc Seychelles',                        lat:  -4.682, lng:   55.491 },
    { city: 'Makgadikgadi',      country: 'Botswana',        hotel: "Jack's Camp",                                    lat: -20.783, lng:   25.050 },
    { city: 'Serengeti',         country: 'Tanzania',        hotel: 'Four Seasons Safari Lodge Serengeti',            lat:  -2.581, lng:   34.855 },
    { city: 'Torres del Paine',  country: 'Chile',           hotel: 'Awasi Patagonia',                                lat: -51.083, lng:  -72.900, live: true },
    { city: 'Machu Picchu',      country: 'Peru',            hotel: 'Belmond Hiram Bingham',                          lat: -13.163, lng:  -72.545, live: true },
    // Indonesia
    { city: 'Sumba Island',      country: 'Indonesia',       hotel: 'Nihi Sumba',                                     lat:  -9.770, lng:  119.050 },
    { city: 'Ubud, Bali',        country: 'Indonesia',       hotel: 'COMO Shambhala Estate',                          lat:  -8.444, lng:  115.244, slug: 'como-shambhala-estate', live: true },
    // Australia, New Zealand & South Pacific
    { city: 'Hamilton Island',   country: 'Australia',       hotel: 'qualia',                                         lat: -20.352, lng:  148.954 },
    { city: 'Kangaroo Island',   country: 'Australia',       hotel: 'Southern Ocean Lodge',                           lat: -35.970, lng:  137.117, live: true },
    { city: 'Uluru',             country: 'Australia',       hotel: 'Longitude 131°',                            lat: -25.241, lng:  130.972 },
    { city: "Hawke's Bay",       country: 'New Zealand',     hotel: 'Rosewood Cape Kidnappers',                       lat: -39.631, lng:  176.981 },
    { city: 'Kadavu',            country: 'Fiji',            hotel: 'Kokomo Private Island Fiji',                     lat: -19.050, lng:  178.450, live: true },
    { city: 'Bora Bora',         country: 'French Polynesia', hotel: 'Four Seasons Resort Bora Bora',                  lat: -16.497, lng: -151.738 },
    // Batch 2 additions (2026-05-14)
    { city: 'Oia, Santorini',    country: 'Greece',          hotel: 'Canaves Ena',                                    lat:  36.461, lng:   25.376, slug: 'canaves-ena', live: true },
    { city: 'County Limerick',   country: 'Ireland',         hotel: 'Adare Manor',                                    lat:  52.563, lng:   -8.789, slug: 'adare-manor', live: true },
    { city: 'Xpu-Ha',            country: 'Mexico',          hotel: 'Hotel Esencia',                                  lat:  20.497, lng:  -87.252, slug: 'hotel-esencia', live: true },
    // Batch 3 additions (2026-05-14)
    { city: 'Peninsula Papagayo', country: 'Costa Rica',     hotel: 'Nekajui, A Ritz-Carlton Reserve',                lat:  10.628, lng:  -85.685, slug: 'nekajui', live: true },
    { city: 'Fljót Valley',     country: 'Iceland',         hotel: 'Deplar Farm',                                    lat:  65.945, lng:  -19.075, slug: 'deplar-farm', live: true },
    { city: 'Cala Blava',        country: 'Spain',           hotel: 'Cap Rocat',                                      lat:  39.488, lng:    2.747, slug: 'cap-rocat', live: true },
    { city: 'Lamego',            country: 'Portugal',        hotel: 'Six Senses Douro Valley',                        lat:  41.105, lng:   -7.820, slug: 'six-senses-douro-valley', live: true }
];

/* Auto-generate slug for any entry without an explicit one */
ATLAS_POINTS.forEach(p => { if (!p.slug) p.slug = slugify(p.hotel); });

/* ---------- PROPERTIES (per-slug landing-page content) ------------------ */
const PROPERTIES = {
    'borgo-santandrea': {
        name: 'Borgo Santandrea',
        location: 'Amalfi Coast, Italy',
        rateFrom: '€850 / night',
        heroImage: '/property-images/borgo-santandrea/02-aerial-coastal.jpg',
        description: "Borgo Santandrea is an award-winning hotel on Italy's Amalfi Coast, embodying a captivating blend of Italian elegance, local charm, and breathtaking natural beauty. Here, mid-century design meets Mediterranean style in perfect harmony. Indulge in culinary delights at the three restaurants, relax by the panoramic pool surrounded by terraced gardens, or retreat to the peaceful fitness and wellness area for a rejuvenating escape. For a real treat, the hotel's exclusive private beach club, Marinella, is a truly unique haven on the rocky Amalfi Coast.",
        perks: [
            'Upgrade on arrival, subject to availability',
            'Daily breakfast for up to two guests per bedroom, served in the restaurant',
            '$100 USD equivalent Food &amp; Beverage credit to be utilized during stay',
            'Early check-in / late check-out, subject to availability',
            'Complimentary Wi-Fi'
        ],
        gallery: [
            '/property-images/borgo-santandrea/04-pool-terrace.png',
            '/property-images/borgo-santandrea/01-premium-pool-suite.jpg',
            '/property-images/borgo-santandrea/03-beach-club-marinella.jpg',
            '/property-images/borgo-santandrea/05-plumbago-bar.jpg',
            '/property-images/borgo-santandrea/00-suite-801-original.webp'
        ],
        idealFor: "Honeymooners, design devotees, and seasoned Italy travelers who&rsquo;d skip the Positano fanfare for somewhere quieter and more considered.",
        agentTip: "Embark on a boat tour of the Amalfi Coast, departing directly from the hotel's dock aboard the luxury Pardo boat &mdash; experience the beauty of the coast while enjoying the essence of seaside living.",
        bookingUrl: 'https://www.virtuoso.com/advisor/wilsschu27955/hotels/16354916/borgo-santandrea?search=%22amalfi%20coast%22&mode=Gts'
    },

    'cheval-blanc-paris': {
        name: 'Cheval Blanc Paris',
        location: 'Paris, France',
        rateFrom: '€1,800 / night',
        heroImage: '/property-images/cheval-blanc-paris/00-hero.jpg',
        description: "Cheval Blanc Paris is an intimate 72-room hideaway designed by Peter Marino, where contemporary refinement meets understated Parisian elegance inside the landmark Samaritaine. Facing the Seine within steps of the Louvre and Notre-Dame, the hotel hosts a three-Michelin-starred restaurant by Arnaud Donckele, the Dior Spa Cheval Blanc, and an artisan-mosaic infinity pool. Bespoke service, family-friendly Dior touches, and an exceptional culinary line-up make it a quietly bold base for honeymooners, families, and Paris devotees.",
        perks: [
            'Complimentary two-way private transfer with airport meet &amp; greet service upon arrival',
            'Cheval Blanc Paris signature breakfast for each guest',
            'Upgrade to the next category, subject to availability',
            'Early check-in / late check-out, subject to availability',
            'Complimentary soft drinks from the in-room private bar',
            'Complimentary access to the Dior Spa Cheval Blanc Paris',
            'Courtesy car access, upon availability'
        ],
        gallery: [
            '/property-images/cheval-blanc-paris/01-pool-gym.jpg',
            '/property-images/cheval-blanc-paris/02-spa.jpg',
            '/property-images/cheval-blanc-paris/03-restaurant-bar.jpg'
        ],
        idealFor: "Honeymooners, design devotees, and Paris regulars who want the city through a quieter, more curated lens &mdash; Dior touches without the spectacle of the grandes dames.",
        bookingUrl: 'https://www.virtuoso.com/advisor/wilsschu27955/hotels/15873984/cheval-blanc-paris'
    },

    'hotel-il-pellicano': {
        name: 'Hotel Il Pellicano',
        location: 'Porto Ercole, Italy',
        rateFrom: '€690 / night',
        heroImage: '/property-images/hotel-il-pellicano/00-hero.jpg',
        description: "Hotel Il Pellicano spills down Monte Argentario into a cove of rare Tyrrhenian beauty, a sun-drenched hideaway opened in 1965 and immortalized by Slim Aarons&rsquo; poolside frames. Terraced gardens of centuries-old olive trees lead to a heated seawater pool perched on the cliffs and a private rocky beach below. Inside, refined Tuscan suites, a Michelin-starred dining room, the Pelligrill, and the Pelliclub wellness suite keep the dolce-vita spirit alive each season from April through October.",
        perks: [
            'Upgrade on arrival, subject to availability',
            'Daily breakfast for up to two guests per bedroom',
            '$100 USD equivalent Food &amp; Beverage credit, applied during stay',
            'Early check-in / late check-out, subject to availability',
            'Complimentary Wi-Fi'
        ],
        gallery: [
            '/property-images/hotel-il-pellicano/01-pool.jpg',
            '/property-images/hotel-il-pellicano/02-restaurant-view.jpg',
            '/property-images/hotel-il-pellicano/03-executive-suite-view.jpg',
            '/property-images/hotel-il-pellicano/04-location.jpg',
            '/property-images/hotel-il-pellicano/05-tuscan-home.jpg'
        ],
        idealFor: "Slim Aarons aesthetes, couples seeking a slower Italian summer, and well-traveled Italy regulars who&rsquo;d trade Capri&rsquo;s crowds for Tuscany&rsquo;s quiet.",
        agentTip: "Book one of the Deluxe Suites overlooking the Tyrrhenian Sea and relax on your private grand terrace.",
        bookingUrl: 'https://www.virtuoso.com/advisor/wilsschu27955/hotels/6164066/hotel-il-pellicano'
    },

    'eden-rock-st-barths': {
        name: 'Eden Rock &mdash; St Barths',
        location: 'St Barths, French West Indies',
        rateFrom: '€1,850 / night',
        heroImage: '/property-images/eden-rock-st-barths/00-hero.jpg',
        description: "Eden Rock occupies one of the Caribbean&rsquo;s most photographed perches, a granite outcrop wedged between two crescents of white-sand beach on St Jean Bay. Part of the Oetker Collection and freshly reimagined in 2019, its art-filled rooms, villas, and suites mix island ease with effortless French style. Days drift between the beach restaurant, the Sand Bar&rsquo;s barefoot lunches, and an enviable contemporary art collection scattered across the property.",
        perks: [
            'One category room upgrade guaranteed at time of booking, based on availability',
            'Access to best room in the category',
            'Complimentary roundtrip private airport transfers',
            'American breakfast daily for up to two in-room guests, served in restaurant',
            'Complimentary Eden Rock Beach Set, per room, including a branded beach bag and flip flops',
            'Early check-in / late check-out, subject to availability',
            'Complimentary Wi-Fi'
        ],
        gallery: [
            '/property-images/eden-rock-st-barths/01-aerial-view.jpg',
            '/property-images/eden-rock-st-barths/02-beach.jpg',
            '/property-images/eden-rock-st-barths/03-beach-bar.jpg',
            '/property-images/eden-rock-st-barths/04-premium-suite-fregate.jpg',
            '/property-images/eden-rock-st-barths/05-christopher-columbus-suite.jpg'
        ],
        idealFor: "Honeymooners, contemporary-art enthusiasts, and Caribbean regulars who want St Barths at its most quietly stylish.",
        agentTip: "Discover the surprising art collection throughout the hotel and inside your very unique room.",
        bookingUrl: 'https://www.virtuoso.com/advisor/wilsschu27955/hotels/6164191/eden-rock-st-barths-oetker-collection'
    },

    'amangiri': {
        name: 'Amangiri',
        location: 'Canyon Point, Utah',
        rateFrom: '$4,170 / night',
        heroImage: '/property-images/amangiri/00-hero.jpg',
        brandBadge: '/logos/aman.png',
        brandBadgeAlt: 'Aman',
        description: "Amangiri rises from 900 acres of the Colorado Plateau in Utah&rsquo;s Grand Staircase-Escalante region, its understated architecture echoing the red-rock canyons that surround it. The 34 suites and private four-bedroom home open onto private terraces, a sculptural pool curls around an ancient rock formation, and the Aman Spa weaves in Navajo healing traditions. Just minutes away, Camp Sarika&rsquo;s tented pavilions deliver an even more remote desert reverie, with hot-air balloons, slot-canyon hikes, and Via Ferrata climbs at the doorstep.",
        perks: [
            'Upgrade on arrival, subject to availability',
            '$100 resort or hotel credit to be utilized during stay (not combinable, not valid on room rate, alcohol, boutique, and no cash value if not redeemed in full)',
            'Early check-in / late check-out, subject to availability'
        ],
        gallery: [
            '/property-images/amangiri/01-camp-sarika-tent.jpeg',
            '/property-images/amangiri/02-desert-view-suite.jpeg',
            '/property-images/amangiri/03-spa-reflection-pool.jpeg',
            '/property-images/amangiri/04-desert-lounge-dusk.jpeg',
            '/property-images/amangiri/05-main-space.jpg'
        ],
        idealFor: "Architecture pilgrims, wellness travelers, and adventurous couples who want the American Southwest at its most cinematic &mdash; far from the lodge stereotype.",
        agentTip: "Snag a complimentary BMW and head to Horseshoe Bend, a 30-minute drive into Arizona &mdash; or stay on property and climb the Studhorse Via Ferrata.",
        bookingUrl: 'https://www.virtuoso.com/advisor/wilsschu27955/hotels/6164435/amangiri'
    },

    'royal-mansour-marrakech': {
        name: 'Royal Mansour Marrakech',
        location: 'Marrakech, Morocco',
        rateFrom: '€1,500 / night',
        heroImage: '/property-images/royal-mansour-marrakech/00-hero.jpg',
        description: "Royal Mansour Marrakech reimagines a traditional medina across six private hectares, where 53 individually designed riads &mdash; each one to four bedrooms &mdash; sit along terracotta-coloured alleys and gardens. Discreet butler service threads through hidden underground tunnels, and a 2,500-square-metre spa, four signature restaurants, and bespoke wellness programmes anchor the experience. Located in Hivernage near Jamaa El Fna, it pairs imperial Moroccan craftsmanship with contemporary indulgence at every turn.",
        perks: [
            'Upgrade on arrival, subject to availability (up to Premier one bedroom Riad)',
            'Daily full breakfast for up to two guests per bedroom, served in the restaurant and via in-room dining',
            '$100 USD equivalent Food &amp; Beverage credit to be utilized during stay (not combinable, not valid on room rate, no cash value if not redeemed in full)',
            'Early check-in / late check-out, subject to availability',
            'Complimentary roundtrip private airport transfers &amp; Fast track'
        ],
        gallery: [
            '/property-images/royal-mansour-marrakech/01-grand-riad.jpg',
            '/property-images/royal-mansour-marrakech/02-courtyard.jpg',
            '/property-images/royal-mansour-marrakech/03-sesamo.jpg',
            '/property-images/royal-mansour-marrakech/04-lobby.jpg',
            '/property-images/royal-mansour-marrakech/05-spa-pool.jpg'
        ],
        idealFor: "Multi-generational families in their own private riads, couples chasing imperial Moroccan opulence, and first-time Marrakech visitors who want the city decoded from inside the medina walls.",
        agentTip: "The Concierge, who proudly wears the &lsquo;Cl&eacute;s d&rsquo;Or&rsquo; distinction, is available to help make a personalized plan for every guest.",
        bookingUrl: 'https://www.virtuoso.com/advisor/wilsschu27955/hotels/6164512/royal-mansour-marrakech'
    },

    'royal-malewane': {
        name: 'Royal Malewane',
        location: 'Thornybush, South Africa',
        rateFrom: '$3,250 / night',
        rateNote: 'All-inclusive, per person',
        heroImage: '/property-images/royal-malewane/00-hero.webp',
        description: "Royal Malewane sits deep within the Thornybush Private Game Reserve on the western edge of Greater Kruger, a flagship of The Royal Portfolio renowned as the &lsquo;Harvard of the Bush.&rsquo; Its guiding team is widely considered the most qualified in Africa, and Big-Five sightings &mdash; especially leopard &mdash; are exceptional. Across the main lodge and the intimate Farmstead villa, guests retreat to private plunge pools, a Bush Spa, and fireside dinners under a sky thick with stars.",
        perks: [
            'Upgrade on arrival, subject to availability (not applicable to Royal Suites or Africa House)',
            'Daily breakfast for up to two guests per bedroom, served in the restaurant and via in-room dining',
            'Guest&rsquo;s choice of one: $100 gift from The Royal Portfolio OR $100 donation to the philanthropic projects of The Royal Portfolio Foundation',
            'Early check-in / late check-out, subject to availability',
            'Complimentary Wi-Fi'
        ],
        gallery: [
            '/property-images/royal-malewane/01-lion-pride.webp',
            '/property-images/royal-malewane/02-suite.webp',
            '/property-images/royal-malewane/03-main-lodge.webp',
            '/property-images/royal-malewane/04-pool.webp',
            '/property-images/royal-malewane/05-sundowner.webp'
        ],
        idealFor: "First-time safari travelers who want the finest guiding in Africa, photographers chasing leopard, and honeymooners who&rsquo;d trade champagne brunches for fireside dinners under a sky thick with stars.",
        agentTip: "There are only thirteen Professional Field Guides with FGASA Scout status in the world &mdash; and two of those are on the Royal Malewane team.",
        bookingUrl: 'https://www.virtuoso.com/advisor/wilsschu27955/hotels/6164194/royal-malewane'
    },

    'soneva-fushi': {
        name: 'Soneva Fushi',
        location: 'Baa Atoll, Maldives',
        rateFrom: '$1,880 / night',
        heroImage: '/property-images/soneva-fushi/00-hero.webp',
        description: "Soneva Fushi pioneered barefoot luxury in the Maldives, hiding 64 beachfront villas and eight overwater retreats among jungle paths on a private island in the Baa Atoll UNESCO Biosphere Reserve. Fourteen dining venues &mdash; from a tree-top restaurant to the chocolate, ice-cream, and charcuterie parlours &mdash; sit alongside the holistic Soneva Soul wellness centre and a dedicated children&rsquo;s complex, The Den. With personal Barefoot Guardians, an optional all-inclusive plan, and a strong sustainability ethos, it remains the gold standard for families, honeymooners, and wellness travellers.",
        perks: [
            'Upgrade on arrival, subject to availability',
            'Daily breakfast for up to two guests per bedroom (already included in property rates), served in the hotel restaurant',
            '$100 USD equivalent in local currency hotel credit to be utilized during stay (not combinable, no cash value if not redeemed in full)',
            'Early check-in / late check-out, subject to availability',
            'Complimentary Wi-Fi'
        ],
        gallery: [
            '/property-images/soneva-fushi/04-accommodation.webp',
            '/property-images/soneva-fushi/01-pool-gym.webp',
            '/property-images/soneva-fushi/02-spa.webp',
            '/property-images/soneva-fushi/03-restaurant-bar.webp'
        ],
        idealFor: "Families across three generations, honeymooners who want overwater seclusion without the formality, and wellness travelers drawn to Soneva Soul&rsquo;s holistic programmes.",
        agentTip: "Your Barefoot Guardian is available around the clock &mdash; a personal concierge who will help shape your stay from the moment you arrive.",
        bookingUrl: 'https://www.virtuoso.com/advisor/wilsschu27955/hotels/6163719/soneva-fushi'
    },

    'rosewood-little-dix-bay': {
        name: 'Rosewood Little Dix Bay',
        location: 'Virgin Gorda, British Virgin Islands',
        rateFrom: '$900 / night',
        heroImage: '/property-images/rosewood-little-dix-bay/00-hero.jpg',
        brandBadge: '/logos/rosewood-elite.png',
        brandBadgeAlt: 'Rosewood Elite',
        description: "Rosewood Little Dix Bay defines understated Caribbean luxury along a half-mile crescent of powder-white sand on Virgin Gorda, an eco-minded resort that has been welcoming guests for more than half a century. Light-filled rooms and villas use natural materials, while two pools &mdash; including a cliff-side infinity pool at Sense Spa &mdash; frame panoramic ocean views. Three beachfront restaurants spotlight fresh local seafood, butler service is on call, and water taxis whisk guests to seven secluded beaches around the island.",
        perks: [
            'Complimentary one category upgrade upon arrival, based on availability',
            'Daily Full American breakfast for up to two people per bedroom',
            'USD $125 food and beverage credit',
            'Welcome note and amenity from the Managing Director on behalf of your travel advisor',
            'Guests will receive locally made candles with the scent of Virgin Gorda to bring a bit of their island discovery home'
        ],
        gallery: [
            '/property-images/rosewood-little-dix-bay/01-bungalow.jpg',
            '/property-images/rosewood-little-dix-bay/02-sense-spa-pool.jpg',
            '/property-images/rosewood-little-dix-bay/03-suite-terrace.jpg',
            '/property-images/rosewood-little-dix-bay/04-bay-view.jpg',
            '/property-images/rosewood-little-dix-bay/05-ldb-view.jpg'
        ],
        idealFor: "Honeymooners, multi-generational families, and Caribbean regulars who&rsquo;d trade resort glamour for half a mile of empty beach, seven secret coves, and a butler who still knows your name.",
        agentTip: "Be sure to visit &lsquo;The Baths&rsquo; &mdash; the iconic BVI rock formation lets you hike through caves, discover rock pools, and climb on giant boulders.",
        bookingUrl: 'https://www.virtuoso.com/advisor/wilsschu27955/hotels/6164080/rosewood-little-dix-bay'
    },

    'time-tide-miavana': {
        name: 'Time + Tide Miavana',
        location: 'Nosy Ankao, Madagascar',
        rateFrom: '$3,700 / night',
        rateNote: 'All-inclusive, per person',
        heroImage: '/property-images/time-tide-miavana/00-hero.webp',
        description: "Miavana by Time + Tide sits on the private island of Nosy Ankao off Madagascar&rsquo;s northeastern coast, where fourteen beachfront villas with private pools, direct beach access, and panoramic ocean views blur the line between inside and out. Days flex from lemur trekking and scuba diving to kiteboarding and helicopter excursions over nearby national parks. Conservation sits at the heart of everything here &mdash; reforestation, marine protection, and meaningful support for local communities &mdash; making it one of the rare places where the experience genuinely gives back.",
        perks: [
            'Daily breakfast for up to two guests per bedroom, served in the restaurant and via in-room dining (already included in property rates)',
            'A complimentary fifty-minute massage for up to two people, per room, once during stay',
            'Early check-in / late check-out, subject to availability',
            'Complimentary Wi-Fi'
        ],
        gallery: [
            '/property-images/time-tide-miavana/01-villa.webp',
            '/property-images/time-tide-miavana/02-pool.webp',
            '/property-images/time-tide-miavana/03-restaurant.webp',
            '/property-images/time-tide-miavana/04-lemur-trekking.webp'
        ],
        idealFor: "Adventurous couples who&rsquo;d trade familiar luxury for true remoteness, conservation-minded travelers, and honeymooners seeking an island so private the staff still outnumber the guests.",
        agentTip: "For a truly unforgettable experience, request a private helicopter excursion at golden hour.",
        bookingUrl: 'https://www.virtuoso.com/advisor/wilsschu27955/hotels/15887498/miavana-by-time-tide'
    },

    'southern-ocean-lodge': {
        name: 'Southern Ocean Lodge',
        location: 'Kangaroo Island, Australia',
        rateFrom: '$2,200 / night',
        rateNote: 'All-inclusive',
        rateInfo: 'Converted to USD from the lodge’s published AUD rate — approximate and subject to exchange-rate movement. Final pricing is confirmed at the time of booking.',
        heroImage: '/property-images/southern-ocean-lodge/00-hero.jpg',
        description: "Set along the limestone cliffs of Kangaroo Island&rsquo;s southwest coast, Baillie Lodges&rsquo; flagship is an all-inclusive lens on Australia&rsquo;s &lsquo;Galapagos.&rsquo; Twenty-five luxury suites curve along the coast with uninterrupted ocean views, contemporary interiors, fireplaces, and generous outdoor terraces. Stays include all meals, an open bar with premium wines and spirits, daily-replenished in-suite minibars, signature guided excursions, and round-trip airport transfers.",
        perks: [
            'Lodge credit on property (USD $100)',
            'Daily breakfast for two per room (included in rate)',
            'Early check-in and late check-out, subject to availability',
            'Personalized welcome note and local gift on arrival or departure',
            'Upgrade to next category, subject to availability'
        ],
        gallery: [
            '/property-images/southern-ocean-lodge/01-suite.jpg',
            '/property-images/southern-ocean-lodge/02-pool-bar.jpg',
            '/property-images/southern-ocean-lodge/03-spa.jpg',
            '/property-images/southern-ocean-lodge/04-restaurant.jpg'
        ],
        idealFor: "Australia regulars looking beyond Uluru and the Reef, wildlife enthusiasts drawn to Kangaroo Island&rsquo;s &lsquo;Galapagos,&rsquo; and couples who want true all-inclusive ease without surrendering the service touches.",
        agentTip: "Plan three nights or more so guests can experience every signature guided excursion &mdash; from Seal Bay sea lions to Remarkable Rocks and Kelly Hill Caves. For the ultimate stay, reserve the Baillie Pavilion, a four-bedroom private residence with dedicated host service.",
        bookingUrl: '#'
    },

    'como-shambhala-estate': {
        name: 'COMO Shambhala Estate',
        location: 'Ubud, Bali',
        rateFrom: '$630 / night',
        heroImage: '/property-images/como-shambhala-estate/00-hero.webp',
        description: "COMO Shambhala Estate is an award-winning wellness retreat spread across twenty-three acres of jungle-covered riverbank twenty minutes from Ubud. Healing runs deep here &mdash; from medicinal plants growing in the surrounding forest to a natural spring locally revered for its restorative properties. The estate is built around COMO&rsquo;s holistic wellness philosophy, with tailored Wellness Paths and nutritional COMO Shambhala Cuisine at its core, while guides and fitness experts lead guests into the surrounding outdoors for a more active approach to wellbeing.",
        perks: [
            'Upgrade on arrival, subject to availability',
            'Daily breakfast for up to two guests per bedroom, served in the restaurant and via in-room dining (already included in property rates)',
            '$100 USD equivalent Resort or Hotel credit to be utilized during stay (not combinable, not valid on room rate, no cash value if not redeemed in full)',
            'Early check-in / late check-out, subject to availability',
            'Complimentary Wi-Fi'
        ],
        gallery: [
            '/property-images/como-shambhala-estate/01-wellness-pool.jpg',
            '/property-images/como-shambhala-estate/02-kedara-water-garden.webp',
            '/property-images/como-shambhala-estate/03-pool-jungle-view.jpg',
            '/property-images/como-shambhala-estate/04-villa-aerial.jpg',
            '/property-images/como-shambhala-estate/05-jungle-dining.jpg'
        ],
        idealFor: "Wellness travelers serious about a reset, solo guests seeking a structured retreat, and couples between chapters who want Bali&rsquo;s spiritual side without the Seminyak scene.",
        agentTip: "Book a massage at the bale by the Kedara water garden for a treatment in the heart of the jungle.",
        bookingUrl: 'https://www.virtuoso.com/advisor/wilsschu27955/hotels/6727293/como-shambhala-estate'
    },

    'las-ventanas-al-paraiso-a-rosewood-resort': {
        name: 'Las Ventanas al Para&iacute;so, A Rosewood Resort',
        location: 'San Jos&eacute; del Cabo, Mexico',
        rateFrom: '$1,015 / night',
        heroImage: '/property-images/las-ventanas-al-paraiso-a-rosewood-resort/00-hero.jpg',
        brandBadge: '/logos/rosewood-elite.png',
        brandBadgeAlt: 'Rosewood Elite',
        description: "Pure romance envelops you the moment a trio of musicians serenade your arrival at Las Ventanas al Para&iacute;so. The resort is beautiful and blissfully private, with a network of underground tunnels keeping staff discreet and making it a favourite of honeymooning couples and celebrities. Mediterranean-Mexican buildings dotted with succulents and cacti blend into the desert landscape, while winding infinity pools seem to disappear into the sea. Every suite has its own twenty-four-hour butler, and the resort&rsquo;s &lsquo;director of romance&rsquo; orchestrates on-the-beach dinners, oceanfront proposals, and over-the-top anniversaries.",
        perks: [
            'Upgrade on arrival, subject to availability',
            'Daily full breakfast for up to two guests per bedroom, served in the restaurant and via in-room dining',
            '$100 USD equivalent Resort or Hotel credit to be utilized during stay (not combinable, not valid on room rate, no cash value if not redeemed in full)',
            'Complimentary Margarita &amp; Taco Sampler from Taqueria, once per stay, per accommodation (for up to two guests)',
            'Early check-in / late check-out, subject to availability',
            'Complimentary Wi-Fi'
        ],
        gallery: [
            '/property-images/las-ventanas-al-paraiso-a-rosewood-resort/01-suite.jpg',
            '/property-images/las-ventanas-al-paraiso-a-rosewood-resort/02-pool.jpg',
            '/property-images/las-ventanas-al-paraiso-a-rosewood-resort/03-beach.jpg',
            '/property-images/las-ventanas-al-paraiso-a-rosewood-resort/04-dining.jpg'
        ],
        idealFor: "Honeymooners, anniversary couples, and Cabo regulars who&rsquo;d skip the buzzy beach clubs for serenades, beachside dinners, and a butler on call around the clock.",
        agentTip: "Don&rsquo;t miss Magic Dinner with the resort&rsquo;s resident magician host &mdash; surrounded by catrinas, candles, and traditional d&eacute;cor in the magical herb gardens, it&rsquo;s a theatrical evening full of intrigue and mystery.",
        bookingUrl: 'https://www.virtuoso.com/advisor/wilsschu27955/hotels/6164075/las-ventanas-al-paraiso-a-rosewood-resort'
    },

    'awasi-patagonia': {
        name: 'Awasi Patagonia',
        location: 'Torres del Paine, Chile',
        rateFrom: '$4,850 / night',
        rateNote: 'All-inclusive, per villa',
        heroImage: '/property-images/awasi-patagonia/00-hero.webp',
        description: "Awasi Patagonia comprises just fourteen modern-rustic villas, each with a direct view of Torres del Paine&rsquo;s iconic twin peaks. Built from native lenga wood and scattered across a private forested reserve, each villa features a wood-burning stove and a private hot tub for stargazing. A dedicated guide and 4WD vehicle let you explore the park entirely at your pace &mdash; hike to a glacier or along the Base Torres trail, track pumas, or ride with gauchos &mdash; before returning to fjord-caught fish, locally reared lamb, and exceptional Chilean wines at the restaurant.",
        perks: [
            'Upgrade on arrival, subject to availability',
            'Daily breakfast for up to two guests per bedroom, served in the restaurant and via in-room dining (already included in property rates)',
            '$100 USD equivalent Resort or Hotel credit to be utilized during stay (not combinable, not valid on room rate, no cash value if not redeemed in full)',
            'Early check-in / late check-out, subject to availability'
        ],
        gallery: [
            '/property-images/awasi-patagonia/01-villa.webp',
            '/property-images/awasi-patagonia/02-torres-del-paine.webp',
            '/property-images/awasi-patagonia/03-interior.webp',
            '/property-images/awasi-patagonia/04-puma.webp'
        ],
        idealFor: "Adventurous couples after their first true Patagonia, photographers chasing puma and condor, and travelers who&rsquo;d rather have a private guide and 4WD than crowd onto a group bus through Torres del Paine.",
        agentTip: "Schedule a sunrise wildlife photography session for the chance to snap guanacos, rheas, foxes, condors, and perhaps an elusive puma.",
        bookingUrl: 'https://www.virtuoso.com/advisor/wilsschu27955/hotels/18280845/awasi-patagonia-relais-chateaux'
    },

    'cap-juluca': {
        name: 'Cap Juluca, A Belmond Hotel',
        location: 'Maundays Bay, Anguilla',
        rateFrom: '$1,500 / night',
        heroImage: '/property-images/cap-juluca/00-hero.jpg',
        brandBadge: '/logos/bellini-club.png',
        brandBadgeAlt: 'Bellini Club by Belmond',
        description: "Cap Juluca anchors a mile-long crescent of powdered sand along Anguilla&rsquo;s Maundays Bay, where Moorish-inspired white villas open onto the turquoise water of one of the Caribbean&rsquo;s most photographed beaches. Reimagined by Belmond in 2018, the resort balances barefoot island ease with quietly elegant service &mdash; multiple oceanfront pools, restaurants spanning Caribbean to Mediterranean cuisine, the Arawak Spa, and reef-side water sports along Maundays Bay. The setting is famously private, the pace genuinely slow.",
        perks: [
            'Upgrade on arrival, subject to availability',
            'Daily breakfast for up to two guests per bedroom',
            '$100 USD equivalent Food &amp; Beverage credit to be utilized during stay',
            'A $500 USD equivalent gift voucher when booking a $5,000 USD equivalent or more Belmond holiday, redeemable on your next Belmond experience',
            'Welcome amenity and letter',
            'Early check-in / late check-out, subject to availability',
            'Complimentary Wi-Fi'
        ],
        gallery: [
            '/property-images/cap-juluca/01-aerial-maundays-bay.jpg',
            '/property-images/cap-juluca/02-beachfront-villas.jpg',
            '/property-images/cap-juluca/03-villa-balcony-breakfast.jpg',
            '/property-images/cap-juluca/04-pimms-restaurant.jpg',
            '/property-images/cap-juluca/05-arawak-spa.jpg'
        ],
        idealFor: "Couples chasing barefoot luxury without the crowds, multi-generational families who want space to spread out, and Caribbean regulars ready to graduate from island-hop resorts to one of the region&rsquo;s most quietly storied stays.",
        agentTip: "If you&rsquo;re looking for the ultimate beachside experience, you&rsquo;ve found it! Every room has an ocean view, and all of Cap Juluca, A Belmond Hotel is accessible with a walk down the beach.",
        bookingUrl: 'https://www.virtuoso.com/advisor/wilsschu27955/hotels/6163918/cap-juluca-a-belmond-hotel-anguilla?action=signinlink'
    },
    'caruso': {
        name: 'Caruso, A Belmond Hotel',
        location: 'Ravello, Amalfi Coast',
        rateFrom: '€1,800 / night',
        heroImage: '/property-images/caruso/00-amalfi-view.jpg',
        brandBadge: '/logos/bellini-club.png',
        brandBadgeAlt: 'Bellini Club by Belmond',
        description: "High above the Amalfi Coast in the hill town of Ravello, Caruso occupies an 11th-century palazzo whose terraces seem to float between the gardens and the sea. Belmond&rsquo;s restoration kept the frescoed ceilings, vaulted salons, and antique detail intact while adding a cliff-edge infinity pool that has become one of Italy&rsquo;s most photographed &mdash; water meeting sky over the Tyrrhenian far below. Days drift between the rose-and-citrus gardens, long lunches on the Belvedere terrace, and the hotel&rsquo;s boat down to the water. Set apart from the crush of Positano and Amalfi, it is the coast at its most serene.",
        perks: [
            'Upgrade on arrival, subject to availability',
            'Daily breakfast for up to two guests per bedroom',
            '$100 USD equivalent Food &amp; Beverage credit to be utilized during stay',
            'A $500 USD equivalent gift voucher when booking a $5,000 USD equivalent or more Belmond holiday, redeemable on your next Belmond experience',
            'Welcome amenity and letter',
            'Early check-in / late check-out, subject to availability',
            'Complimentary Wi-Fi'
        ],
        idealFor: "Honeymooners and couples chasing the Amalfi Coast&rsquo;s most iconic view without the crush below &mdash; and anyone happy to trade a beachfront address for a garden terrace floating high above the sea.",
        agentTip: "Ravello sits high above the coast, so you trade easy beach access for cooler air, quiet evenings, and that unforgettable pool. Have us arrange the hotel&rsquo;s boat for your days down on the water &mdash; it&rsquo;s the best of both.",
        bookingUrl: 'https://www.virtuoso.com/advisor/wilsschu27955/hotels/6164317/caruso-a-belmond-hotel-amalfi-coast'
    },

    'wymara-villas': {
        name: 'Wymara Resort + Villas',
        location: 'Providenciales, Turks &amp; Caicos',
        rateLines: [
            { label: 'Resort', value: '$740 / night' },
            { label: 'Villas', value: '$2,500 / night' }
        ],
        heroImage: '/property-images/wymara-villas/01-villa-slide-into-sea.jpg',
        description: "Wymara is two distinct experiences under one name on Providenciales. On Grace Bay &mdash; routinely ranked among the world&rsquo;s best beaches &mdash; the flagship Wymara Resort fronts the sand with a mosaic oceanfront infinity pool, floating cabanas, a spa, and an open-air lobby and restaurant framing the water. A short drive away on the Turtle Tail bluff, Wymara Villas step down a private headland toward their own turquoise cove: contemporary white villas with ocean-view infinity pools and the signature water slides that spiral straight into the sea, anchored by the six-bedroom Azure Villa. Book the resort for full-service beachfront ease, the villas for total privacy, or pair the two &mdash; villa guests have the run of the resort&rsquo;s beach, pool, and dining.",
        perks: [
            'Upgrade on arrival, subject to availability',
            'Daily breakfast for up to two guests per bedroom',
            '$100 USD equivalent resort or villa credit, to be utilized during stay',
            'Early check-in / late check-out, subject to availability',
            'Complimentary Wi-Fi'
        ],
        gallery: [
            '/property-images/wymara-villas/07-resort-grace-bay-pool.jpg',
            '/property-images/wymara-villas/02-azure-villa-aerial.jpg',
            '/property-images/wymara-villas/08-resort-oceanfront-suite.jpg',
            '/property-images/wymara-villas/03-azure-villa-pool.jpg',
            '/property-images/wymara-villas/11-resort-grace-bay-beach.jpg',
            '/property-images/wymara-villas/04-villa-interior-dining.jpg',
            '/property-images/wymara-villas/10-resort-open-air-lobby.jpg',
            '/property-images/wymara-villas/05-villa-master-bedroom.jpg'
        ],
        idealFor: "We love Wymara for couples and honeymooners at both the main resort and the one-bedroom pool villas, and for families, groups, and multigenerational travelers looking for a private villa experience with serious amenities on the doorstep.",
        agentTip: "The ocean pool runs stand-up paddleboard yoga most mornings, one of the finest ways to appreciate the beauty of Grace Bay Beach.",
        bookingUrl: 'https://www.virtuoso.com/advisor/wilsschu27955/travel/luxury-hotels/6164487/wymara-resort-villas'
    },

    'belmond-hiram-bingham': {
        name: 'Belmond Hiram Bingham',
        location: 'Cusco to Machu Picchu, Peru',
        heroImage: '/property-images/belmond-hiram-bingham/00-hero.jpg',
        brandBadge: '/logos/bellini-club.png',
        brandBadgeAlt: 'Bellini Club by Belmond',
        description: "Hiram Bingham, A Belmond Train, travels the fabled route from just outside Cusco &mdash; the historic capital of the Inca Empire &mdash; to ancient Machu Picchu. Sink into an armchair in the train&rsquo;s 1920s Pullman-style carriages and savour the glamour of a bygone era, gleaming with antique fittings. Each journey includes a light lunch, a guided tour of Machu Picchu, and dinner set to the melody of live music as the Andean landscape rolls by.",
        perks: [
            'Upgrade on arrival, subject to availability',
            'Fully flexible onboard credit: $100 USD equivalent per person per journey and $45 USD equivalent per person for day trips',
            'A $500 USD equivalent gift voucher when booking a $5,000 USD equivalent or more Belmond holiday, redeemable on your next Belmond experience',
            'Welcome amenity and letter',
            'Complimentary Wi-Fi'
        ],
        gallery: [
            '/property-images/belmond-hiram-bingham/01-train-bridge.jpg',
            '/property-images/belmond-hiram-bingham/02-train-exterior.jpg',
            '/property-images/belmond-hiram-bingham/03-train-interior.jpg',
            '/property-images/belmond-hiram-bingham/04-dining.jpg',
            '/property-images/belmond-hiram-bingham/05-landscape.jpg'
        ],
        idealFor: "Travelers who believe the journey is half the trip, couples celebrating a milestone, and Machu Picchu pilgrims who want to arrive at the Inca capital the way nineteen-twenties explorers did &mdash; through the windows of a polished Pullman.",
        agentTip: "Work with your advisor to charter an exclusive itinerary personalized to your group&rsquo;s needs.",
        bookingUrl: '#'
    },

    'kona-village-a-rosewood-resort': {
        name: 'Kona Village, A Rosewood Resort',
        location: 'Kona Coast, Hawai&lsquo;i Island',
        rateFrom: '$1,131 / night',
        heroImage: '/property-images/kona-village-a-rosewood-resort/00-hero.jpg',
        brandBadge: '/logos/rosewood-elite.png',
        brandBadgeAlt: 'Rosewood Elite',
        description: "Sprawling across eighty-one acres on the storied shores of the Kona Coast, Kona Village, A Rosewood Resort is a stunning return to Hawai&lsquo;i Island. 150 hale &mdash; free-standing Hawaiian bungalows with oversized lanais and outdoor showers &mdash; weave modern luxury with local artisan craft. Multiple restaurants, a full-service Asaya spa, robust ocean programming, and a zero-waste, solar-powered commitment that makes Kona Village one of the largest privately-owned microgrids in the state combine for a cutting-edge example of green Hawaiian hospitality.",
        perks: [
            'Upgrade on arrival, subject to availability',
            'Daily breakfast credit of $75 per person, for up to two guests per bedroom, served in the restaurant and via in-room dining (credit is non-cumulative)',
            '$100 USD equivalent Resort or Hotel credit to be utilized during stay (not combinable, not valid on room rate, no cash value if not redeemed in full)',
            'Early check-in / late check-out, subject to availability'
        ],
        gallery: [
            '/property-images/kona-village-a-rosewood-resort/01-bungalow.jpg',
            '/property-images/kona-village-a-rosewood-resort/02-lanai.jpg',
            '/property-images/kona-village-a-rosewood-resort/03-dining.jpg',
            '/property-images/kona-village-a-rosewood-resort/04-spa.jpg'
        ],
        idealFor: "Multi-generational families, sustainability-minded travelers drawn to Kona Village&rsquo;s solar microgrid, and Hawai&lsquo;i regulars wanting bungalows and lava fields instead of high-rise resort row.",
        agentTip: "Don&rsquo;t miss Island Roots on Wednesdays and Saturdays &mdash; a communal dinner under the Kiawe Trees that&rsquo;s as much a tribute to the land&rsquo;s abundance as it is a meal. Also book the Kilo Kai canoe sailing experience.",
        bookingUrl: 'https://www.virtuoso.com/advisor/wilsschu27955/hotels/16663627/kona-village-a-rosewood-resort'
    },

    'kokomo-private-island-fiji': {
        name: 'Kokomo Private Island Fiji',
        location: 'Kadavu, Fiji',
        rateFrom: '$1,995 / night',
        rateNote: 'All-inclusive, per villa',
        heroImage: '/property-images/kokomo-private-island-fiji/00-hero.jpg',
        description: "Kokomo is the ideal all-inclusive island escape for couples chasing a romantic retreat and families looking to slow down. From the moment you arrive you&rsquo;re welcomed into the family with genuine warmth, with activities spanning snorkelling, diving, waterfall hikes to neighbouring islands, fishing, paddleboarding, and kayaking. Service is unparalleled &mdash; staff anticipate your next move with a glass of your favourite ros&eacute;, the newspaper you were reading at breakfast, or snorkelling masks already sized and ready.",
        perks: [
            'Upgrade on arrival, subject to availability',
            'Daily breakfast for up to two guests per bedroom, served in the restaurant (already included in property rates)',
            '$100 USD equivalent Resort or Hotel credit to be utilized during stay (not combinable, not valid on room rate, no cash value if not redeemed in full)',
            'Bookings in our Residences will receive an additional $200 Resort or Hotel credit (for a total of $300 during stay)',
            'Stays of 7+ nights will also receive a complimentary 60-minute Kokomo Signature Pacific Mastery Massage for two guests, once during stay',
            'Early check-in / late check-out, subject to availability'
        ],
        gallery: [
            '/property-images/kokomo-private-island-fiji/01-villa-exterior.jpg',
            '/property-images/kokomo-private-island-fiji/02-bedroom.jpg',
            '/property-images/kokomo-private-island-fiji/03-snorkeling.jpg',
            '/property-images/kokomo-private-island-fiji/04-dining.jpg'
        ],
        idealFor: "Honeymooners after barefoot privacy, multi-generational families who&rsquo;d rather have a whole island than a resort, and divers drawn to Kokomo&rsquo;s stretch of the Great Astrolabe Reef.",
        agentTip: "Trust chef Caroline implicitly &mdash; Walker d&rsquo;Plank has no set menu. She&rsquo;ll chat with you about preferences and dietary needs, then plan around what&rsquo;s local and fresh that day. Plan at least four meals with her.",
        bookingUrl: 'https://www.virtuoso.com/advisor/wilsschu27955/hotels/15577206/kokomo-private-island-fiji'
    },

    'canaves-ena': {
        name: 'Canaves Ena',
        location: 'Oia, Santorini, Greece',
        rateFrom: '€500 / night',
        heroImage: '/property-images/canaves-ena/00-hero.webp',
        description: "Inviting, inspiring, and elegantly classic, Canaves Ena tempts guests into the best of Oia. Freshly renovated suites are decorated in a bright, minimalist style with private verandas, al fresco dining areas, and breathtaking views of the Caldera and the Aegean. Adults-only, intimate, and quietly contemporary &mdash; this is Santorini at its most considered.",
        perks: [
            'Upgrade on arrival, subject to availability',
            'Daily breakfast for up to two guests per bedroom, served in the restaurant (already included in property rates)',
            '$100 USD equivalent Food &amp; Beverage credit to be utilized during stay (not combinable, no cash value if not redeemed in full)',
            'Stays of 7+ nights will receive an additional $200 Food &amp; Beverage credit (for a total of $300 during stay)',
            'Early check-in / late check-out, subject to availability',
            'Complimentary Wi-Fi'
        ],
        gallery: [
            '/property-images/canaves-ena/01-suite.webp',
            '/property-images/canaves-ena/02-pool.webp',
            '/property-images/canaves-ena/03-dining.webp',
            '/property-images/canaves-ena/04-caldera.webp'
        ],
        idealFor: "Honeymooners, adults-only travelers who want Santorini without children running through the breakfast room, and couples seeking the Oia caldera view at its most considered.",
        agentTip: "Enjoy a traditional Greek meal with views of the famous Caldera at Adami restaurant.",
        bookingUrl: 'https://www.virtuoso.com/advisor/wilsschu27955/hotels/6609753/canaves-ena'
    },

    'claridges': {
        name: "Claridge&rsquo;s",
        location: 'London, United Kingdom',
        rateFrom: '£800 / night',
        heroImage: '/property-images/claridges/00-hero.webp',
        description: "Claridge&rsquo;s is a favourite among the City of London&rsquo;s most savvy guests. Rooms are effortlessly glamorous, with original art deco features complemented by the latest technology. Experience Claridge&rsquo;s Bar with its unparalleled collection of vintage champagnes and rare spirits, celebrate the heritage of British baking at Claridge&rsquo;s Bakery, while afternoon tea at The Foyer &amp; Reading Room is a must. For an intimate nightcap, slip behind the Lalique door of The Fumoir.",
        perks: [
            'Upgrade on arrival, subject to availability',
            'Daily full breakfast for up to two guests per bedroom, served in the restaurant and via in-room dining',
            '$100 USD equivalent Resort or Hotel credit to be utilized during stay (not combinable, not valid on room rate, no cash value if not redeemed in full)',
            'Early check-in / late check-out, subject to availability',
            'Complimentary Wi-Fi'
        ],
        gallery: [
            '/property-images/claridges/01-suite.webp',
            '/property-images/claridges/02-foyer.webp',
            '/property-images/claridges/03-art-deco.webp',
            '/property-images/claridges/04-bar.webp',
            '/property-images/claridges/05-detail.webp'
        ],
        idealFor: "Anglophiles, repeat London visitors who want Mayfair from inside its most storied address, and travelers who&rsquo;d rather afternoon tea at the Foyer than the latest design hotel three streets over.",
        agentTip: "Request one of the stunning guest rooms or suites by royal designer David Linley.",
        bookingUrl: 'https://www.virtuoso.com/advisor/wilsschu27955/hotels/6163909/claridges-london'
    },

    'adare-manor': {
        name: 'Adare Manor',
        location: 'County Limerick, Ireland',
        rateFrom: '€895 / night',
        heroImage: '/property-images/adare-manor/00-hero.webp',
        description: "Built in 1832 and tucked into the heart of Adare Village thirty minutes from Shannon, Adare Manor is one of Ireland&rsquo;s leading five-star castle resorts &mdash; voted the number one resort in Europe by Cond&eacute; Nast Traveler readers and home to the 2027 Ryder Cup. The Forbes five-star castle holds three Michelin Keys, with 103 guest rooms plus two- to four-bedroom Lodges and Cottages, a one-Michelin-star restaurant, and a Tom Fazio-designed eighteen-hole golf course on the grounds.",
        perks: [
            'Upgrade on arrival, subject to availability',
            'Daily breakfast for up to two guests per bedroom, served in the restaurant (already included in property rates)',
            'Complimentary Afternoon Tea for up to two guests per hotel bedroom, once during their stay, served in the Gallery (must have minimum value of $100 USD equivalent, not combinable, not valid on room rate, no cash value if not redeemed in full)',
            'Early check-in / late check-out, subject to availability',
            'Complimentary Wi-Fi'
        ],
        gallery: [
            '/property-images/adare-manor/01-stateroom.webp',
            '/property-images/adare-manor/02-pool.webp',
            '/property-images/adare-manor/03-spa.webp',
            '/property-images/adare-manor/04-dining.webp'
        ],
        idealFor: "Golfers en route to the 2027 Ryder Cup, castle-stay enthusiasts, and multi-generational families who&rsquo;d trade a city break for a true Irish country estate &mdash; horses, hounds, and afternoon tea included.",
        agentTip: "Add the Horse &amp; Hound Welcome for a storybook arrival &mdash; two horses and twenty hounds escort you up Adare Manor&rsquo;s tree-lined drive, with time for photos and a chat with the riders. Pure Irish magic.",
        bookingUrl: 'https://www.virtuoso.com/advisor/wilsschu27955/hotels/15274349/adare-manor'
    },

    'hotel-esencia': {
        name: 'Hotel Esencia',
        location: 'Xpu-Ha, Riviera Maya, Mexico',
        rateFrom: '$1,028 / night',
        heroImage: '/property-images/hotel-esencia/00-hero.jpg',
        description: "The former beachside villa of an Italian duchess, Hotel Esencia is a private estate set on expansive gardens along Xpu-Ha Beach. This Riviera Maya refuge holds four villas and twenty-seven suites, a calming organic spa, and two farm-to-table Mexican restaurants drawing on mole from Oaxaca and fruits from the Yucat&aacute;n. Every room features plunge pools, private fitness areas, rooftop terraces, or sitting areas with garden-canopy or Caribbean views.",
        perks: [
            'Upgrade on arrival, subject to availability',
            'Daily breakfast credit of $60 per person for up to two guests per bedroom, served in the restaurant (non-cumulative)',
            '$100 USD equivalent Resort or Hotel credit to be utilized during stay (not combinable, not valid on room rate, no cash value if not redeemed in full)',
            'Complimentary bottle of wine',
            'Bookings in Pool Villa or higher categories receive an additional $100 Resort or Hotel credit (for a total of $200 during stay)',
            'Early check-in / late check-out, subject to availability',
            'Complimentary Wi-Fi'
        ],
        gallery: [
            '/property-images/hotel-esencia/01-suite.webp',
            '/property-images/hotel-esencia/02-pool.webp',
            '/property-images/hotel-esencia/03-spa.webp',
            '/property-images/hotel-esencia/04-dining.webp'
        ],
        idealFor: "Couples and honeymooners wanting the Riviera Maya at its most discreet, design-led travelers who&rsquo;d skip the all-inclusive megaresorts up the coast, and anyone craving a duchess&rsquo;s private villa over a hotel-shaped hotel.",
        agentTip: "Don&rsquo;t miss the property&rsquo;s private freshwater cenote &mdash; a fifteen-minute walk from the resort, where you can swim alongside manatees.",
        bookingUrl: 'https://www.virtuoso.com/advisor/wilsschu27955/hotels/6164072/hotel-esencia'
    },

    'oneandonly-mandarina': {
        name: 'One&amp;Only Mandarina',
        location: 'Riviera Nayarit, Mexico',
        rateFrom: '$1,090 / night',
        heroImage: '/property-images/oneandonly-mandarina/00-hero.webp',
        description: "One&amp;Only Mandarina is woven into one of the last tropical beachfront rainforests on Mexico&rsquo;s Riviera Nayarit, where jungle-clad cliffs meet the Pacific. Spacious standalone treehouses and cliffside villas &mdash; each with a private plunge pool and dedicated host &mdash; hover in the canopy or perch over the surf. The resort&rsquo;s playground spans miles of nature trails, swimmable beaches, an equestrian and polo club, and four dining concepts from beachfront to treetop. It&rsquo;s adventure-led barefoot luxury, dialed up for families, couples, and groups taking over an entire Private Home.",
        perks: [
            'Upgrade on arrival, subject to availability',
            'Daily full breakfast for up to two guests per bedroom, served in Alma Restaurant',
            '$100 USD equivalent resort or hotel credit to be utilized during stay',
            'Early check-in / late check-out, subject to availability',
            'Complimentary Wi-Fi'
        ],
        gallery: [
            '/property-images/oneandonly-mandarina/01-treehouse.webp',
            '/property-images/oneandonly-mandarina/02-villa.webp',
            '/property-images/oneandonly-mandarina/03-pool.webp',
            '/property-images/oneandonly-mandarina/04-dining.webp',
            '/property-images/oneandonly-mandarina/05-jungle.webp'
        ],
        idealFor: "Multi-generational families taking over a Private Home, adventurous couples after barefoot luxury with a jungle backdrop, and Mexico regulars who&rsquo;d trade the Riviera Maya crowds for the wilder Pacific coast.",
        agentTip: "With endless room to roam, airy terraces, private swimming pools, and ultra-luxe comforts, One&amp;Only Mandarina&rsquo;s Private Homes range from four to ten bedrooms &mdash; the ultimate group retreat.",
        bookingUrl: 'https://www.virtuoso.com/advisor/wilsschu27955/hotels/15876149/oneonly-mandarina'
    },

    'nekajui': {
        name: 'Nekaj&uacute;i, A Ritz-Carlton Reserve',
        location: 'Peninsula Papagayo, Costa Rica',
        rateFrom: '$1,500 / night',
        heroImage: '/property-images/nekajui/00-hero.webp',
        brandBadge: '/logos/marriott-stars.png',
        brandBadgeAlt: 'Marriott STARS &amp; Luminous',
        description: "Nekaj&uacute;i is Central America&rsquo;s first Ritz-Carlton Reserve, opened in 2025 on a clifftop within Peninsula Papagayo&rsquo;s 1,400-acre protected sanctuary. The 107 accommodations blend quietly elegant interiors with expansive terraces and Pacific views; three glamping-style Treetop Tents sit aloft in the canopy. Days are shaped around eco-adventures &mdash; tubing along the R&iacute;o Celeste, hiking to waterfalls, surfing, zip-lining &mdash; and slowed back down with indigenous spa rituals, an artisanal coffee ceremony, and Chef Diego Mu&ntilde;oz&rsquo;s Peruvian-inflected cooking at Puna. Each room is paired with a personal Manzu, a butler-host who manages every detail of the stay.",
        perks: [
            'Upgrade on arrival, subject to availability (excludes Casona Suites and Treetop Tents)',
            'Daily buffet breakfast for up to two guests per bedroom, served in the restaurant',
            '$150 USD equivalent resort or hotel credit to be utilized during stay',
            'Early check-in / late check-out, subject to availability',
            'Complimentary Wi-Fi'
        ],
        gallery: [
            '/property-images/nekajui/01-suite.webp',
            '/property-images/nekajui/02-villa.webp',
            '/property-images/nekajui/03-pool.webp',
            '/property-images/nekajui/04-dining.webp',
            '/property-images/nekajui/05-treetop-tent.webp'
        ],
        idealFor: "First-time Costa Rica visitors who want eco-adventure paired with ultra-refined service, families chasing rainforest bonding, and travelers drawn to the new Ritz-Carlton Reserve standard in Central America.",
        agentTip: "Just minutes from the resort, the UNESCO World Heritage-listed &Aacute;rea de Conservaci&oacute;n Guanacaste comprises a tropical dry forest, many volcanoes, and several nesting areas for endangered sea turtles.",
        bookingUrl: 'https://www.virtuoso.com/advisor/wilsschu27955/hotels/18099748/nekajui-a-ritz-carlton-reserve'
    },

    'deplar-farm': {
        name: 'Deplar Farm',
        location: 'Flj&oacute;t Valley, Iceland',
        rateFrom: '$2,775 / night',
        rateNote: 'All-inclusive',
        heroImage: '/property-images/deplar-farm/00-hero.jpg',
        description: "Deplar Farm is an Eleven Experiences lodge tucked into Iceland&rsquo;s remote Troll Peninsula, converted from a 15th-century sheep farm into 13 Scandi-chic suites with floor-to-ceiling views of the Flj&oacute;t Valley. The all-inclusive stay layers in two guided adventures a day &mdash; heli-skiing, surfing the Arctic, fly fishing, sea kayaking, snowmobiling, or horseback riding under the midnight sun. A 5,000-square-foot Eleven Life spa, geothermal indoor-outdoor pool with swim-up bar, Viking sauna, and floatation tanks make recovery as serious as the action. Meals come from Iceland&rsquo;s 2018 Chef of the Year, with island-sourced produce, Arctic char, and frequent visits from the farmers and fishermen behind the menu.",
        perks: [
            'Upgrade on arrival, subject to availability',
            'Daily breakfast for up to two guests per bedroom, served in the restaurant (already included in property rates)',
            '$200 USD equivalent resort or hotel credit to be utilized during stay',
            'Stays of 5+ nights receive an additional $200 credit (total $400 during stay)',
            'Stays of 7+ nights receive an additional $400 credit (total $600 during stay)',
            'Early check-in / late check-out, subject to availability'
        ],
        gallery: [
            '/property-images/deplar-farm/01-aurora-pool.jpg',
            '/property-images/deplar-farm/02-spa.jpg',
            '/property-images/deplar-farm/03-bar.jpg',
            '/property-images/deplar-farm/04-lounge.jpg',
            '/property-images/deplar-farm/05-floki-suite.jpg'
        ],
        idealFor: "Adventure travelers chasing heli-skiing and Arctic surfing, couples seeking a remote bucket-list escape, and active multi-generational families who&rsquo;d trade a Caribbean beach week for floatation tanks under the Northern Lights.",
        agentTip: "There&rsquo;s no wrong time to visit Deplar Farm &mdash; summer brings endless daylight, while winter transforms the valley into a snowy playground with heli-skiing and the Northern Lights.",
        bookingUrl: 'https://www.virtuoso.com/advisor/wilsschu27955/hotels/16879561/eleven-deplar-farm'
    },

    'cap-rocat': {
        name: 'Cap Rocat',
        location: 'Cala Blava, Mallorca, Spain',
        rateFrom: '€500 / night',
        heroImage: '/property-images/cap-rocat/00-hero.webp',
        description: "Cap Rocat is a 19th-century coastal fortress reborn as an adults-only Relais &amp; Ch&acirc;teaux hideaway, clinging to its own cliff above the Bay of Palma. Its former bunkers and buttresses now hold 30 barrel-vaulted rooms and suites &mdash; some with private plunge pools and gazebos &mdash; while an ethereal hammam-style spa has been carved straight from the rock. Golf carts ferry guests across the sprawling grounds to tennis courts, a private beach, and an infinity pool that seems to spill into the Mediterranean. It&rsquo;s a quiet, cinematic base for sailing, cycling the coast, or slipping into Palma for the day.",
        perks: [
            'Upgrade on arrival, subject to availability',
            'Daily full breakfast for up to two guests per bedroom, served in the restaurant or via in-room dining',
            '$100 USD equivalent Food &amp; Beverage credit to be utilized during stay',
            'Early check-in / late check-out, subject to availability',
            'Complimentary Wi-Fi'
        ],
        gallery: [
            '/property-images/cap-rocat/01-accommodation.webp',
            '/property-images/cap-rocat/02-pool.webp',
            '/property-images/cap-rocat/03-spa.webp',
            '/property-images/cap-rocat/04-restaurant.webp'
        ],
        idealFor: "Adults-only travelers wanting Mallorca with cinematic gravitas, honeymooners after a dramatic Mediterranean fortress, and couples who&rsquo;d skip the Balearic beach clubs for a private cliffside cove.",
        agentTip: "Wake each morning to fresh coffee, juice, and a breakfast hamper filled with ham, cheeses, and pan con tomate, discreetly delivered to your room&rsquo;s private patio.",
        bookingUrl: 'https://www.virtuoso.com/advisor/wilsschu27955/hotels/16801557/cap-rocat'
    },

    'six-senses-douro-valley': {
        name: 'Six Senses Douro Valley',
        location: 'Lamego, Portugal',
        rateFrom: '€700 / night',
        heroImage: '/property-images/six-senses-douro-valley/00-hero.webp',
        description: "Six Senses Douro Valley is a 19-acre wellness retreat set high above the River Douro, inside the world&rsquo;s oldest demarcated wine region. A restored 19th-century manor house anchors 71 rooms, suites, and villas, joined by a 10-treatment-room spa, indoor and outdoor pools, and a wine library stocked with the valley&rsquo;s standout vintages. Days run on the Six Senses rhythm &mdash; river cruises and kayaking on the Douro, vineyard hikes and tastings, tree climbing for the whole family, and organic-garden-led cuisine across three dining spaces. The UNESCO World Heritage setting won the property Virtuoso&rsquo;s Best Achievement in Design, and it still feels every bit as considered.",
        perks: [
            'Upgrade on arrival, subject to availability',
            'Daily full breakfast for up to two guests per bedroom, served in the restaurant',
            '$100 USD equivalent resort or hotel credit to be utilized during stay',
            'Early check-in / late check-out, subject to availability',
            'Complimentary Wi-Fi'
        ],
        gallery: [
            '/property-images/six-senses-douro-valley/01-quinta-room.webp',
            '/property-images/six-senses-douro-valley/02-vineyard.webp',
            '/property-images/six-senses-douro-valley/03-spa.webp',
            '/property-images/six-senses-douro-valley/04-dining.webp',
            '/property-images/six-senses-douro-valley/05-pool.webp'
        ],
        idealFor: "Wine enthusiasts curious about Portugal&rsquo;s oldest demarcated region, wellness travelers serious about restoration, and families who&rsquo;d swap a city break for vineyard hikes and tree-climbing across UNESCO terraces.",
        agentTip: "It is absolutely worth it to splurge for a room with a river view.",
        bookingUrl: 'https://www.virtuoso.com/advisor/wilsschu27955/hotels/15267218/six-senses-douro-valley'
    },

    /* ───────────────────────────────────────────────────────────────────
       AUTO-DRAFTED STUBS — added 2026-06-09 from the "SmartFlyer Quote" scan.
       Each is draft:true → HIDDEN from the /hotels directory (hotels.html
       filters drafts) so incomplete pages don't go live. To PUBLISH one:
         1. Drop photos into property-images/{slug}/ and set heroImage + gallery
         2. Confirm the perks against SmartFlyer/Virtuoso (these are candidates)
         3. Paste the Virtuoso / TravelWits bookingUrl (currently '#')
         4. Add the real rateFrom if you want a starting rate shown
         5. Delete the `draft: true` line to publish
       Descriptions are DRAFT copy for Wilson to wordsmith.
       ─────────────────────────────────────────────────────────────────── */

    'four-seasons-resort-cabo-del-sol': {
        draft: true,
        // PHOTOS PENDING — not on SmartFlyer or Virtuoso; official site is bot-blocked (403).
        // Drop images into property-images/four-seasons-resort-cabo-del-sol/, then add
        // heroImage + gallery. Not a Virtuoso property → bookingUrl stays '#' (Four Seasons
        // bookings route through FSPP / the inquiry form, not a Virtuoso self-book link).
        name: 'Four Seasons Resort Cabo Del Sol',
        location: 'Cabo San Lucas, Mexico',
        rateFrom: '$1,650 / night',
        description: "Four Seasons&rsquo; first resort in Los Cabos, opened in 2024 on a rare swimmable stretch of the Sea of Cortez at Cabo Del Sol. Contemporary and low-slung, it steps down through desert gardens to the water &mdash; multiple pools, a destination spa, and restaurants spanning Mexican coastal cooking to wood-fired everything. Championship golf sits on the doorstep, the beach is calm enough to actually swim (rare for Cabo), and the service is classic Four Seasons polish against one of Baja&rsquo;s most dramatic shorelines.",
        perks: [
            'Upgrade on arrival, subject to availability',
            'Daily breakfast for up to two guests per bedroom',
            '$100 USD food &amp; beverage credit, once per stay',
            'Early check-in / late check-out, subject to availability',
            'Complimentary Wi-Fi'
        ],
        idealFor: "Families and couples after polished, dependable Four Seasons service and a Cabo beach you can actually swim &mdash; and golfers, with the Sea of Cortez and championship courses on the doorstep.",
        agentTip: "A genuinely swimmable beach is rare in Los Cabos &mdash; this is one of the few. Book an ocean-view room for the Sea of Cortez sunrise, and leave a morning for golf or a panga out on the water.",
        bookingUrl: '#'
    },

    'the-colony-palm-beach': {
        name: 'The Colony Hotel, Palm Beach',
        location: 'Palm Beach, Florida',
        rateFrom: '$550 / night',
        heroImage: '/property-images/the-colony-palm-beach/00-hero.jpg',
        description: "The pink-washed grande dame of Palm Beach, half a block from Worth Avenue and the Atlantic. Opened in 1947 and recently reimagined, The Colony is all British-colonial brio &mdash; lacquered palm-print walls, a palm-shaded pool courtyard, and a supper club that has drawn the island&rsquo;s regulars for generations. Rooms, suites, and poolside villas read bright and preppy-chic, in the high-spirited pinks and greens that made the hotel a Palm Beach icon. The address is the point: you&rsquo;re in the thick of the island&rsquo;s social swirl.",
        perks: [
            'Upgrade on arrival, subject to availability',
            'Daily breakfast for up to two guests per bedroom',
            '$100 USD equivalent property credit, once per stay',
            'Early check-in / late check-out, subject to availability',
            'Complimentary Wi-Fi'
        ],
        idealFor: "Girls&rsquo; trips, milestone weekends, and design lovers who want to be in the middle of Palm Beach &mdash; steps from Worth Avenue and the beach, with a poolside scene worth dressing for.",
        agentTip: "Reserve a poolside cabana and build a night around the supper club &mdash; the live music and cocktails are a Palm Beach institution. Worth Avenue&rsquo;s boutiques are a two-minute stroll, so pack accordingly.",
        bookingUrl: 'https://www.virtuoso.com/advisor/wilsschu27955/travel/luxury-hotels/16601416/the-colony-hotel-palm-beach'
    },

    'casa-di-langa': {
        name: 'Casa di Langa',
        location: 'Cerretto Langhe, Piedmont, Italy',
        rateFrom: '€550 / night',
        heroImage: '/property-images/casa-di-langa/00-hero.jpg',
        description: "Among the Langhe hills of Piedmont &mdash; hazelnut groves and Barolo vineyards rolling toward the Alpine skyline &mdash; Casa di Langa is a thirty-nine-room eco-luxe resort built in the image of an ancient Piedmontese farm: brick and half-timber, terracotta and stone, courtyards opening onto cultivated slopes. Opened in 2021 with sustainability woven through every decision, it pairs a serious wine cellar and a region-rooted kitchen with cooking classes, a Wine Academy, truffle hunting, and walks through the estate&rsquo;s gardens and forest. Quietly luxurious, and entirely of its place.",
        perks: [
            'Upgrade to the next category, subject to availability',
            'Early check-in / late check-out, subject to availability',
            'Personalized welcome note and amenity',
            '$100 USD equivalent Food &amp; Beverage credit (gratuities, alcohol, and room service excluded)',
            'Complimentary Wi-Fi'
        ],
        gallery: [
            '/property-images/casa-di-langa/01-pool.jpg',
            '/property-images/casa-di-langa/02-accommodation.jpg',
            '/property-images/casa-di-langa/03-restaurant.jpg',
            '/property-images/casa-di-langa/04-spa.jpg'
        ],
        idealFor: "Wine lovers and slow-travelers drawn to Barolo and Barbaresco country, design-minded couples, and anyone who measures luxury in silence, long lunches, and a vineyard view rather than a buzzy scene.",
        agentTip: "Follow the local rhythm &mdash; no more than one winery a day &mdash; and let the estate arrange a morning truffle hunt in the woods or a class in the kitchen garden. Built on sustainability, this is the Langhe at its most considered.",
        bookingUrl: 'https://www.virtuoso.com/advisor/wilsschu27955/hotels/16627144/casa-di-langa'
    },

    'ambergris-cay': {
        name: 'Ambergris Cay',
        location: 'Turks &amp; Caicos',
        rateFrom: '$2,200 / night',
        rateNote: 'All-inclusive',
        heroImage: '/property-images/ambergris-cay/00-hero.jpg',
        description: "A private island on the southeastern edge of the Turks &amp; Caicos, six hundred miles south of Miami and ringed by the turquoise shallows of the Caicos Banks. Ambergris Cay is all-inclusive in the fullest sense &mdash; beachfront bungalows with heated plunge pools and three- to eleven-bedroom villas, every meal and drink, and complimentary water sports from Hobie Cats and kayaks to snorkeling the reef. Days bend to island time: golf-cart explorations, sunset cruises, deep-sea fishing, and long stretches of empty white sand. Remote, barefoot, and entirely your own.",
        perks: [
            'Complimentary sunset cruise for two guests per bedroom, once during stay',
            'Upgrade to the next category at check-in, subject to availability',
            'Early check-in / late check-out, subject to availability',
            '$100 resort credit per room or villa, per stay',
            'Welcome amenity'
        ],
        gallery: [
            '/property-images/ambergris-cay/01-pool.jpg',
            '/property-images/ambergris-cay/02-accommodation.jpg',
            '/property-images/ambergris-cay/03-restaurant.jpg',
            '/property-images/ambergris-cay/04-spa.jpg'
        ],
        idealFor: "Privacy-seekers, honeymooners, and multi-gen families who want a whole island to disappear onto &mdash; all-inclusive and remote, with the reef, the flats, and the water sports thrown in, and not a crowd in sight.",
        agentTip: "Your round-trip flights from Providenciales are included &mdash; a seamless private-island arrival. Once there, don&rsquo;t miss the floating Hangover Tiki Bar, drifting over the turquoise flats off Little Ambergris Cay.",
        bookingUrl: 'https://www.virtuoso.com/advisor/wilsschu27955/hotels/18075165/ambergris-cay-turks-and-caicos'
    },

    'sugar-beach-a-viceroy-resort': {
        name: 'Sugar Beach, A Viceroy Resort',
        location: 'Soufri&egrave;re, St. Lucia',
        rateFrom: '$1,100 / night',
        heroImage: '/property-images/sugar-beach-a-viceroy-resort/00-hero-beach.jpg',
        description: "Sugar Beach unfurls across a former 18th-century plantation between St. Lucia&rsquo;s twin Pitons &mdash; one of the Caribbean&rsquo;s most cinematic settings. A white-sand beach below volcanic-green hillsides, with 105 rooms, cottages, and villas scattered up the mountainside and along the shore &mdash; most with private plunge pools and butler service. A Rainforest Spa whose ten treatment rooms are perched in the treetops, five restaurants from beachfront to fine dining, and that Piton view from nearly everywhere. Dramatic, deeply romantic, and a long-running honeymoon favorite.",
        perks: [
            'Upgrade on arrival, subject to availability',
            'Daily breakfast for up to two guests per bedroom',
            '$100 USD equivalent property credit, once per stay',
            'Early check-in / late check-out, subject to availability',
            'Complimentary Wi-Fi'
        ],
        gallery: [
            '/property-images/sugar-beach-a-viceroy-resort/01-deluxe-cottage.jpg',
            '/property-images/sugar-beach-a-viceroy-resort/02-restaurant.jpg',
            '/property-images/sugar-beach-a-viceroy-resort/03-fitness.jpg'
        ],
        idealFor: "Honeymooners and romantics after the Caribbean at its most cinematic &mdash; those who&rsquo;d take a plunge-pool villa with a Piton framed in the window over a big-resort scene, with rainforest-spa treehouses and barefoot dinners on the sand to fill the days.",
        agentTip: "Time a sunset cocktail at the South Pier Bar &mdash; the Pitons turn gold at golden hour &mdash; then book a treetop treatment at the Rainforest Spa. Don&rsquo;t skip the Jetty Burgers or the Cocoa Mill chocolate experience, a nod to the estate&rsquo;s plantation past.",
        bookingUrl: 'https://www.virtuoso.com/advisor/wilsschu27955/hotels/11245972/sugar-beach-a-viceroy-resort'
    }

    /* Add more entries below as Virtuoso URLs + content come in. Shape:
       'slug-name': {
           name: '...',
           location: '...',
           heroImage: '...',
           description: '...',
           perks: ['...', '...'],
           bookingUrl: '...'
       }
    */
};

/* ---------- ITINERARIES (ready-to-book journeys) ---------------------- */
const ITINERARIES = {
    'safari-and-beach': {
        title: 'The Ultimate Safari and Beach Itinerary',
        subtitle: 'South Africa &amp; Mozambique',
        heroImage: '/itinerary-images/safari-and-beach/hero-candidate-1.jpg',
        duration: '15 days',
        nights: 14,
        countries: ['South Africa', 'Mozambique'],
        priceFrom: 17250,
        priceCurrency: 'USD',
        priceNote: "Per person, double occupancy &mdash; excludes international airfare. Solo and family pricing on request.",
        priceTooltip: "Per person, based on double occupancy. Price includes all accommodation, experiences, guiding and transfers. Based on travelling off-peak and may increase if travelling over peak season. Price excludes international flights but these can be arranged on request.",
        kicker: 'Our Signature Safari & Beach Escape',
        priceIncludes: 'Includes hand-picked accommodations, internal flights, private transfers, guided experiences, and local support throughout.',
        propertyNoteLabel: 'Best for',
        ctaTitle: 'Ready to make it your own?',
        ctaBody: 'Every departure is customized around your dates, travel style, and the experiences that matter most to you.',
        ctaLabel: 'Plan My Safari',

        overview: "Two weeks that stitch the wildest corners of Southern Africa into a single, considered journey &mdash; Cape Town&rsquo;s salt-and-vine glamour, the floral coast of Hermanus, the cellar country of Franschhoek, Sabi Sand&rsquo;s leopards at sunset, and barefoot days on Mozambique&rsquo;s Indian Ocean. The pace shifts deliberately: city to bush to beach, with the best property in each region and private guides throughout.",

        bestFor: "First-time Africa travelers who want to do it once and do it right, honeymooners chasing Big Five mornings and Indian Ocean afternoons, and multi-generational families looking for a journey that earns its airfare.",

        highlights: [
            { label: 'Track leopards at sunrise in Sabi Sand' },
            { label: 'Private tastings in the Cape Winelands' },
            { label: 'Helicopter-worthy views from Table Mountain' },
            { label: 'Sunset dhow cruises in the Indian Ocean' }
        ],

        legs: [
            {
                days: 'Days 1&ndash;3',
                title: 'Captivating Cape Town',
                property: 'Ellerman House',
                image: '/itinerary-images/safari-and-beach/property-01-ellerman-house.jpg',
                description: "Ease into Africa at Ellerman House, an Edwardian villa above Bantry Bay with twelve rooms, a museum-worthy art collection, and the kind of butler service that anticipates your second cappuccino. Days move between Table Mountain at sunrise, V&amp;A Waterfront strolls, the painted lanes of Bo-Kaap, and the penguins at Boulders Beach.",
                highlight: "Cable car up Table Mountain at first light",
                meals: "Breakfast daily"
            },
            {
                days: 'Days 4&ndash;5',
                title: 'The Floral Coast at Grootbos',
                property: 'Grootbos Private Nature Reserve',
                image: '/itinerary-images/safari-and-beach/property-02-grootbos.jpg',
                description: "Two hours east of Cape Town, Grootbos drops you into 11,000 acres of fynbos and milkwood forest along the Walker Bay coast. Suites overlook the ocean, the spa is built into the forest, and depending on the season you&rsquo;ll head out for whale watching, horseback rides on the beach at Hermanus, or marine Big Five boat trips.",
                highlight: "Southern right whale boat encounter (June&ndash;November)",
                meals: "Breakfast, lunch, and dinner daily"
            },
            {
                days: 'Days 6&ndash;8',
                title: 'Cellar Country at Babylonstoren',
                property: 'Babylonstoren',
                image: '/itinerary-images/safari-and-beach/property-03-babylonstoren.jpg',
                description: "A 17th-century Cape Dutch farm reborn as a working garden of 300+ edible plants, with whitewashed cottages set among the vines. Wine and dine your way through Franschhoek and Stellenbosch, take a guided garden tour, ride bicycles through the rows, and bookend the day at the Babel restaurant with vegetables harvested that morning.",
                highlight: "Private cellar tour and tasting at a premier Cape estate",
                meals: "Breakfast daily, plus a private cellar dinner"
            },
            {
                days: 'Days 9&ndash;11',
                title: 'Big Five at Dulini Moya',
                property: 'Dulini Moya',
                image: '/itinerary-images/safari-and-beach/property-04-dulini-moya.jpg',
                description: "A short charter flight north into Sabi Sand &mdash; the gold-standard private game reserve adjacent to Kruger. Dulini Moya is intimate: six villas, no fences, leopards in the trees. Twice-daily game drives with your private ranger and tracker, fireside meals under the stars, and a plunge pool on your deck for between-drive recovery.",
                highlight: "Walking safari with armed ranger at first light",
                meals: "All meals included &mdash; bush breakfasts and boma dinners"
            },
            {
                days: 'Days 12&ndash;15',
                title: 'Island Life at Azura Benguerra',
                property: 'Azura Benguerra Island',
                image: '/itinerary-images/safari-and-beach/property-05-azura-benguerra.jpg',
                description: "Cross from bush to beach with a flight to Vilanculos and a short boat transfer to Benguerra Island in the Bazaruto Archipelago. Twenty beach villas with private pools sit on a powder-soft crescent of sand. Three days of dhow cruises, snorkelling with whale sharks in season, and seafood under the palms; nights mean stars uninterrupted by light pollution.",
                highlight: "Sunset dhow sail with sundowners on the Indian Ocean",
                meals: "All meals and house beverages included"
            }
        ],

        properties: [
            {
                name: 'Ellerman House',
                location: 'Cape Town, South Africa',
                nights: 3,
                image: '/itinerary-images/safari-and-beach/property-01-ellerman-house.jpg',
                description: "Twelve-room Edwardian villa above Bantry Bay; museum-worthy contemporary art collection, panoramic Atlantic views.",
                note: "First-time Cape Town visitors who want the city&rsquo;s best views and service.",
                slug: null
            },
            {
                name: 'Grootbos Private Nature Reserve',
                location: 'Hermanus, South Africa',
                nights: 2,
                image: '/itinerary-images/safari-and-beach/property-02-grootbos.jpg',
                description: "Forest- and ocean-view suites across 11,000 acres of fynbos &mdash; marine Big Five from the doorstep.",
                note: "Nature lovers who want to experience coastal South Africa beyond wine country.",
                slug: null
            },
            {
                name: 'Babylonstoren',
                location: 'Franschhoek, South Africa',
                nights: 3,
                image: '/itinerary-images/safari-and-beach/property-03-babylonstoren.jpg',
                description: "A 17th-century working farm with a celebrated edible garden, Cape Dutch cottages, and ten farm-led dining venues.",
                note: "Food and wine travelers.",
                slug: null
            },
            {
                name: 'Dulini Moya',
                location: 'Sabi Sand, South Africa',
                nights: 3,
                image: '/itinerary-images/safari-and-beach/property-04-dulini-moya.jpg',
                description: "Six intimate villas on a private concession in Sabi Sand &mdash; the gold-standard Big Five game reserve.",
                note: "Leopard sightings and intimate safari experiences.",
                slug: null
            },
            {
                name: 'Azura Benguerra Island',
                location: 'Bazaruto Archipelago, Mozambique',
                nights: 3,
                image: '/itinerary-images/safari-and-beach/property-05-azura-benguerra.jpg',
                description: "Twenty beach villas with private pools on a powder-soft crescent of Indian Ocean sand.",
                note: "Barefoot luxury and post-safari recovery.",
                slug: null
            }
        ],

        included: [
            'All accommodations in private suites or villas (14 nights total)',
            'Full board at Grootbos, Dulini Moya, and Azura Benguerra; daily breakfast at Ellerman House and Babylonstoren',
            'All beverages at Dulini Moya &mdash; boutique South African wines, spirits, beers, and soft drinks; mini-bar included',
            'House wines, local beers and spirits, soft drinks, tea, coffee, and bottled water at Azura Benguerra, plus a daily sunset cocktail',
            'Twice-daily game drives in Sabi Sand with private ranger and tracker, refreshments on game drive, and guided bush walks',
            'Grootbos guided activities &mdash; 4x4 flower safari, nature walks and hikes, fynbos horseback experience, ancient cave visit, and beach picnics',
            'Babylonstoren guided garden tour, farm walk, cellar tour and wine tasting, bicycles, rowing at the dam, and morning harvest with the gardeners',
            'Sunset dhow cruise, kayaks, paddleboards, and snorkelling equipment at Azura Benguerra; scenic island Land Rover drive',
            'Includes all internal flights and private transfers to and from hotels and lodges &amp; all activities',
            'All park, conservation, and reserve fees (including Bazaruto Archipelago National Marine Park)',
            'Wi-Fi at every property',
            'Laundry service at Dulini Moya',
            'Concierge support throughout the journey'
        ],

        notIncluded: [
            'International airfare to/from South Africa',
            'Visas, travel insurance, and required vaccinations',
            'Gratuities for guides, trackers, and property staff',
            'Personal expenses, premium spirits, and items not specified',
            'Spa treatments unless explicitly noted'
        ],

        addOns: [
            {
                name: 'Private helicopter game viewing over Sabi Sand',
                description: "A one-hour aerial survey of the reserve at sunrise &mdash; a Wilson favorite for photographers and second-time safari travelers.",
                from: 1200
            },
            {
                name: 'Bazaruto private dhow charter',
                description: "Full-day private dhow charter with crew, lunch on a sand bar, and snorkelling at Two Mile Reef.",
                from: 850
            },
            {
                name: 'Cape Winelands private chef dinner',
                description: "A multi-course wine-pairing menu prepared by a guest chef in a private cellar at Babylonstoren.",
                from: 350
            }
        ]
    },

    'classic-japan': {
        title: 'The Classic Japan Itinerary',
        subtitle: 'Tokyo, Hakone, Osaka &amp; Kyoto',
        heroImage: '/itinerary-images/classic-japan/00-hero.jpg',
        duration: '9 days',
        nights: 8,
        countries: ['Japan'],
        priceFrom: 20995,
        priceCurrency: 'USD',
        priceNote: "Per person, double occupancy &mdash; excludes international airfare. Single supplement and solo pricing on request.",
        priceTooltip: "Per person, based on double occupancy. Price includes all accommodation, private guides, experiences, transfers, and the bullet train south to Osaka. Based on travelling off-peak; peak-season supplements may apply. Price excludes international flights but these can be arranged on request.",
        propertyNoteLabel: 'Why we chose it',
        ctaTitle: 'Ready to experience Japan your way?',
        ctaBody: "This itinerary is a starting point. We&rsquo;ll tailor the pacing, hotels, dining, and experiences around how you like to travel.",
        ctaLabel: 'Start Planning This Trip',
        whyDifferent: {
            title: 'Why this journey is different',
            body: "This isn&rsquo;t a standard Japan itinerary. You&rsquo;re traveling with private guides throughout, staying at some of Japan&rsquo;s most sought-after luxury properties, and experiencing cultural moments that are difficult to arrange independently.<br><br>The value isn&rsquo;t in seeing more. It&rsquo;s in seeing Japan well."
        },
        whyBook: {
            title: 'Why book this with Wander by Wilson?',
            intro: 'Every departure is customized around your dates, interests, and travel style. Common adjustments include:',
            items: [
                'Additional nights in Tokyo or Kyoto',
                'Michelin dining reservations',
                'Cherry blossom departures',
                'Autumn foliage departures',
                'Family-friendly pacing',
                'Upgraded hotel categories',
                'Extension to Naoshima or Kanazawa'
            ]
        },

        overview: "Nine days that move at the pace Japan teaches &mdash; neon-lit Tokyo evenings and the chefs who quietly perfect a single craft, a night under tatami at G&ocirc;ra Kadan, the bullet-train glide past Mt Fuji into Osaka&rsquo;s street-food laneways, and Kyoto&rsquo;s gold-leaf temples reflected in still ponds. Japan compresses centuries into a morning; this trip is built so you don&rsquo;t miss the quiet hours between.",

        wilsonNote: "Japan rewards the slow traveler. This is the trip we&rsquo;d send you on if you&rsquo;ve never been &mdash; and the one we&rsquo;d happily do again ourselves.",

        bestFor: "First-time Japan travelers who want Tokyo, Kyoto and a proper ryokan night done at the best version of each, design and craft devotees who&rsquo;d rather watch a sushi chef at work than queue for the Skytree, and couples or close-knit groups who want a journey where the lodging is half the experience.",

        highlights: [
            { label: 'Private sushi experience in Tokyo' },
            { label: 'Japan&rsquo;s most iconic luxury ryokan' },
            { label: 'Mt. Fuji from the Shinkansen' },
            { label: 'Private tea ceremony in Kyoto' }
        ],

        legs: [
            {
                days: 'Days 1&ndash;3',
                title: 'Tokyo, at Full Tilt',
                property: 'Four Seasons Hotel Tokyo at Otemachi',
                image: '/itinerary-images/classic-japan/property-01-four-seasons-tokyo.jpg',
                description: "Settle in above the Imperial Palace at Four Seasons Otemachi. Days move between Sens&omacr;-ji in Asakusa and Meiji Shrine, a private taiko-drum workshop where you actually play, the Toyosu fish market at first light, and a chef-led sushi class that ends with the lunch you made yourself. The city&rsquo;s energy shifts constantly &mdash; from Shibuya Crossing to Harajuku, from hidden sushi counters to peaceful gardens &mdash; with Mt. Fuji visible on clear afternoons.",
                highlight: "Private taiko drum workshop and chef-led sushi class",
                meals: "Breakfast daily, plus 2 lunches"
            },
            {
                days: 'Day 4',
                title: 'A Night at G&ocirc;ra Kadan',
                property: 'G&ocirc;ra Kadan',
                image: '/itinerary-images/classic-japan/property-02-gora-kadan.jpg',
                description: "Travel to Hakone hot-spring country in Fuji-Hakone-Izu National Park. The Hakone Ropeway delivers the postcard view of Mt Fuji; the Hakone Open-Air Museum sets Henry Moore, Rodin, and a hundred-piece Picasso pavilion against forested hillsides. Evening brings you to G&ocirc;ra Kadan &mdash; one of Japan&rsquo;s most celebrated ryokans &mdash; for a kaiseki dinner you eat in yukata by lantern, and a private onsen soak before bed.",
                highlight: "Kaiseki dinner and private onsen at G&ocirc;ra Kadan",
                meals: "Breakfast, lunch, and a kaiseki dinner"
            },
            {
                days: 'Days 5&ndash;6',
                title: 'Osaka &amp; Nara',
                property: 'Four Seasons Hotel Osaka',
                image: '/itinerary-images/classic-japan/property-03-four-seasons-osaka.jpg',
                description: "Bullet train south to Osaka, where evenings unfold along the Dotonbori district&rsquo;s takoyaki stalls and neon-mirrored canals. A day trip to Nara &mdash; Japan&rsquo;s first capital &mdash; takes you to Todai-ji and its towering bronze Buddha, then through Nara Park, where the sika deer are considered messengers of the gods and will bow for a cracker, and ends at Kasuga Taisha for a private Shinto ceremony we&rsquo;ve arranged in advance.",
                highlight: "Private Shinto ceremony at Kasuga Taisha",
                meals: "Breakfast daily, plus 2 lunches"
            },
            {
                days: 'Days 7&ndash;8',
                title: 'Kyoto: Gold Leaf and Stillness',
                property: 'Hotel The Mitsui Kyoto',
                image: '/itinerary-images/classic-japan/property-04-mitsui-kyoto.jpg',
                description: "Kyoto rewards the unhurried. Ryoan-ji&rsquo;s rock garden &mdash; fifteen stones arranged so you can only ever see fourteen at once &mdash; is the kind of thing you keep thinking about for weeks; Kinkaku-ji&rsquo;s gold-leaf pavilion mirrors perfectly in its pond when the morning light is right. Afternoons take in the Arashiyama bamboo grove and Kiyomizu-dera&rsquo;s hillside terrace. Your final morning is a private tea ceremony in a temple &mdash; the slowest, most precise hour of the trip, by design.",
                highlight: "Private tea ceremony at a Kyoto temple",
                meals: "Breakfast daily, plus 1 lunch"
            }
        ],

        properties: [
            {
                name: 'Four Seasons Hotel Tokyo at Otemachi',
                location: 'Tokyo, Japan',
                nights: 3,
                image: '/itinerary-images/classic-japan/property-01-four-seasons-tokyo.jpg',
                description: "Modern luxury above the Imperial Palace, with floor-to-ceiling Tokyo views that stretch to Mt Fuji on clear days.",
                note: "The best blend of Tokyo views, location, and contemporary luxury.",
                slug: null
            },
            {
                name: 'G&ocirc;ra Kadan',
                location: 'Hakone, Japan',
                nights: 1,
                image: '/itinerary-images/classic-japan/property-02-gora-kadan.jpg',
                description: "A heritage ryokan in Hakone hot-spring country &mdash; tatami suites, private onsen, and one of Japan&rsquo;s most celebrated kaiseki kitchens.",
                note: "One of Japan&rsquo;s most celebrated ryokans.",
                slug: null
            },
            {
                name: 'Four Seasons Hotel Osaka',
                location: 'Osaka, Japan',
                nights: 2,
                image: '/itinerary-images/classic-japan/property-03-four-seasons-osaka.jpg',
                description: "Modern Four Seasons polish in central Osaka, with Dotonbori&rsquo;s street food and the Shinkansen station within easy reach.",
                note: "The strongest luxury base for Osaka and Nara.",
                slug: null
            },
            {
                name: 'Hotel The Mitsui Kyoto',
                location: 'Kyoto, Japan',
                nights: 2,
                image: '/itinerary-images/classic-japan/property-04-mitsui-kyoto.jpg',
                description: "A Luxury Collection property on the grounds of a 250-year-old Mitsui family estate, opposite Nijo Castle &mdash; private onsen suites and a thermal spring spa.",
                note: "Kyoto&rsquo;s most refined modern hotel experience.",
                slug: null
            }
        ],

        included: [
            'All accommodations in heritage hotels and a celebrated ryokan (8 nights total)',
            'Daily breakfast, plus select lunches and the kaiseki dinner at G&ocirc;ra Kadan',
            'Private English-speaking local guides throughout',
            'Bullet train (Shinkansen) journey Tokyo to Osaka',
            'Private taiko drum workshop in Tokyo',
            'Chef-led sushi-making class followed by lunch',
            'Private Shinto ceremony at Kasuga Taisha Shrine in Nara',
            'Private tea ceremony at a Kyoto temple',
            'All entrance fees to Asakusa Kannon, Meiji Shrine, Edo-Tokyo Museum, Hakone Open Air Museum, Okada Museum, Todai-ji, Ryoan-ji, Kinkaku-ji, Tenryu-ji, Arashiyama Bamboo Grove, and Kiyomizu-dera',
            'Includes all internal transfers, private airport meet-and-greet, and on-the-ground support throughout',
            'Concierge support throughout the journey'
        ],

        notIncluded: [
            'International airfare to/from Japan',
            'Visas, travel insurance, and required vaccinations',
            'Meals not specified (most dinners and select lunches)',
            'Gratuities for guides, drivers, and property staff',
            'Personal expenses, premium spirits, and items not specified'
        ]
    },

    'iconic-greece': {
        title: 'Athens &amp; the Iconic Greek Islands',
        subtitle: 'Athens, Crete, Santorini &amp; Mykonos',
        heroImage: '/itinerary-images/iconic-greece/00-hero-day.jpg',
        duration: '13 days',
        nights: 13,
        countries: ['Greece'],
        priceFrom: 19795,
        priceCurrency: 'USD',
        priceNote: "Per person, double occupancy &mdash; excludes international airfare. Solo and family pricing on request.",
        priceTooltip: "Per person, based on double occupancy. Price includes all accommodation, private guides, the experiences listed below, inter-island transfers, and airport transfers. Based on travelling off-peak; high-summer (July&ndash;August) supplements may apply. Price excludes international flights but these can be arranged on request.",
        whyBook: {
            title: 'Why book this with Wander by Wilson?',
            intro: 'When you inquire through Wander by Wilson, we&rsquo;ll:',
            items: [
                'Confirm current pricing and availability',
                'Tailor the routing and length of stay to your dates',
                'Advise on room categories worth the upgrade',
                'Arrange flights, ferries, and private transfers',
                'Secure preferred-partner amenities where available'
            ],
            ctaLabel: 'Start Planning'
        },

        overview: "Thirteen days from marble to sea. Athens&rsquo; Parthenon lit at dusk, Crete&rsquo;s olive groves and Minoan ruins, Santorini&rsquo;s whitewashed houses tipped over the caldera at sunset, and Mykonos&rsquo; windmills and harbor lanes for the slow last act. Four destinations, four extraordinary hotels, and the Aegean from every angle.",

        wilsonNote: "Greece looks like the photos. The trick is staying long enough to notice what the photos miss &mdash; lunch at a harbor taverna, a swim off the rocks before dinner, the third glass of assyrtiko as the sun disappears behind the caldera.",

        bestFor: "Travelers who believe where you stay matters as much as where you go, couples chasing the postcard moments done at the best version of each, and island-hoppers who would rather unpack once than race to a new harbor every day.",

        highlights: [
            { label: 'The Acropolis at golden hour' },
            { label: 'Cretan vineyards and Spinalonga' },
            { label: 'Santorini&rsquo;s caldera at sunset' },
            { label: 'Mykonos windmills and Delos ruins' }
        ],

        legs: [
            {
                days: 'Days 1&ndash;3',
                title: 'Marble and Markets in Athens',
                property: 'Hotel Grande Bretagne',
                image: '/itinerary-images/iconic-greece/property-01-grande-bretagne.jpg',
                description: "Three days in Athens, based at the Grande Bretagne overlooking Syntagma Square with the Parthenon visible from the rooftop bar. Begin with the Acropolis Museum before stepping onto the Acropolis itself with a private guide, then leave room to wander. Walk through Plaka with stops for honey, cheese, and olive oil at family-run shops in Varvakios Market, and end with an evening drive south to Cape Sounion to watch sundown at the Temple of Poseidon.",
                highlight: "Guided Parthenon visit and a Plaka food walk through Varvakios Market",
                meals: "Breakfast daily"
            },
            {
                days: 'Days 4&ndash;6',
                title: 'East Crete: Olives and Ruins',
                property: 'Phaea Blue',
                image: '/itinerary-images/iconic-greece/property-02-phaea-blue.jpg',
                description: "Fly to Heraklion and drive east along Crete&rsquo;s north coast to Elounda. Phaea Blue is your base &mdash; a low-rise contemporary resort folded into the hillside above the Gulf of Mirabello. An expert-led tour of the Palace of Knossos sets the Minoan scene; another day takes you by private boat to Spinalonga, the Venetian fortress turned leper colony, with lunch in the flower-filled village of Plaka after. In between: long mornings by the sea, olive oil tastings in the hills, vineyards in the inland sun.",
                highlight: "Private boat to Spinalonga and lunch in Plaka village",
                meals: "Breakfast daily, plus 1 lunch"
            },
            {
                days: 'Days 7&ndash;9',
                title: 'The Caldera, Slowly',
                property: 'Canaves Ena',
                image: '/itinerary-images/iconic-greece/property-03-canaves-ena.jpg',
                description: "A short hop to Santorini and into Canaves Ena &mdash; a cliff-edge hotel in Oia with terraces hung directly over the caldera. Days take in the island&rsquo;s quieter corners: a backcountry tour to black-sand Perivolos Beach and the mountaintop Monastery of Prophitis Ilias, with private wine tastings at family estates pouring assyrtiko whites and Mavrotragano reds. Evenings are for the sunset over the volcanic rim &mdash; yours, with a glass of something cold, from your own terrace.",
                highlight: "Wine tastings at family estates and a sunset from your private terrace",
                meals: "Breakfast daily, plus 1 lunch"
            },
            {
                days: 'Days 10&ndash;13',
                title: 'Mykonos, the Slow Last Act',
                property: 'Bill &amp; Coo Mykonos',
                image: '/itinerary-images/iconic-greece/property-04-bill-and-coo.jpg',
                description: "Four nights at Bill &amp; Coo on Megali Ammos, just below Mykonos Town. One morning crosses by private boat to Delos &mdash; the uninhabited island where Greek myth says Artemis and Apollo were born, now an open-air archaeological site as photographable as it is hot. The rest is yours: harbor lanes lined with whitewashed buildings and bougainvillea, paradise-named beaches, the windmills above Little Venice, and long lunches that turn into long afternoons.",
                highlight: "Private boat crossing to Delos and the archaeological site",
                meals: "Breakfast daily, plus 1 lunch"
            }
        ],

        properties: [
            {
                name: 'Hotel Grande Bretagne',
                location: 'Athens, Greece',
                nights: 3,
                image: '/itinerary-images/iconic-greece/property-01-grande-bretagne.jpg',
                description: "An iconic 1874 hotel facing Syntagma Square, with a rooftop pool and bar looking straight onto the Acropolis.",
                slug: null
            },
            {
                name: 'Phaea Blue',
                location: 'Elounda, Crete',
                nights: 3,
                image: '/itinerary-images/iconic-greece/property-02-phaea-blue.jpg',
                description: "Low-rise contemporary resort folded into the hillside above the Gulf of Mirabello, with private beach access and sea-facing suites.",
                slug: null
            },
            {
                name: 'Canaves Ena',
                location: 'Oia, Santorini',
                nights: 3,
                image: '/itinerary-images/iconic-greece/property-03-canaves-ena.jpg',
                description: "Cliff-edge suites in Oia with caldera-facing infinity terraces &mdash; a small, design-led property at the island&rsquo;s quietest end.",
                slug: null
            },
            {
                name: 'Bill &amp; Coo Mykonos',
                location: 'Megali Ammos, Mykonos',
                nights: 4,
                image: '/itinerary-images/iconic-greece/property-04-bill-and-coo.jpg',
                description: "Whitewashed adults-only retreat on Megali Ammos beach, ten minutes from Mykonos Town, and one of the most reliably good kitchens on the island.",
                slug: null
            }
        ],

        included: [
            'All accommodations in hand-selected hotels (13 nights total)',
            'Daily breakfast at every property',
            'Guided tour of the Acropolis, Parthenon, and Acropolis Museum in Athens',
            'Cape Sounion excursion to the Temple of Poseidon',
            'Plaka walking food tour through Varvakios Market in Athens',
            'Expert-led tour of the Palace of Knossos or a Cretan winery tasting en route',
            'Private boat visit to Spinalonga Island and lunch in Plaka village, Crete',
            'Santorini backcountry tour &mdash; Perivolos Beach, Monastery of Prophitis Ilias, and private wine tastings at family estates',
            'Boat crossing to Delos for the archaeological site',
            'Evening guided tour of Mykonos',
            'Private English-speaking local guides throughout',
            'Includes all internal flights and private transfers to and from hotels &amp; all activities',
            'Concierge support throughout the journey'
        ],

        notIncluded: [
            'International airfare to/from Greece',
            'Visas and travel insurance',
            'Most lunches and dinners',
            'Gratuities for guides, drivers, and property staff',
            'Personal expenses, premium spirits, and items not specified'
        ]
    }
};
