# 03: ADR and glossary for sandboxed email bodies

**What to build:** The written rationale for rendering untrusted email HTML in a sandboxed iframe, plus the vocabulary the feature introduces, so the reversal of the previous stance is not a surprise later.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] An ADR records the reversal of "the inbox never renders email HTML", comparing the sandboxed iframe, a third-party sanitizer and plain-text-only rendering, and states why the browser sandbox was chosen.
- [x] The ADR captures the consequences: scripts blocked by sandbox plus pinned-hash CSP, remote content blocked by default with a per-message reveal, no theme inheritance, no nested scroll, and the unresolved `cid:` inline-image limitation.
- [x] `CONTEXT.md` gains precise terms for the message's HTML part, its text part and remote content, each with the avoided synonyms.
- [x] The ADR follows the repository's existing numbering and format.
- [x] No code changes are included in this ticket.

## Comments

Delivered:

- `docs/adr/0033-sandboxed-iframe-for-email-bodies.md` — records the reversal of the text-only stance, the three considered options (plain text, sanitizer plus app-origin injection, sandboxed iframe) and why the browser sandbox was chosen, followed by the consequences: hash-pinned single script, remote content blocked with a per-message reveal, no theme inheritance, automatic uncapped height with no nested scroll, and the unresolved `cid:` inline images.
- `CONTEXT.md` — adds **HTML part**, **Text part** and **Remote content** to the email conversations glossary, each with its avoided synonyms.
- No code changes.
