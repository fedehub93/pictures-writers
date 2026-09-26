# Automations runtime

This document describes how the Automations engine is executed at runtime, and how to run it in development and production.

## Overview

An Automation is authored on the canvas, published as a frozen snapshot, and executed as durable **Runs** and per-node **Steps** stored in the database. Triggers (manual, cron, webhook, internal events) only **enqueue** a Run; a single worker, the **pump**, actually executes the Steps.

The pump:

1. evaluates cron triggers and enqueues any that are due (published Automations only), then
2. claims and executes due Steps until nothing is due, honouring leases, retries, waits and the execution guard.

Because `runDueAutomations` snapshots the due set before executing, the pump calls it repeatedly within one invocation so a linear chain is not limited to one node per tick. A `Wait` parks its Step with a `resumeAt`; the Run stays `RUNNING` and "sleeps as rows" until the pump sees it again.

## Endpoint

- **URL**: `POST <NEXT_PUBLIC_APP_URL>/api/automations/run/`
- **Required header**: `x-scheduled-publication-secret` (same secret as the scheduler endpoint)
- **Response**: JSON with `batches`, `processed`, `succeeded`, `failed`, `skipped`, and `cron.fired`.

Requests without the header, or with a mismatched value, receive `401 Unauthorized`. A failure evaluating cron triggers is logged (`[AUTOMATIONS_CRON]`) but does not stop already-enqueued Steps from draining. Infrastructure failures return `500 Internal Server Error`.

## Production: cron-job.org

In addition to the scheduler job (`/api/scheduler/run/`), configure a second cron-job.org job:

1. Create a new cron job with:
   - **Title**: `Run automations`
   - **URL**: your production `/api/automations/run/` URL
   - **Method**: `POST`
   - **Headers**: `x-scheduled-publication-secret` with the value of `SCHEDULED_PUBLICATION_SECRET`
   - **Schedule**: every `1`–`5` minutes
2. Reuse the existing `SCHEDULED_PUBLICATION_SECRET`; do not commit it.

Without this job, cron- and webhook-triggered Runs are enqueued but never executed.

## Development

There is no external cron in development, so `src/instrumentation.ts` starts a **development-only pump** when the server boots. It evaluates cron triggers and drains due Steps on an interval (default `15s`).

- Disable it with `AUTOMATIONS_DEV_PUMP=off`.
- Change the interval with `AUTOMATIONS_DEV_PUMP_INTERVAL_MS` (milliseconds).

This makes manual "Run now", cron and webhook flows execute locally without a separate process.

## "Run now"

The admin "Run now" action enqueues a manual Run and then triggers one immediate drain, so a test flow executes without waiting for the next tick. A flow that reaches a `Wait` stops there and stays `RUNNING` (expected); subsequent pumps resume it when its `resumeAt` is due.

Calling the pump from more than one place is safe: Steps are claimed with a lease and email sends are idempotent per `(runId, stepId)`, so concurrent pumps never double-execute a Step.
