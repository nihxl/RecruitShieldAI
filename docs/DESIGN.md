---
name: RecruitShield AI
colors:
  surface: '#0f1415'
  surface-dim: '#0f1415'
  surface-bright: '#353a3b'
  surface-container-lowest: '#0a0f10'
  surface-container-low: '#171c1d'
  surface-container: '#1b2021'
  surface-container-high: '#262b2c'
  surface-container-highest: '#313637'
  on-surface: '#dfe3e4'
  on-surface-variant: '#c0c8ca'
  inverse-surface: '#dfe3e4'
  inverse-on-surface: '#2c3132'
  outline: '#8a9294'
  outline-variant: '#40484a'
  surface-tint: '#9ecfda'
  primary: '#9ecfda'
  on-primary: '#00363e'
  primary-container: '#4e7e88'
  on-primary-container: '#ffffff'
  inverse-primary: '#35656f'
  secondary: '#b2cbd0'
  on-secondary: '#1c3438'
  secondary-container: '#354d51'
  on-secondary-container: '#a4bdc2'
  tertiary: '#abc9ee'
  on-tertiary: '#103250'
  tertiary-container: '#5b799a'
  on-tertiary-container: '#ffffff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#b9ebf6'
  primary-fixed-dim: '#9ecfda'
  on-primary-fixed: '#001f25'
  on-primary-fixed-variant: '#194d57'
  secondary-fixed: '#cde7ed'
  secondary-fixed-dim: '#b2cbd0'
  on-secondary-fixed: '#061f23'
  on-secondary-fixed-variant: '#334a4f'
  tertiary-fixed: '#d0e4ff'
  tertiary-fixed-dim: '#abc9ee'
  on-tertiary-fixed: '#001d34'
  on-tertiary-fixed-variant: '#2a4967'
  background: '#0f1415'
  on-background: '#dfe3e4'
  surface-variant: '#313637'
typography:
  h1-desktop:
    fontFamily: Public Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h1-mobile:
    fontFamily: Public Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  h2-desktop:
    fontFamily: Public Sans
    fontSize: 36px
    fontWeight: '600'
    lineHeight: '1.3'
  h3-desktop:
    fontFamily: Public Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Public Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Public Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Public Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.05em
  button:
    fontFamily: Public Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: '1.0'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style
The design system for this platform is built on the pillars of **Security, Transparency, and Reassurance**. Given the sensitive nature of recruitment fraud, the UI adopts a **Corporate / Modern** aesthetic with a lean toward "Safety-First" design. It utilizes a refined systematic approach that prioritizes clarity over decorative flair, ensuring job seekers feel protected and informed.

The visual language is characterized by:
- **Cleanliness:** Optimized layout to reduce cognitive load during potentially stressful fraud-check scenarios.
- **Modernity:** Subtle use of depth and tonal layering to guide user focus in a dark-mode environment.
- **Professionalism:** High-quality typography and a restricted color palette that signals enterprise-grade reliability.
- **Trust:** Softened corners and gentle shadows that move away from cold, industrial tech styles toward a more human-centric, protective experience.

## Colors
The palette is rooted in a "Safe-Tech" spectrum, transitioning to a sophisticated **Dark Mode** foundation that reduces eye strain and emphasizes technical authority.

- **Primary (Muted Slate Blue):** Used for core branding, primary actions, and key navigation elements. It establishes the "Shield" foundation with a calmer, more integrated feel.
- **Secondary (Steel Gray):** Used for supporting UI elements, such as active states or secondary navigational hints.
- **Tertiary (Dusk Blue):** Reserved for specialized highlights, data visualization, and tertiary accents that require distinction without high-contrast vibrance.
- **Backgrounds:** The interface utilizes a series of deep tonal surfaces (Surface, Surface-Container) to create hierarchy, replacing pure whites with dark, neutral-tinted greys to maximize comfort in low-light environments.

## Typography
This design system utilizes **Public Sans** for its institutional reliability and exceptional legibility. As a typeface designed for government and public-facing platforms, it carries an inherent sense of authority and accessibility.

- **Headlines:** Use a bold weight with slightly tight letter-spacing to create a strong, confident visual anchor.
- **Body:** Standardized at 16px for optimal reading on SaaS dashboards. Use a 1.6 line-height to ensure text-heavy fraud reports are easy to parse in dark mode.
- **Labels:** Use the uppercase label style for small metadata (e.g., timestamps on fraud alerts) to distinguish them from actionable body text.

## Layout & Spacing
The design system employs a **12-column fluid grid** for desktop and a **4-column grid** for mobile. 

- **The 8px Rhythm:** All spacing (padding, margins, gutters) must be increments of 8px to maintain a strict mathematical harmony.
- **Dashboard Layout:** Utilizes a fixed left-hand navigation sidebar (240px) with a fluid content area.
- **Vertical Spacing:** Generous padding (lg and xl) is used between major sections to prevent the UI from feeling cluttered, which helps lower user anxiety.
- **Mobile Reflow:** On mobile, cards stack vertically and side margins shrink to 16px to maximize the available screen real estate for fraud detection results.

## Elevation & Depth
Hierarchy is established through **Tonal Layers** and **Ambient Shadows**, specifically tuned for a dark environment. This design system avoids harsh borders in favor of soft-depth cues that suggest "lifted" interactive surfaces against the dark background.

- **Level 0 (Surface):** The main background color, representing the deepest layer of the application.
- **Level 1 (Cards):** Slightly lighter surface-container colors with a very soft, diffused shadow to differentiate content blocks from the main background.
- **Level 2 (Active/Hover):** Enhanced tonal brightness or slightly deeper shadows to indicate interactivity or high-priority modals.
- **Glassmorphism (Subtle):** Used for fixed top navigation bars to maintain context of the content scrolling beneath it, using a 12px backdrop blur and a semi-transparent primary-container tint.

## Shapes
The shape language is consistently **Rounded**, avoiding sharp, aggressive corners to foster an environment of reassurance.

- **Standard Elements:** Buttons, input fields, and small tags use a 0.5rem (8px) radius.
- **Containers:** Large content cards and modals use the `rounded-xl` (1.5rem / 24px) radius to create a soft, friendly "container" for sensitive information.
- **Interactive Icons:** Simple line-style icons should be encased in a circular (pill-shaped) background when used as status indicators (e.g., a green checkmark in a soft-mint circle).

## Components
Consistent component behavior is vital for maintaining the "Trust" brand pillar.

- **Buttons:** 
  - *Primary:* Muted Slate Blue background with high-contrast text. Solid and authoritative.
  - *Secondary:* Ghost style with a Steel Gray border and text.
- **Cards:** Surface-container backgrounds with 24px padding and `rounded-xl` corners. In "Alert" states, cards may feature a 4px left-border accent in Danger or Warning colors.
- **Inputs:** Clean fields with a subtle 1px border. On focus, the border transitions to the Primary color with a soft 4px outer glow in the same color at 15% opacity.
- **Chips/Badges:** Small, pill-shaped indicators using Tonal Spot variants for subtle categorization without overwhelming the dark interface.
- **Status Shields:** A custom component representing the AI analysis. A large central shield icon that changes color based on the threat level, using glow effects instead of heavy shadows to stand out against the dark theme.
- **Progress Indicators:** Linear, thin bars using the Primary color to show analysis completion.