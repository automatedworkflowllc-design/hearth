# Community Resource Hub: UI Architecture, Styling & Accessibility Technical Report (Milestone 1)

**Author:** Explorer 2 (`explorer_m1_2`)  
**Date:** 2026-07-22  
**Target Milestone:** Milestone 1 — Foundation & Project Setup  
**Target Audience:** Orchestrator, Milestone 1 Implementers, Project Lead  

---

## 1. Executive Summary

This report delivers architectural specifications and technical recommendations for the **Community Resource Hub** UI components, styling system, accessibility infrastructure, and category icon mapping.

Key recommendations:
1. **Hybrid Styling Architecture**: Utilize CSS Custom Properties (Variables) for core theme tokens (`--bg-primary`, `--text-primary`, `--border-contrast`, etc.) bridged with **Tailwind CSS** utility classes for layout, flexbox, grid, and spacing.
2. **Global Root-Based Dynamic Text Resizing**: Implement font scaling via root HTML `font-size` modifiers (`100%` normal, `125%` large, `150%` extra-large) driven by `data-text-size` attributes. All typography and layout spacing must use relative `rem` units to ensure proportional WCAG 2.1 SC 1.4.4 / SC 1.4.10 reflow scaling without horizontal scrolling.
3. **High-Contrast Theme System**: Enforce a high-contrast mode compliant with WCAG AAA 7:1 contrast ratio (`#000000` background, `#FFFF00` highlight/accents, `#FFFFFF` text/borders, `#00FFFF` focus outlines) triggered via `data-contrast="high-contrast"`.
4. **Accessible Component Architecture**: Enforce strict ARIA landmark roles (`banner`, `main`, `search`, `dialog`), `aria-live="polite"` search result announcements, skip navigation links, and a robust focus trap & restoration pattern for modal dialogs.
5. **Icon Strategy**: Standardize on **Lucide-react** (`Utensils`, `Home`, `HeartPulse`, `Scale`, `HandHeart`) with an inline SVG fallback pattern, ensuring all decorative icons carry `aria-hidden="true"`.

---

## 2. Styling Choices & Theme Management Comparison

### 2.1 CSS Variables vs. Tailwind CSS Comparison Matrix

| Criteria | Pure CSS Variables / CSS Modules | Tailwind CSS (Default Config) | **Recommended Hybrid Strategy** (Tailwind + CSS Custom Properties) |
|---|---|---|---|
| **High-Contrast Mode Support** | **Excellent**: Global variable overrides on root (`:root[data-contrast="high-contrast"]`). | **Moderate**: Requires custom variants (`dark:` overloading or custom plugin). | **Excellent**: CSS variables define color tokens; Tailwind classes consume `bg-surface`, `text-main`, `border-contrast`. |
| **Dynamic Text Resizing** | **Excellent**: Modifying root `font-size` automatically scales `rem` values across all modules. | **Good**: Standard `rem` utility classes scale automatically with root font size. | **Excellent**: Standard Tailwind `text-*` and `p-*` utilities scale seamlessly with root `rem` adjustments. |
| **Developer Ergonomics & Speed** | **Moderate**: Requires separate `.module.css` files per component. | **High**: Fast utility-first inline class composition. | **High**: Utility classes for structure + semantic design tokens for colors. |
| **Bundle & Build Setup** | **Zero/Native**: Supported in browser natively. | **Lightweight**: PostCSS / `@tailwindcss/vite` purges unused classes. | **Lightweight**: Standard Vite + Tailwind setup. |

### 2.2 Recommended Theme Architecture: Semantic CSS Variables + Tailwind

