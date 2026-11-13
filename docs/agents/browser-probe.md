# Browser probe

`scripts/browser-probe.mjs` opens a URL in headless Chrome, performs one click or key press, and
prints what the browser actually did. Reach for it when the behaviour depends on the browser:
navigation, default actions, middle and modifier clicks, the Puck canvas iframe.

Unit tests run in happy-dom, which has no navigation and no Puck listener, so a passing test can
sit on top of a broken interaction. The probe is the check that settles it.

## Run it

The dev server must already be running.

```bash
# Does a link navigate?
node scripts/browser-probe.mjs --url http://localhost:3000/ --target a --text Blog

# The editor canvas: the link lives in the iframe
node scripts/browser-probe.mjs --url http://localhost:3000/admin/pages/<id>/builder/ \
  --frame preview-frame --target a --text Blog

# Middle click, modifier click, and Enter on the focused link
node scripts/browser-probe.mjs --url <url> --target a --text Blog --button middle
node scripts/browser-probe.mjs --url <url> --target a --text Blog --modifier ctrl
node scripts/browser-probe.mjs --url <url> --target a --text Blog --key Enter
```

An admin route needs the session cookie:

```bash
node scripts/browser-probe.mjs --url <builder> --cookie "better-auth.session_token=<value>"
```

## Reading the report

| Field | Meaning |
| --- | --- |
| `target` | what matched: tag, `href`, visible text |
| `cancelled` | `defaultPrevented` after every handler ran — `true` means nothing followed the link. `null` when the page navigated away before it could be read |
| `event` | the event that fired (`click` or `auxclick`), its button, and the same `prevented` flag |
| `navigated.top` | the top window changed location |
| `navigated.frame` | the canvas iframe changed location; `null` without `--frame` |
| `navigated.newTabs` | tabs opened behind the page: a middle click, a modifier click, a `_blank` target |
| `errors` | page exceptions raised during the run |

Exit code is `0` when the target was found and the action ran, `1` otherwise.

## Options

| Option | Default | Meaning |
| --- | --- | --- |
| `--url` | — | page to open (required) |
| `--target` | `a` | CSS selector, resolved inside `--frame` when set |
| `--text` | — | exact visible text, to pick one of several matches |
| `--frame` | — | iframe id; the selector is resolved through its `contentDocument` |
| `--button` | `left` | `left`, `middle`, `right` |
| `--modifier` | — | `ctrl`, `meta`, `shift`, `alt`; repeatable |
| `--key` | — | `Enter`, `Tab`, `Space`; focuses the target and presses it instead of clicking |
| `--cookie` | — | `name=value`; repeatable, for routes behind auth |
| `--timeout` | `30000` | how long to wait for the target to appear, in ms |
| `--settle` | `1500` | how long to wait after the action before reading the result, in ms |
| `--port` | `0` | devtools port; `0` lets Chrome pick one per run |

## Notes

- Chrome or Edge is required. Set `CHROME_PATH` if neither is in a standard location.
- The probe dispatches real input events at the element's coordinates instead of calling
  `element.click()`, because a middle click only produces an `auxclick` through real input. The
  coordinates are mapped through the canvas iframe's CSS transform.
- `runProbe` is exported: import it for a flow that needs more than one action, or import
  `withSession` to keep one browser across several actions.
- The canvas itself is described in `docs/puck-canvas.md`.

## The agent environment

Agent sessions do not run against `pictures_writers_dev`. That database can be a restored
production dump — real users, real content, real session tokens — and a probe that writes
there would put synthetic pages next to real data.

```bash
npm run agent:env     # once: creates .env.agent (agent database URL, agent-only secrets)
npm run agent:seed    # creates the probe user and resets the probe page; also the reset
npm run dev:agent     # next dev against .env.agent
```

`dev:agent` refuses to start unless `.env.agent` points at `pictures_writers_agent` on
localhost, and `builder-probe` repeats that check before signing in. The probe logs in through
`/api/auth/sign-in/email` as `PROBE_ADMIN_EMAIL`: it never reads `BETTER_AUTH_SECRET` and never
touches the development database.

## Driving the builder

`scripts/builder-probe.mjs` logs in as the probe user, opens the builder, waits for the canvas
iframe to render, then runs a JSON list of steps. Typing into the canvas needs several actions
in one browser, which a single `runProbe` call cannot do; this reuses the same CDP layer through
`withSession`.

```json
[
  { "action": "focus" },
  { "action": "press", "key": "a", "modifiers": ["ctrl"] },
  { "action": "click", "target": "button[title=\"Bold\"]" },
  { "action": "read", "target": ".ProseMirror" }
]
```

```bash
npm run agent:seed
node --env-file=.env.agent scripts/builder-probe.mjs --steps steps.json
```

`npm run agent:probe -- --steps …` does not work here: npm 12 swallows the flags after `--`, so
the command passes through node directly to load `.env.agent`.

The report is JSON on stdout: one entry per step, plus `errors` (page exceptions). A failed step
exits `1` with `step N (action): …`.

| Action | Fields | Reports |
| --- | --- | --- |
| `click` | `target`, optional `text`, `button`, `modifiers` | the matched tag and text |
| `focus` | optional `target` (default `.ProseMirror`), `attempts` | `{ attempts, focused, tag }` |
| `type` | `text` | — (types at the caret, via `Input.insertText`) |
| `press` | `key`, optional `modifiers` | — (letters, digits, `Enter`, `Tab`, `Space`, arrows, `Escape`, `Backspace`) |
| `read` | `target` | `{ tag, text, html }` |
| `exists` | `target` | `found` |
| `wait` | `ms` | — |
| `evaluate` | `expression` | the expression's value, in the top document |

Notes that save a run:

- `target` resolves inside `--frame` (default `preview-frame`), so `h2` is the block's heading
  and not the admin chrome.
- `focus` is what puts the caret in the inline editor. A click on the block selects it and the
  editor takes the caret, but an automation click can land before Tiptap is ready to accept one;
  `focus` clicks until `document.activeElement` is contenteditable and reports how many attempts
  that took. `attempts: 2` is a fact worth recording, not noise.
- The toolbar sits in the block action bar with `title="Bold"`, `title="Italic"`,
  `title="Underline"`; `Add link` and `Text color` are the labelled buttons.
- `read` on `.ProseMirror` returns the editor's HTML — what Save persists.
- Seeding is the reset: `npm run agent:seed` rewrites the probe page from its fixture, so a run
  that typed into the canvas starts from a known state next time.
- `--login-only` prints the cookie name the sign-in produced and nothing else, which is what
  separates "the server is down" from a 403 (`Missing or null Origin`) or a 400
  (`Invalid email`).
