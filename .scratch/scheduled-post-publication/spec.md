# Scheduled post publication

Status: ready-for-agent

## Problem Statement

Gli editor del blog possono oggi pubblicare un Post soltanto manualmente. Questo rende difficile preparare in anticipo contenuti da pubblicare in una data e a un orario prestabiliti, soprattutto quando l’editor non sarà disponibile al momento della pubblicazione.

Il problema riguarda sia un nuovo Post mai pubblicato sia una modifica a un Post già pubblico. Nel secondo caso, la versione pubblica corrente deve rimanere online fino all’esecuzione della pubblicazione programmata.

## Solution

Aggiungere la funzionalità di **Scheduled publication** per i Post `DRAFT` e `CHANGED`.

L’editor potrà scegliere data e ora future dal pannello di amministrazione. Il Post passerà allo stato `SCHEDULED` e sarà pubblicato automaticamente quando l’orario sarà raggiunto.

La schedulazione userà l’ultima versione salvata prima dell’esecuzione. Le modifiche successive alla schedulazione aggiorneranno la stessa versione schedulata e saranno quindi incluse nella pubblicazione automatica.

La pubblicazione automatica sarà attivata da un singolo cron job ricorrente su cron-job.org, eseguito ogni 5 minuti, che chiamerà un endpoint protetto ospitato su Vercel. L’endpoint cercherà tutti i Post dovuti e li processerà indipendentemente.

## User Stories

1. As an editor, I want to schedule a DRAFT Post for a future date and time, so that it becomes public without a manual action at that moment.

2. As an editor, I want to schedule a CHANGED version of a Post, so that the current public version remains online until the new version is ready to replace it.

3. As an editor, I want to select the publication date using my browser timezone, so that the time shown in the scheduling dialog matches my local context.

4. As an editor, I want the selected browser-local date and time to be persisted as an absolute instant, so that changing browser or timezone later does not change the intended publication moment.

5. As an editor, I want to select publication times in five-minute increments, so that I can choose practical publication times such as 10:00, 10:05, or 10:10.

6. As an editor, I want past dates and times to be rejected, so that I do not accidentally create an ambiguous scheduling request.

7. As an editor, I want the scheduling action to validate the same required Post fields as the existing Publish action, so that an incomplete Post cannot be scheduled.

8. As an editor, I want a scheduled Post to have a distinct `SCHEDULED` status, so that I can immediately distinguish it from a DRAFT, a changed Post, and a published Post.

9. As an editor, I want to see the scheduled publication date and time in the Post list, so that I can review upcoming publications without opening every Post.

10. As an editor, I want to filter the Post list by `SCHEDULED`, so that I can focus on upcoming publications.

11. As an editor, I want to edit the scheduled Post before publication, so that the latest saved content is published without having to cancel and recreate the schedule.

12. As an editor, I want changes to a scheduled Post to update the same scheduled version, so that editing does not create a chain of competing scheduled versions.

13. As an editor, I want to change the scheduled date and time, so that I can reschedule a Post when the editorial calendar changes.

14. As an editor, I want only one active schedule per Post/root, so that multiple automatic publications cannot compete for the same Post.

15. As an editor, I want to cancel a scheduled publication, so that the Post returns to its state before scheduling and is not published automatically.

16. As an editor, I want a never-published scheduled Post to return to `DRAFT` when I cancel its schedule, so that it remains an unpublished work in progress.

17. As an editor, I want a scheduled change to a previously published Post to return to `CHANGED` when I cancel its schedule, so that the current public version remains unchanged.

18. As an editor, I want to publish a scheduled Post immediately, so that I can release it before the planned time when necessary.

19. As an editor, I want immediate publication of a scheduled Post to cancel its pending scheduling work, so that the Post is not processed again at the original time.

20. As an editor, I want the currently published version to remain visible until the scheduled version is successfully published, so that visitors never see an incomplete future version prematurely.

21. As an editor, I want the scheduled version to replace the current public version atomically, so that visitors do not observe an intermediate publication state.

22. As an editor, I want multiple different Posts scheduled for the same time to be published independently, so that one failing Post does not block the others.

23. As an editor, I want a Post with an invalid or incomplete latest version to remain scheduled instead of being partially published, so that I can correct it and retry safely.

24. As an editor, I want a scheduled Post whose execution failed to remain identifiable as pending, so that I can notice it and take corrective action.

25. As an editor, I want an overdue scheduled Post to be retried during a later scheduler run, so that a temporary external or database failure does not permanently lose the publication.

26. As an editor, I want deleting a scheduled Post to prevent any later scheduler invocation from publishing it, so that deleted content cannot become public.

