# Show one notification for each POS outcome

Written against: 2c808c27f651737d3b53620883e88cac811ef4bf

## Evidence chain

- Surface: `/pos` barcode lookup and order submission outcomes
- Problem: rejected API requests reach the global Axios error interceptor and the POS-local error handler, producing two notification surfaces for one error with different styling and durations.
- Design evidence: `WebApp/src/lib/api/client.ts` sends non-401 errors to `useToast`; `WebApp/src/app/(main)/layout.tsx` renders `ToastContainer`; `WebApp/src/app/(main)/pos/page.tsx` independently owns and renders another toast.
- Owner: `WebApp/src/lib/hooks/useToast.ts` and `WebApp/src/components/ui/ToastContainer.tsx`
- Scope and affected surfaces: POS success, barcode-not-found, and order-error notifications
- Uncertainty: none

## Design decision

Route POS notifications through the existing global toast store and remove the page-local notification implementation. API failures remain owned by the interceptor; POS adds only outcomes that the interceptor does not produce, such as successful payment and a locally composed barcode message when required.

## Reuse

- `useToast.addToast`
- Exemplar: `WebApp/src/lib/api/client.ts` and `WebApp/src/components/ui/ToastContainer.tsx`

## Changes

1. `WebApp/src/app/(main)/pos/page.tsx`
   - Change: replace local `toast` state with `useToast`; remove the local toast markup and auto-dismiss effect; send payment success through `addToast`.
   - Preserve: order number and formatted total in the payment-success message.
   - Verify: successful payment displays one global success toast.
2. `WebApp/src/app/(main)/pos/page.tsx`
   - Change: do not add a second toast in `orderMutation.onError`, because the Axios interceptor already owns API errors. For barcode lookup, rely on the interceptor error toast or suppress the interceptor explicitly only if the POS-specific barcode message must be retained—never emit both.
   - Preserve: payment modal closure after a failed order and existing 401 redirect behavior.
   - Verify: each failed order and barcode lookup displays exactly one toast.
3. `WebApp/src/components/ui/ToastContainer.tsx`
   - Change: no structural change expected; verify multiline payment-success content remains readable. Add `whitespace-pre-line` to the message only if the preserved newline is otherwise collapsed.
   - Preserve: existing type colors, dismissal, stacking, and timeout behavior.
   - Verify: order number and total render as two intended lines.

## Scope

- Inherit: global toast presentation already used by all main routes
- Verify: `/pos` success and error outcomes plus an unrelated API error on another main route
- Exclude: Axios authentication handling, loading bar behavior, and toast visual redesign

## Validation

- Product: complete a payment, submit an order that the API rejects, and scan an unknown barcode; each action produces one notification.
- Interface: verify success/error colors, multiline success text, manual close, and stacked unrelated messages on mobile and desktop.
- System: search `/pos` for page-local fixed toast markup and confirm `ToastContainer` remains the sole renderer.
- Repository: `cd WebApp && npm run build` → build succeeds.

## Stop conditions

- Stop if API modules bypass `apiClient`, or if barcode errors need different interceptor behavior that would affect routes outside POS.

## Design documentation

- After acceptance and validation: record `ToastContainer` as the single notification renderer in repository UI guidance if such documentation is introduced; otherwise none.
