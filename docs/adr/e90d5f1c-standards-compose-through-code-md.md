---
id: e90d5f1c-8edb-400e-9e41-5691b4b35475
slug: adr:standards-compose-through-code-md
title: Standards compose through CODE.md
status: accepted
supersedes: []
supersededBy: null
deciders: ['project owner']
proposedAt: 2026-07-06
decidedAt: 2026-07-06
tags: []
---

## Context

CodingStandards.md mixed two kinds of content: language-generic web/React
rules that the agent-enhanced-project library maintains as a versioned
bundle, and portal-specific rules (E-prefixed const-object enums,
--portal-\* theming tokens, WCAG target-size exception, input/render
decoupling, read-only signal-runner exemplars).

## Decision

CODE.md at the repo root is the standards manifest: it pins
`web @ plugins/web/CONVENTIONS.md` by reference and carries the full
portal-specific sections (moved verbatim from CodingStandards.md) as
project standards that override the bundle where they intersect.
CodingStandards.md remains as a pointer stub so existing references
resolve.

## Consequences

- One entry point (CODE.md) with an explicit precedence chain.
- Generic rules improve by bumping the pin after reviewing the bundle
  diff; portal rules stay authoritative locally.
- The stub costs one small file until references migrate.

## Alternatives

- Keep the monolith: no versioned relationship to the shared library.
- Split into many files: overkill for 4.3KB of project rules.
