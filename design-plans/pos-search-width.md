# Constrain the POS search field width

Written against: 480ed5c9e3d5a0c81c9e942a79d26b0b6676e74f

## Evidence chain

- Surface: `WebApp/src/app/(main)/pos/page.tsx`, route `/pos`
- Problem: The search wrapper has no width constraint, so it stretches across the full product-browser column and appears disproportionately wide in the supplied desktop screenshot.
- Design evidence: User-supplied `/pos` screenshot with the search area explicitly outlined.
- Owner: `WebApp/src/app/(main)/pos/page.tsx`
- Scope and affected surfaces: The product search control on `/pos`.
- Uncertainty: The exact preferred desktop width was not specified; use the existing Tailwind spacing system and verify visually against the supplied screenshot.

## Design decision

Keep the search control fluid on small screens and constrain it to a readable desktop width. This preserves scanner and keyboard use while preventing the control from dominating the product browser.

## Reuse

- Existing Tailwind responsive width utilities.
- Exemplar: The existing responsive sizing pattern on the cart container in `WebApp/src/app/(main)/pos/page.tsx`.

## Changes

1. `WebApp/src/app/(main)/pos/page.tsx`
   - Change: Add a desktop `max-width` constraint to the search wrapper while retaining `w-full` below the desktop breakpoint. Start with `lg:max-w-3xl`.
   - Preserve: Barcode icon, input behavior, focus ring, glass styling, and full-width mobile layout.
   - Verify: At desktop widths the search control stops at 48rem; on mobile it fills the available product-browser width without horizontal overflow.

## Scope

- Inherit: No other consumer; the wrapper is local to `/pos`.
- Verify: `/pos` at 375px, 768px, 1024px, and 1440px viewport widths.
- Exclude: Product grid width, category scroller, cart width, and search behavior.

## Validation

- Product: Search by product name and scan a barcode; both still add/filter as before.
- Interface: Check empty, short, and long query values; focus state; Thai placeholder; mobile and desktop layouts.
- System: Confirm no new shared component or parallel width token is introduced.
- Repository: `cd WebApp && npm run build` → build completes successfully.

## Stop conditions

- Stop if the product browser is intentionally required to align the search control edge-to-edge with the category scroller.

## Design documentation

- After acceptance and validation: none.
