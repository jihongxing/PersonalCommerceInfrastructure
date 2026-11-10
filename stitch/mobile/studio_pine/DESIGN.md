---
name: Studio Pine
colors:
  surface: '#f7f9ff'
  surface-dim: '#d0dbe8'
  surface-bright: '#f7f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#ecf4ff'
  surface-container: '#e4effc'
  surface-container-high: '#dee9f6'
  surface-container-highest: '#d8e4f1'
  on-surface: '#121d26'
  on-surface-variant: '#404947'
  inverse-surface: '#27323b'
  inverse-on-surface: '#e7f2ff'
  outline: '#707977'
  outline-variant: '#bfc8c6'
  surface-tint: '#306762'
  primary: '#003430'
  on-primary: '#ffffff'
  primary-container: '#0f4c47'
  on-primary-container: '#84bbb4'
  inverse-primary: '#99d1ca'
  secondary: '#226961'
  on-secondary: '#ffffff'
  secondary-container: '#abefe6'
  on-secondary-container: '#2a6f67'
  tertiary: '#003430'
  on-tertiary: '#ffffff'
  tertiary-container: '#004d47'
  on-tertiary-container: '#70bfb5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b5ede6'
  primary-fixed-dim: '#99d1ca'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#144f4a'
  secondary-fixed: '#abefe6'
  secondary-fixed-dim: '#90d3ca'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#00504a'
  tertiary-fixed: '#a1f1e7'
  tertiary-fixed-dim: '#85d5cb'
  on-tertiary-fixed: '#00201d'
  on-tertiary-fixed-variant: '#00504a'
  background: '#f7f9ff'
  on-background: '#121d26'
  surface-variant: '#d8e4f1'
typography:
  display-lg:
    fontFamily: Noto Sans
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
  display-lg-mobile:
    fontFamily: Noto Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-lg:
    fontFamily: Noto Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Noto Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Noto Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Noto Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Noto Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Noto Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Noto Sans
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-sm:
    fontFamily: Noto Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes an architectural, high-trust environment tailored for independent knowledge creators, studio consultants, and boutique commerce operators in modern Chinese and international markets. The aesthetic merges contemporary Chinese digital minimalism with Swiss editorial precision: quiet, deliberate, and free of vanity metrics, neon glows, or aggressive gamification.

The experience prioritizes two synchronized modes:
1. **Studio Back-Office:** A disciplined workspace optimized for inventory curation, transaction validation, fulfillment tracking, and workflow automation. It presents density without clutter, using tactile borders, precise status tagging, and structured monospaced references.
2. **Public Storefront & Reader Front:** An accessible, calm, and readable presentation layer that respects visitor attention, elevating the creator’s work through clear typography, structured grids, and unhurried layouts.

Visual principles:
- **Quiet Utility:** Elimination of decorative gradient fills, shiny glass overlays, and faux analytics cards. Value is conveyed through information clarity and deliberate composition.
- **Structural Integrity:** Boundaries are demarcated via crisp 1px hairpins and subdued structural gray dividers rather than floating ambient elevation.
- **Editorial Legibility:** Strict hierarchical pacing between display headings, dense operational tables, and distinct code-formatted record identifiers.

## Colors

The palette draws from natural pine ink and slate stone, engineered to support sustained screen time without optical fatigue.

### Core Hierarchy
- **Canvas Base:** `#F8F9FA` serves as the primary canvas tint, providing a grounded foundation that prevents harsh white glare across dense studio views.
- **Surface Elevation:** `#FFFFFF` is reserved strictly for operational cards, data grids, toolbars, and modal bodies.
- **Primary Pinewood (`#0F4C47` / `#135E57`):** The signature anchor for primary calls-to-action, active sidebar states, and brand emblems. Hover states step up to `#18726A`, while soft selection washes rely on the muted pine wash `#EBF3F1`.
- **Text & Editorial Values:**
  - Deep Title: `#0D1317` (High-contrast for headers, amounts, and critical values)
  - Body Slate: `#192128` (Readable, low-glare dark slate for primary body copy)
  - Muted Label / Body Secondary: `#5A6570` (Field labels, metadata, and column headers)
  - Inactive / Hint Subtext: `#87929D` (Placeholder text, subtle timestamps)
