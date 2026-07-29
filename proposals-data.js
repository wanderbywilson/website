/* ─────────────────────────────────────────────────────────────────────────
   PROPOSALS — private, client-specific hotel proposals.
   Rendered by /proposal.html at the clean URL  /proposals/{id}  (noindex).

   HOW TO ADD A PROPOSAL
   ─────────────────────
   Add a new key below, then share  https://www.wanderbywilson.com/proposals/{key}
   (no Vercel edit, no new .html file needed — the /proposals/:id rewrite + this
   data file are all it takes). Bump the ?v=N on proposals-data.js in
   proposal.html whenever you edit this file (cache-busting).

   EACH HOTEL in `hotels[]` is EITHER:
     • Library-linked:  { slug: 'borgo-santandrea', room, rate, rateNote, roomDesc }
         → name, location, heroImage, desc, gallery, bookingUrl are pulled from
           PROPERTIES[slug] in data.js. Any field you ALSO set here overrides the
           library value (e.g. a trip-specific rate or a different hero photo).
     • Fully inline:    { name, location, heroImage, room, rate, rateNote,
                          desc, roomDescLabel, roomDesc, gallery, bookingUrl }
         → for one-off hotels not in your library (like the Charleston set).

   OPTIONAL per-hotel `bookingUrl` renders a "Book this rate" button under the
   details — your self-book path. Point it at a Virtuoso or TravelWits link and
   the client can book themselves with their perks attached. Omit it (as Charleston
   does) and no button shows.
   ───────────────────────────────────────────────────────────────────────── */
