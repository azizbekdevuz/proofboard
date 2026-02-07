# PHASE 1: Navigation Audit - Route Analysis

## Current Route Structure

### 1. Landing/Auth Page ✅
**Path**: `/`
**File**: `src/app/page.tsx`
**Purpose**: Landing page with auth button
**Navigation Needs**: 
- No bottom nav (pre-auth)
- No back button (entry point)

---

### 2. Home (Thoughts) Page ✅
**Path**: `/home/thoughts`
**File**: `src/app/(protected)/home/thoughts/page.tsx`
**Purpose**: Main category list (default after auth)
**Current UI**: TopBar with "Thoughts" title
**Navigation Needs**:
- ✅ Show bottom nav (Home/My)
- ❌ No back button (is Home)
- Active: "Home" tab

---

### 3. My Activity Page ✅
**Path**: `/home/my`
**File**: `src/app/(protected)/home/my/page.tsx`
**Purpose**: User's questions and answers
**Current UI**: TopBar with "My Activity" title
**Navigation Needs**:
- ✅ Show bottom nav (Home/My)
- ❌ No back button (is My)
- Active: "My" tab

---

### 4. Home Redirect ✅
**Path**: `/home`
**File**: `src/app/(protected)/home/page.tsx`
**Purpose**: Redirects to `/home/thoughts`
**Navigation Needs**: N/A (instant redirect)

---

### 5. Category Board Page ✅
**Path**: `/category/[id]`
**File**: `src/app/(mini)/category/[id]/page.tsx`
**Purpose**: Shows questions for a specific category
**Current UI**: Unknown (need to check)
**Navigation Needs**:
- ✅ Show bottom nav (Home/My)
- ✅ Show back button (navigates to /home/thoughts)
- ✅ Show category name in header

---

## Route Groups Analysis

### `(protected)` Group
- Contains: `/home/*` routes
- Has layout: `src/app/(protected)/layout.tsx`
- Purpose: Authenticated routes with Navigation component

### `(mini)` Group
- Contains: `/category/*` routes
- Purpose: Mini app specific routes
- Layout: Unknown (need to check)

---

## Current Navigation Component

**File**: `src/components/Navigation/index.tsx`

**Current Implementation**:
- Bottom nav with "Thoughts" and "My" tabs
- Uses `next/navigation` for routing
- Icons: `DocMagnifyingGlass` (Thoughts), `User` (My)
- Active state detection via `usePathname()`

**Routes**:
- Thoughts → `/home/thoughts`
- My → `/home/my`

---

## Identified Issues

1. **No Back Button**
   - Category board has no way to return to home
   - Users are stuck on category pages

2. **Inconsistent Header**
   - `/home/thoughts` and `/home/my` use TopBar
   - `/category/[id]` header unknown
   - Need consistent header with back button

3. **Bottom Nav Not Always Visible**
   - Navigation component exists but placement unclear
   - Need to ensure it's always visible on main pages

4. **No Safe Area Padding**
   - No `env(safe-area-inset-bottom)` for iOS notch
   - Content may be hidden under nav bar

5. **Missing Routes**
   - No dedicated note detail page (questions shown inline on category board)
   - Compose forms are inline/modal (not separate pages)

---

## Proposed Navigation Structure

### Bottom Nav (Always Visible)
```
┌─────────────────────────────────┐
│                                 │
│         Content Area            │
│                                 │
├─────────────────────────────────┤
│  🏠 Home        👤 My           │  ← Bottom Nav
└─────────────────────────────────┘
```

**Items**:
1. **Home** (`/home/thoughts`) - Category list
2. **My** (`/home/my`) - User's activity

**Active State**:
- Home: Active on `/home/thoughts` and `/home`
- My: Active on `/home/my`

### Top Header (Conditional)
```
┌─────────────────────────────────┐
│ ← Back    Category Name    🏠   │  ← Top Header (on inner pages)
├─────────────────────────────────┤
│                                 │
│         Content Area            │
│                                 │
```

**Show On**:
- `/category/[id]` - Back to home, show category name

**Hide On**:
- `/` - Landing page (no nav)
- `/home/thoughts` - Is home (no back button)
- `/home/my` - Is my (no back button)

---

## Pages Requiring Navigation

| Page | Path | Bottom Nav | Top Header | Back Button |
|------|------|------------|------------|-------------|
| Landing | `/` | ❌ | ❌ | ❌ |
| Thoughts | `/home/thoughts` | ✅ | ✅ (no back) | ❌ |
| My Activity | `/home/my` | ✅ | ✅ (no back) | ❌ |
| Category Board | `/category/[id]` | ✅ | ✅ (with back) | ✅ |

---

## Implementation Plan

### Step 1: Create AppShell Component
**File**: `src/components/AppShell/index.tsx`

**Props**:
```typescript
interface AppShellProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
  showTopHeader?: boolean;
  showBackButton?: boolean;
  title?: string;
  headerActions?: React.ReactNode;
}
```

**Features**:
- Renders TopHeader (optional)
- Renders main content with safe-area padding
- Renders BottomNav (optional)
- Handles back button logic

### Step 2: Update Navigation Component
**File**: `src/components/Navigation/index.tsx`

**Changes**:
- Add safe-area padding: `pb-[env(safe-area-inset-bottom)]`
- Ensure fixed positioning at bottom
- Improve active state detection

### Step 3: Create TopHeader Component
**File**: `src/components/TopHeader/index.tsx`

**Features**:
- Back button (uses `router.back()` or fallback to `/home/thoughts`)
- Title display
- Optional actions (Home shortcut, My shortcut)
- Safe-area padding for top

### Step 4: Integrate AppShell
- Wrap pages in AppShell
- Configure per-page navigation visibility
- Ensure content doesn't overlap with nav

---

## Safe Area Considerations

### Bottom Nav
```css
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding-bottom: env(safe-area-inset-bottom);
  padding-bottom: max(env(safe-area-inset-bottom), 16px);
}
```

### Content Padding
```css
.content-area {
  padding-bottom: calc(64px + env(safe-area-inset-bottom));
}
```

### Top Header
```css
.top-header {
  padding-top: env(safe-area-inset-top);
}
```

---

## Touch Target Requirements

- Minimum tap target: 44px × 44px
- Bottom nav items: 56px height
- Back button: 44px × 44px
- Icons: 24px with padding

---

## PHASE 1 COMPLETE ✅

**Routes Identified**: 4 main pages
**Navigation Needs**: Clear
**Next**: Implement AppShell component with TopHeader and BottomNav
