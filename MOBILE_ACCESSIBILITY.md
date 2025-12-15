# Mobile Accessibility Guide

## Touch Target Standards

All interactive elements now meet **WCAG 2.1 Level AA** requirements:
- **Minimum touch target**: 44×44 CSS pixels on mobile
- **Desktop optimization**: Can be smaller (32-40px) for better density
- **iOS text inputs**: 16px font size prevents auto-zoom

---

## Updated Components

### 1. Button Component

**Standard Buttons** - Now have responsive padding:
```tsx
import Button from '@/components/ui/Button';

// Mobile: py-3 (48px height), Desktop: py-2.5 (42px height)
<Button variant="primary" size="md">
  Save Changes
</Button>

// Icon + Text Button
<Button variant="secondary" size="sm">
  <Plus className="w-4 h-4" />
  Add Item
</Button>
```

**Icon-Only Buttons** - Use the `iconOnly` prop:
```tsx
// Automatically gets 44x44px minimum on mobile
<Button variant="ghost" size="md" iconOnly aria-label="Close">
  <X className="w-5 h-5" />
</Button>
```

---

### 2. IconButton Component (NEW)

Dedicated component for icon-only buttons with proper touch targets:

```tsx
import IconButton from '@/components/ui/IconButton';

// Default variant (light background)
<IconButton
  variant="default"
  size="md"
  aria-label="Edit item"
  onClick={handleEdit}
>
  <Edit2 className="w-5 h-5" />
</IconButton>

// Ghost variant (transparent, hover reveals)
<IconButton
  variant="ghost"
  aria-label="Delete"
  onClick={handleDelete}
>
  <Trash2 className="w-5 h-5" />
</IconButton>

// Danger variant (red text)
<IconButton
  variant="danger"
  aria-label="Remove"
  onClick={handleRemove}
>
  <X className="w-5 h-5" />
</IconButton>
```

**Variants:**
- `default` - Light background, suitable for cards
- `ghost` - Transparent, hover reveals background
- `outline` - Border only
- `danger` - Red text for destructive actions

**Sizes:**
- `sm` - 44px mobile / 32px desktop
- `md` - 44px mobile / 36px desktop (default)
- `lg` - 48px mobile / 40px desktop

---

### 3. ActionMenu Component (NEW)

Mobile-friendly action menu with responsive behavior:

```tsx
import ActionMenu from '@/components/ui/ActionMenu';
import { Edit2, Trash2, Download, Share } from 'lucide-react';

const menuItems = [
  {
    label: 'Edit',
    icon: <Edit2 className="w-5 h-5" />,
    onClick: () => handleEdit(),
  },
  {
    label: 'Download',
    icon: <Download className="w-5 h-5" />,
    onClick: () => handleDownload(),
  },
  {
    label: 'Share',
    icon: <Share className="w-5 h-5" />,
    onClick: () => handleShare(),
  },
  {
    label: 'Delete',
    icon: <Trash2 className="w-5 h-5" />,
    onClick: () => handleDelete(),
    variant: 'danger', // Red styling
  },
];

// Default trigger (three dots icon)
<ActionMenu items={menuItems} aria-label="File actions" />

// Custom trigger
<ActionMenu
  items={menuItems}
  trigger={
    <button className="p-2">
      <MoreVertical className="w-5 h-5" />
    </button>
  }
  align="right"
/>
```

**Behavior:**
- **Mobile (<768px)**: Opens as bottom drawer with 56px touch targets
- **Desktop (≥768px)**: Opens as dropdown with 40px items
- Automatically closes on outside click or Escape key
- iOS safe-area support

---

### 4. Input Component

Now uses 16px font size to prevent iOS auto-zoom:

```tsx
import Input from '@/components/ui/Input';

<Input
  label="Email Address"
  type="email"
  placeholder="you@example.com"
  required
  error={errors.email}
/>
```

**Key Changes:**
- `text-base` (16px) on all screens prevents iOS zoom
- Maintains `py-3` padding for easy touch interaction
- Focus ring meets WCAG color contrast requirements

---

## Migration Guide

### Replace Small Icon Buttons

**Before:**
```tsx
<button
  onClick={handleDelete}
  className="p-1 hover:bg-red-50 rounded"
>
  <Trash2 className="w-4 h-4" /> {/* Too small! */}
</button>
```

**After:**
```tsx
<IconButton
  variant="danger"
  aria-label="Delete item"
  onClick={handleDelete}
>
  <Trash2 className="w-5 h-5" />
</IconButton>
```

---

### Replace Dropdown Menus

**Before:**
```tsx
const [showMenu, setShowMenu] = useState(false);

{showMenu && (
  <div className="absolute right-0 mt-2 bg-white rounded shadow">
    <button onClick={handleEdit}>Edit</button>
    <button onClick={handleDelete}>Delete</button>
  </div>
)}
```

**After:**
```tsx
<ActionMenu
  items={[
    {
      label: 'Edit',
      icon: <Edit2 className="w-5 h-5" />,
      onClick: handleEdit,
    },
    {
      label: 'Delete',
      icon: <Trash2 className="w-5 h-5" />,
      onClick: handleDelete,
      variant: 'danger',
    },
  ]}
/>
```

---

## Accessibility Checklist

When creating interactive elements:

- ✅ **Touch targets**: Minimum 44×44px on mobile
- ✅ **Labels**: Always provide `aria-label` for icon-only buttons
- ✅ **Focus states**: Visible ring on keyboard focus
- ✅ **Contrast**: Meet WCAG AA standards (4.5:1 for text)
- ✅ **Disabled states**: Clear visual indication
- ✅ **Keyboard nav**: Support Enter/Space/Escape keys
- ✅ **Screen readers**: Proper ARIA roles and states

---

## Testing

### Mobile Touch Targets
1. Open Chrome DevTools
2. Toggle device toolbar (Cmd/Ctrl + Shift + M)
3. Select iPhone/Android device
4. Verify all buttons are easy to tap with thumb

### Keyboard Navigation
1. Tab through interactive elements
2. Verify focus rings are visible
3. Test Enter/Space to activate
4. Test Escape to close modals/menus

### Screen Reader
1. Use VoiceOver (Mac) or NVDA (Windows)
2. Verify all buttons have descriptive labels
3. Check that menu states are announced
4. Confirm disabled states are read correctly

---

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Target Size (Level AAA)](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/inputs)
