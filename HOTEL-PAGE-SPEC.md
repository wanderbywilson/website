# Hotel page spec — the single source of truth

Both paths that create hotel pages MUST follow this file:

1. **Claude Code** — the `new-hotel-page` skill (`.claude/commands/new-hotel-page.md`)
2. **The Studio** — the `hotel-draft-builder` workflow, whose drafts land in
   /studio → Hotel pages for Wilson to review and edit

If the two ever disagree, **this file wins**. Update it here first, then make both
paths match.

---

## The compliance rule that overrides everything

Wilson, 2026-07-29: *"The content must come from the property's Virtuoso page AND / OR
the actual hotel page. We can not make anything up or change anything. If we embellish
and the client books based on the embellishment we could get in a lot of trouble."*

So: **`description` is VERBATIM. Never our own prose, never paraphrased, never
"inspired by" the official copy.** This replaced the old "write original evocative
prose" instruction, which is now banned.

Our own editorial voice is allowed in exactly two fields — `idealFor` and `agentTip` —
and even there, every *fact* must be sourced.

---

## Fields

| Field | Rule |
|---|---|
| `name` | The official name exactly as the hotel writes it. |
| `location` | `Town, Region, Country`. Append ` · Brand` only when the affiliation is part of its official identity (e.g. `· Relais & Châteaux`). |
| `rateFrom` | **Entry-level** nightly rate — cheapest room category, low/shoulder season. Never derive it from a suite quote (that bug shipped €1,270 for Il Borro when the real floor was ~€450). Be conservative: never understate. USD/EUR/GBP native (literal € / £); any other currency → convert to USD and add `rateInfo`. Empty string if no defensible figure. |
| `description` | **VERBATIM** from the hotel's own site or its Virtuoso/SmartFlyer listing. ONE coherent passage — do NOT stitch paragraphs from several pages together (that produced the repetitive FORESTIS copy where "Dolomites UNESCO World Heritage Site" appeared four times). 400–900 characters. Real HTML entities (`&mdash;`, `&rsquo;`), never double-escaped. Empty if you cannot verify it. |
| `idealFor` | **BEST FOR — ONE sentence, hard cap 280 characters.** Pattern: `[Traveler types] who [want X] &mdash; [the trade-off this place wins]`. All 47 live entries are single sentences, 114–279 chars, median ~200. Our voice, sourced facts. **Banned:** a second sentence · colon-then-feature-list · "It also scales well for…" · "Two things worth setting expectations on…" · anything about closures, small beaches, or what the property lacks. |
| `agentTip` | **ADVISOR TIP — one concrete insider move**, 66–349 characters (median ~193): a named suite worth the splurge, a specific dish or table, a named experience, a timing move. Source: SmartFlyer write-up (primary), Virtuoso "Hotel Tip" sidebar (fallback), else the hotel's own site for verifiable specifics. |
| `perks` | The actual preferred-partner amenities documented for **this** hotel (Virtuoso / SmartFlyer / brand program). Keep the precise fine print — "subject to availability", "$100 USD equivalent F&B credit, once per stay", "not combinable…". **Never** the advisor's *personalized welcome note* (surprise rule). Never assume a generic package. Empty array if unverified. |
| `heroImage` + `gallery` | Hero + 5, per the photo rules below. |
| `bookingUrl` | Wilson's Virtuoso advisor link — pull it yourself (see the skill's "Booking link" section). Empty string if the hotel isn't bookable through Virtuoso; the page then falls back to the inquiry form. Never `#`. |
| Optional | `rateNote`, `rateInfo`, `rateLines`, `brandBadge` + `brandBadgeAlt`. |

## Never ship a placeholder

**No page field may ever contain `TODO`, `TBD`, `FIXME`, "before publishing", or
bracketed placeholder text.** There are zero such strings in the 47 live entries, and
Wilson flagged one that reached a draft (2026-08-03, Il Borro's advisor tip):
*"this should never happen — you need to actually pull this info."*

If a value cannot be verified: **do the research** (SmartFlyer, Virtuoso, the hotel's
own site). If it genuinely cannot be found, leave the field an **empty string** — the
page hides empty fields cleanly — and record what's missing in the draft's notes, which
are for the reviewer and never render publicly.

## Photo rules (Wilson, validated)

Galleries tell the story of the **place**, not an inventory of rooms.

- **Hero:** the property's signature postcard shot. Daylight or golden hour.
- **Mix (hero + 5):** sense-of-place landscape/lifestyle · a signature experience ·
  dining *setting* only if it earns its place · ONE shot of an actual room (bed/living,
  ideally with its view) · pool/waterfront/architecture.
- **Never:** plated-food shots · night/after-dark shots · bathroom-only room shots ·
  posed models as the subject · dark or flat interiors · renders when photos exist ·
  near-duplicates · generic spa treatment rooms.
- **Sources:** the hotel's own site/official media (WordPress sites often expose
  `/wp-json/wp/v2/media`), SmartFlyer, Virtuoso. Optimize with Pillow, ≥1600px.

## Where drafts go

Never publish a new hotel page directly. Per the standing rule, a draft goes to
**both**:

1. `drafts/hotels/{slug}/` locally (gitignored — `README.md` + `entry.js`), and
2. the Studio's hotel-draft store, so Wilson actually sees it:
   `POST /api/studio-content` `{passcode, kind:'hoteldraft', action:'save', id:'{slug}',
   doc:{slug, name, location, status:'in-review', heroImage, images[], notes, entry:{…}},
   meta:{name, location, status, heroImage}}`

`doc.entry` (the structured object above) is **required** — the Studio editor renders it
in the real page template for review, and the daily publish pipeline builds `data.js`
from it. Images may deploy immediately; the page never goes live until Wilson flips the
draft to **ready**.
