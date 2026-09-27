# Site time zone for scheduled features, with Wait anchored to wall-clock time

**Status**: accepted

Automations need to schedule by wall-clock time ("send the day-3 nurture email at 09:00"), but the Wait node could only wait a relative duration or an absolute datetime, and the Cron trigger's optional `timeOfDay` was interpreted in UTC regardless of where the site's readers live. We add a single IANA time zone to `Settings` (`timezone`, seeded `Europe/Rome`, falling back to `UTC`), applied by both the Cron trigger and the Wait node. Wait's "delay + time of day" uses **calendar-day anchoring**: N whole days after the submission's wall date, at the chosen time, rolled forward a day if that instant has already passed (submitted Thursday 16:00 → "2 days at 10:00" → Saturday 10:00). Conversions go through `date-fns-tz` so daylight-saving transitions are handled by the zone, not a fixed offset. The runner threads the site zone into the node handler context, so changing the setting affects every future run rather than something frozen into published snapshots.

## Considered options

- **Per-record browser time zone** (the scheduler's `ScheduledAction.timezone` precedent): rejected — it scatters the source of truth and would let two authors schedule in different zones without noticing.
- **Hand-rolled `Intl` offset math** (the previous UTC-only approach generalised): rejected — correct only for fixed offsets, wrong across DST.
- **Elapsed-then-anchor** (wait the delay, then jump to the next occurrence of the time): rejected — a Thursday-16:00 submission would resume Sunday, not Saturday, contradicting the nurture use case.
- **Freeze the zone into each node's config at author time**: rejected — a setting change would not apply until republish, surprising for a global setting.

## Consequences

- Existing published Cron triggers with a `timeOfDay` are reinterpreted from UTC to the site zone. Accepted because no production Automations exist yet; otherwise a data migration would be required.
- `date-fns-tz` is added as a dependency.
- A broken or missing `timezone` silently degrades to UTC rather than stalling the pump.