- **Structural Dividers:**
  - Primary Border: `#E2E5E8` (Standard card borders, table dividers, form fields)
  - Subtle Border: `#ECEEF0` (Nested sub-rows, secondary dividers, and inset zones)

### Functional & Lifecycle Feedback
Status treatments utilize a three-element formula: deeply saturated text, high-tint tinted surface backgrounds, and a calibrating border:
- **Pending / Action Required:** Amber Ochre `#B46200` (Surface: `#FEF7EE`, Border: `#F8DCB4`)
- **Success / Fulfilled:** Forest Mint `#1E6B47` (Surface: `#EDF7F1`, Border: `#BEE4D0`)
- **Critical / Rejected / Alert:** Brick Muted Red `#A62828` (Surface: `#FDF0F0`, Border: `#F5C6C6`)
- **Neutral / Draft / Archived:** Slate Gray `#5A6570` (Surface: `#F1F3F5`, Border: `#E2E5E8`)

## Typography

The type system prioritizes dual-script performance across Simplified Chinese, Traditional Chinese, and Latin alphanumerics.

- **Primary Stack:** Native system sans-serif font rendering (`system-ui, -apple-system, "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif`) ensures crisp edge fidelity across Windows, macOS, iOS, and Android.
- **Monospace Stack:** `JetBrains Mono, SFMono-Regular, Menlo, Monaco, Consolas, monospace` is mandatory for functional data points: formatted 18-character Creator Identifiers (C-Numbers), token keys, financial settlement ledgers, and inventory units.
- **Hierarchy Rules:**
  - Standard table data uses `body-md` (14px/22px).
  - Column names, field prompts, and non-interactive metrics utilize `label-md` or `label-sm` with letter spacing set between 0 and +0.02em to prevent glyph crowding in Chinese.
  - Numbers denoting financial totals above 20px maintain tabular lining (`font-variant-numeric: tabular-nums`).

## Layout & Spacing

The layout is constructed on an 8pt modular rhythm with a supporting 4pt micro-grid.

### Grid Architecture
- **Desktop Studio Console (1024px+):** Fixed-width side rail (240px default, collapsable to 64px icon-only), with a fluid workspace running between 1200px max-width (focused operational tasks) and unconstrained fluid tables (order ledgers). Column grids employ 12 columns with 24px (`gutter-desktop`) gutters and 32px (`margin-desktop`) canvas padding.
- **Tablet (768px – 1023px):** 8-column layout with 16px (`gutter`) gutters and 24px (`margin-tablet`) margins. Sidebar transforms into a slide-over panel.
- **Mobile Handheld (320px – 767px):** 4-column flow with 16px outer margin (`margin`) and 12px internal gutters. Single-column card stacking replaces wide tables.

### Rhythm Principles
- Component inner padding matches standard spacing primitives (`space-sm` 8px for compact badges, `space-md` 16px for card interiors, `space-lg` 24px for section separations).
- Complex forms and multi-field panels use a consistent vertical gap of 20px to 24px between field groups, ensuring clear optical grouping.

## Elevation & Depth

This design system avoids high-blur, multi-colored drop shadows and semi-transparent blur planes. Depth is structured through mechanical surface layering and hairline borders:

- **Flat Canvas Model:** The underlying shell rests at `#F8F9FA`. Interactive surfaces and content containers rest at `#FFFFFF`.
- **Primary Separation:** 1px solid borders (`#E2E5E8`) define all container edges. Nested groups and inset controls transition to `#ECEEF0`.
- **Restrained Shadow:** Floating elements (dropdown menus, action sheets, context popovers) receive a single micro-shadow: `0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.03)` wrapped in a 1px solid `#E2E5E8` shell.
- **Modal Overlays:** Modal viewports use a neutral backdrop scrim of `rgba(13, 19, 23, 0.4)` without backdrop blur filters to preserve sharp foreground readability.

