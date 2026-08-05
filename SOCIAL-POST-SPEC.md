# Social post spec — Instagram carousels

Instagram is the only channel. Every post built in the Studio — from a proposal,
a hotel page, a blog post, an itinerary, or from scratch — follows this file. The
Studio's prompts and its QA panel enforce what can be checked automatically; the
rest is judgment.

---

## The cover slide

The cover decides whether anyone sees slide 2.

- It must be a **showstopper**: sweeping scenery, the hero shot of the best
  property in the post, or an iconic view of the destination.
- **Never** an interior detail, a chair, a corner of a lobby, a close-up of an
  object, or a plain room shot. *(Wilson, 2026-08-03, on an armchair cover:
  "a good example of what we would NEVER want.")*
- If the strongest image belongs to slide 5, use it on the cover anyway.
- The cover must survive a **square centre crop** — that's what the profile grid
  shows. Keep the subject and the headline centred, away from the outer edges.

## The brief slide

Read in under two seconds, or not at all.

- **Intro line:** ONE sentence, max ~140 characters.
- **Bullets:** 3–4, max ~60 characters each (about 8 words). Fragments, not
  sentences. No trailing periods. If a bullet needs a comma to survive, it's too
  long — cut adjectives before facts.
- More words means smaller type, and small type on a phone reads as noise.

## Hotel / stop slides

- **Photo:** the best available image of that hotel, destination or experience —
  wide, bright, instantly readable at thumbnail size. If a property has no
  genuinely great photo, **use a stunning destination photo instead** rather than
  settling for a weak hotel shot.
- Reject: dim interiors, tight crops of furniture, empty corridors, meeting
  rooms, anything that looks like a booking-site thumbnail.
- Standing photo rules still apply: daylight or golden hour only; no plated
  food; no night shots; no bathroom-only room shots; no people as the subject — no couples,
  portraits, models or lifestyle shots where a person is what the photo is
  about (small figures at human scale in a wide view are fine); never the same photo twice in one carousel.
- **Copy:** one strong sentence (~110 characters) by default. A **second short
  sentence** is welcome when it genuinely strengthens the slide — a concrete
  detail, never filler. Measured limits: **~170 characters** fits (4 lines), but
  only **~130** when the rate line is showing (3 lines). Past that it truncates,
  and the QA panel flags it against whichever budget applies.
- **Sourcing:** the hotel's own site or official media library first, then
  Virtuoso, then an official tourism board for a destination slide. Never
  Instagram, Pinterest, TripAdvisor, stock sites, or Google Images.

## Partner marketing emails as a source

Partner mail is a steady source of genuinely new news — an opening, a
renovation, a new suite category, a new route. In the Studio: **New post → From a
partner email**, copy the prompt, and paste the email's **subject line**. Claude
finds it in the inbox (both wilson@ and the SmartFlyer address), extracts the
actual news out of the marketing language, and verifies it against the
property's own site before anything is written.

Rules specific to this source:

- **Find the fact.** Marketing emails bury one real item in adjectives. If there
  is no genuine news, don't post — not every email deserves one.
- **Never repeat** rates or "from $X" pricing · limited-time offers, promo codes
  or booking deadlines (they expire, the post doesn't) · commission or agent-
  incentive language, which is trade-only and must never be public · superlatives
  the hotel doesn't claim itself.
- **Photos come from the property's own site, not the email** — email images are
  usually tracking-wrapped, cropped, or low-resolution.

## Structure

- **Blog posts become chapters.** An article's H2 section heading renders as a
  **section divider** — cream, "Part One", the section title, its opening line,
  no photo — and the H3s beneath it become the photo slides. It breaks up a long
  run of photo slides and tells the reader where they are.
- Dividers are deliberately text-only; the QA panel doesn't ask them for a photo.
- Any slide can be removed with the **✕** on its preview. Numbering is derived
  from position, so the slides after it renumber themselves — and dividers don't
  consume a number.

## Numbering

- **Itinerary posts count DAYS, not slides** — "Days 1–2", "Days 3–5". A slide
  number reads as a list; day ranges read as a trip. The itinerary prompt asks
  Claude to read the day ranges off the document.
- Everything else uses No. 01, No. 02…

## Caption

- The first ~125 characters are all that shows before "more" — front-load the
  hook.
- Structure: hook → the shape of the trip/post → the list in order → invitation
  to reach out → 5–8 hashtags (not 30).
- Curation language, per Wilson: "we'll curate a shortlist tailored to you", not
  "we design the shortlist".

## Never on a public post

- The client's name, their party's names, their travel dates, or what they paid.
  A client story is anonymous — the trip is the story.
- Rates: fine on a hotel feature, avoid on a client-story post (it implies a
  specific person's quote). The composer's "show rates" toggle controls this.
- Any copy we invented about a property — the compliance rule that governs hotel
  pages and proposals governs social too.

## Rhythm (scheduling)

- Each scheduled post carries a **category** — Caribbean, Mexico, Europe, Africa,
  Asia, South Pacific, Middle East, North America, South America, All-Inclusive,
  Cruise, Safari, Honeymoon, Ski, Villa — shown on the calendar chip and in the
  grid preview.
- Don't post the same category twice in a row; the calendar labels exist to make
  that visible at a glance.
- 6–10 slides per carousel. Past ~10, swipe-through collapses.

## Where slide photos come from (blog posts)

Articles rarely have one image per section, and anything migrated from Google
Docs has none at all. The builder fills every slide in this order:

1. an image inside that section, matched by meaning (filename/alt vs. heading),
   then by position;
2. **our own hotel page's hero**, if the section names a property we have a page
   for — matched across the whole section, and for an H2 across its sub-sections;
3. a **destination match** — a library hotel whose location shares a distinctive
   place name with the section (generic words like *island*, *coast*, *bay* don't
   count);
4. for the cover, the strongest slide photo when the article has no hero.

Headings with under 8 words of their own copy ("Where to Stay") are scaffolding,
not slides, and are skipped. Fallback photos are on-topic but may not show the
exact property named — the QA panel flags them so you can confirm or swap.

## What the Studio checks for you

The QA panel flags: number words that contradict the slide count · client-name
leaks · missing photos · repeated photos · weak/interior cover and slide photos ·
brief intro over ~160 characters · brief bullets over ~75 characters · more than
4 bullets · slide lines that will get cut · filenames suggesting a banned shot.

Green QA is a floor, not a finish line — look at every slide before posting.
