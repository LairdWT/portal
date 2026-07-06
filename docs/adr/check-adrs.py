"""Check an ADR directory: frontmatter completeness, INDEX coverage, status
validity, supersede symmetry, and repo-wide adr:<slug> reference resolution.

Usage: python check-adrs.py [--adr-dir docs/adr] [--repo-root .]
Stdlib only. Exit codes: 0 clean, 1 findings, 2 operational failure.
"""

from __future__ import annotations

import argparse
import pathlib
import re
import sys

REQUIRED_FIELDS: tuple[str, ...] = ("id", "slug", "title", "status", "proposedAt")
VALID_STATUSES: frozenset[str] = frozenset({"proposed", "accepted", "rejected", "superseded"})
SLUG_REF_PATTERN: re.Pattern[str] = re.compile(r"adr:([a-z0-9][a-z0-9-]*)")
FENCED_BLOCK_PATTERN: re.Pattern[str] = re.compile(r"^```.*?^```", re.MULTILINE | re.DOTALL)
CODE_SPAN_PATTERN: re.Pattern[str] = re.compile(r"`[^`\n]*`")
SCAN_SUFFIXES: frozenset[str] = frozenset({".md", ".py", ".rs", ".ts", ".tsx", ".cs", ".cpp", ".h", ".toml", ".json"})
SKIP_DIR_NAMES: frozenset[str] = frozenset({".git", "node_modules", "target", ".venv", "Temp", "temp"})


def parse_frontmatter(text: str) -> dict[str, str]:
    fields: dict[str, str] = {}
    if not text.startswith("---\n"):
        return fields
    end: int = text.find("\n---", 4)
    if end < 0:
        return fields
    for line in text[4:end].splitlines():
        if ":" not in line or line.startswith(" ") or line.startswith("#"):
            continue
        key, _, value = line.partition(":")
        fields[key.strip()] = value.strip()
    return fields


def main() -> int:
    parser: argparse.ArgumentParser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--adr-dir", type=str, default="docs/adr")
    parser.add_argument("--repo-root", type=str, default=".")
    args: argparse.Namespace = parser.parse_args()

    adr_dir: pathlib.Path = pathlib.Path(args.adr_dir)
    repo_root: pathlib.Path = pathlib.Path(args.repo_root)
    if not adr_dir.is_dir():
        print(
            "check_adrs: failed_input='adr_dir' value='{0}' skipped='check' severity=error".format(adr_dir),
            file=sys.stderr,
        )
        return 2

    findings: list[str] = []
    slugs: dict[str, str] = {}
    statuses: dict[str, str] = {}
    supersedes_map: dict[str, list[str]] = {}
    superseded_by: dict[str, str] = {}

    adr_files: list[pathlib.Path] = sorted(
        path for path in adr_dir.glob("*.md") if path.name != "INDEX.md"
    )
    for adr_path in adr_files:
        fields: dict[str, str] = parse_frontmatter(adr_path.read_text(encoding="utf-8"))
        if fields == {}:
            findings.append("{0}: missing or malformed frontmatter".format(adr_path.name))
            continue
        for required in REQUIRED_FIELDS:
            if required not in fields or fields[required] == "":
                findings.append("{0}: missing required field '{1}'".format(adr_path.name, required))
        slug_value: str = fields.get("slug", "").removeprefix("adr:")
        if slug_value == "":
            continue
        if slug_value in slugs:
            findings.append("{0}: duplicate slug '{1}' (also {2})".format(adr_path.name, slug_value, slugs[slug_value]))
        slugs[slug_value] = adr_path.name
        status_value: str = fields.get("status", "")
        statuses[slug_value] = status_value
        if status_value not in VALID_STATUSES:
            findings.append("{0}: invalid status '{1}'".format(adr_path.name, status_value))
        raw_supersedes: str = fields.get("supersedes", "[]").strip("[] ")
        supersedes_map[slug_value] = [
            item.strip().removeprefix("adr:") for item in raw_supersedes.split(",") if item.strip() != ""
        ]
        by_value: str = fields.get("supersededBy", "null").strip()
        if by_value not in ("null", ""):
            superseded_by[slug_value] = by_value.removeprefix("adr:")

    index_path: pathlib.Path = adr_dir / "INDEX.md"
    index_text: str = index_path.read_text(encoding="utf-8") if index_path.is_file() else ""
    if index_text == "":
        findings.append("INDEX.md: missing")
    # filename -> the "## ..." heading its entry sits under, so an accepted
    # ADR cannot rot in the Proposed section unnoticed.
    index_sections: dict[str, str] = {}
    current_heading: str = ""
    for line in index_text.splitlines():
        if line.startswith("## "):
            current_heading = line.rstrip()
            continue
        for filename in slugs.values():
            if "(" + filename + ")" in line and current_heading != "":
                index_sections[filename] = current_heading
    expected_headings: dict[str, str] = {
        "proposed": "## Proposed",
        "accepted": "## Accepted",
        "superseded": "## Superseded / Rejected",
        "rejected": "## Superseded / Rejected",
    }
    for slug_value, filename in slugs.items():
        occurrences: int = index_text.count("(" + filename + ")")
        if occurrences != 1:
            findings.append("INDEX.md: '{0}' listed {1} times (expected 1)".format(filename, occurrences))
            continue
        expected: str = expected_headings.get(statuses.get(slug_value, ""), "")
        if expected == "":
            continue  # invalid status already reported above
        actual: str = index_sections.get(filename, "")
        if actual != expected:
            findings.append(
                "INDEX.md: '{0}' (status {1}) listed under '{2}', expected '{3}'".format(
                    filename, statuses.get(slug_value, ""), actual, expected
                )
            )

    for slug_value, targets in supersedes_map.items():
        for target in targets:
            if target not in slugs:
                findings.append("adr:{0}: supersedes unknown adr:{1}".format(slug_value, target))
            elif superseded_by.get(target) != slug_value:
                findings.append("adr:{0}: supersedes adr:{1} but its supersededBy does not point back".format(slug_value, target))
    for slug_value, by_slug in superseded_by.items():
        if statuses.get(slug_value) != "superseded":
            findings.append("adr:{0}: has supersededBy but status is '{1}'".format(slug_value, statuses.get(slug_value)))
        if by_slug not in slugs:
            findings.append("adr:{0}: supersededBy unknown adr:{1}".format(slug_value, by_slug))

    for path in repo_root.rglob("*"):
        if not path.is_file() or path.suffix not in SCAN_SUFFIXES:
            continue
        if any(part in SKIP_DIR_NAMES for part in path.parts):
            continue
        if path.parent == adr_dir:
            continue
        try:
            text: str = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        if path.suffix == ".md":
            text = FENCED_BLOCK_PATTERN.sub("", text)
            text = CODE_SPAN_PATTERN.sub("", text)
        for match in SLUG_REF_PATTERN.finditer(text):
            if match.group(1) not in slugs:
                findings.append("{0}: dangling reference adr:{1}".format(path, match.group(1)))

    for finding in findings:
        print("FINDING: {0}".format(finding), file=sys.stderr)
    print("check_adrs: adrs={0} findings={1}".format(len(adr_files), len(findings)))
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main())