## Shapes

The geometry reflects utility and structure. Radii are deliberately constrained to prevent soft or toy-like appearances:

- **Base Radius (0.25rem / 4px):** Applied to form inputs, search fields, buttons, action chips, and status badges.
- **Medium Radius (0.375rem / 6px to 0.5rem / 8px):** Applied to root data cards, modal containers, and studio panels.
- **Circular / Pill (`rounded-full`):** Reserved exclusively for user identity avatars, presence dot indicators, and discrete numeric notification tallies. Form controls, status chips, and action buttons must never use pill silhouettes.

## Components

### 1. Buttons
- **Primary:** Background `#0F4C47`, text `#FFFFFF`, border none. Hover: `#18726A`. Active: `#0B3834`. Disabled: `#E2E5E8` with `#87929D` text.
- **Secondary / Default:** Background `#FFFFFF`, text `#192128`, 1px solid border `#E2E5E8`. Hover: `#F8F9FA` with border `#5A6570`.
- **Subtle / Ghost:** Background transparent, text `#5A6570`. Hover: `#F1F3F5` with text `#192128`.
- **Destructive:** Background `#FDF0F0`, text `#A62828`, 1px border `#F5C6C6`. Hover: background `#A62828`, text `#FFFFFF`.

### 2. Form Inputs & Selectors
- Standard height: 36px (compact studio density) or 40px (default).
- Surface `#FFFFFF`, border 1px solid `#E2E5E8`, text `#192128`, placeholder `#87929D`.
- Focus state: Border `#0F4C47` with a 1px outline box-shadow: `0 0 0 1px #0F4C47`.
- Error state: Border `#A62828`, focus shadow `0 0 0 1px #A62828`.

### 3. Identity Codes (C-Numbers & Fulfillment Tokens)
- Formatted as hyphenated blocks (e.g., `ACDEFH-3479JK-MNPQRT`).
- Rendered in JetBrains Mono (`code-md` or `code-sm`), tracking +0.04em, wrapped in an inline pill-free container (background `#F1F3F5`, border 1px solid `#E2E5E8`, padding 2px 6px, radius 4px). Includes a single-click copy trigger with a quiet checkmark confirmation.

### 4. Status Badges & Chips
- Structure: 1px border, tinted background, high-contrast text, 4px border-radius, font size 12px, font-weight 500.
- Variants:
  - Pending: Text `#B46200`, Bg `#FEF7EE`, Border `#F8DCB4`
  - Fulfilled: Text `#1E6B47`, Bg `#EDF7F1`, Border `#BEE4D0`
  - Critical: Text `#A62828`, Bg `#FDF0F0`, Border `#F5C6C6`
  - Inactive: Text `#5A6570`, Bg `#F1F3F5`, Border `#E2E5E8`

### 5. Cards & Tables
- **Cards:** Background `#FFFFFF`, border 1px solid `#E2E5E8`, border-radius 6px. Padding 16px to 24px. Header rows separated by a 1px horizontal `#ECEEF0` rule.
- **Data Tables:** Column headers in `label-sm` text (`#5A6570`), background `#F8F9FA`, border-bottom 1px solid `#E2E5E8`. Row hover states utilize `#F8F9FA` or pine wash `#EBF3F1` for checked items.

### 6. Timeline Slots & Auto-Switching Controls
- Vertical or horizontal procedural lines: 2px solid `#E2E5E8` with active portions in `#0F4C47`.
- State nodes: 8px solid nodes with a 2px `#FFFFFF` gap and `#E2E5E8` inactive ring. Active timeline slots pulse a 2px `#EBF3F1` outer halo during processing.