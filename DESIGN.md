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
- **Back and Close**: always an icon plus a word, never an icon alone. On light surfaces they are grey pills (`.back-pill`, `.grey-pill`); inside the island they are dark pills (`.isl-pill`). On phones, the email's Back button sits in its own row under the island, so it is never hidden by it.
- **Cat logo / Inbox check**: the cat logo at the top left of the inbox is a quiet button with no badge. It opens the "Inbox check" sheet. The sheet has one sentence beside the cat ("These look like scams. Tap one to see why." or "All the emails in your inbox look safe."), then the likely scams in the inbox as rows that open the email. Nothing else, on purpose.
- **Segmented control**: Inbox and Scam folder, 48px segments in a grey track.
- **Mail rows**: 96px minimum height, avatar, sender, subject, two-line preview, "Likely a scam" tag.
- **Blocked link**: dashed red card that replaces a dangerous link and opens the assistant.
- **Comfort bar**: floating, frosted bar with four buttons at least 56px tall (Text size, Read aloud, High contrast, Language). Labels are 16px (1rem) and may wrap onto two lines. It sits over the reader on desktop.
- **Sheets**: native `<dialog>` bottom sheets with 60px radio rows.
- **Toast**: black, sits above the comfort bar, includes Undo. It is shown for 10 seconds and pauses while the pointer or keyboard focus is on it (WCAG 2.2.1).
- **Suspicious address**: on scam emails, the red sender address also gets a "⚠ Suspicious address" label, so the warning does not rely on colour.
- **Intro**: a bottom sheet with 4 short cards, about 30 seconds in total: Hi I'm c@t, Find me at the top, Risky links are blocked, Make it comfortable. Each card shows a small copy of the real element, a "Read this to me" button, a step count and Back / Next buttons. There are no timers. Card 1 also has a Language button. The intro opens on the first visit (remembered in `localStorage` as `cat-intro-seen`) and again from the **Help** pill in the inbox header.

## Island states

`checking` (cat scanning, progress sweep) → `compact` for every email: a pill with the cat, a coloured dot and the verdict in words. Nothing pops up by itself; screen readers hear the verdict through a status message. Tapping the pill opens `banner` for scams (verdict, Why?, Ask me questions) or "In simple words" for safe mail → `expanded` (In simple words, questions, or What should I do?). "What should I do?" shows one sentence of advice and one main white button (Move to Scam folder, or Done). Every other option sits below it in two iOS-style grouped lists, "Ask someone you trust" (Call Anna, Send Anna a summary) and "More options" (Learn about this scam, and the way out when c@t is wrong). All rows look the same: grey row, 28px grey icon (sized in rem, so it grows with Text size), white text, chevron. The screen uses no red or green, because the verdict was already shown. "Learn about this kind of scam" opens its own step, "How this scam works". It shows three grey cards, one per sign of the scam. Each card has an icon beside a short title, one plain sentence, and "In this email:" with the exact words from the email in a black chip. Below them, a white "What to do instead" card and "Read this to me". Width and height are measured and animated with a spring easing; content blurs in. While the island shows `checking` or `banner`, the email moves down by the island's measured height (`--island-h`), so the subject stays visible in any language or text size. The banner has two rows (cat, "c@t checked this email" and Close; then the verdict), and the expanded header has two rows (cat or Back, and Close; then the title), so labelled buttons never squeeze the text.

## Mascot

Round minimal cat with a blue collar and a yellow "@" tag. It is a black cat with yellow eyes on light surfaces and a white cat inside the island. Moods: idle (blinks, ear twitch), thinking (eyes look around, scan line), alert (ears up, head shake, puffed tail), happy (closed eyes, blush, bob) and sleep (breathing, z's).

## Motion

Spring overshoot is used only for the island's morph. Everything else uses an exponential ease-out. `prefers-reduced-motion` turns animations off.

## Accessibility rules

Every target is at least 44x44px with space between neighbours. Focus rings are 3px. All text is at least 16px. Arabic switches the UI to right-to-left, while email content keeps its own direction.

Focus follows the person:
- When an email opens on a phone, focus moves to its subject.
- When the assistant opens, focus moves to its heading. Escape or Close collapses it and returns focus to the subject.
- When the email closes or moves to another folder, focus returns to its row, or to the list title.

While the assistant is expanded, the email behind it is `inert`, so Tab and screen readers can't reach the blurred content. The comfort bar stays reachable. The page title names the current screen, for example "Inbox – c@t".
