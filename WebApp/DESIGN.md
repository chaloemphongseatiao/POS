---
version: alpha
name: POS WebApp
description: Thai retail point-of-sale interface with semantic color roles and translucent glass surfaces.
colors:
  background: "hsl(228 33% 96%)"
  foreground: "hsl(232 28% 18%)"
  card: "hsl(0 0% 100%)"
  card-foreground: "hsl(222 35% 12%)"
  border: "hsl(229 32% 91%)"
  input: "hsl(229 28% 86%)"
  primary: "hsl(232 61% 59%)"
  primary-foreground: "hsl(0 0% 100%)"
  secondary: "hsl(230 35% 94%)"
  secondary-foreground: "hsl(222 25% 22%)"
  muted: "hsl(230 28% 95%)"
  muted-foreground: "hsl(228 12% 45%)"
  accent: "hsl(232 43% 92%)"
  accent-foreground: "hsl(232 48% 38%)"
  destructive: "hsl(0 72% 48%)"
  destructive-foreground: "hsl(0 0% 100%)"
  ring: "hsl(232 61% 59%)"
rounded:
  base: 1rem
---

## Overview

POS WebApp supports Thai retail checkout and store management. Its current interface combines semantic indigo interaction states with light translucent surfaces over a softly tinted background.

## Colors

Use semantic color roles instead of palette values for shared components. Primary marks the main action and selected state; destructive is reserved for irreversible or invalidating actions; muted roles carry supporting text and low-emphasis surfaces. Focus indicators use the ring role.

Glass surfaces remain light enough for foreground and card-foreground text. Status treatments use the existing success, warning, and destructive component variants rather than repurposing primary.

## Typography

Thai content is the primary interface language. Shared page titles use the page-title owner, while supporting copy uses page-description. Numeric totals and table values use tabular figures so changing amounts remain aligned.

Controls inherit the application body typeface. Receipt content is the scoped exception and retains its receipt-oriented monospace treatment.

## Layout

Management routes use page-shell as the width and responsive-padding owner. Pair page-title and page-description inside page-header when a route also presents header actions.

The POS transaction route keeps its dedicated viewport workspace: product discovery is the flexible region and the cart is the bounded checkout region. Below the desktop split breakpoint, these regions stack and leave space for bottom navigation.

## Elevation & Depth

Use the shared glass or surface owner for primary panels. Cards reuse the Card primitive, and modal workflows reuse Dialog so overlay, blur, elevation, and entrance treatment stay consistent.

Reserve stronger elevation for overlays, active navigation, and the primary transaction action. Table rows change surface tone on hover without becoming separate elevated cards.

## Shapes

Use the shared base radius for ordinary controls and surfaces. Larger containers and dialogs may use the established larger rounded variants owned by their shared component. Status badges remain pill-shaped.

## Components

Use Button variants for primary, destructive, outline, secondary, ghost, and link actions. Do not recreate these action treatments in route-local buttons when an existing variant expresses the same role.

Use Input for form fields across authentication, filters, payment, products, and settings. Search compositions may wrap a native input when they require an inline icon, but their focus state follows the semantic ring role.

Use Card for grouped settings content and glass or surface for route-level panels and data regions. Use Dialog for payment, receipt, confirmation, and editing overlays.

Navigation has two responsive presentations from one item collection: a desktop sidebar and a mobile bottom bar. Active state uses the primary role in both presentations.
