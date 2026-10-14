# Padhai Timer

**Study together. Track every minute.**
A free, open-source study timer for Indian exam aspirants: NEET, JEE, UPSC, SSC, Bank and CA.

**Live app:** https://padhaitimer.com  ·  **Website:** https://padhaitimer.com/home/

Inspired by the study-timer apps Korean students use every day: you start a timer for a subject, and you can see who else is studying right now.

## Features

- **Subject timers** – pick your exam and its subjects appear automatically
- **Live study hall** – see everyone preparing for the same exam who is studying right now, and today's ranking
- **Study groups** – create a group, share a 6-character code, invite friends on WhatsApp
- **10-minute planner** – each 10-minute box is coloured by the subject you studied
- **This week chart, D-day countdown and daily streak**
- **Fair play** – a "Still studying?" check every 90 minutes; the timer pauses if nobody answers
- **7 languages** – English, हिन्दी, বাংলা, తెలుగు, मराठी, தமிழ், 한국어
- **No download needed** – works in the browser, can be installed as an app (PWA), light on low-end phones
- **Study chat** – a simple feed for aspirants. Bad words, phone numbers and links are blocked automatically, 3 reports hide a post, posts disappear after 30 days
- **Privacy first** – no phone number, no ads, no payments. Others see only your nickname, exam and today's study time

## How it is built

Plain HTML, CSS and JavaScript – no build step.

| File | What it does |
|---|---|
| `index.html`, `style.css` | Page and design |
| `app.js` | Timer, planner, study hall, groups |
| `i18n.js` | All text in 7 languages |
| `clock.js` | Corrects wrong device clocks using the server time |
| `firebase-config.js` | Your Firebase settings (empty = demo mode) |
| `firestore.rules` | Database security rules |
| `guide.js` | Step-by-step guide (shared by the app and the website) |
| `community.js`, `community-text.js`, `home/filter.js` | Study chat (shared by the app and the website) and its word filter |
| `home/` | Website: landing page, how-to, why, stories, chat, suggestions |
| `install.html` | Install guide for Android, iPhone, in-app browsers and desktop |
| `sw.js`, `manifest.json`, `icons/` | Offline support and app install |

Backend: Firebase Authentication (anonymous + Google) and Cloud Firestore.

## Run it yourself

1. **Demo mode** – open `index.html` with any local web server (for example `npx serve .`). Everything works on one device with sample students.
2. **Live mode** – create a Firebase project, enable Anonymous and Google sign-in, create a Firestore database, publish `firestore.rules`, then paste your web app config into `firebase-config.js`.
3. Deploy the folder to any static host (Cloudflare Pages, Netlify, Firebase Hosting, GitHub Pages) and add that domain to Firebase Authentication → Authorized domains.

## Contributing

Bug reports, translation fixes and ideas are very welcome. Please open an issue.
Native speakers: if a Hindi, Bengali, Telugu, Marathi or Tamil sentence sounds unnatural, please tell us.

## Contact

Padhai Labs – padhai4018@gmail.com

## License

[MIT](LICENSE)
