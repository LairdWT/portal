# Supply-Chain Triage: Socket.dev Dependency Alerts

Package: @laird-wt/portal
Version at triage: 0.12.0
Alerts filed against: published 0.11.0 (Socket dependency-tab alerts)
Triage date: 2026-06-27
Status: supersedes the prior published 0.11.0 alert state. Net finding: none
of the six Socket alerts is a Portal vulnerability.

This document is the authoritative, version-controlled record of why the six
Socket.dev dependency-tab alerts are accepted. It is referenced by the
repo-root `socket.yml`. The full as-run command transcripts live in the
working report under the standards-audit temp folder (see section 8).

---

## 1. Scope and posture

- Runtime `dependencies` in package.json: `{}` (empty). Portal ships no
  runtime dependency edges.
- `files`: `["dist"]`. ONLY the `dist/` directory is published to npm.
  Nothing at the repo root, and nothing under `src/`, ships in the tarball.
- Peers: `react`, `react-dom`, and `animejs` are REQUIRED peers. `three`,
  `@react-three/fiber`, and `@react-three/drei` are OPTIONAL peers
  (`peerDependenciesMeta.optional = true`).
- `pnpm audit`: "No known vulnerabilities found" (0 known CVEs).

Every flagged file is either (a) not imported by `src/`, (b) not bundled
into any `dist/` artifact, and (c) reachable by a consumer only through an
OPTIONAL peer (`three` / `@react-three/drei`) that the consumer would install
directly anyway. The published `dist/r3f.js` externalizes the React-Three
stack (`three`, `@react-three/fiber`, `@react-three/drei`) via bare `import`
statements rather than bundling it.

---

## 2. How to reproduce this triage

Run the verification checklist in section 7 from the repo root. Each command
re-proves a specific claim in the disposition table. Any deviation from the
stated expected result is a blocker and must be investigated before the
triage is considered current.

---

## 3. Per-alert disposition table

Legend - "Shipped to consumer?": does the flagged code reach an npm consumer
of @laird-wt/portal via the published tarball (`files: ["dist"]`) or via a
REQUIRED dependency? Runtime `dependencies` is `{}`; `react` / `react-dom` /
`animejs` are REQUIRED peers; `three` / `@react-three/fiber` /
`@react-three/drei` are OPTIONAL peers.

| #   | Alert (class)  | Package@version                 | Provenance (pnpm why)                                                                                                                                                 | Shipped to consumer?                                | Disposition      | Justification                                                                                                                                                                                         |
| --- | -------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | obfuscatedFile | three@0.184.0 (alert: 0.185)    | OPTIONAL peer (>=0.160); dev 0.184.0. File: examples/jsm/loaders/ColladaLoader.js                                                                                     | NO - opt-in extra, not imported, not in dist        | ACCEPT           | False positive. Socket's own note calls it a standard, well-structured loader, low-risk. Portal never imports examples/jsm.                                                                           |
| 2   | gptSecurity    | three@0.184.0 (alert: 0.185)    | OPTIONAL peer (>=0.160); dev 0.184.0. File: examples/jsm/inspector/extensions/tsl-graph/TSLGraphLoader.js                                                             | NO - opt-in extra, not imported, not in dist        | ACCEPT-WITH-NOTE | Real UPSTREAM injection surface (new Function(json.code)) in a three EXAMPLE; not Portal-fixable; Portal never imports/ships it. Consumer guidance: do not load untrusted TSL graphs (see section 6). |
| 3   | networkAccess  | @mediapipe/tasks-vision@0.10.17 | dev + optional-peer transitive: <- @react-three/drei@10.7.7 (dev) AND <- @react-three/drei@9.122.0 <- r3f-perf (dev). File: vision_bundle.cjs/.mjs (globalThis.fetch) | NO - only if consumer installs drei (optional peer) | ACCEPT           | Expected model-asset fetch in a Google vision/WASM library; reaches a consumer only via the optional drei peer, identical to installing drei directly.                                                |
| 4   | usesEval       | @mediapipe/tasks-vision@0.10.17 | same chain as #3. File: vision_bundle.cjs/.mjs (execScript)                                                                                                           | NO - only if consumer installs drei (optional peer) | ACCEPT           | execScript in a compiled bundle; optional-peer transitive via drei; expected capability of the compiled WASM glue.                                                                                    |
| 5   | shellAccess    | cross-spawn@7.0.6               | DEV-ONLY: <- cross-env <- @react-three/drei (dev) AND <- eslint / typescript-eslint (dev). File: index.js (child_process)                                             | NO - dev tooling only                               | ACCEPT           | Canonical cross-platform dev spawner; dev-only; 7.0.6 is already the latest (CVE-2024-21538 ReDoS-patched) - nothing to update.                                                                       |
| 6   | trivialPackage | is-promise@2.2.2                | DEV/transitive: <- promise-worker-transferable <- @monogrid/gainmap-js <- @react-three/drei (dev) and r3f-perf (dev). File: index.js (8 LOC)                          | NO - dev/transitive only                            | ACCEPT           | Benign, well-known 8-line package; trivialPackage is a hygiene signal, NOT a vulnerability; a pnpm override to 4.0.0 would break gainmap's is-promise@2.x API expectation.                            |

