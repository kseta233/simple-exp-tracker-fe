# Design System Specification: High-End Financial Editorial

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Precision Curator."** 

In an expense tracking context, "modern and professional" usually defaults to a sterile, spreadsheet-like interface. This system rejects that. Instead, we treat financial data with the reverence of a premium editorial magazine. By leveraging **intentional asymmetry**, **glassmorphism**, and **tonal layering**, we move away from "app-as-a-tool" toward "app-as-a-concierge." 

The goal is to provide a sense of absolute financial control through breathing room (white space) and sophisticated depth, ensuring the user's data remains the hero of the experience.

---

## 2. Colors & Surface Architecture
The palette is built on deep, authoritative indigos and emeralds, balanced by a sophisticated grayscale that favors warmth over sterile blue-grays.

### The "No-Line" Rule
To achieve a premium feel, **1px solid borders are strictly prohibited** for sectioning. Boundaries must be defined solely through background color shifts or subtle tonal transitions. For example, a `surface_container_low` section sitting on a `surface` background provides enough contrast to indicate a new functional area without the visual "noise" of a line.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, physical layers. 
- **Base:** `surface` (#f7f9fb)
- **Content Blocks:** `surface_container_low` (#f2f4f6)
- **Interactive Cards:** `surface_container_lowest` (#ffffff)
- **Elevated Modals:** `surface_bright` (#f7f9fb) with backdrop-blur.

### The "Glass & Gradient" Rule
Floating elements (like a Bottom Navigation Bar or a persistent "Add Expense" button) should use **Glassmorphism**. Apply a semi-transparent `surface_container_lowest` with a `backdrop-blur` of 16px–24px. 

For Primary CTAs, use a **Signature Texture**: a subtle linear gradient from `primary` (#000b60) to `primary_container` (#142283) at a 135-degree angle. This adds "soul" and depth that a flat hex code cannot replicate.

---

## 3. Typography
We utilize a dual-font strategy to balance character with utility.

| Category | Font Family | Token | Size | Role |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | Manrope | `display-lg` | 3.5rem | Large Hero Balances |
| **Headline** | Manrope | `headline-md` | 1.75rem | Section Titles (e.g., Monthly Recap) |
| **Title** | Inter | `title-lg` | 1.375rem | Transaction Names / Category Headers |
| **Body** | Inter | `body-md` | 0.875rem | Primary Metadata / Descriptions |
| **Label** | Inter | `label-sm` | 0.6875rem | Micro-data / Overline timestamps |

**Editorial Contrast:** Use `display-lg` in a Semi-Bold weight for amounts, contrasted immediately by `label-sm` in `on_surface_variant` (#454652) for the currency or date. This creates an authoritative hierarchy where the most important "data-first" information is undeniable.

---

## 4. Elevation & Depth
Traditional drop shadows create "muddy" interfaces. We use **Tonal Layering** and **Ambient Shadows**.

*   **The Layering Principle:** Depth is achieved by "stacking." A `surface_container_lowest` card placed on a `surface_container_low` background creates a natural lift.
*   **Ambient Shadows:** For floating elements, use a `24px` blur with 4% opacity. The shadow color must be a tint of `primary` (#000b60) rather than pure black, ensuring the shadow feels like a natural extension of the brand's lighting.
*   **The Ghost Border:** If a boundary is strictly required for accessibility, use `outline_variant` (#c6c5d4) at **15% opacity**. Never use a 100% opaque border.

---

## 5. Components

### Buttons
*   **Primary:** Gradient (`primary` to `primary_container`), `DEFAULT` (0.5rem) roundedness. No border. White text (`on_primary`).
*   **Secondary:** `surface_container_high` background. No border. `primary` text.
*   **Tertiary:** Transparent background, `primary` text, Semi-bold.

### Cards & Lists (The Divider-less Layout)
*   **Cards:** Use `surface_container_lowest` with `md` (0.75rem) roundedness.
*   **Lists:** Forbid divider lines. Use `spacing-4` (0.9rem) or `spacing-5` (1.1rem) to separate transaction items. Distinguish groups (e.g., "Yesterday" vs "Today") using a `surface_container_low` background header.

### Input Fields
*   **Default State:** `surface_container_highest` background, no border.
*   **Active State:** Soft "Ghost Border" of `primary` at 20% opacity.
*   **Success/Error:** Use `secondary` (#006c4a) for "Savings achieved" and `error` (#ba1a1a) for "Over budget."

### Contextual Components for Expense Tracking
*   **Progressive Donut Charts:** Use `secondary` (Emerald) for the "Safe" zone and `tertiary_container` (#670019) for the "Warning" zone to create a sophisticated, non-vibrant alert system.
*   **Micro-Chips:** Use `xl` (1.5rem) roundedness for category tags (e.g., "Food," "Rent") using `surface_container_high` with `on_surface_variant` text.

---

## 6. Do’s and Don’ts

### Do
*   **DO** use whitespace as a functional tool. If a screen feels cluttered, increase the spacing scale instead of adding a line.
*   **DO** use `secondary` (Emerald) for all positive financial growth. It should feel like a "reward" color.
*   **DO** ensure the most important number on any screen uses the `display` or `headline` scale.

### Don't
*   **DON'T** use 1px solid black or gray dividers. It breaks the editorial flow and makes the app look like a legacy banking tool.
*   **DON'T** use "Pure Black" (#000000). Always use `on_background` (#191c1e) for text to maintain a soft, premium readability.
*   **DON'T** over-apply shadows. If everything floats, nothing is important. Reserve shadows for the most critical actions (e.g., the "Add" button).

---

## 7. Spacing Scale (Key Tokens)
*   **Inner Card Padding:** `4` (0.9rem)
*   **Section Gaps:** `8` (1.75rem)
*   **Global Margins:** `5` (1.1rem)
*   **Micro-spacing (Labels):** `1.5` (0.3rem)

*This system is designed to evolve. When in doubt, prioritize the "The Precision Curator" ethos: less is more, but what remains must be perfect.*