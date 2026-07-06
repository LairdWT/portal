"""Mint a new ADR: uuid8-<slug>.md with filled frontmatter plus an INDEX.md entry.

Usage: python new-adr.py "Title Of The Decision" [--adr-dir docs/adr]
Stdlib only. Exit codes: 0 minted, 2 operational failure.
"""

from __future__ import annotations

import argparse
import datetime
import pathlib
import re
import sys
import uuid

INDEX_NAME: str = "INDEX.md"
PROPOSED_HEADING: str = "## Proposed"

TEMPLATE: str = """---
id: {full_id}
slug: adr:{slug}
title: {title}
status: proposed
supersedes: []
supersededBy: null
deciders: []
proposedAt: {today}
decidedAt: null
tags: []
---

## Context

## Decision

## Consequences

## Alternatives

"""


def to_kebab(title: str) -> str:
    lowered: str = title.strip().lower()
    kebab: str = re.sub(r"[^a-z0-9]+", "-", lowered).strip("-")
    return kebab


def main() -> int:
    parser: argparse.ArgumentParser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("title", type=str, help="decision title")
    parser.add_argument("--adr-dir", type=str, default="docs/adr", help="ADR directory")
    args: argparse.Namespace = parser.parse_args()

    adr_dir: pathlib.Path = pathlib.Path(args.adr_dir)
    if not adr_dir.is_dir():
        print(
            "new_adr: failed_input='adr_dir' value='{0}' skipped='mint' severity=error".format(adr_dir),
            file=sys.stderr,
        )
        return 2

    slug: str = to_kebab(args.title)
    if slug == "":
        print(
            "new_adr: failed_input='title' value='{0}' skipped='mint' severity=error".format(args.title),
            file=sys.stderr,
        )
        return 2

    full_id: str = str(uuid.uuid4())
    uuid8: str = full_id.replace("-", "")[:8]
    filename: str = "{0}-{1}.md".format(uuid8, slug)
    adr_path: pathlib.Path = adr_dir / filename
    if adr_path.exists():
        print(
            "new_adr: failed_input='adr_path' value='{0}' skipped='mint (exists)' severity=error".format(adr_path),
            file=sys.stderr,
        )
        return 2

    today: str = datetime.date.today().isoformat()
    body: str = TEMPLATE.format(full_id=full_id, slug=slug, title=args.title.strip(), today=today)
    adr_path.write_text(body, encoding="utf-8", newline="\n")

    index_path: pathlib.Path = adr_dir / INDEX_NAME
    entry: str = "- [adr:{0}]({1}) - {2}\n".format(slug, filename, args.title.strip())
    if not index_path.is_file():
        index_text: str = "# ADR Index\n\n## Accepted\n\n{0}{1}\n\n## Superseded / Rejected\n".format(
            PROPOSED_HEADING + "\n", entry
        )
        index_path.write_text(index_text, encoding="utf-8", newline="\n")
        print(str(adr_path))
        return 0

    index_text = index_path.read_text(encoding="utf-8")
    if PROPOSED_HEADING not in index_text:
        index_text = index_text.rstrip("\n") + "\n\n" + PROPOSED_HEADING + "\n"
    index_text = index_text.replace(PROPOSED_HEADING, PROPOSED_HEADING + "\n" + entry.rstrip("\n"), 1)
    index_path.write_text(index_text, encoding="utf-8", newline="\n")
    print(str(adr_path))
    return 0


if __name__ == "__main__":
    sys.exit(main())
