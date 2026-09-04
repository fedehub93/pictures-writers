# Scheduling scalabile per Post e newsletter

Status: ready-for-agent

## Problem Statement

La piattaforma dispone oggi di una **Scheduled publication** specifica per i Post. La data prevista, lo stato `SCHEDULED` e la logica di esecuzione sono memorizzati direttamente nel modello Post e il calendario amministrativo legge una lista paginata di Post.

Questo approccio non permette di rappresentare in modo affidabile altri tipi di azioni future, in particolare l’invio programmato di una newsletter. Il calendario può inoltre omettere elementi oltre la pagina corrente, confondere contenuti pubblicati con azioni pianificate e non offre uno storico operativo uniforme.

La piattaforma deve supportare azioni una tantum per Post e newsletter, mantenendo il comportamento già disponibile per la Scheduled publication dei Post e preparando un’estensione futura a ulteriori canali senza implementare i social in questa fase.

## Solution

Introdurre un modulo di scheduling indipendente dai singoli contenuti, basato su una singola entità `ScheduledAction`.

Una `ScheduledAction` rappresenta una specifica operazione una tantum da eseguire in futuro, ad esempio:

- pubblicare un Post;
- inviare una newsletter.

L’entità conserva sia l’intenzione di esecuzione sia il risultato operativo, permettendo di mantenere lo storico dopo il completamento. Il worker comune acquisisce le azioni dovute, le esegue attraverso handler specifici per tipo di azione e registra successo, errore, retry e annullamento.

La Scheduled publication dei Post continuerà a usare l’ultima versione salvata ed eleggibile al momento dell’esecuzione. Un invio newsletter leggerà al momento dell’esecuzione la versione più aggiornata del contenuto e dell’audience selezionata. I contatti appartenenti all’audience saranno risolti dinamicamente al momento dell’invio.

Il calendario amministrativo consumerà una query dedicata per intervallo e mostrerà sia le azioni future sia lo storico delle azioni completate, fallite o annullate. Il timezone scelto nell’interfaccia sarà quello del browser e la precisione del polling resterà di cinque minuti.

## User Stories

1. As an editor, I want to schedule a DRAFT Post for a future date and time, so that it becomes public without a manual action at that moment.

2. As an editor, I want to schedule a CHANGED Post, so that the currently published version remains public until the scheduled publication is executed.

3. As an editor, I want a scheduled Post to use the latest saved eligible version at execution time, so that changes made after scheduling are included automatically.

4. As an editor, I want to edit a scheduled Post without creating a second scheduled action, so that the Post has one clear future publication.

5. As an editor, I want to reschedule a Post, so that I can change its planned publication time without recreating it.

6. As an editor, I want to cancel a scheduled Post, so that it is not published automatically.

7. As an editor, I want a canceled scheduled Post to return to the appropriate editorial state, so that a never-published Post returns to DRAFT and a scheduled change returns to CHANGED.

8. As an editor, I want to publish a scheduled Post immediately, so that I can release it before the planned time when necessary.

9. As an editor, I want immediate publication to invalidate the pending scheduled action, so that the Post is not processed again by the worker.

10. As an editor, I want invalid or incomplete Posts to be rejected when scheduled, so that an automatic execution cannot publish unusable content.

11. As an editor, I want validation to be repeated at execution time, so that a Post edited into an invalid state does not become partially public.

12. As an editor, I want the currently published Post version to remain visible until the scheduled publication succeeds, so that visitors never see an incomplete future version.

13. As an editor, I want the scheduled version to replace the currently published version atomically, so that visitors do not observe an intermediate state.

14. As an editor, I want to schedule several different Posts for the same time, so that each Post is processed independently.

15. As an editor, I want one active scheduled publication per Post root, so that competing future publications cannot be created for the same Post.

16. As an editor, I want to create a newsletter as a reusable EmailSingleSend, so that I can prepare its content before deciding when to send it.

