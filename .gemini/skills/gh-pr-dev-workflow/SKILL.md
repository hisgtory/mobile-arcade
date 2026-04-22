---
name: gh-pr-dev-workflow
description: Automates the end-to-end GitHub Pull Request lifecycle. Use when you need to process open PRs, complete development tasks from linked issues, trigger automated code reviews, and merge approved PRs in a continuous loop.
---

# GH PR Dev Workflow

This skill automates the iterative process of developing, reviewing, and merging Pull Requests.

## Overview

The workflow follows a cycle: **Discover -> Develop -> Review -> Merge**. It continues until all open PRs have been processed and merged.

## Workflow Steps

### 1. Inventory Discovery
Start by listing all open Pull Requests to understand the work queue.
```bash
gh pr list --state open
```

### 2. PR Processing Loop
For each PR in the list, perform the following steps:

#### A. Context Gathering
Checkout the PR branch and identify the work to be done.
```bash
gh pr checkout <pr-number>
# Check PR description and linked issues
gh pr view <pr-number> --json body,title,number
gh issue list --linked-pr <pr-number> # If supported, or search issues manually
```

#### B. Development & Validation
Complete any remaining development tasks or bug fixes.
- Follow existing codebase conventions.
- Add tests for new features or fixes.
- Verify changes with project-specific test commands.

#### C. Request Code Review
Commit your changes and push to the branch. Then, mention the code review workflow in a comment to trigger the review.
```bash
git push
gh pr comment <pr-number> --body "@.github/workflows/claude-code-review.yml please review"
```

#### D. Approval & Merging
Check for approval comments. If a comment contains the word "approve", merge the PR.
```bash
# Check for approval in comments
gh pr view <pr-number> --json comments --template '{{range .comments}}{{if contains .body "approve"}}{{.body}}{{"\n"}}{{end}}{{end}}'

# If approved, merge
gh pr merge <pr-number> --merge --auto
```

### 3. Continuation
Repeat the process for the next PR in the inventory until all PRs are addressed.

## Guidelines
- **Surgical Changes:** Only modify files relevant to the PR's objective.
- **Verification:** Always run tests before pushing changes.
- **Clear Communication:** If a PR cannot be completed or merged due to conflicts or complex issues, note the blocker and move to the next PR.