---

## 4. socket.yml policy rationale

The repo-root `socket.yml` intentionally does NOT disable any alert class:

- Socket's `issueRules` map is DEPRECATED and operates GLOBALLY at the
  repository level only. It cannot be scoped to a specific package, path, or
  dependency type.
- Disabling e.g. `usesEval` or `shellAccess` in `socket.yml` would therefore
  also suppress that same alert class on a FUTURE PRODUCTION dependency,
  which is unsafe.
- The schema has no safe mechanism to encode "accept usesEval ONLY for
  @mediapipe/tasks-vision" or "accept shellAccess ONLY for dev deps".
- Per-instance acceptance for the six alerts above is handled OUTSIDE
  `socket.yml`: it is acknowledged per-instance on the Socket dashboard for
  the specific alert instance, and documented here.

Consequently `socket.yml` is kept minimal: metadata, posture, and a pointer
to this document. All alert classes stay ENABLED so the same alert on any
future production dependency is still surfaced.

---

## 5. Consumer guidance: optional peers

`three` and `@react-three/drei` (and `@react-three/fiber`) are OPTIONAL
peer dependencies of @laird-wt/portal. Installing them is the consumer's
choice and carries those packages' own upstream surfaces. Portal's published
`dist/` does not bundle them; the R3F entry (`dist/r3f.js`) imports them as
externals only when the consumer opts into the R3F feature surface.

If a consumer does not install the React-Three stack, none of alerts 1-4 and
none of the drei-transitive paths for alerts 5-6 are present in the
consumer's tree at all.

---

## 6. Specific note: gptSecurity / TSLGraphLoader (alert #2)

The gptSecurity alert flags
`examples/jsm/inspector/extensions/tsl-graph/TSLGraphLoader.js` in `three`.
That file uses `new Function(json.code)` where the executed source is derived
from JSON that may originate from a URL or browser localStorage. This is a
genuine upstream injection surface, but:

- It lives in `three`'s `examples/jsm` (opt-in extras), NOT in core `three`.
- Portal does not import it and does not ship it in `dist/`.
- It is not Portal-fixable; it is upstream three example code.

Consumer guidance: do NOT load untrusted TSL material graphs through the
three TSL-graph loader. Treat any TSL graph JSON as executable code and
apply the same trust controls you would to loading a script.

---

## 7. Verification checklist (run from repo root)

A. Non-exposure in source (expect: no matches):
rg -n "ColladaLoader|TSLGraphLoader|@mediapipe/tasks-vision|three/examples/jsm|is-promise|cross-spawn" src/

B. Non-exposure in the published bundle (expect: no files listed):
rg -l "mediapipe|ColladaLoader|is-promise|cross-spawn|TSLGraph" dist/

C. Runtime dependency surface is empty (expect: {} then ["dist"]):
node -e "const p=require('./package.json'); console.log(JSON.stringify(p.dependencies||{}))"
node -e "const p=require('./package.json'); console.log(JSON.stringify(p.files))"

D. Provenance is dev/optional-peer only (expect: every leaf terminates at a
devDependencies or optional-peer transitive; no runtime dependencies edge):
pnpm why cross-spawn
pnpm why is-promise
pnpm why @mediapipe/tasks-vision
pnpm why three

E. No known CVEs (expect: "No known vulnerabilities found"):
pnpm audit

F. r3f-perf is dev-overlay only (expect: only src/r3f/CanvasDevtools.tsx,
which documents that it is stripped from the published build):
rg -n "r3f-perf" src/

G. socket.yml does not disable any alert class (expect: no issueRules KEY)
and is valid YAML. The load-bearing requirement is that no issueRules
CONFIG KEY exists; the explanatory comment in socket.yml mentions the word
"issueRules" on purpose, so a raw text match would give a false failure.
Strip comment lines first, then look for an actual key (expect:
"no issueRules config key: OK", exit 0):
node -e "const t=require('fs').readFileSync('socket.yml','utf8'); const code=t.split(/\r?\n/).filter(l=>!/^\s*#/.test(l)).join('\n'); if(/^\s*issueRules\s\*:/m.test(code)){console.error('FAIL: issueRules config key present');process.exit(1)} console.log('no issueRules config key: OK')"

---

## 8. Review / refresh trigger

Re-run section 7 on any dependency bump or any new Socket alert. Update the
disposition table, and re-acknowledge the accepted instances in the Socket
dashboard. The full as-run command transcripts for the 2026-06-27 triage are
archived in the working report:

    portal-socket-remediation-report.md
    (under the standards-audit working folder; not committed to this repo)