27. As an editor, I want normal manual publishing to continue working for DRAFT and CHANGED Posts, so that scheduling remains an additional publication mode rather than replacing the existing one.

28. As an administrator, I want the automatic publication endpoint to be protected by a secret, so that arbitrary internet callers cannot trigger publication processing.

29. As an administrator, I want the scheduler to process all due Posts in a bounded batch, so that a large number of scheduled Posts does not exceed the execution limits of a Vercel Function.

30. As an administrator, I want each Post publication to be idempotent, so that repeated scheduler invocations cannot publish the same version twice or corrupt version state.

31. As an administrator, I want scheduler failures to be recorded in server logs, so that operational problems can be diagnosed without exposing implementation details to visitors.

32. As an administrator, I want the scheduler to use one recurring external job instead of one external job per Post, so that the number of Posts and the publication horizon are not constrained by the scheduler provider.

33. As an administrator, I want to schedule Posts more than one month in advance, so that the editorial calendar is not limited to a short horizon.

34. As an administrator, I want more than ten Posts to be scheduled at the same time, so that the CMS does not impose an artificial capacity limit.

## Implementation Decisions

- Add `SCHEDULED` to the content status vocabulary used by the Post publication workflow. Existing Page, Category, Tag, Product, and other content workflows must not gain scheduling behavior as part of this feature merely because the shared enum contains the value.

- Add a nullable scheduled publication timestamp to Post. A non-null timestamp identifies the planned publication instant; after publication or cancellation it is cleared.

- Preserve the status that existed before scheduling so cancellation can restore `DRAFT` for a never-published Post and `CHANGED` for a scheduled change to a previously published Post.

- Scheduling is available only for the current editable version in `DRAFT` or `CHANGED`. A `PUBLISHED` version cannot be scheduled directly, and a Post may have at most one active scheduled version per root.

- The current published version remains public while a future `CHANGED` version is `SCHEDULED`. Public queries continue to expose only the published latest version until the scheduled version is successfully published.

- A scheduled version remains the editable version for that Post. Updates to its title, slug, content, metadata, SEO data, authors, categories, tags, or image update the same scheduled version rather than creating another competing version.

- The scheduled publication operation validates the same required fields used by the existing manual Publish action. The automatic workflow performs the validation again at execution time because the Post may have been edited after scheduling.

- The publication workflow is shared by manual publishing and automatic publishing. It is responsible for demoting the previous latest version, promoting the selected version to `PUBLISHED`, updating publication timestamps, and clearing the scheduled timestamp.

- On initial publication, `firstPublishedAt` retains its existing historical meaning. `publishedAt` records the actual publication time, not merely the originally requested scheduled time.

- “Publish now” on a `SCHEDULED` Post must perform a conflict-safe immediate publication and clear the pending scheduled state. A stale scheduler invocation must then be a no-op.

- The automatic scheduler selects all current scheduled versions whose planned timestamp is less than or equal to the current time. It does not freeze a Post ID/version snapshot at schedule time; this ensures that the latest saved eligible version is used.

- The scheduler processes Posts independently. A failure for one Post must not roll back successful publications of other Posts in the same run.

- Automatic publication is idempotent. Reprocessing a Post that is no longer `SCHEDULED`, has been deleted, or has already been published must not produce a second publication or an invalid version transition.

- A failed automatic publication does not introduce a `FAILED` content status in this iteration. The Post remains `SCHEDULED`; a scheduled timestamp in the past identifies it as requiring attention, while technical details are written to server logs.

- Add a dedicated protected application endpoint for scheduler polling. It accepts only the configured secret header and is not authenticated through an editor session.

- The endpoint scans due scheduled Posts and processes them in a bounded batch. A later invocation processes remaining or previously failed Posts. Authentication failures and infrastructure failures return an HTTP error; a completed scan can return a successful response with per-Post results even when an individual Post failed.

- Use cron-job.org Free as the external trigger. Configure one recurring job to send an HTTP POST to the application endpoint every five minutes. The job uses a custom secret header and does not represent an individual Post.

- Do not use Vercel Cron because the Vercel Hobby schedule precision is not sufficient for a five-minute polling requirement. Vercel hosts the endpoint and executes the short-lived function; cron-job.org provides the recurring trigger.

- The cron-job.org REST API daily limit applies to management API calls, not to the execution frequency of the configured recurring job. The application does not need to call that REST API at runtime.

- The cron-job.org Free execution capability is sufficient for this design because the required frequency is 12 executions per hour, below the documented maximum of 60 executions per hour. The single recurring job has no seven-day or ten-active-schedule limitation because individual Post schedules are stored in the application database.

