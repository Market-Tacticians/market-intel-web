# Market Brief Renderer Spec — JSON to HTML

This document tells the website renderer **exactly** what HTML to produce for every
field in the JSON. If the website renders something different from what's described
here, the renderer is broken — not the JSON, not the CSS.

The two issues you reported (broken Key Questions, missing notes in Market Snapshot)
are both renderer bugs. The fixes are described in sections 5 and 7 below.

---

## 1. Top-level structure

```json
{
  "meta":               { ... },
  "regime":             { ... },
  "dominant_narratives":[ ... ],
  "catalyst_calendar":  [ ... ],
  "market_snapshot":    { ... },
  "stories_to_track":   { ... },
  "scenarios":          [ ... ],
  "key_questions":      [ ... ],
  "research_sources":   [ ... ]
}
```

Render order: masthead → regime banner → narratives → calendar → snapshot →
stories to track → scenarios → key questions → notes (user-editable) → footer.

---

## 2. Masthead

```js
meta.title          → <h1> text
meta.period_covered → <p class="subtitle"> text
meta.last_updated   → <span class="ts-value"> text (format: "Tue Apr 28, 2026 | 11:30 AM ET")
```

```html
<header class="masthead">
  <div class="masthead-row">
    <h1><span class="accent">▶</span> {meta.title}</h1>
    <div class="timestamp-badge">
      <span class="ts-dot"></span>
      <span class="ts-label">Last Updated</span>
      <span class="ts-value">{formatted meta.last_updated}</span>
    </div>
  </div>
  <p class="subtitle">Week of {meta.period_covered} | Dominant narratives · Catalyst calendar · Scenario planning · Key levels</p>
</header>
```

---

## 3. Regime Banner

```js
regime.label       → .regime-label text
regime.color       → drives inline color on .regime-dot, .regime-label, .regime-banner border
regime.description → .regime-desc text
```

The colors are dynamic (per regime state) so they MUST be applied as inline styles.
Map `regime.color` to CSS variables:

| `regime.color` | dot/label color | banner border-color |
|---|---|---|
| `"green"` | `var(--green)` | `rgba(34,197,94,0.2)` |
| `"amber"` | `var(--amber)` | `var(--border)` (default) |
| `"red"`   | `var(--red)`   | `rgba(239,68,68,0.35)` |

```html
<div class="regime-banner" style="border-color: {bannerBorderColor}">
  <div class="regime-dot" style="background: {dotColor}"></div>
  <span class="regime-label" style="color: {labelColor}">{regime.label}</span>
  <span class="regime-desc">{regime.description}</span>
</div>
```

---

## 4. Dominant Narratives

Each item in `dominant_narratives[]` has a `type`:

- `type: "narrative_card"` — flat card, render `headline` + `body`.
- `type: "story_thread"` — condensed card on top + collapsible update timeline below.

### 4a. narrative_card

```html
<div class="narrative-card">
  <h3>
    <span class="tag tag-{tagSlug}">{tag}</span>
    {headline}
  </h3>
  <p>{body}</p>
</div>
```

`tagSlug` is derived from the tag string:
- `"Geopolitical"` → `tag-geo`
- `"Fed"` → `tag-fed`
- `"Energy"` → `tag-oil`
- `"Earnings"` → `tag-earnings`
- `"Econ Data"` → `tag-data`
- `"Flows"` → `tag-flow`

### 4b. story_thread

```html
<div class="story-thread">
  <div class="narrative-card condensed">
    <h3><span class="tag tag-{tagSlug}">{tag}</span> {headline}</h3>
    <p>{body}</p>
  </div>
  <div class="update-timeline">
    <div class="update-timeline-rail">
      <!-- one <details> per item in updates[] -->
    </div>
  </div>
</div>
```

Each `updates[i]` becomes:

```html
<details class="update-entry"{openIfLive}>
  <summary class="update-trigger">
    <div class="update-trigger-top">
      <div class="update-dot{liveClass}"></div>
      <span class="update-badge">
        {pulseSpan}
        {label}
      </span>
      <span class="update-timestamp">{timestamp}</span>
      <span class="update-chevron">▾</span>
    </div>
    <div class="update-trigger-headline">{headline}</div>
  </summary>
  <div class="update-body">
    <p>{body}</p>
    {if bullets exist:}
      <ul class="bullet-list">
        {for each b in bullets:}
          <li>{b}</li>
      </ul>
    {if market_impact exists:}
      <div class="market-impact">
        <div class="market-impact-label">Market Impact — {market_impact.session}</div>
        <p>{market_impact.text}</p>
      </div>
    {if sources exist and length > 0:}
      <details class="sources-drawer">
        <summary class="sources-toggle">
          Sources <span class="sources-count">{sources.length}</span>
          <span class="sources-chevron">▾</span>
        </summary>
        <ul class="sources-list">
          {for each s in sources:}
            <li>
              <span class="source-label">{s.label}</span><br>
              <a href="{s.url}" target="_blank" rel="noopener">{s.url}</a>
            </li>
        </ul>
      </details>
  </div>
</details>
```

