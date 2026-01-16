# Soft-Square/Semi-Rounded Design System Overhaul

## Summary

The Thynkr UI has been overhauled with a "Soft-Square/Semi-Rounded" design aesthetic featuring:

1. **Border Radius**: Replaced sharp edges and fully rounded pills with consistent `rounded-lg`, `rounded-xl`, and `rounded-2xl` styles
2. **Contrast**: Deep Zinc-950 (#09090b) background in dark mode with high-clarity Slate-800/White-10 borders
3. **Buttons**: Redesigned with slightly rectangular `rounded-lg` edges and vibrant high-contrast gradients (blue to violet)
4. **Cards/Sidebars**: Enhanced glassmorphism with `backdrop-blur-md` and refined 1px borders

---

## Core Design Tokens

### Border Radius Scale
- **Small elements** (badges, small buttons): `rounded-lg` (8px)
- **Medium elements** (cards, inputs): `rounded-xl` (12px)
- **Large containers** (modals, sections): `rounded-2xl` (16px)
- **Avatars/icons**: `rounded-lg` for soft-square aesthetic (replacing `rounded-full`)

### Background Colors (Dark Mode)
- **Primary surface**: `bg-zinc-950/90` (#09090b with 90% opacity)
- **Secondary surface**: `bg-zinc-950/95` (#09090b with 95% opacity)
- **Slate accents**: `bg-slate-800`, `bg-slate-900`

### Glassmorphism
- **Blur intensity**: `backdrop-blur-md` (consistent subtle blur)
- **Background opacity**: 90-95% for main containers
- **Border treatment**: `border border-slate-200 dark:border-slate-800/50`

### High-Contrast Colors
- **Primary gradient**: `from-blue-600 to-violet-600` (vibrant blue to purple)
- **Hover state**: `from-blue-700 to-violet-700` (darker on hover)
- **Shadow**: `shadow-lg shadow-blue-500/30` (pronounced glow effect)

---

## Component Updates

### 1. Button Component
**File**: `frontend/src/components/ui/Button.tsx`

**Changes**:
- Border radius: `rounded-xl` → `rounded-lg`
- Primary variant: Vibrant blue-to-violet gradient
- Font weight: `font-medium` → `font-semibold`
- Improved shadow: `shadow-lg shadow-blue-500/30`

**Example**:
```tsx
// Before
className="rounded-xl bg-gradient-aurora"

// After  
className="rounded-lg bg-gradient-to-r from-blue-600 to-violet-600"
```

### 2. GlassCard Component
**File**: `frontend/src/components/ui/GlassCard.tsx`

**Changes**:
- Border radius: `rounded-2xl` → `rounded-xl`
- Background: `bg-slate-900/50` → `bg-zinc-950/90`
- Blur: `backdrop-blur-sm` → `backdrop-blur-md`
- Border: `border-white/10` → `border-slate-800/50`

### 3. Modal Component
**File**: `frontend/src/components/ui/Modal.tsx`

**Changes**:
- Border radius: `rounded-2xl` → `rounded-xl`
- Background: `bg-slate-800` → `bg-zinc-950/95`
- Backdrop blur: Enhanced with `backdrop-blur-md`
- Close button: `rounded-full` → `rounded-lg`

### 4. Sidebar Component
**File**: `frontend/src/components/Sidebar.tsx`

**Changes**:
- Container: `rounded-2xl` → `rounded-xl` with `backdrop-blur-md`
- Background: `dark:bg-[#0F172A]/90` → `dark:bg-zinc-950/90`
- Nav items: `rounded-xl` → `rounded-lg` with enhanced active state
- Avatar: `rounded-xl` → `rounded-lg` with border
- Search input: `rounded-xl` → `rounded-lg`

### 5. Page Components (MyCourseDetail)
**File**: `frontend/src/pages/MyCourseDetail.tsx`

**Changes**:
- All cards: Updated to `rounded-xl` with zinc-950 backgrounds
- Badges: `rounded-full` → `rounded-lg` pills
- Input fields: `rounded-xl` → `rounded-lg` 
- Buttons: Updated to new vibrant gradient style
- Toggle switches: `rounded-full` → `rounded-lg` for track
- Progress bars: `rounded-full` → `rounded-lg`

---

## Global CSS Updates

### File: `frontend/src/index.css`

**Updated Utilities**:
```css
/* Glass Panel - Soft-Square Design */
.glass-panel {
  @apply backdrop-blur-md bg-white/90 dark:bg-zinc-950/90 
         border border-slate-200 dark:border-slate-800/50 
         shadow-lg rounded-xl;
}

/* Card - Soft-Square Aesthetic */
.card {
  @apply bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md 
         border border-slate-200 dark:border-slate-800/50 
         rounded-xl shadow-md;
}
```

**Updated CSS Variables** (Dark Mode):
```css
.dark {
  --color-bg-primary: #09090b;  /* Zinc-950 */
  --color-bg-secondary: #18181b;
  --color-bg-tertiary: #27272a;
  
  --glass-bg: rgba(9, 9, 11, 0.9);
  --glass-border: rgba(226, 232, 240, 0.1);
  
  --color-border: rgba(30, 41, 59, 0.5);
  --color-border-light: rgba(255, 255, 255, 0.1);
}
```

**Body Background**:
```css
body {
  @apply bg-slate-50 dark:bg-zinc-950;  /* Changed from dark:bg-[#0a0e1a] */
}
```

---

## Design Patterns

### Button Patterns
```tsx
// Primary Action (High Contrast)
<button className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-violet-600 
                   text-white rounded-lg hover:from-blue-700 hover:to-violet-700 
                   shadow-lg shadow-blue-500/30 font-semibold">
  Save Changes
</button>

// Secondary Action
<button className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 
                   text-slate-800 dark:text-slate-200 rounded-lg 
                   border border-slate-200 dark:border-slate-700 font-semibold">
  Cancel
</button>

// Ghost/Outline
<button className="px-5 py-2.5 border border-slate-300 dark:border-slate-700 
                   text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 
                   dark:hover:bg-slate-800/50">
  Learn More
</button>
```

### Card Patterns
```tsx
// Standard Card
<div className="bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md 
                border border-slate-200 dark:border-slate-800/50 
                rounded-xl shadow-lg p-6">
  {/* Content */}
</div>

// Interactive Card
<div className="bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md 
                border border-slate-200 dark:border-slate-800/50 
                rounded-xl shadow-lg hover:shadow-xl hover:border-slate-300 
                dark:hover:border-slate-700/60 transition-all p-6 cursor-pointer">
  {/* Content */}
</div>
```

### Input Patterns
```tsx
// Text Input
<input className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 
                  rounded-lg bg-white dark:bg-slate-800 text-slate-900 
                  dark:text-slate-100 focus:ring-2 focus:ring-blue-500 
                  focus:border-transparent transition-all" />

// Select Dropdown
<select className="w-full px-4 py-3 border border-slate-300 dark:border-slate-700 
                   rounded-lg bg-white dark:bg-slate-800 text-slate-900 
                   dark:text-slate-100 cursor-pointer">
  <option>Option 1</option>
</select>
```

### Badge Patterns
```tsx
// Soft-Square Badge (not rounded-full anymore)
<span className="px-3 py-1 text-xs font-semibold rounded-lg 
               bg-blue-100 dark:bg-blue-900/30 text-blue-700 
               dark:text-blue-400 border border-blue-200 dark:border-blue-800">
  Premium
</span>
```

### Avatar Patterns
```tsx
// Soft-Square Avatar (not rounded-full)
<div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 
               flex items-center justify-center text-slate-600 
               dark:text-slate-300 font-semibold border border-slate-300 
               dark:border-slate-700">
  JD
</div>
```

---

## Migration Checklist

When updating other pages/components, apply these changes:

### Border Radius
- [ ] Replace `rounded-full` buttons → `rounded-lg`
- [ ] Replace `rounded-2xl` cards → `rounded-xl`
- [ ] Replace `rounded-3xl` → `rounded-2xl`
- [ ] Keep `rounded-full` only for: loading spinners, dot indicators

### Backgrounds (Dark Mode)
- [ ] Replace `bg-slate-900` → `bg-zinc-950/90`
- [ ] Replace `bg-[#0F172A]` → `bg-zinc-950/90`
- [ ] Add `backdrop-blur-md` to glass containers

### Borders
- [ ] Replace `border-white/10` → `border-slate-800/50`
- [ ] Replace `border-slate-200/50` → `border-slate-200`
- [ ] Add explicit borders to avatars and badges

### Buttons
- [ ] Primary gradients: `from-blue-600 to-violet-600`
- [ ] Replace `rounded-full` → `rounded-lg`
- [ ] Update shadows: `shadow-lg shadow-blue-500/30`
- [ ] Font weight: `font-semibold` for buttons

### Typography
- [ ] Button text: `font-semibold` (was `font-medium`)
- [ ] Badge text: `font-semibold` (was `font-medium`)

---

## Benefits of This Design System

1. **Visual Consistency**: Uniform border radius creates cohesive feel
2. **Modern Aesthetic**: Soft-square design is contemporary and professional
3. **Improved Contrast**: Zinc-950 background with high-clarity borders enhances readability
4. **Glassmorphism**: Refined backdrop-blur creates depth and sophistication
5. **Accessibility**: High-contrast colors improve visibility
6. **Premium Feel**: Vibrant gradients and refined shadows add polish

---

## Browser Compatibility

- ✅ Chrome/Edge (v90+)
- ✅ Firefox (v88+)
- ✅ Safari (v14+)
- ✅ All modern mobile browsers

**Note**: `backdrop-blur-md` has excellent support in all modern browsers. For older browsers, backgrounds will fall back gracefully to solid colors.

---

## Next Steps

To complete the design system overhaul across the entire app:

1. **Search for patterns**: `rounded-full`, `rounded-2xl`, `bg-slate-900` in all `.tsx` files
2. **Apply systematically**: Use the patterns and examples in this document
3. **Test dark mode**: Ensure zinc-950 backgrounds look good with all content
4. **Verify accessibility**: Check contrast ratios meet WCAG standards
5. **Review animations**: Ensure transitions feel smooth with new styles

---

**Created**: January 14, 2026
**Status**: Core components updated, rollout in progress
