# Unread Message Counts - Visual Guide

## 📱 What You'll See

### Sidebar with Unread Badges

```
┌─────────────────────────────────┐
│  Chats                          │
├─────────────────────────────────┤
│                                 │
│  Bob                      [3]   │  ← 3 unread messages
│                                 │
│  Charlie                  [1]   │  ← 1 unread message
│                                 │
│  Team Project                   │  ← No unread (no badge)
│                                 │
│  Alice                   [12]   │  ← 12 unread messages
│                                 │
└─────────────────────────────────┘
```

## 🎨 Badge Appearance

### Single Digit
```
┌────┐
│ 3  │  ← Red background
└────┘    White text
          11px font
          Rounded (10px radius)
```

### Double Digit
```
┌─────┐
│ 12  │  ← Expands to fit
└─────┘    Min width: 18px
```

### Large Numbers
```
┌──────┐
│ 999  │  ← Can show any number
└──────┘    (Consider "99+" for > 99)
```

## 🔄 State Transitions

### State 1: No Unread Messages
```
┌─────────────────────────┐
│  Bob                    │  ← No badge
└─────────────────────────┘
```

### State 2: First Message Arrives
```
┌─────────────────────────┐
│  Bob              [1]   │  ← Badge appears!
└─────────────────────────┘
```

### State 3: More Messages Arrive
```
┌─────────────────────────┐
│  Bob              [5]   │  ← Count increases
└─────────────────────────┘
```

### State 4: Room Opened
```
┌─────────────────────────┐
│  Bob                    │  ← Badge disappears
└─────────────────────────┘
```

## 📊 Complete Sidebar Example

### Before Opening Any Chats
```
┌─────────────────────────────────┐
│  Welcome, Alice                 │
│  [Logout]                       │
├─────────────────────────────────┤
│  Chats                          │
│                                 │
│  🟢 Bob                   [5]   │  ← Online + 5 unread
│                                 │
│  Charlie                  [2]   │  ← Offline + 2 unread
│                                 │
│  🟢 Team Project          [8]   │  ← Group + 8 unread
│                                 │
│  David                          │  ← No unread
│                                 │
├─────────────────────────────────┤
│  Start Private Chat             │
│  🟢 Eve                         │
│  🟢 Frank                       │
└─────────────────────────────────┘
```

### After Opening Bob's Chat
```
┌─────────────────────────────────┐
│  Welcome, Alice                 │
│  [Logout]                       │
├─────────────────────────────────┤
│  Chats                          │
│                                 │
│  🟢 Bob                         │  ← Badge gone!
│  (Active)                       │
│                                 │
│  Charlie                  [2]   │
│                                 │
│  🟢 Team Project          [8]   │
│                                 │
│  David                          │
│                                 │
└─────────────────────────────────┘
```

## 🎬 Animation Sequence

### Message Arrives (Real-time)

**Frame 1 (0ms):**
```
Bob                    
```

**Frame 2 (100ms):**
```
Bob              [1]   ← Badge fades in
```

**Frame 3 (200ms):**
```
Bob              [1]   ← Fully visible
```

### Count Increments

**Before:**
```
Bob              [3]
```

**After (instant):**
```
Bob              [4]   ← Number changes
```

### Badge Disappears

**Frame 1 (0ms):**
```
Bob              [5]
```

**Frame 2 (Click room):**
```
Bob                    ← Badge removed instantly
```

## 🎨 Color Variations

### Default (Red)
```
┌────┐
│ 3  │  Background: #f56565 (Red)
└────┘  Text: white
```

### Alternative: Blue
```
┌────┐
│ 3  │  Background: #4299e1 (Blue)
└────┘  Text: white
```

### Alternative: Green
```
┌────┐
│ 3  │  Background: #48bb78 (Green)
└────┘  Text: white
```

### Alternative: Orange
```
┌────┐
│ 3  │  Background: #ed8936 (Orange)
└────┘  Text: white
```

## 📐 Layout Variations

### Compact Mode
```
Bob [3]
```

### Spacious Mode
```
Bob                      [3]
```

### With Icons
```
💬 Bob                   [3]
```

### With Timestamps
```
Bob                      [3]
Last message: 2m ago
```

## 🔢 Number Formatting

### Standard Numbers
```
[1]    [2]    [5]    [10]   [25]
```

### Large Numbers
```
[99]   [100]  [500]  [999]
```

### Overflow (Future)
```
[99+]  ← For numbers > 99
```

## 🎯 Badge Positioning

### Right-Aligned (Current)
```
┌─────────────────────────────────┐
│  Bob                      [3]   │
│  Charlie                  [1]   │
└─────────────────────────────────┘
```

### Left-Aligned (Alternative)
```
┌─────────────────────────────────┐
│  [3] Bob                        │
│  [1] Charlie                    │
└─────────────────────────────────┘
```

