# Keep mobile navigation balanced for every role

Written against: 2c808c27f651737d3b53620883e88cac811ef4bf

## Evidence chain

- Surface: `/pos` and every route rendered by `WebApp/src/app/(main)/layout.tsx` below the `md` breakpoint
- Problem: the navigation always uses five grid columns, while `visibleItems` contains only three entries for a cashier; the remaining columns stay empty and the links occupy only the left side.
- Design evidence: the same `visibleItems` collection feeds both responsive navigation variants in `WebApp/src/components/layout/Sidebar.tsx`; the desktop variant centers every visible item, while the mobile container hard-codes `grid-cols-5`.
- Owner: `WebApp/src/components/layout/Sidebar.tsx`
- Scope and affected surfaces: mobile navigation on `/pos`, `/orders`, `/dashboard`, `/products`, and `/settings`, for cashier and admin roles
- Uncertainty: none

## Design decision

Use equal-width flexible links in the mobile navigation so its layout derives from the role-filtered item collection. This keeps all available actions centered across the full bar without introducing role-specific class maps.

## Reuse

- Existing `visibleItems` filtering and mobile `Link` composition
- Exemplar: the existing full-width mobile navigation container in `WebApp/src/components/layout/Sidebar.tsx`

## Changes

1. `WebApp/src/components/layout/Sidebar.tsx`
   - Change: replace `grid grid-cols-5` on the mobile navigation with `flex`; add `min-w-0 flex-1` to each mobile navigation link.
   - Preserve: role filtering, order, labels, icons, active color, safe-area padding, fixed positioning, and the `md:hidden` breakpoint.
   - Verify: three cashier links and five admin links each divide the full navigation width evenly.

## Scope

- Inherit: every route using `MainLayout`
- Verify: both cashier and admin roles at widths below `md`
- Exclude: desktop sidebar dimensions and logout behavior

## Validation

- Product: sign in as cashier, open `/pos`, and confirm the three available destinations span the full bottom bar.
- Interface: test cashier and admin roles at 320px, 375px, and 767px widths; confirm long Thai labels remain centered without overflow.
- System: confirm the same `visibleItems` array remains the only navigation source.
- Repository: `cd WebApp && npm run build` → build succeeds.

## Stop conditions

- Stop if another runtime owner replaces `Sidebar` for mobile navigation or product requirements reserve fixed empty slots for hidden admin actions.

## Design documentation

- After acceptance and validation: none