17. As an editor, I want to schedule an EmailSingleSend for a future date and time, so that the newsletter is sent automatically.

18. As an editor, I want a scheduled newsletter to use the latest saved subject and body at execution time, so that changes made after scheduling are respected.

19. As an editor, I want a scheduled newsletter to use the latest saved audience selection at execution time, so that changes to the newsletter configuration are not silently ignored.

20. As an editor, I want the contacts belonging to the selected audience to be resolved dynamically at execution time, so that the current audience membership is used.

21. As an editor, I want a newsletter to keep its selected audience scope stable during one execution, so that the audience is evaluated consistently for that send.

22. As an editor, I want to reschedule a newsletter, so that I can change its planned send time without creating an accidental duplicate send.

23. As an editor, I want to cancel a scheduled newsletter before execution, so that it is not sent to the audience.

24. As an editor, I want an email send to be executed at most once for the same scheduled action, so that retries do not create duplicate newsletters.

25. As an editor, I want a failed email send to be retried when the provider reports a temporary failure, so that transient provider or network problems do not permanently lose the send.

26. As an editor, I want a permanent email failure to become visible as failed, so that I know that corrective action is required.

27. As an editor, I want to see upcoming Post publications and newsletter sends in the same calendar, so that I can coordinate the editorial and communication schedule.

28. As an editor, I want to filter calendar events by action type, so that I can view only Posts, only newsletters, or all scheduled actions.

29. As an editor, I want to filter calendar events by operational status, so that I can find pending, failed, completed, or canceled actions.

30. As an editor, I want to see completed actions in the calendar, so that the calendar can be used as a consultation history.

31. As an editor, I want to distinguish planned time from actual execution time, so that I can understand whether an action ran on time.

32. As an editor, I want to see manually published Posts in the historical calendar view, so that the Post publication history is not limited to scheduler-created actions.

33. As an editor, I want overdue actions to be visibly identifiable, so that a missed or failed scheduler run can be investigated.

34. As an editor, I want to choose date and time using my browser timezone, so that scheduling matches my local context.

35. As an editor, I want the selected browser-local value to be persisted as an absolute instant, so that changing timezone later does not change the intended execution moment.

36. As an editor, I want scheduling times to use five-minute increments, so that the precision matches the external polling interval.

37. As an editor, I want a future action to remain stored if a polling execution is missed, so that the next worker invocation can process it when it becomes due.

38. As an editor, I want a scheduler failure for one action not to prevent other due actions from being processed, so that one invalid Post or failed provider call does not block the queue.

39. As an administrator, I want the existing recurring external cron to trigger one common scheduler, so that the number of cron jobs does not grow with the number of Posts or newsletters.

40. As an administrator, I want the scheduler to process a bounded batch, so that the application remains within the execution limits of the hosting platform.

41. As an administrator, I want concurrent scheduler invocations to claim different actions, so that the same side effect is not started twice by overlapping cron calls.

42. As an administrator, I want abandoned processing claims to expire, so that an action can be recovered after a worker interruption.

43. As an administrator, I want every execution attempt to be recorded, so that retries and provider failures can be diagnosed.

44. As an administrator, I want provider identifiers and errors to be persisted, so that the application can reconcile external operations and support manual investigation.

45. As an administrator, I want the scheduled action record to remain after success, failure, or cancellation, so that the calendar history is durable.

46. As an administrator, I want the existing Post publication workflow to remain the single source of truth for publishing Posts, so that manual and automatic publication have the same behavior.

47. As an administrator, I want the email provider integration to be called through a scheduler-specific handler, so that the generic worker does not contain provider-specific logic.

48. As an administrator, I want the system to reserve an extensible action type for future channels, so that adding social publishing later does not require duplicating the scheduler and calendar infrastructure.

49. As an administrator, I want scheduling to work without introducing a new roles or permissions model, so that authorization changes remain outside this feature.

