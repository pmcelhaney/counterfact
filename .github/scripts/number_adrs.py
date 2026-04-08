#!/usr/bin/env python3
"""Assign sequential numbers to ADR files that use the placeholder 'xxx' prefix.

Scans docs/adr/ for files matching the pattern xxx-*.md, determines the next
available sequential number based on already-numbered files in the same
directory, renames each placeholder file, and prints a summary.

Exit codes:
  0 – all placeholder files renamed successfully (or none found)
  1 – one or more files could not be renamed
"""

import glob
import os
import re
import sys


ADR_DIR = "docs/adr"
PLACEHOLDER_PATTERN = "xxx-*.md"
NUMBERED_PATTERN = re.compile(r"^(\d+)-")


def next_adr_number(adr_dir: str) -> int:
    """Return the next available sequential ADR number.

    Scans *adr_dir* for files whose names begin with one or more digits
    followed by a hyphen (e.g. ``001-some-decision.md``) and returns the
    highest such number plus one.  Returns 1 if no numbered files exist yet.
    """
    highest = 0
    for filepath in glob.glob(os.path.join(adr_dir, "*.md")):
        filename = os.path.basename(filepath)
        match = NUMBERED_PATTERN.match(filename)
        if match:
            highest = max(highest, int(match.group(1)))
    return highest + 1


def main() -> None:
    placeholder_glob = os.path.join(ADR_DIR, PLACEHOLDER_PATTERN)
    placeholders = sorted(glob.glob(placeholder_glob))

    if not placeholders:
        print("No ADR placeholder files found — nothing to do.")
        return

    failed = False

    for filepath in placeholders:
        filename = os.path.basename(filepath)
        # Strip the leading "xxx-" prefix to get the rest of the name.
        suffix = filename[len("xxx-"):]

        number = next_adr_number(ADR_DIR)
        new_filename = f"{number:03d}-{suffix}"
        new_filepath = os.path.join(ADR_DIR, new_filename)

        if os.path.exists(new_filepath):
            print(
                f"Error: target path {new_filepath!r} already exists — skipping {filepath!r}.",
                file=sys.stderr,
            )
            failed = True
            continue

        os.rename(filepath, new_filepath)
        print(f"Renamed: {filepath!r}  →  {new_filepath!r}")

    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