- The scheduler secret is stored only in deployment environment configuration and in the cron-job.org request header. It must not be embedded in the URL, exposed to browser code, or committed to the repository.

- The administration UI uses the existing Publish action area and presents “Publish now” and “Schedule publication” actions. For a scheduled Post it presents rescheduling and cancellation actions.

- The scheduling dialog provides a browser-local date picker and a time selector in five-minute increments. The selected local value is converted to an absolute timestamp before persistence. The UI displays the browser timezone to make the interpretation explicit.

- The Post list displays a Scheduled badge, scheduled date/time, a Scheduled status filter, and actions appropriate to the current state. A scheduled Post whose timestamp is already in the past remains visibly actionable.

- The status filter, Post types, query results, and client data types are extended to represent `SCHEDULED` and its scheduled timestamp. Public Post queries continue to exclude scheduled content.

- The schema migration must preserve all existing Post statuses and timestamps. Existing Posts must remain behaviorally unchanged after the migration.

- The choice of an external polling scheduler over Vercel Cron and QStash Free is recorded as an architectural decision. QStash Free is excluded as the primary mechanism because its documented active-schedule and maximum-delay limits conflict with the requirement for more than ten Posts and publication dates beyond one month.

## Testing Decisions

- Tests must verify observable publication behavior and persisted state transitions, not component implementation details, database query syntax, or the identity of helper functions.

- Use the agreed single application-level seam: the shared Post publication workflow used by manual and automatic publication. Tests should use a controllable current time and a test database or equivalent database fixture.

- Test that a valid DRAFT Post can be scheduled for a future time and becomes `SCHEDULED` with the requested instant.

- Test that a valid CHANGED version can be scheduled while the previous PUBLISHED version remains publicly visible.

- Test that scheduling rejects past timestamps, invalid required fields, PUBLISHED versions, and a second active schedule for the same root.

- Test that editing a scheduled Post changes the same scheduled version and that the latest saved values are used by the automatic workflow.

- Test that cancellation restores the correct pre-scheduling state for both never-published Posts and changes to previously published Posts.

- Test that immediate publication of a scheduled Post clears its scheduled state and leaves a later scheduler run as a no-op.

- Test that a scheduler run publishes every due Post, leaves future Posts untouched, and does not expose scheduled content through public Post queries.

- Test that multiple due Posts are processed independently and that one invalid or failing Post does not prevent successful Posts from being published.

- Test idempotency by executing the automatic workflow more than once for the same due Post and asserting that only one effective publication occurs.

- Test that a deleted scheduled Post is ignored safely by a later scheduler invocation.

- Test that an automatic validation or publication failure leaves the Post `SCHEDULED` and eligible for a later retry.

- Test the scheduler endpoint at its external HTTP boundary for valid secret, invalid/missing secret, successful scan, and infrastructure error behavior. The endpoint test should assert the observable response and resulting Post state through the same publication seam.

- No similar automated test suite exists in the current repository. The feature should establish integration-test conventions for the Post publication workflow rather than adding isolated tests for React presentation components.

## Out of Scope

- Scheduling Page, Category, Tag, Product, or any content type other than Post.

- Recurring publications, publication calendars, bulk scheduling, or campaign-like publication rules.

- A site-wide configurable timezone. The first version uses the browser timezone; a future site setting may define a default timezone.

- Email, push, Slack, or other notifications for successful or failed publications.

- A separate `FAILED` content status or a full publication-attempt history UI.

- QStash, Vercel Cron, or another per-Post delayed-message system as the primary scheduler.

- Strict real-time publication guarantees or an SLA stronger than the expected few-minute polling precision.

- Automatic rescheduling after a Post is edited. Edits update the active scheduled version and do not alter the selected publication time.

- Authentication or authorization model changes beyond applying the same publication permissions to scheduling actions.

- A user-facing schedule history or audit log.

## Further Notes

- cron-job.org must be configured manually as part of deployment with one recurring five-minute POST job. Its management API is not required by the application.

- The cron endpoint should be configured with the production application URL and a long, randomly generated secret header. The secret must be rotated through deployment configuration if compromised.

- cron-job.org’s execution history and failure notifications can be used as operational visibility for the trigger. Application logs remain the source for per-Post publication failures.

- If cron-job.org temporarily misses an execution, due Posts remain stored as `SCHEDULED` with a past timestamp and are picked up by the next successful poll.

- Vercel Hobby is suitable for the short polling function and its expected call volume. The endpoint should still use a bounded batch so that unusually many due Posts are spread over multiple runs.

- The domain glossary defines **Scheduled publication** as a publication instruction that makes the latest saved eligible version of a Post public at a future date and time chosen by the editor.