## Implementation Decisions

- Introduce a scheduling module with a single `ScheduledAction` aggregate for one-off operations. Do not introduce a separate Plan entity in this iteration because there are no multi-destination actions in scope.

- `ScheduledAction` represents both the scheduled instruction and its durable execution history. A successful, failed, or canceled action is retained and is not deleted as part of normal processing.

- Supported action types in this iteration are `PUBLISH_POST` and `SEND_EMAIL`. The model must allow additional action types later, but no social integration is implemented now.

- The scheduled action stores an action type, target type, target identifier, planned execution instant, browser timezone, operational status, retry information, lease information, idempotency key, provider identifier when applicable, last error, and actual execution timestamp.

- Scheduling is one-off only. Recurrence rules, recurring actions, bulk scheduling, and campaign grouping are not introduced.

- The operational state of a scheduled action is independent of the editorial `ContentStatus` state. Existing Post scheduling fields and `ContentStatus.SCHEDULED` remain temporarily available for backward compatibility while the Post workflow is migrated.

- The scheduled action lifecycle is:

  ```text
  SCHEDULED -> PROCESSING -> SUCCEEDED
                         -> RETRY_WAIT -> PROCESSING
                         -> FAILED
  SCHEDULED -> CANCELED
  RETRY_WAIT -> CANCELED
  ```

- `PROCESSING` is protected by a lease. A worker must claim an action before executing it, and an expired lease makes the action eligible for recovery.

- Claiming must be concurrency-safe. The implementation must use an atomic conditional claim or PostgreSQL row-locking with `SKIP LOCKED`; a read followed by an unconditional update is not sufficient.

- The worker must not hold a database transaction open while making an external provider call. Claiming and finalizing the result are short database operations around the external execution.

- Each action has a stable idempotency key. A retry of the same action reuses the key and must not create a second effective side effect.

- Transient and permanent errors are classified by the handler or provider adapter. Transient errors use bounded retries with backoff; permanent errors become `FAILED`. The maximum attempt count and retry delay are configurable constants, not user-editable settings in this iteration.

- A `SUCCEEDED` action is terminal and cannot be executed again through an automatic retry. A `CANCELED` action is terminal and cannot be executed later.

- The existing Post publication workflow remains responsible for the Post publication transition, version promotion, public visibility, publication timestamps, and clearing of the legacy scheduled state.

- A Post scheduled action targets the Post root rather than freezing an old content snapshot. At execution time the handler resolves the latest saved eligible version, so modifications made after scheduling are included.

- A scheduled Post may still use the existing editorial behavior in which edits update the active scheduled version rather than creating competing scheduled versions.

- The application must preserve the invariant that only one active Post publication action exists for a Post root. The invariant must be enforced by application logic and a database uniqueness strategy where supported.

- Existing Post scheduling mutations remain the public application interface during migration. They delegate to the new scheduling service and keep legacy fields synchronized until the migration is complete.

- A newsletter scheduled action targets an EmailSingleSend. The handler reads the latest EmailSingleSend subject, body, design, and audience configuration at execution time; the schedule does not freeze an email-content snapshot.

- The selected newsletter audience is evaluated dynamically. The action must use the latest audience configuration associated with the EmailSingleSend and the current contacts belonging to that audience when execution begins. The contact list is not copied into the scheduled action.

- Multiple audiences selected for a newsletter must be handled according to the EmailSingleSend configuration rather than silently using only the first audience. The implementation must define one provider operation per supported audience strategy and persist the resulting provider identifier(s) or failure.

- The email handler must validate that the EmailSingleSend still exists, has a valid subject and body, and has a usable audience/provider configuration. If validation fails, the action must not issue an external send.

- The existing direct “send now” behavior must remain available, but scheduled sends must use the common email delivery service and the same provider adapter abstraction.

