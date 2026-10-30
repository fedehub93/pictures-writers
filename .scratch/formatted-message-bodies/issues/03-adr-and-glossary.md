# 03: ADR and glossary for sandboxed email bodies

**What to build:** The written rationale for rendering untrusted email HTML in a sandboxed iframe, plus the vocabulary the feature introduces, so the reversal of the previous stance is not a surprise later.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] An ADR records the reversal of "the inbox never renders email HTML", comparing the sandboxed iframe, a third-party sanitizer and plain-text-only rendering, and states why the browser sandbox was chosen.
- [ ] The ADR captures the consequences: scripts blocked by sandbox plus pinned-hash CSP, remote content blocked by default with a per-message reveal, no theme inheritance, no nested scroll, and the unresolved `cid:` inline-image limitation.
- [ ] `CONTEXT.md` gains precise terms for the message's HTML part, its text part and remote content, each with the avoided synonyms.
- [ ] The ADR follows the repository's existing numbering and format.
- [ ] No code changes are included in this ticket.
