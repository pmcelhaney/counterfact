#!/usr/bin/env python3
"""Process issue proposal files and create GitHub issues.

Reads every *.md file under .github/issue-proposals/, parses the YAML front
matter, validates required fields, creates a GitHub issue via the gh CLI, links
it as a sub-issue of the resolved parent, then deletes the proposal file.

Exit codes:
  0 – all proposals processed successfully (or no proposals found)
  1 – one or more proposals failed validation or issue creation
"""

import glob
import os
import re
import subprocess
import sys

import yaml


def parse_proposal(filepath):
    """Return (metadata dict, body str) for a Markdown proposal file.

    Raises ValueError if the file is malformed.
    """
    with open(filepath, encoding="utf-8") as fh:
        content = fh.read()

    if not content.startswith("---"):
        raise ValueError(f"No YAML front matter found in {filepath!r}")

    parts = content.split("---", 2)
    if len(parts) < 3:
        raise ValueError(f"Front matter is not properly closed in {filepath!r}")

    raw_yaml = parts[1]
    body = parts[2].strip()

    try:
        metadata = yaml.safe_load(raw_yaml)
    except yaml.YAMLError as exc:
        raise ValueError(f"Invalid YAML in front matter of {filepath!r}: {exc}") from exc

    if not isinstance(metadata, dict):
        raise ValueError(f"Front matter must be a YAML mapping in {filepath!r}")

    return metadata, body


def _gh(*args, check=True):
    """Run a gh CLI command and return its stdout, raising on failure."""
    result = subprocess.run(
        ["gh", *args],
        capture_output=True,
        text=True,
    )
    if check and result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip())
    return result


def get_parent_issue_from_context(repo, sha):
    """Try to derive a parent issue number from the pull request context.

    Returns an int or None.
    """
    # Find the PR associated with this commit.
    result = _gh(
        "api",
        f"repos/{repo}/commits/{sha}/pulls",
        "--jq",
        ".[0].number",
        check=False,
    )
    if result.returncode != 0 or not result.stdout.strip():
        return None

    pr_number = result.stdout.strip()

    # Get the head branch of that PR.
    result = _gh(
        "api",
        f"repos/{repo}/pulls/{pr_number}",
        "--jq",
        ".head.ref",
        check=False,
    )
    if result.returncode != 0 or not result.stdout.strip():
        return None

    branch = result.stdout.strip()

    # Extract an issue number from the branch name.
    # Try common naming conventions in order of specificity before falling back
    # to any bare number, so that version numbers in prefixes (e.g. "v2-") are
    # not mistakenly treated as issue numbers.
    #
    # Supported patterns (examples):
    #   copilot/fix-1234-description  →  issue-/fix-/feat-/bug- prefix
    #   feature/issue-1234            →  "issue-" keyword
    #   1234-my-feature               →  leading number in the last path segment
    #   my-feature-1234               →  trailing number in the last path segment

    segment = branch.split("/")[-1]  # consider only the last path component

    for pattern in (
        r"(?:issue|fix|feat|feature|bug|chore|refactor)[-/](\d+)",  # keyword[-/]number (e.g. "issue-1234", "fix/1234")
        r"^(\d+)[-_]",   # leading number in the segment (e.g. "1234-description")
        r"[-_](\d+)$",   # trailing number in the segment (e.g. "description-1234")
        r"[-_](\d+)[-_]",  # number surrounded by separators
    ):
        match = re.search(pattern, segment)
        if match:
            return int(match.group(1))

    return None


def resolve_parent_issue(metadata, repo, sha):
    """Return the parent issue number as int, or None."""
    # Front matter takes precedence when present and valid.
    raw = metadata.get("parentIssue")
    if raw is not None:
        try:
            return int(raw)
        except (ValueError, TypeError):
            pass

    return get_parent_issue_from_context(repo, sha)