Where:
- `openIfLive` = ` open` if `is_live === true`, else empty string
- `liveClass` = ` live` if `is_live === true`, else empty string
- `pulseSpan` = `<span class="pulse"></span>&nbsp;` if `is_live === true`, else empty

**Important:** preserve the order of `updates[]` (oldest → newest). Only the newest
(last) entry should have `is_live: true`. The renderer should respect the JSON;
do not re-order.

---

## 5. Catalyst Calendar

```html
<div class="timeline">
  {for each item in catalyst_calendar:}
    <div class="tl-item {impact}">
      <div class="tl-date">{date_label}</div>
      <div class="tl-title">
        {event}
        {if flag is not null:}
          <span class="inline-update">{flag}</span>
      </div>
      <div class="tl-body">{body}</div>
      {if tags.length > 0:}
        <div class="tl-tags">
          {for each t in tags:}
            <span class="tag tag-{tagSlug(t)}">{t}</span>
        </div>
    </div>
</div>
```

`{impact}` is the literal string from JSON (`"high"`, `"medium"`, `"low"`).

**Empty-state rule:** if `flag === null` or `flag === ""`, do not render the
`<span class="inline-update">` element at all. Same for `tags` — if empty array,
omit the `<div class="tl-tags">` wrapper.

---

## 6. Market Snapshot — **THIS IS A BUG IN YOUR RENDERER**

The website is showing only `value` and ignoring `note`. The HTML version concatenates them.

```html
<section>
  <div class="section-title">Market Snapshot</div>
  <div class="grid-3">

    <!-- Card 1: indexes -->
    <div class="card">
      <h4>Global Indexes</h4>
      {for each row in market_snapshot.indexes:}
        <div class="stat-row">
          <span class="stat-label">{row.label}</span>
          <span class="stat-val {directionClass(row.direction)}">{formatStatVal(row)}</span>
        </div>
    </div>

    <!-- Card 2: macro_fed -->
    <div class="card">
      <h4>Macro & Fed</h4>
      {same pattern using market_snapshot.macro_fed}
    </div>

    <!-- Card 3: energy_volatility -->
    <div class="card">
      <h4>Energy & Volatility</h4>
      {same pattern using market_snapshot.energy_volatility}
    </div>

  </div>
</section>
```

### `formatStatVal(row)` — THE FIX

```javascript
function formatStatVal(row) {
  // Both value and note exist → concatenate with separator
  if (row.value && row.note)  return row.value + ' | ' + row.note;
  // Only value exists
  if (row.value)              return row.value;
  // Only note exists (e.g. Russell 2000 — value is null, note is "+0.4% Tue AM (outperforming)")
  if (row.note)               return row.note;
  // Neither exists → empty
  return '';
}
```

### `directionClass(direction)` — direction string to CSS class

```javascript
function directionClass(direction) {
  switch (direction) {
    case 'up':      return 'up';       // → green text
    case 'down':    return 'down';     // → red text
    case 'neutral': return 'neutral';  // → amber text
    case 'mixed':   return 'flat';     // → default text color
    default:        return 'flat';
  }
}
```

**Currently your website is rendering `<span class="stat-val">{row.value}</span>`
and dropping `note` entirely.** That's why Russell 2000 shows blank (its `value`
is `null`) and S&P 500 shows only "7,173.91" instead of
"7,173.91 | Mon ATH close | −0.46% Tue AM".

---

## 7. Stories to Track

```html
<section>
  <div class="section-title">Stories to Track</div>
  <div class="grid-2">

    <div class="card">
      <h4>Geopolitical & Macro</h4>
      {for each row in stories_to_track.geopolitical_macro:}
        <div class="watchlist-item">
          <div class="w-dot {row.direction}"></div>
          <span class="w-label">{row.label}</span>
          <span class="w-status">{row.status}</span>
        </div>
    </div>

    <div class="card">
      <h4>Sector & Stock Signals</h4>
      {same pattern using stories_to_track.sector_stock_signals}
    </div>

  </div>
</section>
```

`row.direction` is one of `"up"`, `"down"`, `"neutral"` — apply directly as a class.

---

## 8. Scenarios

