# Polished sales-history date picker

Written against: 6d0819f9e460241a9d9cae6dfc621ed889b80958

## Evidence chain

- Surface: `WebApp/src/app/(main)/orders/page.tsx`, route `/orders`, date-range filter
- Problem: Both date controls render native `<input type="date">` elements. The browser owns the open calendar panel, so the CSS in `WebApp/src/app/globals.css` only styles the closed field and WebKit edit parts; it cannot apply the product's typography, glass surface, rounded shape, brand active state, or responsive layout to the calendar panel shown in the supplied screenshot.
- Design evidence: `DESIGN.md` defines glass surfaces, `rounded.lg`, `primary` for active states, `ring` for focus, and the IBM Plex Sans Thai font stack. `WebApp/src/components/ui/popover.tsx`, `button.tsx`, and `input.tsx` are the connected shared primitives for floating content and controls.
- Owner: Add `WebApp/src/components/ui/date-picker.tsx`; consume it in `WebApp/src/app/(main)/orders/page.tsx`.
- Scope and affected surfaces: The two date fields in the sales-history filter only. The shared component is reusable but has no automatic consumers.
- Uncertainty: Validate Thai month/year labels and first day of week with the product owner; default this implementation to Thai labels with Sunday as the first column to preserve the current calendar convention.

## Design decision

Replace the two native date inputs with one controlled custom `DatePicker` primitive built on the existing Radix `Popover`. Render the month grid inside the app so every visible calendar state follows the current design system. Keep the stored and API-facing values as `yyyy-MM-dd` strings, preserving order queries, min/max constraints, quick ranges, and pagination reset behavior.

## Reuse

- `Popover`, `PopoverTrigger`, and `PopoverContent` from `WebApp/src/components/ui/popover.tsx`
- `Button` from `WebApp/src/components/ui/button.tsx`
- `date-fns` for parsing, formatting, month arithmetic, and calendar-grid dates
- `primary`, `accent`, `muted-foreground`, `ring`, `border`, and `radius` Tailwind tokens resolved from `WebApp/src/app/globals.css`
- Exemplar: `WebApp/src/components/ui/combobox.tsx` for controlled popover composition and trigger-width handling

## Changes

1. `WebApp/src/components/ui/date-picker.tsx`
   - Change: Add a controlled `DatePicker` accepting `value`, `onChange`, `min`, `max`, `aria-label`, and optional `className`. Use a button trigger with localized display text and a calendar icon. Inside `PopoverContent`, render month/year heading, previous/next controls, a seven-column weekday header, and a fixed six-week date grid.
   - Change: Style the panel as an opaque-enough glass surface with `rounded-2xl`, subtle indigo shadow, IBM Plex inheritance, and compact spacing. Use `primary` for the selected day, `accent` for today, muted text for outside-month days, hover feedback for selectable days, and visible `ring` focus. Disable dates outside `min`/`max` and month navigation that cannot reach an enabled date.
   - Change: Close the popover after a date is selected. Support keyboard activation through native buttons, expose full dates through `aria-label`, mark today with `aria-current="date"`, and mark the selection with `aria-pressed`.
   - Preserve: ISO date-string contract, local calendar-day semantics, existing font and brand palette, and Radix collision handling.
   - Verify: The panel stays within the viewport, is fully styled, shows a clear selected date and today state, and can be used with pointer and keyboard.

2. `WebApp/src/app/(main)/orders/page.tsx`
   - Change: Replace both `<Input type="date">` instances with `DatePicker`. Pass the existing `fromDate`, `toDate`, `today`, `handleFromDate`, and `handleToDate` values and constraints unchanged. Give each trigger enough width for the localized date without overlap.
   - Preserve: Labels, query keys, API parameters, quick-range buttons, valid range enforcement, and page reset behavior.
   - Verify: Changing either date reloads the same order query, start cannot exceed end, end cannot exceed today, and quick ranges still update both fields.

3. `WebApp/src/app/globals.css`
   - Change: Remove the `input[type="date"]` and WebKit date-edit/picker-indicator rules after the orders page no longer consumes native date inputs, but only if repository search confirms there are no remaining native date fields.
   - Preserve: Global scrollbar, print, reduced-motion, and unrelated input styles.
   - Verify: No unused calendar CSS remains and no other form loses date styling.

## Scope

- Inherit: Future consumers that explicitly import the new `DatePicker`.
- Verify: `/orders` at mobile, tablet, and desktop widths; both start and end popovers near viewport edges.
- Exclude: API date logic, report filters, order table, summary cards, native browser locale settings, and unrelated form controls.

## Validation

- Product: Open `/orders`, select a start and end date, use Today/7-day/30-day shortcuts, and confirm results and constraints remain correct.
- Interface: Check selected day, today, outside-month days, disabled future/out-of-range days, previous/next month, focus ring, Escape dismissal, outside-click dismissal, and 320px/768px/1440px widths.
- System: Confirm the calendar uses existing `Popover` and semantic Tailwind tokens, with no second popover or button implementation.
- Repository: `cd WebApp && npm run build` → TypeScript and Next.js build complete successfully.
- Repository: `rg -n "type=\"date\"|input\\[type=\"date\"\\]" WebApp/src` → no stale native date consumer or CSS remains, unless a separately verified consumer still requires the global rules.

## Stop conditions

- Stop if another active branch already adds a shared calendar/date-picker owner, or if date values must represent UTC instants instead of local calendar days.

## Design documentation

- After acceptance and validation: add the shared `DatePicker` behavior and selected/today/disabled state rules under `Components` in `DESIGN.md`.
