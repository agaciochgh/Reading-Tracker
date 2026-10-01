# Reading Quest 📚

A cheerful reading tracker for kids. One profile per reader, with daily goals, streaks, badges, a bookshelf and a read-along timer.

## Features

- **Who's reading?** Each kid gets a profile with their own avatar, favourite colour, a daily minutes goal and a weekly goal (so they don't need to read every day). Weeks run Monday to Sunday.
- **Home:** a goal ring for today, weekly goal progress, the current streak, the books they're reading now, and a Mon–Sun chart of the week.
- **Reading timer:** a full-screen timer with pause and resume. It survives a page refresh and throws confetti when the daily goal is reached.
- **Log reading:** minutes (±1, or hold to count faster), the book, and "what page are you on now?" Pages read are worked out from that. For "Something else" they type the title, and it goes on their Reading shelf.
- **Book types:** physical, digital or audiobook. Audiobooks skip the page questions.
- **Bookshelf:** Reading / Wishlist / Finished. Book search uses Open Library for titles, authors, page counts and covers. If there's no network, or no cover, the book gets a colourful generated cover instead.
- **Finish a book:** rate it with stars, then confetti.
- **18 badges:** streaks, total time, pages, books finished, weekend reading and more, each with a progress bar.
- **Stats by week, month and year:** time, days read, pages, books finished, a chart, and a comparison with the same point in the previous period. Arrows step back through past periods. **All time** adds totals, a 15-week reading calendar and full history.
- **Family sync (optional):** sign in with one family account on every device and they all stay in step, even after being offline. See [SYNC-SETUP.md](SYNC-SETUP.md).
- **Parent PIN:** locks Parent settings and deleting things. It syncs across devices, and a grown-up question gets you in if you forget it.
- **Parent settings:** manage readers, sync, PIN, export/import a JSON backup, load demo data, erase everything.
- Installable as an app (PWA), works offline, supports dark mode, and fits phones, tablets and desktops.

## Running it

No build step and no dependencies. Serve the folder over HTTP:

```sh
npx serve .            # or: python3 -m http.server
```

Then open the printed URL. Opening `index.html` straight from disk also works, but the offline service worker only runs over http(s).

To put it on your kids' tablets, host it on **GitHub Pages** (Settings → Pages → deploy from branch). Open the URL on the device and use **Add to Home Screen**.

## Data & privacy

Each device keeps its data in the browser's `localStorage`. Without sync, nothing leaves the device except book-search queries to openlibrary.org. With family sync turned on, data is also stored in your own Firebase project, where only your family account can read it (see `firestore.rules`). It's kept until you delete it. **Parent settings → Export** saves a backup file at any time.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | App shell |
| `styles.css` | All styling (light/dark themes, per-kid accent colour) |
| `app.js` | State, rendering, timer, badges, stats, PIN, search, backup |
| `sync.js` | Family sync via Firebase Auth + Firestore |
| `sync-config.js` | Your Firebase project settings (`null` = sync off) |
| `firestore.rules` | Database security rules to paste into Firebase |
| `sw.js` | Offline cache |
| `manifest.webmanifest`, `icon.svg` | Install-as-app metadata and icon |