#### Core CSS Variable Schema (`index.css`)
```css
/* Standard Theme Tokens */
:root,
html[data-contrast="standard"] {
  --bg-app: #f8fafc;
  --bg-surface: #ffffff;
  --bg-card: #ffffff;
  --bg-card-hover: #f1f5f9;
  --text-main: #0f172a;
  --text-muted: #475569;
  --text-inverse: #ffffff;
  --border-main: #e2e8f0;
  --border-focus: #2563eb;
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-accent: #0d9488;
  --focus-ring-color: #2563eb;
  --focus-ring-width: 3px;
  --shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
}

/* High-Contrast Theme Tokens (WCAG AAA 7:1 compliant) */
html[data-contrast="high-contrast"] {
  --bg-app: #000000;
  --bg-surface: #000000;
  --bg-card: #000000;
  --bg-card-hover: #121212;
  --text-main: #ffffff;
  --text-muted: #ffffff;
  --text-inverse: #000000;
  --border-main: #ffffff;
  --border-focus: #ffff00;
  --color-primary: #ffff00;
  --color-primary-hover: #e6e600;
  --color-accent: #00ffff;
  --focus-ring-color: #00ffff;
  --focus-ring-width: 4px;
  --shadow-card: none;
}
```

#### Tailwind Configuration Mapping (`tailwind.config.js` or CSS plugin)
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        app: 'var(--bg-app)',
        surface: 'var(--bg-surface)',
        card: 'var(--bg-card)',
        'card-hover': 'var(--bg-card-hover)',
        main: 'var(--text-main)',
        muted: 'var(--text-muted)',
        primary: 'var(--color-primary)',
        accent: 'var(--color-accent)',
        border: 'var(--border-main)',
      },
    },
  },
};
```

---

## 3. Dynamic Text Resizing Architecture

`PROJECT.md` specifies the state interface:
```typescript
textSize: 'normal' | 'large' | 'extra-large'
```

### 3.1 Scaling Factor Implementation
Dynamic font scaling is controlled by altering the root document font size.

```css
/* Base root text scale */
html[data-text-size="normal"] {
  font-size: 100%; /* 16px default */
}

html[data-text-size="large"] {
  font-size: 125%; /* 20px base */
}

html[data-text-size="extra-large"] {
  font-size: 150%; /* 24px base */
}
```

### 3.2 Integration with `useAccessibility` Hook
The `useAccessibility` hook applies `data-text-size` and `data-contrast` directly to `document.documentElement`:

```typescript
// Example integration pattern inside useAccessibility hook
useEffect(() => {
  const root = document.documentElement;
  root.setAttribute('data-contrast', contrastMode);
  root.setAttribute('data-text-size', textSize);
}, [contrastMode, textSize]);
```

### 3.3 Layout & Text Overflow Guidelines
- **Use `rem` exclusively**: Font sizes, padding, margins, line-heights, and grid gap properties MUST use `rem` or Tailwind spacing utilities (`p-4`, `text-lg`, `gap-6`). Avoid fixed `px` heights on containers with text content.
- **Flex Wrap and Min-Height**: Cards and headers must use `flex-wrap: wrap` and `min-height` rather than fixed height `h-16` to prevent visual clipping when font size is set to `extra-large` (150%).

---

## 4. UI Component Architecture & Responsive Grid Strategy

### 4.1 Component Hierarchy & Responsibilities

```
App
├── Navbar (Header landmark, brand logo, navigation links)
├── AccessibilityToolbar (Fixed/Sticky bar: High-contrast toggle & text size selector)
├── Header (Banner title & search overview)
├── Main Content Container (<main id="main-content">)
│   ├── FilterBar (Search input, Category filters, Tags, Sort-by selector)
│   ├── Live Region Results Header (aria-live="polite" results count)
│   └── Resource Content Grid / Split View
│       ├── ResourceList (Grid container displaying ResourceCards)
│       │   └── ResourceCard (Article card with summary & details trigger)
│       └── ResourceMap (Interactive SVG / Canvas map pins with accessible list fallback)
└── ResourceDetailModal (Accessible dialog overlay with focus trap)
```

### 4.2 Responsive Layout Grid Strategy

#### Breakpoint Definition
- **Mobile (`< 640px`)**: Single column stacked layout.
  - Resource cards: 1 column (`grid-cols-1`).
  - Map View: Toggleable tab (Switch between List View / Map View).
- **Tablet (`640px - 1024px`)**: 2-column card grid.
  - Resource cards: 2 columns (`grid-cols-1 md:grid-cols-2`).
- **Desktop (`> 1024px`)**: Split View or 3-column grid.
  - Left panel / Top: FilterBar & ResourceList (`lg:grid-cols-3` or 65% width).
  - Right panel: Sticky ResourceMap (35% width sticky column).

#### CSS Grid Specification
```css
.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(17.5rem, 1fr)); /* min 280px */
  gap: 1.5rem;
}
```

---

## 5. ARIA Attribute Patterns & Focus Management

### 5.1 Landmark Structure & Skip Navigation

```html
<!-- Skip to content link (first focusable element in DOM) -->
<a 
  href="#main-content" 
  class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-inverse focus:rounded-md focus:shadow-lg"