const PROPOSALS = {
  /* ──────────────────────────────────────────────────────────────────
     NOTE (2026-07-29): live proposals are now built in the Proposal
     Studio (/studio) and stored in the wndr-proposals Vercel Blob store
     — proposal.html falls back to /api/proposals when an id isn't found
     here. This static object still works for hand-authored proposals.
     The retired Charleston + Caribbean-scaffold entries are kept below
     as commented-out reference for the data shape.
  ────────────────────────────────────────────────────────────────── */


  //   'charleston-getaway': {
  //     metaTitle: 'Your Lowcountry Getaway — Wander by Wilson',
  //     metaDescription: 'A private hotel proposal — four options for your June 4–5 stay across the South Carolina and Georgia coast, with Virtuoso perks included at every hotel.',

  //     kicker: 'A private proposal',
  //     title: 'Your Lowcountry <em>getaway.</em>',
  //     lede: 'Four hotels along the South Carolina and Georgia coast to consider for your overnight stay. Each option includes our exclusive Virtuoso perks at no additional cost.',
  //     dates: 'June 4 &mdash; June 5, 2026 &middot; 1 night',

  //     hotels: [
  //       {
  //         name: 'The <em>Dunlin</em>',
  //         location: 'Kiawah River, South Carolina &middot; Auberge Resorts Collection',
  //         heroImage: '/proposals/charleston-getaway-images/dunlin-hero.jpg',
  //         room: 'Dunlin Suite',
  //         rate: 'From <em>$1,765.12</em>',
  //         rateNote: 'For 1 night, before taxes. Virtuoso perks included.',
  //         desc: 'A mid-century-modern retreat perched along the tidal Kiawah River. Quiet, considered, and unhurried &mdash; expansive marsh views, a serene pool deck, and a coastal-Carolina restaurant program that leans deeply local.',
  //         roomDescLabel: 'About the Dunlin Suite',
  //         roomDesc: 'Floor-to-ceiling windows framing tidal river and marsh views. A king bed, separate sitting area, and a marble bath with deep soaking tub. Curated bath amenities and a private terrace overlook the water. Among the most peaceful rooms on Kiawah.',
  //         gallery: [
  //           '/proposals/charleston-getaway-images/dunlin-gallery-01.jpg',
  //           '/proposals/charleston-getaway-images/dunlin-gallery-02.jpg',
  //           '/proposals/charleston-getaway-images/dunlin-gallery-03.jpg',
  //           '/proposals/charleston-getaway-images/dunlin-gallery-04.jpg'
  //         ]
  //       },
  //       {
  //         name: 'The <em>Cooper</em>',
  //         location: 'Charleston, South Carolina &middot; Auberge Resorts Collection',
  //         heroImage: '/proposals/charleston-getaway-images/cooper-hero.jpg',
  //         room: 'One Bedroom Suite',
  //         rate: 'From <em>$2,658.48</em>',
  //         rateNote: 'For 1 night, before taxes. Virtuoso perks included.',
  //         desc: 'Charleston&rsquo;s most anticipated downtown opening &mdash; an Auberge address tucked into the historic district, steps from King Street&rsquo;s shops, the harbor, and the city&rsquo;s most storied restaurants. A rooftop pool, a buzzy cocktail program, and the kind of Southern-elegant interiors that make you want to stay in.',
  //         roomDescLabel: 'About the One Bedroom Suite',
  //         roomDesc: 'A separate living room and bedroom layout designed for lingering &mdash; Charleston-historic architectural details meet modern luxury finishes. King bed, marble bath, generous closet, and city or interior courtyard views. The most comfortable address for a downtown weekend.',
  //         gallery: [
  //           '/proposals/charleston-getaway-images/cooper-gallery-01.jpg',
  //           '/proposals/charleston-getaway-images/cooper-gallery-02.jpg',
  //           '/proposals/charleston-getaway-images/cooper-gallery-03.jpg',
  //           '/proposals/charleston-getaway-images/cooper-gallery-04.jpg'
  //         ]
  //       },
  //       {
  //         name: 'Montage <em>Palmetto Bluff</em>',
  //         location: 'Bluffton, South Carolina &middot; Montage Hotels &amp; Resorts',
  //         heroImage: '/proposals/charleston-getaway-images/palmetto-bluff-hero.jpg',
  //         room: 'Forest View Cottage',
  //         rate: 'From <em>$1,887</em>',
  //         rateNote: 'For 1 night, before taxes. Virtuoso perks included.',
  //         desc: 'A 20,000-acre Lowcountry preserve along the May River &mdash; ancient live oaks, Spanish moss, and a sense of place that&rsquo;s entirely its own. Equal parts nature retreat and grand Southern resort, with the river, an Audubon-rated golf course, an equestrian center, and a destination spa woven through the property.',
  //         roomDescLabel: 'About the Forest View Cottage',
  //         roomDesc: 'A standalone cottage tucked into the wooded preserve &mdash; king bed, screened porch, soaking tub, and Lowcountry-style interiors in natural materials and a soft, restorative palette. Privacy among the oaks, with the river and village a short walk or bike ride away.',
  //         gallery: [
  //           '/proposals/charleston-getaway-images/palmetto-bluff-gallery-01.jpg',
  //           '/proposals/charleston-getaway-images/palmetto-bluff-gallery-02.jpg',
  //           '/proposals/charleston-getaway-images/palmetto-bluff-gallery-03.jpg',
  //           '/proposals/charleston-getaway-images/palmetto-bluff-gallery-04.jpg'
  //         ]
  //       },
  //       {
  //         name: 'The <em>Cloister</em>',
  //         location: 'Sea Island, Georgia &middot; Sea Island Resort',
  //         heroImage: '/proposals/charleston-getaway-images/cloister-hero.jpg',
  //         room: 'River View One Bed Suite',
  //         rate: 'From <em>$1,995</em>',
  //         rateNote: 'For 1 night, before taxes. Virtuoso perks included.',
  //         desc: 'The grande dame of the Georgia coast. Originally opened in 1928 as an Addison Mizner Spanish Colonial masterpiece &mdash; rebuilt in 2003 to honor his vision &mdash; The Cloister sits at the heart of a five-mile private island retreat. Terracotta-tile roofs, cloistered walkways, manicured gardens, and a sense of effortless Southern grandeur that no other hotel in the region quite matches.',
  //         roomDescLabel: 'About the River View One Bed Suite',
  //         roomDesc: 'A spacious one-bedroom suite with sweeping views over the Black Banks River and tidal marshlands. Mahogany details and an Addison Mizner-inspired palette, king bed, separate living area, marble bath with deep soaking tub, and a private terrace looking out over the water. Steps from the spa, the beach club, and the world-class golf for which Sea Island is known.',
  //         gallery: [
  //           '/proposals/charleston-getaway-images/cloister-gallery-01.jpg',
  //           '/proposals/charleston-getaway-images/cloister-gallery-02.jpg',
  //           '/proposals/charleston-getaway-images/cloister-gallery-03.jpg',
  //           '/proposals/charleston-getaway-images/cloister-gallery-04.jpg'
  //         ]
  //       }
  //     ],

  //     perks: {
  //       kicker: 'Included at every hotel',
  //       title: 'Wander by Wilson<br><em>exclusive perks.</em>',
  //       intro: 'Each booking is made at the best available rate with our Virtuoso preferred-partner perks layered on top &mdash; at no additional cost to you.',
  //       list: [
  //         'Daily breakfast for two',
  //         '$100+ hotel, food &amp; beverage, or spa credit',
  //         'Priority room upgrade on arrival (subject to availability)',
  //         'Early check-in &amp; late check-out (where available)',
  //         'VIP recognition with the property before you arrive'
  //       ]
  //     },

  //     closeTitle: 'Just hit reply<br><em>to confirm.</em>',
  //     closeLede: 'Let me know which option feels right &mdash; or if you&rsquo;d like to see anything else &mdash; and I&rsquo;ll lock in the booking with all the perks attached.',
  //     signatureName: 'Wilson',
  //     signatureRole: 'Founder &middot; Wander by Wilson'
  //   },

  //   // ── SCAFFOLD / PLACEHOLDER — replace [ bracketed ] bits + the PLACEHOLDER rates
  //   //    with the real client name, dates, room categories, and quoted rates.
  //   'caribbean-islands': {
  //     metaTitle: 'Your Caribbean Getaway — Wander by Wilson',
  //     metaDescription: 'A private hotel proposal — three island stays across Turks & Caicos and Grand Cayman, each with our preferred-partner perks included.',

  //     kicker: 'A private proposal',
  //     title: 'Your Caribbean <em>getaway.</em>',
  //     lede: 'Three island stays to consider &mdash; two on Turks &amp; Caicos, one on Grand Cayman. Each includes our exclusive preferred-partner perks at no additional cost.',
  //     dates: '[ Travel dates ]',

  //     hotels: [
  //       {
  //         slug: 'ambergris-cay',
  //         room: '[ Room category ]',
  //         rate: 'From <em>$2,200 / night</em>',
  //         rateNote: 'PLACEHOLDER &mdash; all-inclusive; replace with your quoted rate. Perks included.'
  //       },
  //       {
  //         slug: 'wymara-villas',
  //         room: '[ Room category ]',
  //         rate: 'From <em>$750 / night</em>',
  //         rateNote: 'PLACEHOLDER &mdash; replace with your quoted rate. Perks included.'
  //       },
  //       {
  //         slug: 'palm-heights',
  //         room: '[ Room category ]',
  //         rate: 'From <em>$850 / night</em>',
  //         rateNote: 'PLACEHOLDER &mdash; replace with your quoted rate. Perks included.'
  //       }
  //     ],

  //     perks: {
  //       kicker: 'Included at every hotel',
  //       title: 'Wander by Wilson<br><em>exclusive perks.</em>',
  //       intro: 'Each booking is made at the best available rate with our preferred-partner perks layered on top &mdash; at no additional cost to you.',
  //       list: [
  //         'Daily breakfast for two',
  //         '$100+ hotel, food &amp; beverage, or spa credit',
  //         'Priority room upgrade on arrival (subject to availability)',
  //         'Early check-in &amp; late check-out (where available)',
  //         'VIP recognition with the property before you arrive'
  //       ]
  //     },

  //     closeTitle: 'Just hit reply<br><em>to confirm.</em>',
  //     closeLede: 'Let me know which island feels right &mdash; or if you&rsquo;d like to see anything else &mdash; and I&rsquo;ll lock in the booking with all the perks attached.',
  //     signatureName: 'Wilson',
  //     signatureRole: 'Founder &middot; Wander by Wilson'
  //   }
};

// Expose globally for the inline bootstrap in proposal.html (matches data.js).
if (typeof window !== 'undefined') { window.PROPOSALS = PROPOSALS; }
