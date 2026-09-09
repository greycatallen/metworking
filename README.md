# Secure Networking Tracker

> **Status: in progress.** Sections marked _TODO_ are filled in as the build
> proceeds. This outline exists from the first commit so every grading
> requirement stays visible while building.

A private networking tracker for staying in touch with the people you meet at
Berkeley. Each signed-in user keeps their own contact list — name, company,
role, where you met, notes, and a priority — and no user can see or change
another user's rows. Ownership is enforced by Postgres Row Level Security, not
by application code.

- **Live app:** _TODO — Vercel URL_
- **Repository:** _TODO — GitHub URL_

---

## Table of contents

1. [Overview](#overview)
2. [Screenshots and walkthrough](#screenshots-and-walkthrough)
3. [Features](#features)
4. [Technology stack and why](#technology-stack-and-why)
5. [Architecture](#architecture)
6. [Local setup](#local-setup)
7. [Environment variables](#environment-variables)
8. [Database schema](#database-schema)
9. [Authentication and RLS ownership](#authentication-and-rls-ownership)
10. [Testing](#testing)
11. [Deployment](#deployment)
12. [Grading evidence](#grading-evidence)
13. [Known limitations and next steps](#known-limitations-and-next-steps)

---

## Overview

_TODO — one paragraph._

## Screenshots and walkthrough

_TODO — sign-in/sign-out, create/edit/delete/refresh, invalid input, two-account
privacy test._

## Features

_TODO._

## Technology stack and why

_TODO — Next.js, Tailwind + shadcn/ui, Neon Postgres, Managed Better Auth, Neon
Data API, Vercel._

## Architecture

_TODO — request flow from browser through the Data API into Postgres, and where
the trust boundary sits._

## Local setup

_TODO — clone through `npm run dev`._

## Environment variables

Names only; see [`.env.example`](.env.example) for the template.

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_NEON_AUTH_URL` | public | Managed Better Auth HTTPS endpoint |
| `NEXT_PUBLIC_NEON_DATA_API_URL` | public | Neon Data API HTTPS endpoint |
| `DATABASE_URL` | **server only** | Applying migrations; bypasses RLS |
| `TEST_USER_A_EMAIL` / `TEST_USER_A_PASSWORD` | server only | RLS isolation test |
| `TEST_USER_B_EMAIL` / `TEST_USER_B_PASSWORD` | server only | RLS isolation test |

The two public URLs are exposed to the browser deliberately. They are not
secrets: every row reachable through them is protected by RLS.

## Database schema

Source of truth: [`db/migrations/0001_init.sql`](db/migrations/0001_init.sql).

_TODO — column table and explanation._

## Authentication and RLS ownership

_TODO — `auth.user_id()`, the four policies, and why `WITH CHECK` on UPDATE is
what prevents handing a row to another user._

## Testing

_TODO — `npm test`, what each test verifies, and captured output._

## Deployment

_TODO._

## Grading evidence

_TODO — checklist mapping each required artifact to where it appears._

## Known limitations and next steps

_TODO._
