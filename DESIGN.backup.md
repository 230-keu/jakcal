# Design Direction: Kalkulator Pajak Invoice (PPN & PPh) [BACKUP]

## Design Read
Reading this as: Interactive financial utility (Indonesian PPN & PPh invoice calculator) for finance teams, vendors, and freelancers, in a warm editorial ledger style inspired by the user's reference screenshot, dial `ENERGY 1 / RHYTHM 2 / MOTION 1`.

## Dials
- **ENERGY: 1 (Calm)**: High-clarity accounting ledger aesthetic where numbers, input boundaries, and tax relationships take center stage without decorative noise.
- **RHYTHM: 2 (Balanced)**: Two distinct structural zones (top parameter controls vs. bottom interactive 5-row financial ledger) with deliberate typographic weight differentiation on key summary rows (`Total invoice` and `Diterima vendor`).
- **MOTION: 1 (Hover & Focus States Only)**: Instantaneous numeric recalculation on keystroke with crisp focus rings and tactile button press offset; zero decorative loops.

## Color Palette (R-29: 2 Core + 1 Accent)

### Light Mode (Default - Warm Paper Ledger)
- **Background Primary (`#FAF7F2`)**: Warm archival paper tone matching the reference screenshot to reduce eye strain during invoice reconciliation.
- **Surface / Ledger Cell (`#FFFFFF` & `#F3EFE6`)**: Crisp white for interactive fields and warm stone (`#F3EFE6`) for highlighting the active calculation anchor row.
- **Ink & Structural Border (`#18181B` & `#52525B`)**: Deep charcoal (`16.58:1` on paper) for primary text and crisp `1.5px` ledger borders; muted zinc (`7.23:1` on paper) for supporting labels.
- **Deliberate Accent (`#0F766E`)**: Deep fiscal teal (`5.47:1` on white) used exclusively to indicate the active source row (`Acuan`) and keyboard `:focus-visible` indicator. Semantic deduction text uses deep crimson (`#B91C1C`, `6.47:1` on white) paired with an explicit minus sign (`- Rp`).

### Dark Mode (Carbon Ledger)
- **Background Primary (`#121316`)**: Deep carbon surface for low-light financial work.
- **Surface / Ledger Cell (`#1A1C20` & `#22252A`)**: Elevated slate surfaces for inputs and active row states.
- **Chalk & Border (`#F4F4F5`, `#A1A1AA`, border `#71717A`)**: High-contrast chalk text (`16.90:1`), muted silver labels (`7.25:1`), and `3.53:1` structural borders.
- **Deliberate Accent (`#2DD4BF`)**: Crisp teal (`9.17:1` on `#1A1C20`) for active source indicators and focus rings; `#F87171` (`6.17:1`) for `- Rp` deductions.

## Typography & Hierarchy (R-06, R-31)
- **UI & Labels**: System humanist sans-serif (`Plus Jakarta Sans`, `-apple-system`, `BlinkMacSystemFont`, `'Segoe UI'`, sans-serif) for fast label scanning in Indonesian.
- **Currency & Numeric Inputs**: Tabular monospace (`'JetBrains Mono'`, `'SFMono-Regular'`, `Consolas`, monospace with `font-variant-numeric: tabular-nums`) so digits align vertically across all 5 ledger rows and never jitter during live typing.

## One-Line Decision Log (R-31)
- **Why this color palette?**: Matches the warm paper-and-ink ledger aesthetic of the user's reference image while meeting strict WCAG AA contrast in both light and dark modes.
- **Why this layout?**: Mirrors the exact mental model of an Indonesian tax invoice: top parameters (`Nominal`, `Tarif PPN`, `Potongan PPh`) feeding a 5-row bidirectional ledger table.
- **Why tabular monospace on numbers?**: Aligns Rupiah place values vertically across `DPP`, `PPN`, `Total invoice`, `PPh dipotong`, and `Diterima vendor` for instant visual verification.
- **Why hard offset shadow on the Salin button?**: Preserves the tactile neo-brutalist ledger button signature from the user's reference screenshot (`2px 2px 0` solid border offset).
- **Why inline editable inputs inside every table row?**: Fulfills the core requirement that editing any component (such as `Diterima vendor` for gross-up or `Total invoice`) immediately reverse-calculates all other rows in place.

