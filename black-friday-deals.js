/* ==========================================================================
   Black Friday + Cyber Monday 2026 deals, shown on /black-friday
   --------------------------------------------------------------------------
   Sources: Grand Velas offers from velasresorts.com/hotel-packages (read 2026-11-21).
   SmartFlyer Society toolkit "Black Friday Promotions 2026"
   (society.smartflyer.com/toolkit-detail?id=131), read 2026-11-21.

   HOW TO UPDATE
   - Add a deal: copy any block below, change the fields, save.
   - End a deal early: set  hidden: true
   - Deals hide on their own the day after `bookBy`.
   - Deals with a future `bookFrom` show an "Opens Nov 26" tag until then.
   - After editing, bump  black-friday-deals.js?v=N  in black-friday.html.

   FIELDS
   id        unique, lowercase-with-dashes. Also fills the hotel name on the
             "Have us book it" form unless `slug` is set.
   slug      the hotel's site page slug (/hotels/{slug}), if it has one.
   region    mexico | caribbean | europe | asia | usa-west | usa-east | cruise
   brand     optional, e.g. 'Auberge Collection' (shows above the hotel name)
   offer     the one-line headline
   details   short bullets (no promo codes, ever)
   bookFrom  first day to book (YYYY-MM-DD), optional
   bookBy    last day to book (YYYY-MM-DD)
   travel    plain-text travel window
   ========================================================================== */
