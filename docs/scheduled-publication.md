# Scheduled publication

This document describes the automatic scheduled-publication setup for blog Posts and newsletters.

## Overview

Editors can schedule a `DRAFT` or `CHANGED` Post for future publication. The Post moves to the `SCHEDULED` status and is published automatically when the scheduled time is reached. Newsletter single sends can be scheduled the same way.

Automatic publication is triggered by a **single external recurring cron job** hosted on [cron-job.org](https://cron-job.org). The job calls a protected application endpoint deployed on Vercel every five minutes. The endpoint triggers the **common scheduler worker**, which processes every due scheduled action (scheduled Post publications and newsletter sends) in a bounded batch. The cron is only the trigger; it does not inspect or mutate content itself.

## Endpoint

- **URL**: `POST <NEXT_PUBLIC_APP_URL>/api/scheduler/run/`
- **Required header**: `x-scheduled-publication-secret`
- **Response**: JSON with the number of processed, succeeded, failed, and skipped actions, plus per-action details.

The endpoint compares the value of the `x-scheduled-publication-secret` header with the `SCHEDULED_PUBLICATION_SECRET` environment variable. Requests without the header, or with a mismatched value, receive `401 Unauthorized`. Infrastructure failures return `500 Internal Server Error`. A successful run returns `200 OK` even when individual actions fail.

After each run the endpoint triggers a Vercel production build **only when at least one scheduled Post was actually published**. Newsletter-only runs never trigger a build.

## cron-job.org configuration

1. Create a free account on [cron-job.org](https://cron-job.org).
2. Create a new cron job with the following settings:
   - **Title**: `Publish scheduled content`
   - **URL**: your production `/api/scheduler/run/` URL
   - **Method**: `POST`
   - **Headers**: add `x-scheduled-publication-secret` with the value of `SCHEDULED_PUBLICATION_SECRET`
   - **Schedule**: every `5` minutes
3. Generate a long, random value for `SCHEDULED_PUBLICATION_SECRET` in your deployment environment (for example with `openssl rand -hex 32`) and copy it into the cron-job.org header.
4. Do **not** commit the secret to the repository.

## Why cron-job.org and not Vercel Cron

Vercel Cron is intentionally **not** used for this feature. The Hobby plan schedule precision does not satisfy the five-minute polling requirement. Vercel only hosts the endpoint and executes the short-lived function; cron-job.org provides the recurring trigger.

## One job, many items

The cron job does **not** create one schedule per item. A single recurring job polls the application every five minutes. The application stores all scheduled publication instructions as `ScheduledAction` rows in the database. The common worker processes due actions in a bounded batch, claiming each one with a lease so concurrent invocations cannot double-publish.

## Batch limits

Each invocation processes at most `SCHEDULER_BATCH_SIZE` (currently `50`) due actions. If more actions are due, they are picked up by subsequent invocations. This prevents a large queue from exceeding Vercel Function execution limits.

## Failure handling

- A failure for one action does not block other actions in the same run.
- **Transient** errors (provider outages, temporary infrastructure issues) leave the action `RETRY_WAIT` with exponential backoff; it is retried on a later invocation.
- **Permanent** errors (validation failures, invalid state) mark the action `FAILED`. The affected Post stays `SCHEDULED` and is shown in the admin list as overdue so editors can review and reschedule or unschedule it. Published posts are never reverted.
- Technical error details are logged server-side (`lastError`). No `FAILED` content status is introduced.

## Security

- The secret is stored only in deployment environment variables and in the cron-job.org request header.
- It is not embedded in the URL, exposed to browser code, or committed to the repository.
- Rotate the secret through deployment configuration if it is ever compromised.

## Cutover from the legacy scheduler

Older releases used a legacy scheduler driven by the Post's `scheduledAt` field, plus an email-specific scheduled-job endpoint. Both have been removed: the common worker is now the **only** runtime processing path.

Operators who upgraded from a release that still populated legacy `SCHEDULED` Posts should run the one-time backfill and verification before the legacy Post fields are eventually dropped:

1. `runSchedulerCutoverBackfill()` — materializes every legacy scheduled Post as an active `ScheduledAction`. It is idempotent and safe to run repeatedly; it loops until the backlog is exhausted.
2. `verifySchedulerCutover()` — read-only report that flags legacy `SCHEDULED` Posts without an active action, active actions whose latest root version is not `SCHEDULED`, and duplicate active actions for one root. It also reports the preserved terminal (succeeded / failed / canceled) history.

The legacy Post fields (`scheduledAt`, `preSchedulingStatus`, `SCHEDULED` status) remain synchronized with the operational `ScheduledAction` purely as a compatibility layer for the editorial UI, and will be removed once the cutover report is clean.