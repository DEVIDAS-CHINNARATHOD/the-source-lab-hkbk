# The Source Lab

Install the dependencies with `npm ci`, then run `npm run build`. Run `npm start` with Node 22.13 or later after the build. The static frontend is generated in `dist/client/`. Pages and navigation work as static files when hosted at a domain root or under a GLUG directory.

The existing pages, workshop photos and shared layout styles live in `site/`. The home animation is a React island. `hero.tsx` mounts the GSAP crowd in the hero and the shared play/pause control beside the CSS logo strip. The local sprite contains 15 columns and 7 rows. No application state provider is required.

## Components and styles

Reusable UI belongs in `components/ui/`. The shadcn CLI reads `components.json` and installs UI into this directory. Imports such as `@/components/ui/skiper39` work because Vite and TypeScript both map `@/` to the project root. The standalone usage example is `components/ui/demo.tsx`.

Tailwind is installed through the Vite plugin. `styles/globals.css` contains the Tailwind theme, component sources, and homepage effects. `site/style.css` supplies the existing page layout. When installing components into a new Tailwind source directory, register that directory with `@source` in the global stylesheet.

To set up a fresh TypeScript/Vite project, start with the React TypeScript template, install `tailwindcss` and `@tailwindcss/vite`, add the Vite plugin and define the `@/` alias in Vite and tsconfig. Run `npx shadcn@latest init` and point the UI alias at `@/components/ui`. This repository already includes the configuration. To select additional components use `npx shadcn@latest add <component>`.

Artwork credits and the original Tux notice are in `site/assets/hero/`. The strip includes all six featured distribution marks and eight open-source tool marks.

## Contact inbox

The hosted contact form posts to a same-origin Worker at `api/contact`. It validates the submission and records it in the private `contact_messages` D1 table. The site owner can review messages through the site database tools. Email notifications are not configured. The local preview uses a separate SQLite database in the ignored `.sites-runtime/` directory.

For static-only GLUG hosting, provide a POST handler at `api/contact` under the same site directory to receive messages, or link visitors to the hosted contact section.
