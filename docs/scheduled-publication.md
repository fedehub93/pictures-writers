# Scheduled post publication

This document describes the automatic scheduled-publication setup for blog Posts.

## Overview

Editors can schedule a `DRAFT` or `CHANGED` Post for future publication. The Post moves to the `SCHEDULED` status and is published automatically when the scheduled time is reached.

Automatic publication is triggered by a **single external recurring cron job** hosted on [cron-job.org](https://cron-job.org). The job calls a protected application endpoint deployed on Vercel every five minutes. The endpoint scans for due scheduled Posts and publishes each one independently.

## Endpoint

- **URL**: `POST <NEXT_PUBLIC_APP_URL>/api/admin/posts/publish-scheduled/`
- **Required header**: `x-scheduled-publication-secret`
- **Response**: JSON with the number of processed, succeeded, failed, and skipped Posts.

The endpoint compares the value of the `x-scheduled-publication-secret` header with the `SCHEDULED_PUBLICATION_SECRET` environment variable. Requests without the header, or with a mismatched value, receive `401 Unauthorized`. Infrastructure failures return `500 Internal Server Error`. A successful scan returns `200 OK` even when individual Posts fail to publish.

## cron-job.org configuration

1. Create a free account on [cron-job.org](https://cron-job.org).
2. Create a new cron job with the following settings:
   - **Title**: `Publish scheduled posts`
   - **URL**: your production `/api/admin/posts/publish-scheduled/` URL
   - **Method**: `POST`
   - **Headers**: add `x-scheduled-publication-secret` with the value of `SCHEDULED_PUBLICATION_SECRET`
   - **Schedule**: every `5` minutes
3. Generate a long, random value for `SCHEDULED_PUBLICATION_SECRET` in your deployment environment (for example with `openssl rand -hex 32`) and copy it into the cron-job.org header.
4. Do **not** commit the secret to the repository.

## Why cron-job.org and not Vercel Cron

Vercel Cron is intentionally **not** used for this feature. The Hobby plan schedule precision does not satisfy the five-minute polling requirement. Vercel only hosts the endpoint and executes the short-lived function; cron-job.org provides the recurring trigger.

## One job, many Posts

The cron job does **not** create one schedule per Post. A single recurring job polls the application every five minutes. The application stores all scheduled publication instructions in the database and processes the due ones in a bounded batch.

## Batch limits

Each invocation processes at most `SCHEDULED_PUBLICATION_BATCH` (currently `50`) due Posts. If more Posts are due, they are picked up by subsequent invocations. This prevents a large queue from exceeding Vercel Function execution limits.

## Failure handling

- A failure for one Post does not block other Posts in the same run.
- A Post that fails validation or publication remains `SCHEDULED` and is eligible for the next run.
- A `SCHEDULED` Post with a timestamp in the past is shown in the admin list with an overdue warning so editors can review it.
- Technical error details are logged server-side. No `FAILED` content status is introduced.

## Security

- The secret is stored only in deployment environment variables and in the cron-job.org request header.
- It is not embedded in the URL, exposed to browser code, or committed to the repository.
- Rotate the secret through deployment configuration if it is ever compromised.
