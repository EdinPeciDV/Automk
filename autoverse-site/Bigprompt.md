CONTEXT
This is the existing "AutoMk" luxury car salon single-page site (already live, already redesigned). Extend it, don't rebuild it. Before writing code, read the current files and reuse the existing design system, CSS variables, fonts (Cormorant Garamond + Manrope), components (buttons, cards, modal, toast, reveal-on-scroll utilities), easing cubic-bezier(0.22,1,0.36,1) and animation style. The new sections must look like they were always part of the site. The site has an EN / SQ / SR language switcher: EVERY new string must be added to the existing translation system in all three languages (natural Albanian and Serbian Latin, not word-for-word translation).

Do not break or restyle any existing section. Vanilla HTML/CSS/JS unless the project already uses something else; follow whatever the project uses.

=====================================================
PART 0: FIXES IN THE EXISTING SITE
=====================================================
1. Encoding: "€" renders as "â‚¬". Make <meta charset="utf-8"> the very first element in <head>, make sure every file is saved as UTF-8, and check all special characters (€, é, ë, ç, č, ž, á, –, ·).
2. Footer social links point to "#": move them into CONFIG.social and hide any icon whose URL is empty.
3. Stat counters must start animating when visible (they currently sit at 0 if the observer fails). Add a fallback that sets the final values if IntersectionObserver isn't available.

=====================================================
PART 1: DATA LAYER (backend-ready)
=====================================================
The real backend (CRUD for cars and brands) is built separately. The frontend must ONLY talk to a small data module, so switching from mock data to the real API changes one line.

- Create a dedicated module (e.g. js/data.js) exporting:
  • getBrands() → Promise<Brand[]>
  • getCars(filters) → Promise<Car[]>
  • getCarById(id) → Promise<Car>
  • createLead(lead) → Promise<{ok:boolean}>   (finder / contact submissions)
- CONFIG.api.baseUrl: if empty, use local mock JSON (data/brands.json, data/cars.json) and filter client-side; if set, call:
  GET  {baseUrl}/brands
  GET  {baseUrl}/cars?brand=bmw&type=suv&minPrice=&maxPrice=&maxKm=&yearFrom=&yearTo=&fuel=&transmission=&sort=&page=
  GET  {baseUrl}/cars/:id
  POST {baseUrl}/leads
- Handle loading (skeletons), errors (elegant retry message) and empty states everywhere. Never show a blank area.
- Document the exact JSON shapes in a comment block at the top of data.js:

  Brand { slug, name, logo (path/URL to SVG), country, carCount }
  Car {
    id, brandSlug, brand, model, type ("sports"|"gt"|"suv"|"sedan"|"convertible"|"electric"|"luxury"),
    year, km, price, currency, fuel, transmission, hp, acceleration, topSpeed, colour,
    status ("available"|"reserved"|"arriving"), arrivalDate, images[] (optional), featured (bool)
  }

- Mock data: 15 brands, ~40 cars spread realistically across them (a few brands with only 1–2 cars, one brand with 0 cars to test the empty state, several "arriving" cars).

=====================================================
PART 2: "SHOP BY BRAND" BROWSER (id="brands")
=====================================================
CONCEPT
A dedicated place to browse our stock by brand, like the brand wall in a premium dealership. The visitor taps a brand logo and instantly sees only that brand's cars.

BRANDS (rendered from getBrands(), never hardcoded in HTML)
Volkswagen, BMW, Mercedes-Benz, Audi, Alfa Romeo, Lamborghini, Ferrari, Porsche, Maserati, Bentley, Rolls-Royce, Aston Martin, McLaren, Land Rover, Tesla.

LOGOS (important)
- Use the official brand logo files, NOT hand-drawn SVG imitations. Load them from /assets/brands/{slug}.svg (a monochrome SVG per brand). The simple-icons package (simpleicons.org) is a good source for monochrome SVG logos where available; any brand without a file falls back automatically to an elegant monogram tile (brand initials in Cormorant Garamond inside a thin champagne ring).
- Show all logos in one consistent style: monochrome ivory at 70% opacity by default, full opacity plus a champagne glow on hover/active. Equal optical size (fit inside a fixed 56×56 box with object-fit: contain).
- Every logo button has an accessible name: aria-label="Show BMW cars (6)".

LAYOUT
- Section label "OUR MARQUES", headline "Choose your *brand*".
- Desktop: an elegant grid of brand tiles (5 per row), each tile with the logo, the brand name in small caps underneath, and a car count badge ("6 cars"). Tiles have a 1px champagne border at 10% opacity, a hover lift of 4px, a cursor-following shine and a subtle 3D tilt (reuse the existing tilt/shine utility).
- Mobile: a horizontal swipeable row of round logo chips with scroll-snap and fade edges, sticky under the nav while browsing results.
- An "All brands" tile/chip comes first.
- Brands with 0 cars stay visible but muted, with the label "Coming soon"; clicking them shows the empty state with a "Notify me" option instead of an empty grid.

