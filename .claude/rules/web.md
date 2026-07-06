---
paths:
    - 'src/**/*.ts'
    - 'src/**/*.tsx'
    - 'src/**/*.css'
    - 'e2e/**/*.ts'
---

Before writing code here, read CODE.md: it pins the library's web
conventions (plugins/web/CONVENTIONS.md in agent-enhanced-project) and
carries the binding portal-specific rules (const-object enums,
--portal-\* theming, input/render decoupling, a11y floors) that override
the bundle. Every lint suppression carries a reason and a tracking ref.
