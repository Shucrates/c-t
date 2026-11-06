# c@t design system

Recorded from the built app (`src/App.tsx`, `src/index.css`, `src/Cat.tsx`). Product truth lives in PRODUCT.md.

## World

Apple-like, mobile-first email app. White surfaces, grouped-grey fields, pill controls and one blue accent. The c@t assistant is the only dark object on screen: a pure-black "island" at the top of the reader that morphs between sizes like the iPhone Dynamic Island.

## Colour (CSS variables in `:root`)

| Role | Normal | High contrast |
|---|---|---|
| `--bg` surface | #ffffff | #ffffff |
| `--grouped` fields, rows on hover | #f2f2f7 | #ffffff (plus 2px borders) |
| `--text` | #1d1d1f | #000000 |
| `--text-2` secondary | #55555b | #1d1d1f |
| `--accent` links, primary buttons | #0060c7 | #003f8a |
| `--scam` / `--scam-bg` | #b4141b / #fdecea | #8a0000 / white |
| `--safe` / `--safe-bg` | #1b6f35 / #e6f4ea | #0b4d1f / white |

Island palette: background #000, text #fff, secondary #d1d1d6, inner cards #1c1c1e, dark pills #2c2c2e, scam red #ff7b72, safe green #4ce07a, danger button #d70015.

## Type

System stack (`-apple-system`, SF Pro, Segoe UI, Roboto, Noto for Devanagari and Arabic). Everything is in `rem` so the Text size control (16, 19 or 22px root) scales the whole UI. Body 1.125 to 1.1875rem, large title 2.125rem/800, island verdict 1.625rem/800.

## Components

- **Pills** (`.pill-light`, `-dark`, `-danger`, `-ghost`, `-primary`): fully rounded, at least 48px tall, 0.625rem gap between neighbours.
- **Round buttons**: 48px circles for back and close.
- **Segmented control**: Inbox and Scam folder, 48px segments in a grey track.
- **Mail rows**: 96px minimum height, avatar, sender, subject, two-line preview, "Likely a scam" tag.
- **Blocked link**: dashed red card that replaces a dangerous link and opens the assistant.
- **Comfort bar**: floating, frosted bar with four 56px buttons (Text size, Read aloud, Contrast, Language). It sits over the reader on desktop.
- **Sheets**: native `<dialog>` bottom sheets with 60px radio rows.
- **Toast**: black, sits above the comfort bar, includes Undo, shown for 8 seconds.

## Island states

`checking` (cat scanning, progress sweep) → `banner` for scams (verdict, Why?, Ask me questions) or `compact` for safe mail (pill with cat and coloured dot) → `expanded` (In simple words, questions, or What would you like to do?). Width and height are measured and animated with a spring easing; content blurs in. While the island shows `checking` or `banner`, the email moves down so the subject stays visible.

## Mascot

Round minimal cat with a blue collar and a yellow "@" tag. It is a black cat with yellow eyes on light surfaces and a white cat inside the island. Moods: idle (blinks, ear twitch), thinking (eyes look around, scan line), alert (ears up, head shake, puffed tail), happy (closed eyes, blush, bob) and sleep (breathing, z's).

## Motion

Spring overshoot is used only for the island's morph. Everything else uses an exponential ease-out. `prefers-reduced-motion` turns animations off.

## Accessibility rules

Every target is at least 44x44px with space between neighbours. Focus rings are 3px. Arabic switches the UI to right-to-left, while email content keeps its own direction. When the assistant opens, focus moves to its heading, and Escape collapses it.