INTERACTION
- Clicking a brand:
  1. The active tile gets a champagne border and a checkmark that draws itself; the others dim slightly.
  2. A brand header animates in above the results: big logo, brand name in serif, country, "6 cars available · 2 arriving soon".
  3. The results grid crossfades: old cards fade and sink 20px, skeleton cards shimmer while loading, then the new cards rise in with a 80ms stagger.
  4. The page smoothly scrolls so the brand header is in view (only if it isn't already).
- Single brand at a time by default, with an optional "Compare brands" toggle that allows multi-select (chips show ×).
- Clicking the active brand again, or "All brands", resets.

FILTER BAR (above results, combined with the brand)
- Type chips (Sports, GT, SUV, Sedan, Convertible, Electric), a price range slider, max km, year range, fuel, transmission.
- Sort: Featured, Price low→high, Price high→low, Newest, Lowest km.
- Mobile: a "Filters (3)" button opens a bottom sheet with all filters and an "Show 12 cars" button whose number updates live.
- Active filters show as removable chips ("BMW ×", "Under €100k ×") with "Clear all".
- Live result count announced via aria-live ("6 cars found").

URL STATE (shareable)
- Sync brand and filters to the URL query (?brand=bmw&type=suv&maxPrice=150000) with history.pushState, so links can be shared ("look at our BMWs") and the back button works. Read the URL on page load and restore the state.

CAR CARDS
- Reuse the existing collection card design. Show: image or SVG silhouette, brand logo (small), model, year, km, price (formatted per language: €120.000 for SQ/SR, €120,000 for EN), key specs, status badge ("Available" / "Reserved" / "Arriving in March" with a pulsing dot).
- Buttons: "Details" (opens the existing modal, now loaded via getCarById) and "Ask on WhatsApp" (pre-filled message, see Part 4).
- "Load more" button with skeletons (pagination ready for the API), not infinite scroll.

CONNECTIONS
- Make the brand names in the hero marquee clickable: they scroll to #brands with that brand selected.
- The existing Collection filter tabs and the new brand browser should share the same filtering logic (one filter function, no duplicated code).
- Add "Brands" to the main nav.

=====================================================
PART 3: "FIND YOUR CAR" INTERACTIVE FORM (id="finder")
=====================================================
Upgrade the existing "Private Viewing" form into this experience (keep a short "quick viewing request" variant in the contact section so nothing is lost).

CONCEPT: a private consultation with a personal advisor. Multi-step, one question at a time, centered, lots of space. At the end it shows matching cars from OUR inventory (via getCars).

UI
- Label "PERSONAL CONSULTATION", headline "Let us find *your* car".
- Thin champagne progress bar with "Step 2 of 6"; completed steps clickable to go back.
- Steps slide in from the right while the previous one fades out to the left (700ms); reversed when going back. Enter advances; auto-focus the first input.

STEPS
1. First name + last name (floating labels, champagne underline grows from the center on focus). Personalize later steps: "Nice to meet you, Arben."
2. Phone: country code selector (default +383; also +355, +389, +381, +49, +41, +43, +44, +1) with auto-formatting, inputmode="tel". Checkbox "Contact me on WhatsApp" (on by default).
3. Brand & type: brand logo chips (same logos and component as the brand browser, multi-select, plus "Any brand") and car type cards with line icons (Sports, GT, SUV, Sedan, Convertible, Electric). Selected = champagne border, glow, drawn checkmark.
4. Budget: dual-handle range slider €20,000 to €500,000+ (step €5,000), large serif values that update while dragging, presets ("Under €50k", "€50–100k", "€100–250k", "€250k+").
5. Mileage & year: max km slider 0 ("Brand new") to 200,000 km with labels (New / Nearly new / Low mileage / Any); year range from 2012 to the current year; transmission toggle (Automatic / Manual / Any); fuel (Petrol / Diesel / Hybrid / Electric / Any).
6. Extras: optional textarea (colour, equipment, trade-in…), toggles "I want financing" and "I have a car to trade in", plus a summary card with "edit" links per answer. Submit: "Show my matches".

VALIDATION
- Name min 2 letters; phone valid length for the country. Inline errors in soft oxblood with a gentle shake; no alerts. Continue disabled until valid.
- Save progress to localStorage (try/catch) and restore on refresh.

SEARCH MOMENT
- 1.5s "Searching our collection…" state: a car outline drawing itself plus rotating texts ("Checking 15 brands…", "Comparing mileage…", "Finding your perfect match…").

RESULTS
- Score each car 0–100% against the criteria (brand, type, budget, km, year, transmission, fuel; weighted, with budget and brand weighing most). Sort by score; show a "96% match" badge.
- Header: "Arben, we found 4 cars for you." Cards rise in with a stagger.
- Card buttons: "Ask on WhatsApp" (pre-filled with that car, see Part 4) and "Request a call" (calls createLead, then shows "We'll call you at +383 … within 2 hours" with a checkmark animation).
- No perfect match → "No exact match yet, here are the closest options" with the 3 nearest cars. Never an empty screen.

UPCOMING ARRIVALS & ADVISOR
- "Arriving soon" row: cars with status "arriving" matching their brands/types, with arrival month and a "Reserve first" button.
- "Notify me when a matching car arrives" box pre-filled with their criteria → createLead → "Done, we'll message you on WhatsApp as soon as it arrives."
- Big CTA "Talk to your personal advisor" → WhatsApp with the full summary (see Part 4).
- "Start over" resets smoothly.

=====================================================
PART 4: CONTACT & WHATSAPP (id="contact")
=====================================================
Use the existing contact details, showrooms and hours, but all values come from ONE CONFIG object at the top of the main script:
CONFIG = { phone, whatsapp (international format, digits only, no +), email, showrooms[{city, address, mapsUrl}], hours, social{instagram, facebook, tiktok, youtube}, api{baseUrl} }

LAYOUT (two columns desktop, stacked mobile)
- Left: label "VISIT US", headline "We're here for *you*", reassurance line, then large contact rows (icon, label, value) with a hover shift of 6px and an icon glow:
  Phone · WhatsApp · Email · Showrooms (each with "Get directions" → Google Maps in a new tab) · Opening hours with a live "Open now" / "Closed, opens at 09:00" badge calculated from the showroom's timezone, with a pulsing dot.
- Right: a dark stylized SVG map with pulsing champagne pins for the showrooms (no API key needed), plus the quick viewing request form (name, phone, preferred car loaded from getCars, date) which sends via createLead plus an optional WhatsApp hand-off.

PHONE ACTION SHEET (important)
- Tapping or clicking ANY phone number never calls directly. It opens:
  • Mobile: a bottom sheet sliding up (drag handle, dimmed backdrop, swipe down to close).
  • Desktop: a popover anchored to the number.
- Options (large buttons with icons):
  1. "Call now" → tel:
  2. "Message on WhatsApp" → https://wa.me/{whatsapp}?text=…
  3. "Copy number" → clipboard + toast "Number copied ✓"
  4. "Cancel"
- role="dialog", focus trap, ESC closes, focus returns to the trigger.

EMAIL
- mailto: with a pre-filled subject ("Inquiry from website") and body; if the Finder was completed, include their summary. A copy icon next to it copies the address and shows a toast.

WHATSAPP MESSAGES (all pre-filled, encodeURIComponent, %0A line breaks, written in the visitor's current site language)
- Car card: "Hello AutoMk, I'm [Name]. I'm interested in the [Year Brand Model] ([km] km, €[price]). Ref #[id]."
- Advisor: "Hello AutoMk, I'm [Name]. I'm looking for: [brands], [types], budget €X–€Y, max [km] km, [years], [transmission], [fuel]. Notes: [notes]. Do you have anything arriving soon?"
- General: "Hello AutoMk, I'd like more information."

FLOATING WHATSAPP BUTTON
- Discreet round button in the bottom-right (champagne ring, WhatsApp icon, gentle pulse every 8s, "Chat with us" tooltip). Opens the same action sheet. Hidden while a modal or sheet is open, and it never covers the mobile filter button.

=====================================================
QUALITY BAR
=====================================================
- Mobile-first, tap targets ≥ 48px, sliders and sheets work with touch.
- Animate only transform and opacity; one requestAnimationFrame loop for pointer and scroll effects.
- prefers-reduced-motion: replace slides, tilt and shine with simple fades.
- Accessible: real <label>s, aria-live for errors and result counts, visible champagne focus rings, keyboard-operable logo grid (arrow keys move between tiles).
- Lazy-load brand logos and car images; no layout shift (fixed aspect ratios).
- No console errors, no duplicated filtering logic, clean commented sections.
- After implementing, test: brand click → filtered results; URL share/restore; back button; empty brand; finder end-to-end; every WhatsApp/tel/mailto link; all 3 languages; 375px and 1440px widths.

OUTPUT
Implement directly in the existing project. Fully working, no "TODO / add logic here". The only placeholders allowed are the values inside CONFIG and the mock JSON data.