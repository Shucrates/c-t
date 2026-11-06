# Product <!-- impeccable:product-schema 1 -->

## Platform

web (mobile-first; must also work on desktop)

## Users

Older adults (roughly 65+) reading their email on a phone who are unsure whether a message is a scam. They are not confident with technology, may have reduced eyesight, hearing or fine motor control, and may not read English as a first language. There is no secondary user role; a trusted person (for example a relative) only receives a summary when the user chooses to ask them.

## Product Purpose

c@t is an email app with a built-in assistant (the cat) that checks each email, says plainly whether it looks like a scam, explains why in simple words, and helps the user act safely: ask someone they trust, move the email to a Scam folder, or undo if c@t was wrong. Success: the user can tell within seconds whether an email is safe and knows exactly what to do next, without clicking a dangerous link.

## Positioning

The safety check is not a separate tool or warning banner; a friendly assistant lives inside the mail app, blocks risky links before they can be opened, and talks the user through the decision in their own language, with the option to loop in a trusted person.

## Operating Context

Personal email on a phone, often at home, sometimes in poor light or with reading glasses off. Users read slowly, may want text read aloud, and may need to check with a relative before acting.

## Capabilities and Constraints

- Course project prototype with fake mail data; not connected to a real mailbox.
- Read aloud uses the browser's built-in speech synthesis.
- Language switches between pre-written translations: English, Irish (Gaeilge), Standard Galactic Alphabet ("enchanting table" script), Russian, Italian, French, Spanish, Arabic (right-to-left), Hindi, Slovak, plus German, Portuguese, Polish and Japanese. Real-time translation may come later.
- Call and Send summary to the trusted contact are simulated (confirmation only).
- Accessibility controls (text size, read aloud, contrast, language) must actually work.
- The low-fidelity wireframe is a rough idea only, not a spec.

## Brand Commitments

- Product name: c@t (replaces the earlier name "Postbird").
- The cat mascot may be redesigned; it should feel modern, minimal or fun, and lively with animation.
- The assistant's motion should feel like the iPhone Dynamic Island (a pill that morphs into larger states).
- Clean, modern, Apple-like UI.

## Evidence on Hand

No real users, testimonials or statistics. Trusted contact name and mail content are placeholders.

## Product Principles

1. Safe by default: dangerous links are blocked until the user has been told what they are.
2. One clear answer first, details on request.
3. Plain words over technical terms, in the user's language.
4. Nothing is final: every action can be undone.
5. Never rush the user; scammers do.

## Accessibility & Inclusion

Designed for older adults. Every button and link at least 44x44px with space between neighbours (Appendix A, O1). Large readable text that can be enlarged further, high-contrast option, read aloud, keyboard and screen-reader support, right-to-left support for Arabic, reduced-motion support.