### Floating (Alternative)
```
┌─────────────────────────────────┐
│  Bob                    ⓷       │
│  Charlie                ①       │
└─────────────────────────────────┘
```

## 📱 Mobile View

### Portrait Mode
```
┌───────────────┐
│  Chats        │
├───────────────┤
│  Bob     [3]  │
│  Charlie [1]  │
│  Team         │
└───────────────┘
```

### Landscape Mode
```
┌─────────────────────────────┐
│  Bob              [3]       │
│  Charlie          [1]       │
└─────────────────────────────┘
```

## 🎨 CSS Breakdown

### Badge Structure
```css
.unread-badge {
  /* Color */
  background: #f56565;    /* Red */
  color: white;
  
  /* Size */
  padding: 2px 6px;
  min-width: 18px;
  font-size: 11px;
  
  /* Shape */
  border-radius: 10px;    /* Rounded pill */
  
  /* Text */
  font-weight: 600;       /* Semi-bold */
  text-align: center;
}
```

### Room Item Layout
```css
.room-badges {
  display: flex;
  align-items: center;
  gap: 6px;               /* Space between badges */
}
```

## 🔍 Hover States (Future)

### Tooltip on Hover
```
┌─────────────────────────────────┐
│  Bob                      [5]   │
│  ┌─────────────────────────┐   │
│  │ 5 unread messages       │   │
│  │ Last: "Hello!" (2m ago) │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

### Highlight on Hover
```
┌─────────────────────────────────┐
│  Bob                      [5]   │  ← Darker background
└─────────────────────────────────┘
```

## 🎭 Multiple Badge Types

### Unread + Online Status
```
┌─────────────────────────────────┐
│  🟢 Bob                   [3]   │  ← Green dot + badge
└─────────────────────────────────┘
```

### Unread + Group Badge
```
┌─────────────────────────────────┐
│  Team Project    [Group]  [5]   │  ← Two badges
└─────────────────────────────────┘
```

### Unread + Typing
```
┌─────────────────────────────────┐
│  Bob                      [3]   │
│  Bob is typing...               │
└─────────────────────────────────┘
```

## 📊 Real-World Examples

### WhatsApp Style
```
┌─────────────────────────────────┐
│  Bob                            │
│  Hello there!            [2]    │  ← Preview + count
│  10:30 AM                       │
└─────────────────────────────────┘
```

### Slack Style
```
┌─────────────────────────────────┐
│  # general              [12]    │  ← Channel + count
│  # random                [3]    │
└─────────────────────────────────┘
```

### Telegram Style
```
┌─────────────────────────────────┐
│  Bob                      ③     │  ← Circled number
│  Charlie                  ①     │
└─────────────────────────────────┘
```

### Discord Style
```
┌─────────────────────────────────┐
│  ● Bob                    [5]   │  ← Dot + count
│  ○ Charlie                      │
└─────────────────────────────────┘
```

## 🎨 Theme Variations

### Light Theme (Current)
```
Background: White
Badge: Red (#f56565)
Text: Dark gray
```

### Dark Theme (Future)
```
Background: Dark gray (#2d3748)
Badge: Bright red (#fc8181)
Text: White
```

### High Contrast
```
Background: Black
Badge: Yellow (#fbbf24)
Text: Black (on badge)
```

## 🔢 Count Display Logic

### Standard Display
```javascript
count === 0  → No badge
count === 1  → [1]
count === 5  → [5]
count === 99 → [99]
```

### With Overflow (Future)
```javascript
count === 0   → No badge
count === 1   → [1]
count === 99  → [99]
count === 100 → [99+]
count === 500 → [99+]
```

### With K notation (Future)
```javascript
count === 1000  → [1K]
count === 5000  → [5K]
count === 10000 → [10K]
```

## 🎯 Accessibility

### Screen Reader Text
```html
<span className="unread-badge" aria-label="3 unread messages">
  3
</span>
```

### High Contrast Mode
```css
@media (prefers-contrast: high) {
  .unread-badge {
    border: 2px solid white;
  }
}
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  .unread-badge {
    animation: none;
  }
}
```

## 📏 Size Variations

### Small
```css
.unread-badge-small {
  padding: 1px 4px;
  font-size: 9px;
  min-width: 14px;
}
```

### Medium (Current)
```css
.unread-badge {
  padding: 2px 6px;
  font-size: 11px;
  min-width: 18px;
}
```

### Large
```css
.unread-badge-large {
  padding: 4px 8px;
  font-size: 13px;
  min-width: 22px;
}
```

## 🎬 Animation Ideas (Future)

### Bounce In
```css
@keyframes bounceIn {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
```

### Pulse
```css
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
```

### Shake
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}
```

---

**Status:** ✅ Fully Implemented
**Visual Design:** ✅ Red pill-shaped badges
**Positioning:** ✅ Right-aligned in room list
**Responsive:** ✅ Works on all screen sizes
**Next:** Test in browser to see it in action!
