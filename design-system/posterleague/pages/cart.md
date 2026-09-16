# Cart Page Overrides

> **PROJECT:** POSTERLEAGUE
> **Page Type:** Checkout / Cart

> Rules here **override** `design-system/posterleague/MASTER.md`.

---

## Layout

- **Max width:** 1080px
- **Pattern:** Items left + sticky glass summary right (desktop); stacked + sticky mobile checkout bar
- **Section order:** Hero → Rewards bar → Line items → Upsell carousel → Order summary

## Style

- **Hero:** Dark liquid-glass band — thin, premium, gold accent glow
- **Summary card:** `backdrop-filter: blur(20px)` on dark glass panel
- **Cards:** White on `#F4F4F2` background, 12px radius, subtle shadow on hover

## Brand tokens (override MASTER accent)

| Token | Value |
|-------|-------|
| Primary | `#0C0C0C` |
| Accent / CTA | `#FFBA00` |
| Background | `#F4F4F2` |

## Accessibility (required)

- Min touch target: 44×44px on qty buttons, remove, checkout, upsell add
- `focus-visible` outline: 2px gold `#FFBA00`
- `prefers-reduced-motion`: skip progress bar animation
- SVG icons only — no emojis

## Components

- Sticky mobile checkout bar (≤959px)
- Horizontal upsell carousel with glue dots + wall packs link
- Social proof above checkout CTA
- Compare-at savings on line items when set in Shopify
