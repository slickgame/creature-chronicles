# Creature Chronicles UI Layout Rules

## Variable-text boxes

Cards, notices, status rows, callouts, and other boxes containing dynamic text must size to their content.

Required behavior:

- Use intrinsic or automatic height.
- Use `min-width: 0` inside grid and flex layouts.
- Allow headings and body text to wrap naturally.
- Do not clip, hide, or ellipsize variable gameplay text.
- Keep modest bottom padding so boxes do not look cramped.
- Use scrolling on the surrounding list or page region, not inside ordinary text cards.

For new components, apply either:

```tsx
<section className="uiAutoTextBox">...</section>
```

or:

```tsx
<section data-ui-text-box="auto">...</section>
```

The global `content-sizing.css` stylesheet also applies this behavior retroactively to common card, box, row, notice, callout, message, and status class names.

## Exceptions

A genuinely fixed visual frame, such as an artwork viewport, may opt out:

```tsx
<div data-ui-fixed-size="true">...</div>
```

A deliberately single-line label may opt into truncation:

```tsx
<span className="uiSingleLineText">...</span>
```

or:

```tsx
<span data-ui-text="single-line">...</span>
```

Fixed sizing and truncation should be exceptions, not the default for gameplay information.
