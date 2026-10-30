# Email address is the Contact identity, compared case-insensitively

**Status**: accepted

`EmailContact.email` is the only identity a Contact has, but it was stored and compared exactly as typed, so `Mario@example.com` and `mario@example.com` became two Contacts that behaved as one downstream: the provider resolves contacts by email and returned the same record for both, while automations key their idempotency on the contact id and ran twice. We treat the trimmed, lowercase form of the address as the identity: every write stores that form and every lookup compares case-insensitively, so a returning visitor is recognised whatever capitalisation they type. There is no data migration and no new database constraint — the seven pre-existing duplicate pairs stay in the table as inert legacy rows, and the structural guarantee (`CHECK (email = lower(email))` or a unique index on `lower(email)`) is deferred, because it cannot be created while those pairs exist and buying it would force a backfill whose only benefit is tidiness.

## Considered options

- **Normalise writes only, keep exact lookups**: rejected, and worth remembering. It looks like the cheap version but is worse than doing nothing: every legacy row becomes unreachable, a fresh canonical row is created the next time that person appears, and the old row keeps its audience memberships and provider mapping while the new one propagates without them — split state instead of a visible duplicate.
- **Enforce uniqueness with a unique index on `lower(email)`**: same destination, not a shortcut. The index cannot be built while the legacy pairs exist, so it postpones the merge rather than avoiding it. Deferred until the pairs are worth cleaning (see Consequences).
- **One email per Audience (Mailchimp's model)**: rejected. Audiences are a many-to-many membership here, not an ownership boundary; the same person in two Audiences is one Contact.
- **Manual merge as the primary answer**: rejected. It treats the symptom — by the time a duplicate is merged, the automations it triggered have already run twice.
- **Collapse `+tags` and Gmail dots**: rejected. They change the address we actually send to, and merging on them requires a corroborating identity signal (a phone number, a bounce) that we do not have.

## Consequences

- The seven legacy pairs keep their original spelling forever. Lookups resolve to the oldest matching row, so every future event lands on one of the two and the pair stops producing duplicate automation runs — the double send was a product of *creating* the second row, not of it existing.
- The two internal emitters (`form.submitted`, `subscription.confirmed`) key their idempotency on the canonical address instead of the contact id: ADR-0005 still owns the opaque-key mechanism, but the address makes a double Run impossible even if two rows for the same person reappear.
- The rule is enforced at one choke point instead of nine independent capture paths. A new path that bypasses it can still create a variant; the failure mode is a visible duplicate, not a corrupted provider mapping.
- `FormSubmission.email` and `Conversation.contactEmail` are normalised as writes so they stay joinable, but they keep many rows per address by design.
- The provider needs no action: it already resolves by email and has been collapsing these pairs all along.
- Adding the structural guarantee later is a data merge of the remaining pairs plus one `ALTER TABLE`; nothing in this decision makes it harder.