>
  Skip to main content
</a>

<header role="banner" class="bg-surface border-b border-main">
  <!-- Navbar & AccessibilityToolbar -->
</header>

<main id="main-content" role="main" tabIndex="-1">
  <!-- Search, Filters, Map, and Resource List -->
</main>
```

### 5.2 ARIA Patterns for Key Components

#### 1. FilterBar & Search Controls
```html
<section aria-label="Search and Filter Options">
  <form role="search" onSubmit={(e) => e.preventDefault()}>
    <label for="resource-search" class="sr-only">Search resources by keyword or name</label>
    <input 
      id="resource-search"
      type="search"
      role="searchbox"
      aria-label="Search resources"
      placeholder="Search food, shelter, healthcare..."
    />
  </form>

  <!-- Live Region for search results feedback -->
  <div aria-live="polite" aria-atomic="true" class="sr-only">
    Showing 8 resources for "food" in Shelter category.
  </div>
</section>
```

#### 2. ResourceCard
```html
<article 
  class="bg-card border border-main rounded-lg p-6 shadow-card"
  aria-labelledby="resource-title-101"
>
  <div class="flex items-center gap-2">
    <span class="inline-flex items-center" aria-hidden="true">
      <!-- Category Icon -->
    </span>
    <span class="sr-only">Category: Food</span>
    <span class="text-xs font-semibold px-2 py-1 rounded bg-surface text-main border border-main">
      Food
    </span>
  </div>
  <h3 id="resource-title-101" class="text-xl font-bold text-main mt-2">
    Central Food Bank
  </h3>
  <p class="text-muted text-sm mt-1">0.4 miles away • 123 Main St</p>
  <button 
    type="button"
    aria-label="View details for Central Food Bank"
    class="mt-4 px-4 py-2 bg-primary text-inverse font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2"
  >
    View Details
  </button>
</article>
```

#### 3. ResourceDetailModal (Accessible Dialog)
```html
<!-- Modal Backdrop -->
<div 
  class="fixed inset-0 bg-black/50 z-40" 
  aria-hidden="true" 
  onClick={closeModal} 
/>

<!-- Dialog Container -->
<div 
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
  class="fixed inset-auto z-50 bg-card border-2 border-main rounded-xl p-6 shadow-2xl max-w-2xl w-full"
>
  <div class="flex justify-between items-center pb-4 border-b border-main">
    <h2 id="modal-title" class="text-2xl font-bold text-main">
      Central Food Bank
    </h2>
    <button 
      type="button"
      aria-label="Close details modal"
      onClick={closeModal}
      class="p-2 text-main rounded-md hover:bg-card-hover focus:ring-2"
    >
      ✕
    </button>
  </div>
  <div id="modal-description" class="py-4 text-main">
    <!-- Detailed resource info: phone, website, hours, directions -->
  </div>
