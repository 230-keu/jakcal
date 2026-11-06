# Design Direction: Kalkulator Pajak Invoice (Apple Design System)

## Overview & Philosophy
Applying Apple's clean, photography-first and content-centric design system to the Indonesian Tax Invoice Calculator (PPN & PPh). UI chrome recedes so the numbers and tax relationships speak directly. 

No decorative gradients, no heavy drop shadows on UI cards or buttons. Elevation is achieved through subtle surface contrast (pure white `#FFFFFF` cards on parchment `#F5F5F7` background), whisper-soft 1px hairlines (`#E0E0E0`), frosted-glass headers (`saturate(180%) blur(20px)`), and a single brand interactive accent color: Apple Action Blue (`#0066CC`).

## Color System

### Light Mode (Signature Apple Light Canvas)
- **Canvas / Background (`#F5F5F7`)**: Apple parchment off-white page background.
- **Surface / Card (`#FFFFFF`)**: Pure white utility cards with subtle 1px hairline (`#E0E0E0`).
- **Surface Pearl (`#FAFAFC`)**: Near-white subtle row hover and secondary capsule fill.
- **Active Source Highlight (`#F0F6FF`)**: Whisper of Apple blue tint for the active recalculation anchor row.
- **Ink Primary (`#1D1D1F`)**: Signature Apple near-black ink for headlines and primary numbers.
- **Ink Secondary / Muted (`#86868B`)**: SF Pro muted label tone for secondary captions and hints.
- **Action Blue (`#0066CC`)**: The single interactive accent for primary buttons, active badges, and links.
- **Focus Blue (`#0071E3`)**: Keyboard focus outline and active input borders.
- **Deduction Accent (`#D70015` / `#B91C1C`)**: Apple System Red reserved strictly for negative deductions (`- Rp`).

### Dark Mode (Apple Pro Canvas)
- **Canvas / Background (`#000000`)**: Deep void black backdrop.
- **Surface / Card (`#1D1D1F`)**: Apple space gray utility cards.
- **Surface Tile / Row (`#272729` & `#2A2A2C`)**: Layered dark tiles for inputs and table rows.
- **Ink Primary (`#F5F5F7`)**: Crisp near-white text on dark.
- **Ink Secondary (`#86868B`)**: Balanced silver captions.
- **Action Blue On Dark (`#2997FF`)**: Apple Sky Link Blue for high legibility on dark surfaces.
- **Deduction Accent (`#FF453A`)**: Apple dark mode System Red for deductions.

## Typography
- **Headlines & Titles**: `SF Pro Display`, `-apple-system`, `BlinkMacSystemFont`, `system-ui`, sans-serif.
  - Weight: 600 (semi-bold, strictly avoiding over-bold 700 or generic 500).
  - Letter spacing: Negative tracking (`-0.28px` to `-0.374px` / `-0.015em`) for the iconic Apple tight headline cadence.
- **Body & Captions**: `SF Pro Text`, `-apple-system`, `BlinkMacSystemFont`, `system-ui`, sans-serif.
  - Body size: 17px with 1.47 line height.
- **Numeric & Currency**: Tabular figures via `'SF Pro Text', 'SFMono-Regular', Consolas, monospace` with `font-variant-numeric: tabular-nums` to guarantee place-value alignment across invoice rows.

## Shapes & Geometry
- **Primary Buttons (`button-primary`)**: Full pill shape (`border-radius: 9999px`), `#0066CC` background, white text, 44px min touch target, micro-interaction press state `transform: scale(0.95)`.
- **Secondary Actions (`button-secondary-pill`, `button-dark-utility`)**: Capsule/pill shape, clean hairlines, subtle hover.
- **Cards & Ledger Containers**: Rounded `18px` (`rounded.lg`), 1px solid hairline (`#E0E0E0`), zero box-shadow.
- **Form Inputs**: Rounded `12px` or pill, crisp 1px border, seamless focus ring (`0 0 0 3px rgba(0, 113, 227, 0.2)`).

## Accessibility & Interaction
- **Focus Rings**: 2px solid `#0071E3` with 2px offset.
- **Touch Targets**: Minimum 44 × 44px on all buttons, checkboxes, and interactive rows.
- **Copy Feedback**: Smooth state transition on the Salin button with Apple checkmark icon and blue feedback.
