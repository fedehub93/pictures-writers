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
- `runProbe` is exported: import it for a flow that needs more than one action.
- The canvas itself is described in `docs/puck-canvas.md`.