```html
<section>
  <div class="section-title">Scenarios</div>
  {for each s in scenarios:}
    <div class="scenario">
      <div class="scenario-header">
        <div class="scenario-icon" style="background: {dimColor(s.color)}; color: {fullColor(s.color)}">
          {s.label}
        </div>
        <h4>{s.case} Case: {s.headline}</h4>
      </div>
      <p>{s.body}</p>

      {if s.update is not null/undefined:}
        <div class="scenario-update-note">
          <div class="scenario-update-label">{s.update.label}</div>
          <p>{s.update.text}</p>
        </div>
    </div>
</section>
```

Color helpers:

```javascript
function dimColor(c)  { return 'var(--' + c + '-dim)'; }   // "red" → "var(--red-dim)"
function fullColor(c) { return 'var(--' + c + ')'; }       // "red" → "var(--red)"
```

**Empty-state rule:** if `s.update` is `null`, `undefined`, or absent, do NOT
render the `.scenario-update-note` element. Bull and Base scenarios in the
current JSON have no update; only Bear does.

---

## 9. Key Questions — **THIS IS A BUG IN YOUR RENDERER**

Your current website is rendering question + status as a raw concatenation
("...this week?partially answered" with no space, no badge styling, and no
answer block). It's also missing the answer/update text entirely.

```html
<section>
  <div class="section-title">Key Questions</div>
  <div class="card">
    <div class="question-block">
      {for each q in key_questions:}
        <p>
          <strong style="color: var(--text-bright)">{q.number}.</strong>
          {q.question}
          <span class="{badgeClass(q.status)}">{q.update_label || statusToLabel(q.status)}</span>
        </p>
        {if q.answer:}
          <span class="q-answer">{q.answer}</span>
        {if q.update:}
          <span class="q-answer partial">{q.update}</span>
    </div>
  </div>
</section>
```

### `badgeClass(status)` — status to CSS class

```javascript
function badgeClass(status) {
  switch (status) {
    case 'unanswered':         return 'q-unanswered';
    case 'answered':           return 'q-answered';
    case 'partially_answered': return 'q-badge-partial';
    case 'updated':            return 'q-badge-updated';
    default:                   return 'q-unanswered';
  }
}
```

### `statusToLabel(status)` — fallback if `update_label` is missing

```javascript
function statusToLabel(status) {
  switch (status) {
    case 'unanswered':         return 'Unanswered';
    case 'answered':           return 'Answered';
    case 'partially_answered': return 'Partially Answered';
    case 'updated':            return 'Updated';
    default:                   return 'Unanswered';
  }
}
```

### What the renderer is doing wrong right now

Looking at your screenshot:
- "...back on track this week?**partially answered**" — that's the bare status
  string concatenated with no space, no `<span>` wrapper, no badge styling.
- The `q.answer` field exists in the JSON but is not being rendered at all.
- Q1 should show the "Partially Answered" badge AND the amber answer block below
  with "Iran submitted a formal proposal Sunday–Monday..."
- Q5 should show the "Updated" badge AND the amber update block below.

### Required HTML for Q1 (partially_answered)

```html
<p>
  <strong style="color: var(--text-bright)">1.</strong>
  Does Trump reverse his Islamabad cancellation...
  <span class="q-badge-partial">Partially Answered</span>
</p>
<span class="q-answer partial">Iran submitted a formal proposal Sunday–Monday: reopen Hormuz...</span>
```

### Required HTML for Q5 (updated)

```html
<p>
  <strong style="color: var(--text-bright)">5.</strong>
  Does Powell's press conference language...
  <span class="q-badge-updated">Updated</span>
</p>
<span class="q-answer partial">Markets have already moved the answer...</span>
```

### Required HTML for Q2 (unanswered) — no answer block

```html
<p>
  <strong style="color: var(--text-bright)">2.</strong>
  Does Q1 2026 GDP advance estimate come in above 1.0%...
  <span class="q-unanswered">Unanswered</span>
</p>
<!-- NO answer block — q.answer is absent -->
```

---

## 10. Footer

```html
<footer>
  <span>Weekly Market Intelligence Brief — Week of {meta.period_covered}</span>
  <span>Last updated: {formatted meta.last_updated} | Sources: {meta.sources.join(', ')}</span>
</footer>
```

---

## 11. Summary of the two bugs you saw

| Section | Bug | Fix |
|---|---|---|
| Market Snapshot | Renderer ignores `row.note` field. Russell 2000 shows blank because its `value` is `null`. | Use `formatStatVal(row)` from section 6 — concatenate `value` + `note`. |
| Key Questions | Renderer outputs raw `status` string without span wrapper, no badge class. Misses `q.answer` and `q.update` entirely. | Use `badgeClass()` + `update_label` + render `.q-answer` block when `answer` or `update` exists. |

The JSON schema is correct. The CSS classes are correct. The renderer code on the
website needs to be patched to match this spec.
