#!/usr/bin/env bash
# Run this any time: ./scripts/gh-notify.sh
# Shows unread GitHub notifications + PRs awaiting your review, newest first.
set -euo pipefail

echo "── Notifications (mentions, comments, CI) ──"
gh api notifications --jq '.[] | "\(.updated_at) [\(.reason)] \(.repository.full_name): \(.subject.title)"' || true

echo
echo "── PRs requesting your review ──"
gh search prs --review-requested=@me --state open --json repository,title,url \
  --jq '.[] | "\(.repository.nameWithOwner): \(.title) — \(.url)"' || true

echo
echo "── My open PRs (recent activity) ──"
gh search prs --author=@me --state open --json repository,title,updatedAt,url \
  --jq '.[] | "\(.repository.nameWithOwner): \(.title) — \(.url) (updated \(.updatedAt))"' || true
