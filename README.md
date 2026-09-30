# Reading Quest 📚

A cheerful reading tracker for kids. One profile per reader, with daily goals, streaks, badges, a bookshelf and a read-along timer.

## Features

- **Who's reading?** Each kid gets a profile with their own avatar, favourite colour and daily minutes goal.
- **Home:** a goal ring for today, the current streak, the books they're reading now, and a chart of the week.
- **Reading timer:** a full-screen timer with pause and resume. It survives a page refresh and throws confetti when the daily goal is reached.
- **Log reading:** minutes, the book, and "what page are you on now?" Pages read are worked out from that.
- **Bookshelf:** Reading / Wishlist / Finished. Book search uses Open Library for titles, authors, page counts and covers. If there's no network, or no cover, the book gets a colourful generated cover instead.
- **Finish a book:** rate it with stars, then confetti.
- **18 badges:** streaks, total time, pages, books finished, weekend reading and more, each with a progress bar.
- **Stats:** totals, a 15-week reading calendar, and full history. Entries can be deleted.
- **Parent settings:** manage readers, export/import a JSON backup, load demo data, erase everything.
- Installable as an app (PWA), works offline, supports dark mode, and fits phones, tablets and desktops.

## Running it

No build step and no dependencies. Serve the folder over HTTP:

```sh
npx serve .            # or: python3 -m http.server
```

Then open the printed URL. Opening `index.html` straight from disk also works, but the offline service worker only runs over http(s).

To put it on your kids' tablets, host it on **GitHub Pages** (Settings → Pages → deploy from branch). Open the URL on the device and use **Add to Home Screen**.

## Data & privacy

Everything is stored in the browser's `localStorage` on each device. Nothing is sent anywhere except book-search queries to openlibrary.org. Each device keeps its own data; use **Parent settings → Export/Import** to move or back it up.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | App shell |
| `styles.css` | All styling (light/dark themes, per-kid accent colour) |
| `app.js` | State, rendering, timer, badges, search, backup |
| `sw.js` | Offline cache |
| `manifest.webmanifest`, `icon.svg` | Install-as-app metadata and icon |