</div>
```

### 5.3 Focus Management Protocol

1. **Focus Trap Pattern (Modal Dialogs)**:
   - When the modal opens:
     1. Store the active element: `const previousFocus = document.activeElement as HTMLElement`.
     2. Move focus into the modal: `closeButtonRef.current?.focus()`.
     3. Trap `Tab` navigation: Catch `keydown` event. If `key === 'Tab'`, cycle between modal's first and last focusable elements.
   - When the modal closes:
     1. Restore focus: `previousFocus?.focus()`.
2. **Visible Focus Styles**:
   - Standard Mode: `outline: 3px solid #2563eb; outline-offset: 2px;`
   - High Contrast Mode: `outline: 4px solid #00ffff; outline-offset: 2px;`

---

## 6. Icon Set Selection & Resource Category Mapping

### 6.1 Recommended Icon Library: `lucide-react`

**Lucide-react** is recommended as the primary icon set. It provides accessible, customizable SVG icons designed for modern React applications.

### 6.2 Resource Category Mapping Table

| Resource Category | Recommended Lucide Icon Component | Visual Metaphor | ARIA Specification |
|---|---|---|---|
| **Food** | `<Utensils />` (or `<Apple />`) | Cutlery / Food Pantry | `aria-hidden="true"` (text label provides context) |
| **Shelter** | `<Home />` (or `<Building />`) | House / Housing | `aria-hidden="true"` |
| **Health** | `<HeartPulse />` (or `<Stethoscope />`) | Healthcare / Clinic | `aria-hidden="true"` |
| **Legal** | `<Scale />` (or `<FileText />`) | Scales of Justice / Legal Aid | `aria-hidden="true"` |
| **Support** | `<HandHeart />` (or `<HelpingHand />`) | Community Care / Support Services | `aria-hidden="true"` |

### 6.3 Accessibility Controls Toolbar Icons

| Control Button | Lucide Icon Component | Visual Indicator |
|---|---|---|
| Contrast Mode Toggle | `<Sun />` / `<Moon />` / `<Eye />` | Standard vs High Contrast indicator |
| Text Size Control | `<Type />` / `<ZoomIn />` | Text size options (Normal, Large, Extra Large) |
| Navigation / Search | `<Search />`, `<MapPin />`, `<Filter />` | Core UI interaction hints |

### 6.4 Inline SVG Fallback Component Pattern (`CategoryIcon.tsx`)
If zero third-party icon dependencies are preferred, use an inline accessible SVG mapper:

```tsx
import React from 'react';

export type CategoryType = 'Food' | 'Shelter' | 'Health' | 'Legal' | 'Support';

interface CategoryIconProps {
  category: CategoryType;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ category, className = "w-5 h-5" }) => {
  switch (category) {
    case 'Food':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false">
          <path d="M18 2v6a3 3 0 0 1-3 3 3 3 0 0 1-3-3V2" />
          <path d="M15 2v16" />
          <path d="M6 2v20" />
        </svg>
      );
    case 'Shelter':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    case 'Health':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      );
    case 'Legal':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false">
          <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
          <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
          <path d="M7 21h10" />
          <path d="M12 3v18" />
          <path d="M3 7h18" />
        </svg>
      );
    case 'Support':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false">
          <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" />
          <path d="m7 21 1.6-1.4c.5-.4 1.2-.6 1.9-.6h4c2 0 3.8-1.1 4.7-2.8L21 13" />
        </svg>
      );
    default:
      return null;
  }
};
```

---

## 7. Implementation Recommendations for Milestone 1

1. **Setup Core CSS Variables**: Add the `:root` and `html[data-contrast="high-contrast"]` CSS variable blocks to `src/index.css`.
2. **Setup `useAccessibility` Hook**: Implement full toggle logic for `contrastMode` and `textSize`, modifying `document.documentElement` attributes.
3. **Build `AccessibilityToolbar`**: Place high-contrast toggle and font size controls prominently in the header area.
4. **Scaffold Component Hierarchy**: Implement placeholder JSX shells with appropriate ARIA roles (`main`, `banner`, `search`, `dialog`) ready for data integration in Milestone 2 & 3.
5. **Install / Configure Icons**: Install `lucide-react` or add `CategoryIcon.tsx` helper component.