- The email provider adapter must accept the scheduled action idempotency key or an equivalent provider-safe request identifier. The application must not treat `EmailSingleSend.externalId` alone as sufficient execution history because one EmailSingleSend may be sent more than once over time.

- The scheduler trigger remains one external recurring cron job with a five-minute frequency. It calls one protected scheduler endpoint; it does not create one external schedule per Post or newsletter.

- The scheduler endpoint is a thin trigger boundary. It authenticates the configured secret, invokes the scheduler runner, returns bounded execution results, and does not contain Post or email business rules.

- The scheduler processes due actions in a bounded batch. An action is due when its planned execution instant, or its next retry instant, is less than or equal to the current time.

- A failed action is independent from all other actions in the same batch. One handler failure must not roll back successful actions or prevent later actions from being attempted.

- Successful Post publication may request the existing deployment/build webhook, but email actions must never trigger a Post rebuild. Build triggering is a Post-publication concern rather than a generic scheduler concern.

- Calendar data is read through a dedicated range-based calendar query rather than through the paginated Post list query. The query uses a half-open interval `[from, to)` and supports action-type and status filters.

- The calendar query returns normalized events containing action identifier, action type, title, start time, optional end time, timezone, status, target identifier, planned time, actual execution time, overdue state, and an administration target URL where applicable.

- Future calendar events use the planned execution time. Historical events use the actual execution time when available and retain the planned time for comparison and detail display.

- The calendar includes completed, failed, and canceled scheduled actions for consultation. Failed and overdue actions are visually distinguishable from successful actions.

- Manually published Posts without a scheduler action can be included in the historical calendar view from their publication data. Scheduler-created Post publications must not appear twice through both the completed action and the generic published-Post history query.

- Calendar events are not limited by the current Post list page size. The server query is bounded by the visible date range and indexed by operational status and execution time.

- The browser timezone is used when entering and displaying scheduling values. The database stores the corresponding absolute instant and the IANA timezone identifier used by the browser.

- Date and time selection uses five-minute increments. Past execution times are rejected by the application service and by the user interface.

- No roles or permissions are added or changed. Existing authentication and access behavior remains outside this feature and is not expanded during implementation.

- The schema migration must be additive and backward-compatible with the existing Post scheduling implementation. Existing scheduled Posts must be backfilled into scheduled actions before the new worker becomes the only processing path.

- During migration, the legacy Post scheduler and the new scheduler must not process the same Post concurrently. The cutover must include an explicit compatibility strategy and a safe backfill for active scheduled Posts.

- The future social use case is represented only by extensible action typing. Social accounts, OAuth credentials, provider capabilities, per-network content, and social delivery are out of scope.

## Testing Decisions

- Tests verify observable behavior and persisted state transitions. They do not assert helper names, ORM query structure, component implementation details, or a specific locking SQL statement.

- The highest application seam is the scheduler runner that claims due `ScheduledAction` records and dispatches them to typed handlers. It should be tested with a controllable clock and fake channel handlers/provider adapters.

- The existing shared Post publication workflow remains the domain seam for verifying that a Post becomes public correctly. Scheduler tests should assert that the runner invokes this behavior once and preserves its existing public visibility guarantees.

- The email handler should be tested at the application/provider boundary with a fake provider. Tests must verify the content and audience data read at execution time, dynamic contact resolution, validation failures, idempotency behavior, and classification of retryable versus permanent failures.

- Existing integration-test conventions for Post scheduling and automatic publication should be extended rather than replaced. The test database and controllable time approach already used by the current Post scheduling tests are the prior art.

- Test creation of a scheduled Post action and a scheduled email action with the correct planned time, type, target, timezone, and initial status.

- Test that a scheduled Post uses the latest saved eligible version when it executes after an edit.

- Test that a scheduled newsletter uses the latest subject, body, and audience configuration available at execution time.

- Test that newsletter contacts are resolved at execution time and are not taken from a stale contact snapshot.

