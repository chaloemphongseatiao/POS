# Align shared input focus with semantic interface tokens

Written against: 2c808c27f651737d3b53620883e88cac811ef4bf

## Evidence chain

- Surface: `/pos` discount input and cash payment modal
- Problem: the shared `Input` focus ring resolves through `brand-400/40`, while links, buttons, and the POS search focus state resolve through the semantic `ring` token.
- Design evidence: `--ring` is declared beside `--primary` in `WebApp/src/app/globals.css`; `Button` and global links use `ring-ring`; `Input` hard-codes `brand-400/40`.
- Owner: `WebApp/src/components/ui/input.tsx`
- Scope and affected surfaces: all consumers of the shared `Input`, including POS discount and payment amount
- Uncertainty: none

## Design decision

Make the shared input use the existing semantic focus-ring token. Keep its glass surface and other states unchanged so the correction aligns interaction feedback without redesigning the component.

## Reuse

- `ring` color token from `WebApp/src/app/globals.css`
- Exemplar: focus classes in `WebApp/src/components/ui/button.tsx`

## Changes

1. `WebApp/src/components/ui/input.tsx`
   - Change: replace `focus-visible:ring-brand-400/40` with `focus-visible:ring-ring`; retain the current two-pixel ring and zero offset unless visual validation proves clipping.
   - Preserve: height, padding, glass background, border, typography, hover state, disabled state, and file-input styling.
   - Verify: shared inputs use the same semantic focus hue as buttons and the POS search field.

## Scope

- Inherit: every shared `Input` consumer
- Verify: POS discount input, payment amount input, login inputs, and product form inputs
- Exclude: bespoke native inputs that do not import `Input`, and changes to the `brand` palette

## Validation

- Product: keyboard-focus the POS discount and payment amount inputs and complete a cash payment.
- Interface: verify focus at mobile and desktop widths, including modal placement and disabled inputs; confirm the ring is visible without unwanted offset.
- System: confirm shared interactive primitives use `ring-ring` for the same focus role and no new focus token is introduced.
- Repository: `cd WebApp && npm run build` → build succeeds.

## Stop conditions

- Stop if current design documentation explicitly assigns `brand-400/40` to form controls as a deliberate exception.

## Design documentation

- After acceptance and validation: none
