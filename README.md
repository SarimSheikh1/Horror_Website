# ☠ DarkVault — World-Class Horror Prank Website

The most terrifying multi-page horror prank website ever built.
Open `index.html` in any browser. No server required.

---

## 📁 File Structure

```
prank website/
├── index.html        ← Main landing page (start here)
├── chapters.html     ← 7-chapter horror story with progress bar
├── asylum.html       ← Blackwood Asylum (room map + corridor walkthrough)
├── forest.html       ← Cursed Forest (animated trees + choice adventure)
├── ritual.html       ← Dark Ritual (5-candle interactive game)
├── gallery.html      ← Horror Gallery (masonry grid + hover scares)
├── jumpscare.html    ← Scream Room (6 scares + custom builder)
├── 404.html          ← Lost in the Void page
├── styles.css        ← Complete horror design system
└── horror.js         ← Master engine (audio, cursor, particles, scares)
```

---

## 🎭 Features

### Every Page Has:
- 🔴 Custom glowing red cursor with smooth trail
- 🩸 Animated blood drips across the top
- 👻 Floating particles (blood, skulls, ghosts, spiders, bats)
- 📺 CRT scanline flicker overlay
- 🌑 Vignette darkness effect
- 🔊 Web Audio API — ambient drone, tick sounds, scream burst
- 📳 Screen shake on scares
- ⚡ Flash effects
- 😴 Idle scare (triggers if user is inactive 18 seconds)
- 👁️ Page visibility hook (creepy sound when tab is revisited)
- 📊 Scroll-reveal animations via IntersectionObserver

### Individual Experiences:

| Page | Unique Feature |
|------|---------------|
| `index.html` | SVG cemetery gate, live victim counter, rotating dare messages |
| `chapters.html` | 7-chapter story, reading progress bar, mid-chapter scare triggers |
| `asylum.html` | 3×3 interactive room map, corridor walkthrough with animated steps |
| `forest.html` | Animated CSS tree silhouettes, choice-based adventure, depth meter |
| `ritual.html` | 5-candle click game, progressive ritual effects, purple awakening |
| `gallery.html` | Masonry grid, filter tabs, hover reveals, fake loading bar |
| `jumpscare.html` | 6 engineered scares, custom scare builder, WhatsApp share, how-to guide |
| `404.html` | Auto-scare after 8 seconds, full site navigation grid |

---

## 🎯 How To Use As A Prank

1. **Open** `jumpscare.html` or `index.html`
2. **Copy the link** (or just share the folder / host it)
3. **Send to your target** — tell them it's a quiz, game, or "cool website"
4. **Tell them to use headphones** and turn up the volume
5. **Watch and record** their reaction when they trigger a scare

---

## 🔊 Audio (No Files Needed)

All audio is generated in real-time via the **Web Audio API**:
- Ambient low-frequency drone
- Countdown tick beeps
- Scream burst (noise + oscillator layers)
- Candle click sound
- Ghost hover tone
- Random ambient events every 7–12 seconds

No external audio files required. Works offline.

---

## 🌐 Hosting (Optional)

To share the link with friends remotely, you can host it for free:

- **Netlify Drop**: drag the folder to [netlify.com/drop](https://app.netlify.com/drop)
- **GitHub Pages**: push to a repo and enable Pages
- **Vercel**: `vercel deploy` from the folder

---

## ✅ Browser Compatibility

Works in all modern browsers (Chrome, Firefox, Edge, Safari).
Audio requires a user interaction first (browser policy) — any click unlocks it.

---

*© 2026 DarkVault · Built to terrify · Share responsibly 😈*