- Test that a newsletter with missing content, missing audience, or invalid provider configuration does not call the provider and becomes an appropriate failed action.

- Test scheduling, rescheduling, cancellation, and immediate Post publication through the existing application interfaces, including synchronization with legacy Post scheduling fields during migration.

- Test that one active scheduled Post publication exists per Post root and that concurrent scheduling attempts cannot create two active actions.

- Test that two concurrent workers cannot claim the same action and that an expired lease makes an abandoned action eligible again.

- Test that a successful action cannot be executed a second time and that retries reuse the same idempotency key.

- Test retryable provider failures, backoff eligibility, maximum attempts, permanent failures, and terminal `FAILED` state.

- Test that one failed action does not prevent other due actions in the same bounded batch from succeeding.

- Test that future actions remain untouched, due actions are processed, and overdue actions are picked up by a later invocation.

- Test that completed, failed, and canceled actions remain available to the calendar history query.

- Test the calendar query for date-range boundaries, action-type filters, status filters, more events than the old Post page size, overdue events, and separation of planned versus actual execution time.

- Test that a manually published Post can appear in historical calendar data without duplicating a scheduler-created Post publication.

- Test browser-local date conversion, five-minute validation, past-date rejection, and persistence of the absolute instant together with the browser timezone.

- Test the scheduler HTTP boundary for valid and invalid secret handling, bounded runner results, and infrastructure failures. The endpoint test must not duplicate handler-specific business rules.

- Test the migration/backfill for already scheduled Posts and verify that legacy and new processing paths cannot execute the same Post publication twice.

## Out of Scope

- Social publishing, social accounts, OAuth, token storage, provider capabilities, and per-network content.

- Roles, permissions, authorization changes, or a new permission matrix. These will be analyzed and implemented as a separate feature.

- Recurring actions, recurrence rules, repeating newsletters, or calendar automation rules.

- A separate `PublicationPlan` entity or multi-destination grouping model.

- Bulk scheduling from the calendar.

- Workspace, tenant, or multi-brand isolation.

- A site-wide timezone setting. The first implementation uses the browser timezone.

- Real-time execution stronger than the five-minute polling precision.

- A separate queue infrastructure such as BullMQ, QStash, Inngest, or another external delayed-message system.

- Per-recipient email delivery analytics, opens, clicks, bounces, unsubscribe tracking, or provider webhook reconciliation beyond the provider identifier and execution result needed for the scheduled action history.

- A full audit log of every editorial change to a Post or EmailSingleSend.

- Freezing email content or copying the full audience contact list at scheduling time.

- Introducing a `FAILED` value into `ContentStatus` for Posts or other editorial content.

## Further Notes

- The word `ScheduledAction` is a new application-domain concept: it represents an operational instruction to execute one action at a future time. It is intentionally separate from the editorial state of a Post and from the reusable content of an EmailSingleSend.

- The current Post implementation already provides a reusable publication workflow and automatic polling boundary. The new feature should extend those seams rather than create a second publication implementation.

- The current calendar is Post-specific and paginated. Replacing its data source with a range-based normalized event query is required for correctness even before adding newsletter events.

- The existing email single-send external identifier is not a complete history model. A reusable EmailSingleSend may have multiple scheduled or immediate sends over its lifetime, so execution history belongs to ScheduledAction records.

- The scheduler secret must remain deployment-only and must not be committed or exposed to browser code. The currently exposed environment secret should be rotated before implementation or deployment of the new scheduler.

- The implementation should preserve the distinction between the requested execution time and the actual execution time. A five-minute polling delay is expected behavior, not necessarily an error.

- If a target is deleted before execution, the scheduler must mark the action as failed or skipped with a durable reason and must not perform an external side effect.

- When a newsletter provider cannot guarantee idempotency, the adapter must expose that limitation explicitly and the implementation must prefer reconciliation or a terminal unknown state over blindly sending again after an ambiguous timeout.
