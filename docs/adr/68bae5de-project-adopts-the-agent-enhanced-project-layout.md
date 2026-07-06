---
id: 68bae5de-bd0d-40c1-a672-d454fe34708f
slug: adr:project-adopts-the-agent-enhanced-project-layout
title: Project adopts the agent-enhanced-project layout
status: accepted
supersedes: []
supersededBy: null
deciders: ['project owner']
proposedAt: 2026-07-06
decidedAt: 2026-07-06
tags: []
---

## Context

Portal had a strong 4.3KB CodingStandards.md but no agent root, no
decision log, and no conventions bridge: every agent session rediscovered
the pnpm scripts, the input/render architecture split, and the read-only
exemplar rule from scratch, and decisions lived only in chat history.
The agent-enhanced-project library provides a proven layout: lean
pointer-first CLAUDE.md, CODE.md standards manifest, uuid-named ADRs
under docs/adr/, and path-scoped .claude/rules/.

## Decision

Portal adopts the AEP layout: CLAUDE.md (lean, pointer-first), CODE.md
(standards manifest pinning the library's web conventions by reference),
docs/adr/ with uuid8-named ADRs plus the portable new-adr.py /
check-adrs.py assets, and .claude/rules/web.md loading conventions on
source-file touch. CI gains an adr-gate workflow running check-adrs.py;
the existing verify.yml remains the code gate.

## Consequences

- Agents start with repo-correct context (~4KB root) instead of none.
- Decisions are durable and checkable; dangling adr: references fail CI.
- The web conventions track the library by version pin
  (`pins --check .` reports drift).

## Alternatives

- Status quo (standards file only): no decision log, no session context,
  repeated rediscovery.
- Vendored conventions: unnecessary - this machine and CI consumers are
  git-native; the reference pin is lighter.
