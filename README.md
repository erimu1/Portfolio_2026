# Erim Uludag — Portfolio

React + TypeScript portfolio with a responsive home page, an empty animated project gallery, About page, and Contact page.

Live at [erimu1.github.io/Portfolio_2026](https://erimu1.github.io/Portfolio_2026/).

## Start the site

Run `npm install` once, then `npm run dev`. Open the local URL printed by Vite. For a preview bound to IPv4, run `npm run dev -- --host 127.0.0.1`.

## Build and open offline

Run `npm run check` for TypeScript validation and `npm run build` to generate the hosting files in `dist/` and refresh the standalone `offline/index.html`. Open the offline file directly in a browser; keep `offline/logo.png` beside it. No server or CDN is required for that copy.

## Design and interactions

- Home circles smoothly fill, hold, and empty on a repeating twenty-second cycle (a quick fill, a long hold, and a smooth reset). Their curved arrows spin continuously and respect Pause and reduced motion.
- The large home arrow opens Projects. Four empty, staggered rounded cards reveal in sequence and float gently. Next page opens About; there are no mock project titles or detail pages.
- Pine green `#214E3B` complements the orange. Fine procedural grain textures the backgrounds without image downloads. Navigation cards on green use white text for contrast.
- Navigation cards enter alternately from the top and bottom along their own tilted axis: 12 degrees on desktop and 9 degrees on mobile. Moving between pages uses a green/orange transition.
- The home name scrambles on arrival, then locks into ERIM ULUDAG. Fixed letter widths keep the layout stable; screen readers receive the unchanged name.
- Connect opens a contact page with email and phone links, Schiedam location, and a portrait space. Email opens a mail app; phone uses the international dialing number.
- Escape closes navigation. Navigation traps keyboard focus and page changes move focus to their headings.
- Page shortcuts appear on every screen and remain visible while scrolling on phones. About fits laptop viewports down to 1280 × 620 without hiding its navigation.
- Contact includes a copy-email button with confirmation and a fallback message if clipboard access is unavailable.
- Scrollbars are hidden while mouse-wheel, touch, and keyboard scrolling remain enabled.
- Motion can be disabled using the header control and the preference is saved locally. Device reduced-motion settings take priority and update immediately when changed. The control still works if browser storage is unavailable.
- Page shortcuts include hover and keyboard labels, visible focus indicators, and 44-pixel touch targets. Mobile navigation accounts for the device's bottom safe area.
- Home, Projects, About, and Contact support URL hashes and browser Back/Forward.

## Content to personalize

The four project cards are intentionally empty decorative spaces, ready for your work. Contact details, location, school, and degree are stored in `src/profile.ts`. Set `portraitSrc` there to add a photo, and place the photo in `public/` (and beside the offline HTML for offline use). GitHub links to `erimu1`; LinkedIn still needs your personal profile URL in `src/App.tsx`.

## Files

- `src/App.tsx`: home, About, navigation, and social links.
- `src/styles.css`: overall layout, home geometry, and menu animation.
- `src/refinements.css`: finishing details, rotating arrows, and compact About layout.
- `src/Projects.tsx` and `src/projects.css`: empty gallery, card motion, and next-page navigation.
- `src/Contact.tsx` and `src/contact.css`: contact details and portrait space.
- `src/profile.ts`: personal details and portrait path.
- `src/ScrambleName.tsx`: accessible name scrambling with reduced-motion support.
- `src/usePageTransition.ts` and `src/transitions.css`: page transitions and URL navigation.
- `public/logo.png`: the original logo, retained unchanged; the SVG rendering filter removes its background without adding an outline.
- `scripts/build-offline.mjs`: standalone HTML generation after a production build.

Local browser verification results are kept in `artifacts/` and excluded from Git. Checks cover desktop/mobile layout, navigation, animation controls, and contact interactions.

## GitHub Pages

`.github/workflows/pages.yml` installs the locked dependencies, validates TypeScript, builds the site, and publishes `dist/`. Select GitHub Actions as the Pages source in the repository settings. The relative asset paths support the `/Portfolio_2026/` repository URL. Build outputs, dependencies, and local verification artifacts are excluded from Git.
