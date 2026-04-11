# Logo Filter Strategy

This document explains the CSS filter strategy used to render the logo correctly across different UI backgrounds in the chatbot app.

## Overview

The logo needs to appear correctly in multiple locations, each with a different background color. The strategy uses CSS filters to adapt the logo's appearance without maintaining multiple image assets.

## Location Reference Table

| Location | Background | Filter Applied |
|---|---|---|
| `WelcomeView` greeting | White page background | None — Navy logo shows perfectly on white |
| `ChatHeader` | Navy Blue (`bg-primary`) | `brightness(0) invert(1)` → renders white |
| `ChatWindow` empty state | Navy Blue circle (`bg-primary`) | `brightness(0) invert(1)` → renders white |
| `ChatWidget` floating button | Navy Blue (`bg-primary`) | `brightness(0) invert(1)` → renders white |

## Implementation

The filter is applied using an inline style instead of Tailwind CSS utilities:

```jsx
style={{ filter: 'brightness(0) invert(1)' }}
```

### Why Inline Styles?

The inline `style={{ filter: 'brightness(0) invert(1)' }}` is used instead of Tailwind utilities to avoid any CSS composition issues with Tailwind v4's filter system — it's direct, reliable, and easy to adjust later.

## How the Filter Works

The `brightness(0) invert(1)` filter is a two-step transformation:

1. **`brightness(0)`** — Reduces brightness to zero, turning any color in the image completely black.
2. **`invert(1)`** — Inverts all colors, flipping black to white.

This makes any logo render as **white**, regardless of its original color — which is ideal when placing a dark logo on a dark Navy Blue (`bg-primary`) background.
