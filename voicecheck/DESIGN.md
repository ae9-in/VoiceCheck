---
name: VoiceCheck
colors:
  surface: '#fcf8ff'
  surface-dim: '#dcd8e5'
  surface-bright: '#fcf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f2ff'
  surface-container: '#f0ecf9'
  surface-container-high: '#eae6f4'
  surface-container-highest: '#e4e1ee'
  on-surface: '#1b1b24'
  on-surface-variant: '#464555'
  inverse-surface: '#302f39'
  inverse-on-surface: '#f3effc'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#5a5e69'
  on-secondary: '#ffffff'
  secondary-container: '#dee2ef'
  on-secondary-container: '#60646f'
  tertiary: '#7e3000'
  on-tertiary: '#ffffff'
  tertiary-container: '#a44100'
  on-tertiary-container: '#ffd2be'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#dee2ef'
  secondary-fixed-dim: '#c2c6d3'
  on-secondary-fixed: '#171c25'
  on-secondary-fixed-variant: '#424751'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb695'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7b2f00'
  background: '#fcf8ff'
  on-background: '#1b1b24'
  surface-variant: '#e4e1ee'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  gutter: 20px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

The design system is built for a high-utility Audio Recording Management System, prioritizing clarity, reliability, and precision. The aesthetic is **Corporate / Modern**, emphasizing an "enterprise-grade" feel that reassures users managing sensitive or critical audio data.

The visual narrative focuses on structured efficiency. By utilizing a restrained color palette and a disciplined grid, the system reduces cognitive load during intensive administrative tasks. Design elements feature clean 1px borders and generous whitespace to ensure that complex metadata and waveforms remain legible and actionable. The overall emotional response should be one of professional confidence and technical stability.

## Colors

The color system utilizes a dominant **Indigo** primary to signify intelligence and trust. 

- **Primary & Surface:** Indigo (#4F46E5) is used for primary actions and brand presence. The lighter shade (#EEF2FF) is reserved for subtle backgrounds, hover states, and "active" indicators in navigation.
- **Semantic Feedback:** A comprehensive suite of semantic colors (Success, Danger, Warning, Info, Orange) handles status badges and system alerts. Each uses a high-contrast pairing of a light background tint with a dark text variant to ensure WCAG AA accessibility.
- **Neutrals:** The UI sits on a Gray-50 background to distinguish the canvas from white card elements. Typography follows a strict hierarchy: Gray-900 for headings to ensure maximum impact, and Gray-500/600 for secondary metadata.

## Typography

This design system exclusively uses **Inter**, a typeface designed for highly functional user interfaces. 

The type scale is optimized for readability in data-dense environments. Headings use a bold weight and slight negative letter-spacing to appear more cohesive, while body text maintains a standard 1.5x line-height for optimal scanning of long lists or transcripts. 

Small labels and "Overline" text should utilize the `label-sm` style with increased tracking and uppercase styling to distinguish metadata from interactive content.

## Layout & Spacing

This design system follows a **Fluid Grid** model that prioritizes logical grouping and spatial breathing room.

- **Mobile First:** The layout begins as a single-column stack. The primary navigation is positioned as a fixed bottom bar for thumb-friendly interaction.
- **Desktop:** At the 1280px breakpoint, the layout transitions to a fixed-sidebar model. The sidebar remains sticky to provide constant access to recording categories and filters.
- **Consistency:** All spacing is based on a 4px baseline grid. Padding within cards and containers defaults to `lg` (24px) on desktop and `md` (16px) on mobile to maximize screen real estate.

## Elevation & Depth

The design system utilizes **Low-Contrast Outlines** rather than heavy shadows to establish hierarchy. This creates a flat, professional "sheet" aesthetic suitable for enterprise software.

- **Surface Levels:** The primary background is Gray-50. Content containers (cards, lists) use a white background with a 1px solid border (#E5E7EB).
- **Interactive Depth:** On hover, interactive cards may transition to a subtle "soft" shadow (4px blur, 2% opacity) to provide tactile feedback without breaking the clean aesthetic.
- **Z-Index Strategy:** Modals and dropdowns utilize a higher elevation with a more pronounced, diffused shadow to clear the underlying data interface.

## Shapes

The shape language is balanced and friendly yet structured. 

- **Standard Containers:** Cards, input fields, and modals use a 0.5rem (8px) radius to maintain a modern, approachable look.
- **Interactive Pills:** Active states, buttons, and status badges utilize a full pill-shape (999px radius). This distinct shape differentiates "actions" and "statuses" from "containers."
- **Icons:** Use a consistent 2px stroke weight to match the border-driven aesthetic of the overall system.

## Components

- **Buttons:** Primary buttons are Indigo (#4F46E5) with white text, using a pill-shaped geometry. Secondary buttons use a ghost style (1px border, Indigo text).
- **Status Badges:** Compact pill-shaped labels using the semantic color palette. Text is always bold/medium and uppercase for maximum legibility.
- **Input Fields:** 1px solid Gray-200 borders, 12px vertical padding. Focus states utilize a 2px Indigo ring.
- **Cards:** White background, Gray-200 border, no shadow. Use for individual audio recording entries.
- **Audio Waveform Player:** A custom component featuring a primary Indigo waveform on a Gray-50 background. Controls (Play/Pause) must be pill-shaped.
- **Navigation:**
    - *Desktop Sidebar:* Light background, Gray-900 text, Indigo pill-shaped indicator for the active route.
    - *Mobile Bottom Nav:* Fixed position, icon-centric, with active labels in Indigo.