# Issue tracker: Local Markdown

Issues and specs for this repo live as markdown files in `.scratch/`.

`.scratch` is dot-prefixed, so `glob` only sees it with `hidden: true`; a directory listing
(`ls`, `Get-ChildItem`) sees it either way. A plain `glob .scratch/**` reports no files.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- The spec is `.scratch/<feature-slug>/spec.md`
- Implementation issues are one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`, never a single combined tickets file
- Triage state is recorded as a `Status:` line near the top of each issue file (see `triage-labels.md` for the role strings)
- Comments and conversation history append to the bottom of the file under a `## Comments` heading

## When a skill says "publish to the issue tracker"

Create a new file under `.scratch/<feature-slug>/` (creating the directory if needed).

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the issue number directly.

## When a skill says "resolve the ticket the way the tracker closes work"

`implement-spec` speaks in those terms; this is what it means:

1. Set `**Status:**` to `done`. A `ready-for-human`, `needs-info` or `needs-triage` ticket stays
   open — a human closes those.
2. Tick the acceptance checklist (`- [ ]` → `- [x]`), but only for what was actually run. A check
   that did not happen stays unticked and is named in the comment.
3. Append a `## Comments` entry: the date, the commit that landed the work, what changed, and the
   verification output (lint/typecheck/test counts, plus the browser probe when one ran).
4. Commit the ticket file on its own, as `docs(<area>): close the <ticket> ticket`. The code keeps
   its own `feat(...)` commit; the ticket never rides along with it.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a file with one **child** file per ticket.

- **Map**: `.scratch/<effort>/map.md` (the Notes / Decisions-so-far / Fog body).
- **Child ticket**: `.scratch/<effort>/issues/NN-<slug>.md`, numbered from `01`, with the question in the body. A `Type:` line records the ticket type (`research`/`prototype`/`grilling`/`task`); a `Status:` line records `claimed`/`resolved`.
- **Blocking**: a `Blocked by: NN, NN` line near the top. A ticket is unblocked when every file it lists is `resolved`.
- **Frontier**: scan `.scratch/<effort>/issues/` for files that are open, unblocked, and unclaimed; first by number wins.
- **Claim**: set `Status: claimed` and save before any work.
- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, then append a context pointer (gist + link) to the map's Decisions-so-far in `map.md`.