window.BF_DEALS = [
  // ---------------- Mexico ----------------
  {
    id: 'oneandonly-mandarina', slug: 'oneandonly-mandarina',
    name: 'One&Only Mandarina', place: 'Riviera Nayarit, Mexico', region: 'mexico',
    offer: 'Up to 25% off + up to $1,000 resort credit',
    details: ['3-night minimum', 'Credit from $200 (rooms, suites, 1BR) up to $1,200 (6BR homes)'],
    bookBy: '2026-12-03', travel: 'Now through Dec 15, 2027'
  },
  {
    id: 'oneandonly-palmilla',
    name: 'One&Only Palmilla', place: 'Los Cabos, Mexico', region: 'mexico',
    offer: 'Up to 30% off + $100 daily resort credit',
    details: ['Daily credit for dining, spa and more'],
    bookBy: '2026-12-03', travel: 'Now through Dec 15, 2027'
  },
  {
    id: 'waldorf-astoria-los-cabos-pedregal',
    name: 'Waldorf Astoria Los Cabos Pedregal', place: 'Los Cabos, Mexico', region: 'mexico',
    offer: 'Up to 35% off + $500 resort credit',
    details: ['3-night minimum', 'Credit is per stay'],
    bookFrom: '2026-11-23', bookBy: '2026-12-11', travel: 'Nov 30, 2026 to Oct 31, 2027'
  },
  {
    id: 'nizuc-resort-spa',
    name: 'NIZUC Resort & Spa', place: 'Cancún, Mexico', region: 'mexico',
    offer: 'Special Black Friday rates',
    details: ['2-night minimum', 'Excludes the three signature villas'],
    bookBy: '2026-12-03', travel: 'Jan 3 to Dec 18, 2027'
  },
  {
    id: 'grand-velas-riviera-maya', slug: 'grand-velas-riviera-maya',
    name: 'Grand Velas Riviera Maya', place: 'Riviera Maya, Mexico', region: 'mexico',
    offer: 'Up to 20% off suites + kids stay free',
    details: ['All-inclusive', '50% off the teen rate', '$50 spa credit per adult, per night', 'A lifestyle photoshoot', 'Not valid Easter, Thanksgiving, Christmas or New Year\'s Eve'],
    bookBy: '2026-12-03', travel: 'Now through Dec 17, 2027'
  },
  {
    id: 'grand-velas-los-cabos',
    name: 'Grand Velas Los Cabos', place: 'Los Cabos, Mexico', region: 'mexico',
    offer: 'Up to 25% off suites + kids stay free',
    details: ['All-inclusive', '50% off the teen rate + airport transfers', '$50 spa credit per adult, per night', 'Not valid Easter, Thanksgiving, Christmas or New Year\'s Eve'],
    bookBy: '2026-12-03', travel: 'Now through Dec 17, 2027'
  },
  {
    id: 'grand-velas-boutique-los-cabos',
    name: 'Grand Velas Boutique Los Cabos', place: 'Los Cabos, Mexico (adults only)', region: 'mexico',
    offer: 'Up to 20% off suites + $50 nightly spa credit',
    details: ['All-inclusive', '50% off airport transfers', '$50 toward a romantic experience', 'Not valid Easter, Thanksgiving, Christmas or New Year\'s Eve'],
    bookBy: '2026-12-03', travel: 'Now through Dec 17, 2027'
  },
  {
    id: 'grand-velas-riviera-nayarit',
    name: 'Grand Velas Riviera Nayarit', place: 'Nuevo Vallarta, Mexico', region: 'mexico',
    offer: 'Up to 20% off + a suite upgrade + kids stay free',
    details: ['All-inclusive', '50% off the teen rate', '$50 spa credit per adult, per night', 'Not valid Easter, Thanksgiving, Christmas or New Year\'s Eve'],
    bookBy: '2026-12-03', travel: 'Now through Dec 17, 2027'
  },

  // ---------------- Caribbean + Bermuda ----------------
  {
    id: 'round-hill-hotel-and-villas',
    name: 'Round Hill Hotel & Villas', place: 'Montego Bay, Jamaica', region: 'caribbean',
    offer: '35% off + $50 resort credit + 20% off spa',
    details: ['4-night minimum', 'Rooms, suites and villas', 'Four-day booking window only'],
    bookFrom: '2026-11-26', bookBy: '2026-11-29', travel: 'Jan 19 to Dec 16, 2027'
  },
  {
    id: 'half-moon',
    name: 'Half Moon', place: 'Montego Bay, Jamaica', region: 'caribbean',
    offer: 'Up to 35% off every room category',
    details: ['3-night minimum', 'Non-refundable', 'Holiday blackout dates apply'],
    bookBy: '2026-12-02', travel: 'Now through Dec 22, 2027'
  },
  {
    id: 'jamaica-inn',
    name: 'Jamaica Inn', place: 'Ocho Rios, Jamaica', region: 'caribbean',
    offer: '30% off all accommodations',
    details: ['Our Virtuoso perks still apply'],
    bookBy: '2026-12-19', travel: 'Dec 1, 2026 to Dec 19, 2027'
  },
  {
    id: 'oil-nut-bay',
    name: 'Oil Nut Bay', place: 'Virgin Gorda, BVI', region: 'caribbean',
    offer: 'Stay 5 nights, pay for 3',
    details: ['Spring and early summer travel'],
    bookBy: '2026-12-04', travel: 'Apr 6 to Jul 31, 2027'
  },
  {
    id: 'secret-bay',
    name: 'Secret Bay', place: 'Dominica', region: 'caribbean',
    offer: '40% off villas + breakfast, transfers and more',
    details: ['Daily breakfast', 'Welcome dinner at Bwa Denn', 'Airport transfers + Indian River tour'],
    bookFrom: '2026-11-23', bookBy: '2026-12-02', travel: 'Jun 1 to Oct 31, 2027'
  },
  {
    id: 'six-senses-la-sagesse',
    name: 'Six Senses La Sagesse', place: 'Grenada', region: 'caribbean',
    offer: '$250 resort credit on top of our perks',
    details: ['Five-day booking window'],
    bookFrom: '2026-11-27', bookBy: '2026-12-01', travel: 'Dec 1, 2026 to Aug 15, 2027'
  },
  {
    id: 'the-loren-bermuda',
    name: 'The Loren', place: 'Bermuda', region: 'caribbean',
    offer: 'Stay 4 nights, pay for 3',
    details: ['Blackout dates apply'],
    bookFrom: '2026-11-27', bookBy: '2027-01-31', travel: 'Now through Mar 24, 2027'
  },

  // ---------------- Europe ----------------
  {
    id: 'casa-angelina', slug: 'casa-angelina',
    name: 'Casa Angelina', place: 'Amalfi Coast, Italy', region: 'europe',
    offer: '10% off + priority upgrade',
    details: ['2-night minimum', 'Every room and suite', 'Upgrade subject to availability'],
    bookFrom: '2026-11-23', bookBy: '2026-11-30', travel: 'Mar 24 to Oct 31, 2027'
  },
  {
    id: 'grand-hotel-du-palais-royal',
    name: 'Grand Hôtel du Palais Royal', place: 'Paris, France', region: 'europe',
    offer: '30% off 2027 stays',
    details: ['Our Virtuoso perks still apply', 'Not valid during Fashion Weeks'],
    bookBy: '2026-12-03', travel: 'Through Dec 24, 2027'
  },
  {
    id: 'grand-powers',
    name: 'Grand Powers', place: 'Paris, France', region: 'europe',
    offer: '30% off 2027 stays',
    details: ['Our Virtuoso perks still apply', 'Not valid during Fashion Weeks'],
    bookBy: '2026-12-03', travel: 'Through Dec 24, 2027'
  },
  {
    id: 'six-senses-london',
    name: 'Six Senses London', place: 'London, England', region: 'europe',
    offer: '25% off',
    details: ['2-night minimum'],
    bookBy: '2026-11-30', travel: 'Now through Mar 31, 2027'
  },

  // ---------------- Asia + Indian Ocean ----------------
  {
    id: 'conrad-maldives-rangali-island',
    name: 'Conrad Maldives Rangali Island', place: 'Maldives', region: 'asia',
    offer: '20% off + free half board + $100 credit',
    details: ['25 to 30% off seaplane transfers', 'Double Hilton Honors points'],
    bookBy: '2026-12-31', travel: 'Now through Dec 31, 2027'
  },
  {
    id: 'banyan-tree-samui',
    name: 'Banyan Tree Samui', place: 'Koh Samui, Thailand', region: 'asia',
    offer: 'Up to 25% off longer stays',
    details: ['4+ nights: resort credit for dining and spa', '9+ nights: airport transfers, a Saffron dinner and a rainforest spa experience'],
    bookBy: '2026-12-03', travel: 'Now through Jun 30, 2027'
  },
  {
    id: 'banyan-tree-krabi',
    name: 'Banyan Tree Krabi', place: 'Krabi, Thailand', region: 'asia',
    offer: 'Stay more, pay less on pool suites and villas',
    details: ['Savings grow with longer stays'],
    bookBy: '2026-12-03', travel: 'Now through Jun 30, 2027'
  },
  {
    id: 'viceroy-bali',
    name: 'Viceroy Bali', place: 'Ubud, Bali', region: 'asia',
    offer: 'Black Friday villa rates + airport transfer',
    details: ['2-night minimum for the transfer'],
    bookBy: '2026-12-06', travel: 'Now through Dec 23, 2027'
  },

  // ---------------- USA ----------------
  {
    id: 'oneandonly-moonlight-basin',
    name: 'One&Only Moonlight Basin', place: 'Big Sky, Montana', region: 'usa-west',
    offer: 'Up to 25% off + up to $1,200 resort credit',
    details: ['Credit depends on room category'],
    bookBy: '2026-12-03', travel: 'Now through Dec 15, 2027'
  },
  {
    id: 'caldera-house',
    name: 'Caldera House', place: 'Jackson Hole, Wyoming', region: 'usa-west',
    offer: '15% off + $200 resort credit',
    details: ['5-night minimum', 'Blackout dates apply'],
    bookBy: '2026-12-14', travel: 'Nov 2026 to Oct 2027'
  },
  {
    id: 'carneros-resort-and-spa',
    name: 'Carneros Resort and Spa', place: 'Napa Valley, California', region: 'usa-west',
    offer: 'Cyber Sale rates + $100 daily resort credit',
    details: ['Winter wine country'],
    bookBy: '2026-12-01', travel: 'Now through Mar 31, 2027'
  },
  {
    id: 'waldorf-astoria-monarch-beach',
    name: 'Waldorf Astoria Monarch Beach', place: 'Dana Point, California', region: 'usa-west',
    offer: '25% off every room and suite',
    details: [],
    bookBy: '2026-12-31', travel: 'Now through Mar 31, 2027'
  },

  // ---------------- Added 2026-11-21 (Wilson): Sanctuary + Salt Hotels ----------------
  {
    id: 'sanctuary-camelback-mountain',
    name: 'Sanctuary Camelback Mountain', place: 'Scottsdale, Arizona', region: 'usa-west',
    offer: '20% off + $100 resort credit',
    details: ['Credit toward the spa and dining', 'Casitas + suites'],
    bookBy: '2026-11-30', travel: 'Now through Apr 30, 2027'
  },
  {
    id: 'salt-house-inn', brand: 'Salt Hotels',
    name: 'Salt House Inn', place: 'Provincetown, Massachusetts', region: 'usa-east',
    offer: 'Up to 30% off',
    details: ['2 nights: 20% off', '3 nights: 30% off', 'Blackout dates apply'],
    bookFrom: '2026-11-20', bookBy: '2026-12-01', travel: 'Dec 4, 2026 to Oct 23, 2027'
  },
  {
    id: 'the-abner', brand: 'Salt Hotels',
    name: 'The Abner', place: 'Litchfield, Connecticut', region: 'usa-east',
    offer: 'Up to 30% off',
    details: ['1 night: 25% off', '2 nights: 30% off', 'Blackout dates apply'],
    bookFrom: '2026-11-20', bookBy: '2026-12-01', travel: 'Now through Aug 31, 2027'
  },
  {
    id: 'the-brant-nantucket', brand: 'Salt Hotels',
    name: 'The Brant', place: 'Nantucket, Massachusetts', region: 'usa-east',
    offer: 'Up to 30% off summer 2027',
    details: ['2 nights: 20% off', '3 nights: 30% off', 'Blackout dates apply'],
    bookFrom: '2026-11-20', bookBy: '2026-12-01', travel: 'Apr 1 to Dec 2, 2027'
  },

  // ---------------- Auberge Collection (sheet: More Discovery, More Auberge, read 2026-11-21) ----------------
  {
    id: 'esperanza-an-auberge-resort', brand: 'Auberge Collection',
    name: 'Esperanza', place: 'Los Cabos, Mexico', region: 'mexico',
    offer: 'Save up to 40%',
    details: ['Prepaid and non-refundable', 'Blackout dates apply'],
    bookBy: '2026-12-07', travel: 'Nov 19, 2026 to May 31, 2027'
  },
  {
    id: 'chileno-bay-resort-residences', brand: 'Auberge Collection',
    name: 'Chileno Bay Resort & Residences', place: 'Los Cabos, Mexico', region: 'mexico',
    offer: 'Save up to 40%',
    details: ['Prepaid and non-refundable', 'Blackout dates apply'],
    bookBy: '2026-12-07', travel: 'Nov 19, 2026 to May 31, 2027'
  },
  {
    id: 'etereo-auberge-resorts-collection', brand: 'Auberge Collection',
    name: 'Etéreo', place: 'Riviera Maya, Mexico', region: 'mexico',
    offer: 'Save up to 40%',
    details: ['Prepaid and non-refundable', 'Not valid Dec 24 to Jan 2'],
    bookBy: '2026-12-07', travel: 'Now through Oct 30, 2027'
  },
  {
    id: 'susurros-del-corazon', brand: 'Auberge Collection',
    name: 'Susurros del Corazón', place: 'Punta de Mita, Mexico', region: 'mexico',
    offer: 'Save up to 40%',
    details: ['Prepaid and non-refundable', 'Not valid Nov 24 to 28 or Dec 24 to Jan 2'],
    bookBy: '2026-12-07', travel: 'Now through Oct 31, 2027'
  },
  {
    id: 'hacienda-altagracia', brand: 'Auberge Collection',
    name: 'Hacienda AltaGracia', place: 'Pérez Zeledón, Costa Rica', region: 'mexico',
    offer: '$500 daily resort credit',
    details: ['5-night minimum'],
    bookBy: '2026-12-07', travel: 'Now through May 31, 2027'
  },
  {
    id: 'collegio-alla-querce', brand: 'Auberge Collection',
    name: 'Collegio alla Querce', place: 'Florence, Italy', region: 'europe',
    offer: 'Up to €200 nightly resort credit',
    details: ['€100 rooms, €200 suites', '2-night minimum'],
    bookBy: '2026-12-07', travel: 'Now through Dec 31, 2027'
  },
  {
    id: 'domaine-des-etangs', brand: 'Auberge Collection',
    name: 'Domaine des Etangs', place: 'Massignac, France', region: 'europe',
    offer: 'Up to €400 nightly resort credit',
    details: ['€100 to €400, depending on the room', '2-night minimum'],
    bookBy: '2026-12-07', travel: 'May 1 to Oct 30, 2027'
  },
  {
    id: 'grace-hotel-santorini', brand: 'Auberge Collection',
    name: 'Grace Hotel', place: 'Santorini, Greece', region: 'europe',
    offer: '€100 nightly resort credit',
    details: ['Every room type'],
    bookBy: '2026-12-07', travel: 'Apr 12 to May 31 + Oct 2027'
  },
  {
    id: 'the-woodward-geneva', brand: 'Auberge Collection',
    name: 'The Woodward', place: 'Geneva, Switzerland', region: 'europe',
    offer: 'Up to CHF 500 nightly resort credit',
    details: ['CHF 300 Junior, Deluxe + Executive', 'CHF 500 Bellevue and above', '2-night minimum'],
    bookBy: '2026-12-07', travel: 'Nov 2026 to Dec 2027'
  },
  {
    id: 'auberge-du-soleil', brand: 'Auberge Collection',
    name: 'Auberge du Soleil', place: 'Napa Valley, California', region: 'usa-west',
    offer: 'Up to $250 daily resort credit',
    details: ['$150 Deluxe Rooms', '$250 suites + Private Maisons', '2-night minimum'],
    bookBy: '2026-12-07', travel: 'Now through Apr 30, 2027'
  },
  {
    id: 'solage', brand: 'Auberge Collection',
    name: 'Solage', place: 'Napa Valley, California', region: 'usa-west',
    offer: 'Up to $250 daily resort credit',
    details: ['$100 standard, $150 premium, $250 suites', '2-night minimum'],
    bookBy: '2026-12-07', travel: 'Nov 12, 2026 to Mar 31, 2027'
  },
  {
    id: 'stanly-ranch', brand: 'Auberge Collection',
    name: 'Stanly Ranch', place: 'Napa Valley, California', region: 'usa-west',
    offer: 'Up to $600 daily resort credit',
    details: ['$200 rooms, $400 suites, $600 residences', 'Blackout dates apply'],
    bookBy: '2026-12-07', travel: 'Now through Mar 31, 2027'
  },
  {
    id: 'the-inn-at-matteis-tavern', brand: 'Auberge Collection',
    name: 'The Inn at Mattei\'s Tavern', place: 'Santa Ynez Valley, California', region: 'usa-west',
    offer: 'Up to $300 nightly resort credit',
    details: ['$200 rooms, $300 suites', '2-night minimum'],
    bookBy: '2026-12-07', travel: 'Now through May 19, 2027'
  },
  {
    id: 'mauna-lani', brand: 'Auberge Collection',
    name: 'Mauna Lani', place: 'Kohala Coast, Hawaii', region: 'usa-west',
    offer: '$200 daily resort credit',
    details: ['3-night minimum'],
    bookBy: '2026-12-07', travel: 'Now through Dec 17, 2027'
  },
  {
    id: 'hotel-jerome', brand: 'Auberge Collection',
    name: 'Hotel Jerome', place: 'Aspen, Colorado', region: 'usa-west',
    offer: 'Up to $300 nightly resort credit',
    details: ['$200 Deluxe + Junior Suites', '$300 larger suites', '3-night minimum'],
    bookBy: '2026-12-07', travel: 'Now through Aug 2027'
  },
  {
    id: 'element-52', brand: 'Auberge Collection',
    name: 'Element 52', place: 'Telluride, Colorado', region: 'usa-west',
    offer: '$250 nightly resort credit',
    details: ['Per room, per night'],
    bookBy: '2026-12-07', travel: 'Now through Apr 30, 2027'
  },
  {
    id: 'madeline-hotel-residences', brand: 'Auberge Collection',
    name: 'Madeline Hotel & Residences', place: 'Telluride, Colorado', region: 'usa-west',
    offer: 'Up to $350 daily resort credit',
    details: ['$150 rooms + 1BR, $250 2BR, $350 3 to 4BR', '3-night minimum'],
    bookBy: '2026-12-07', travel: 'Nov 2026 to Oct 2027'
  },
  {
    id: 'goldener-hirsch', brand: 'Auberge Collection',
    name: 'Goldener Hirsch', place: 'Park City, Utah', region: 'usa-west',
    offer: 'Up to $300 nightly resort credit',
    details: ['$200 rooms, $300 2 to 3BR residences', '3-night minimum', 'Not valid Dec 26 to 31 or Feb 11 to 15'],
    bookBy: '2026-12-07', travel: 'Nov 25, 2026 to Apr 30, 2027'
  },
  {
    id: 'the-lodge-at-blue-sky', brand: 'Auberge Collection',
    name: 'The Lodge at Blue Sky', place: 'Park City, Utah', region: 'usa-west',
    offer: 'A free signature experience ($500 value)',
    details: ['For two adults, or a family of four', '2-night minimum'],
    bookBy: '2026-12-07', travel: 'Now through Dec 31, 2027'
  },
  {
    id: 'bishops-lodge', brand: 'Auberge Collection',
    name: 'Bishop\'s Lodge', place: 'Santa Fe, New Mexico', region: 'usa-west',
    offer: 'Up to $300 nightly resort credit',
    details: ['$200 rooms, $300 suites', '2-night minimum'],
    bookBy: '2026-12-07', travel: 'Now through May 19, 2027'
  },
  {
    id: 'commodore-perry-estate', brand: 'Auberge Collection',
    name: 'Commodore Perry Estate', place: 'Austin, Texas', region: 'usa-east',
    offer: '$100 nightly resort credit',
    details: ['2-night minimum'],
    bookBy: '2026-12-07', travel: 'Now through Sep 6, 2027'
  },
  {
    id: 'bowie-house', brand: 'Auberge Collection',
    name: 'Bowie House', place: 'Fort Worth, Texas', region: 'usa-east',
    offer: '$100 nightly resort credit',
    details: ['2-night minimum'],
    bookBy: '2026-12-07', travel: 'Now through Sep 6, 2027'
  },
  {
    id: 'the-knox', brand: 'Auberge Collection',
    name: 'The Knox', place: 'Dallas, Texas', region: 'usa-east',
    offer: 'Up to $500 nightly resort credit',
    details: ['$100 Deluxe up to $500 Grande Suites', '2-night minimum'],
    bookBy: '2026-12-07', travel: 'Feb to Dec 2027'
  },
  {
    id: 'the-dunlin', brand: 'Auberge Collection',
    name: 'The Dunlin', place: 'Kiawah River, South Carolina', region: 'usa-east',
    offer: 'Up to $250 daily resort credit',
    details: ['$150 rooms, $250 suites', 'Blackout dates apply'],
    bookBy: '2026-12-07', travel: 'Now through Sep 30, 2027'
  },
  {
    id: 'the-lodge-at-primland', brand: 'Auberge Collection',
    name: 'The Lodge at Primland', place: 'Blue Ridge Mountains, Virginia', region: 'usa-east',
    offer: '$500 resort credit on suites',
    details: ['2 to 3-night minimum'],
    bookBy: '2026-12-07', travel: 'Now through May 28, 2027'
  },
  {
    id: 'wildflower-farms', brand: 'Auberge Collection',
    name: 'Wildflower Farms', place: 'Hudson Valley, New York', region: 'usa-east',
    offer: 'Up to $200 daily resort credit',
    details: ['$100 standard rooms', '$200 suites + 2BR', '2 to 3-night minimum'],
    bookBy: '2026-12-07', travel: 'Now through Apr 29, 2027'
  },
  {
    id: 'mayflower-inn-spa', brand: 'Auberge Collection',
    name: 'Mayflower Inn & Spa', place: 'Litchfield Hills, Connecticut', region: 'usa-east',
    offer: 'Up to $200 daily resort credit',
    details: ['$150 rooms, $200 suites', 'Blackout dates apply'],
    bookBy: '2026-12-07', travel: 'Now through Apr 2027'
  },
  {
    id: 'the-vanderbilt', brand: 'Auberge Collection',
    name: 'The Vanderbilt', place: 'Newport, Rhode Island', region: 'usa-east',
    offer: '$150 daily resort credit',
    details: ['Rooms + suites', 'Blackout dates apply'],
    bookBy: '2026-12-07', travel: 'Now through Apr 2027'
  },
  {
    id: 'white-barn-inn', brand: 'Auberge Collection',
    name: 'White Barn Inn', place: 'Kennebunk, Maine', region: 'usa-east',
    offer: 'Up to $200 daily resort credit',
    details: ['$150 rooms', '$200 cottages + houseboats', 'Blackout dates apply'],
    bookBy: '2026-12-07', travel: 'Now through Apr 2027'
  },

  // ---------------- Cruises + expeditions ----------------
  {
    id: 'hx-expeditions',
    name: 'HX Expeditions', place: 'Antarctica, Galápagos, Alaska, Greenland', region: 'cruise',
    offer: 'Up to 40% off every sailing',
    details: ['Up to 25% off Antarctica', 'Up to 40% off Galápagos'],
    bookBy: '2026-12-02', travel: 'Dec 1, 2026 to Mar 31, 2028'
  },
  {
    id: 'hapag-lloyd-cruises',
    name: 'Hapag-Lloyd Cruises', place: 'Europa, Europa 2 + expedition ships', region: 'cruise',
    offer: 'Up to 40% off 28 sailings',
    details: [],
    bookBy: '2026-11-30', travel: 'Jan 1 to Aug 31, 2027'
  }
];

window.BF_REGIONS = [
  { key: 'mexico',    label: 'Mexico + Costa Rica' },
  { key: 'caribbean', label: 'Caribbean + Bermuda' },
  { key: 'europe',    label: 'Europe' },
  { key: 'asia',      label: 'Asia + Maldives' },
  { key: 'usa-west',  label: 'USA: West + Hawaii' },
  { key: 'usa-east',  label: 'USA: South + East' },
  { key: 'cruise',    label: 'Cruises + Expeditions' }
];