def create_github_issue(repo, title, body, labels, assignees, milestone):
    """Create a GitHub issue via the GitHub API. Return (issue_number, issue_id, issue_url).

    Uses ``gh api`` so the JSON response can be parsed reliably, avoiding any
    dependency on the URL format printed by ``gh issue create``.

    Returns a 3-tuple: (issue_number, issue_id, issue_url).
    ``issue_id`` is the internal integer ID required by the sub-issues API.
    ``issue_number`` is the human-readable number shown in the URL.
    """
    fields = ["-f", f"title={title}", "-f", f"body={body}"]

    for label in labels:
        fields += ["-f", f"labels[]={label}"]

    for assignee in assignees:
        fields += ["-f", f"assignees[]={assignee}"]

    if milestone:
        fields += ["-f", f"milestone={milestone}"]

    result = _gh(
        "api",
        "--method",
        "POST",
        "-H",
        "Accept: application/vnd.github+json",
        f"repos/{repo}/issues",
        *fields,
        "--jq",
        ".number,.id,.html_url",
    )

    lines = result.stdout.strip().splitlines()
    if len(lines) < 3:
        raise RuntimeError(f"Unexpected response from issues API: {result.stdout!r}")

    issue_number = int(lines[0])
    issue_id = int(lines[1])
    issue_url = lines[2]
    return issue_number, issue_id, issue_url


def add_sub_issue(repo, parent_number, child_issue_id):
    """Register the issue identified by child_issue_id as a sub-issue of parent_number.

    Uses the GitHub sub-issues REST API endpoint:
    POST /repos/{owner}/{repo}/issues/{issue_number}/sub_issues

    ``child_issue_id`` must be the internal integer ID of the issue (the ``.id``
    field in the GitHub API response), **not** the human-readable issue number.
    See https://docs.github.com/en/rest/issues/sub-issues

    This endpoint requires the repository to have the Sub-issues feature
    enabled (available on GitHub Team and Enterprise plans, and as a public
    beta on some Free plans). If the endpoint is unavailable, a warning is
    logged and the function returns False without failing the overall workflow.
    """
    result = _gh(
        "api",
        "--method",
        "POST",
        "-H",
        "Accept: application/vnd.github+json",
        f"repos/{repo}/issues/{parent_number}/sub_issues",
        "-f",
        f"sub_issue_id={child_issue_id}",
        check=False,
    )
    if result.returncode != 0:
        print(
            f"  Warning: could not create sub-issue relationship: {result.stderr.strip()}",
            file=sys.stderr,
        )
        return False
    return True


def main():
    repo = os.environ.get("GITHUB_REPOSITORY", "")
    sha = os.environ.get("GITHUB_SHA", "")

    if not repo:
        print("Error: GITHUB_REPOSITORY environment variable is not set.", file=sys.stderr)
        sys.exit(1)

    proposal_dir = ".github/issue-proposals"
    files = sorted(glob.glob(f"{proposal_dir}/*.md"))

    if not files:
        print("No proposal files found — nothing to do.")
        return

    failed = False
    files_to_delete = []

    for filepath in files:
        print(f"\nProcessing: {filepath}")

        # --- Parse ---
        try:
            metadata, body = parse_proposal(filepath)
        except ValueError as exc:
            print(f"  Error: {exc}", file=sys.stderr)
            failed = True
            continue

        # --- Validate ---
        title = (metadata.get("title") or "").strip()
        if not title:
            print(f"  Error: 'title' is missing or empty in {filepath!r}", file=sys.stderr)
            failed = True
            continue

        if not body:
            print(f"  Error: body content is empty in {filepath!r}", file=sys.stderr)
            failed = True
            continue

        # --- Determine parent ---
        parent_issue = resolve_parent_issue(metadata, repo, sha)
        if parent_issue is None:
            print(
                f"  Error: cannot determine parent issue for {filepath!r}. "
                "Add 'parentIssue' to front matter or ensure the PR branch "
                "includes an issue number.",
                file=sys.stderr,
            )
            failed = True
            continue

        print(f"  Title:        {title}")
        print(f"  Parent issue: #{parent_issue}")

        # --- Create issue ---
        labels = [str(lbl) for lbl in (metadata.get("labels") or [])]
        assignees = [str(a) for a in (metadata.get("assignees") or [])]
        milestone = metadata.get("milestone")

        try:
            issue_number, issue_id, issue_url = create_github_issue(
                repo, title, body, labels, assignees, milestone
            )
        except RuntimeError as exc:
            print(f"  Error creating issue: {exc}", file=sys.stderr)
            failed = True
            continue

        print(f"  Created:      #{issue_number} — {issue_url}")

        # --- Sub-issue link ---
        linked = add_sub_issue(repo, parent_issue, issue_id)
        if linked:
            print(f"  Linked as sub-issue of #{parent_issue}")

        files_to_delete.append(filepath)

    # --- Cleanup ---
    for filepath in files_to_delete:
        os.remove(filepath)
        print(f"\nDeleted: {filepath}")

    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
