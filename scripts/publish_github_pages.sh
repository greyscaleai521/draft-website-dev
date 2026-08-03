#!/usr/bin/env bash
set -Eeuo pipefail

DEFAULT_REPO="greyscaleai521/draft-website-dev"
DEFAULT_PAGES_URL="https://greyscaleai521.github.io/draft-website-dev/"
EXPECTED_PAGES_SOURCE="main /"

REPO="${REPO:-$DEFAULT_REPO}"
PAGES_URL="${PAGES_URL:-$DEFAULT_PAGES_URL}"
WORK_BRANCH="${WORK_BRANCH:-}"
COMMIT_MESSAGE="${COMMIT_MESSAGE:-}"
VERIFY_PATH="${VERIFY_PATH:-}"
EXPECTED_TEXT="${EXPECTED_TEXT:-}"
ALLOW_EXTRA_CHANGES=0
ASSUME_YES=0
RERUN_PAGES_ON_FAILURE=0
RETURN_TO_WORK_BRANCH=0
FILES=()

usage() {
  cat <<'USAGE'
Publish the current working branch to GitHub Pages by fast-forwarding main.

Usage:
  scripts/publish_github_pages.sh \
    --message "Update homepage case studies router" \
    --verify-path "/" \
    --expected-text "Real inspection challenges. Image-backed answers." \
    -- index.html assets/css/styles.css assets/img/case-studies/product-in-seal-placeholder.svg

Environment-variable form, matching docs/github-pages-publish-procedure.md:
  export COMMIT_MESSAGE="Update industry pages"
  export FILES_TO_STAGE="industries/seafood/index.html assets/css/styles.css"
  export VERIFY_PATH="/industries/seafood/"
  export EXPECTED_TEXT="Inspection intelligence for seafood"
  scripts/publish_github_pages.sh

Options:
  --repo OWNER/REPO              Defaults to greyscaleai521/draft-website-dev.
  --pages-url URL                Defaults to the draft GitHub Pages URL.
  --work-branch BRANCH           Defaults to the current branch.
  --message TEXT                 Commit message. Required.
  --verify-path PATH             Live page path to verify after publish. Required.
  --expected-text TEXT           Text expected on the live page. Required.
  --files FILE [FILE ...]        Explicit files to stage. Alternative to using --.
  --allow-extra-changes          Permit unrelated local changes to remain unstaged.
  --rerun-pages-on-failure       Rerun the failed Pages job once, then watch again.
  -y, --yes                      Do not prompt before commit/push/fast-forward.
  -h, --help                     Show this help.

Safety defaults:
  - Refuses to run from main.
  - Refuses pre-existing staged changes.
  - Refuses uncommitted files outside the explicit publish file list.
  - Refuses GitHub Pages source settings other than "main /".
  - Uses git merge --ff-only and never force-pushes.
USAGE
}

die() {
  printf '\nERROR: %s\n' "$*" >&2
  exit 1
}

warn() {
  printf 'WARN: %s\n' "$*" >&2
}

step() {
  printf '\n==> %s\n' "$*"
}

print_command() {
  printf '+'
  for arg in "$@"; do
    printf ' %q' "$arg"
  done
  printf '\n'
}

run() {
  print_command "$@"
  "$@"
}

cleanup() {
  local exit_code=$?

  if [[ $exit_code -ne 0 && $RETURN_TO_WORK_BRANCH -eq 1 && -n "$WORK_BRANCH" ]]; then
    local current_branch
    current_branch="$(git branch --show-current 2>/dev/null || true)"

    if [[ "$current_branch" != "$WORK_BRANCH" ]]; then
      printf '\nAttempting to return to %s after failure...\n' "$WORK_BRANCH" >&2
      git switch "$WORK_BRANCH" >/dev/null 2>&1 || {
        printf 'Could not switch back automatically. Current branch: %s\n' "$current_branch" >&2
      }
    fi
  fi
}

trap cleanup EXIT

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"
}

is_requested_path() {
  local path="$1"
  local requested

  path="${path#./}"

  for requested in "${FILES[@]}"; do
    requested="${requested#./}"
    requested="${requested%/}"

    if [[ "$path" == "$requested" || "$path" == "$requested/"* ]]; then
      return 0
    fi
  done

  return 1
}

confirm_or_abort() {
  if [[ $ASSUME_YES -eq 1 ]]; then
    return 0
  fi

  local reply
  printf '\nProceed with commit, pushes, main fast-forward, Pages watch, and live verification? [y/N] '
  read -r reply

  case "$reply" in
    y|Y|yes|YES)
      return 0
      ;;
    *)
      git restore --staged -- "${FILES[@]}" >/dev/null 2>&1 || true
      die "Aborted. Explicit files were unstaged."
      ;;
  esac
}

show_failure_context() {
  printf '\nFailure context:\n' >&2
  git status --short >&2 || true
  printf '\nRecent main/origin/main history:\n' >&2
  git log --oneline --decorate --max-count=8 main origin/main >&2 || true
}

pages_failure_diagnostics() {
  local run_id="$1"

  warn "GitHub Pages run did not complete successfully."
  gh run view "$run_id" --repo "$REPO" --json status,conclusion,headSha,url || true
  gh run view "$run_id" --repo "$REPO" --log-failed || true
  gh api "repos/$REPO/pages" --jq '.status' || true
}

live_page_diagnostics() {
  local run_id="$1"
  local publish_sha="$2"

  warn "Live page verification failed."
  run git fetch origin
  printf 'origin/main: %s\n' "$(git rev-parse origin/main 2>/dev/null || true)" >&2
  printf 'publish sha: %s\n' "$publish_sha" >&2
  gh api "repos/$REPO/pages" --jq '.status' || true
  gh run view "$run_id" --repo "$REPO" --json status,conclusion,headSha,url || true
}

parse_files_from_env() {
  local item

  if [[ ${#FILES[@]} -gt 0 || -z "${FILES_TO_STAGE:-}" ]]; then
    return 0
  fi

  for item in $FILES_TO_STAGE; do
    FILES+=("$item")
  done
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)
      REPO="${2:-}"
      shift 2
      ;;
    --pages-url)
      PAGES_URL="${2:-}"
      shift 2
      ;;
    --work-branch)
      WORK_BRANCH="${2:-}"
      shift 2
      ;;
    --message)
      COMMIT_MESSAGE="${2:-}"
      shift 2
      ;;
    --verify-path)
      VERIFY_PATH="${2:-}"
      shift 2
      ;;
    --expected-text)
      EXPECTED_TEXT="${2:-}"
      shift 2
      ;;
    --files)
      shift
      while [[ $# -gt 0 && "$1" != --* ]]; do
        FILES+=("$1")
        shift
      done
      ;;
    --allow-extra-changes)
      ALLOW_EXTRA_CHANGES=1
      shift
      ;;
    --rerun-pages-on-failure)
      RERUN_PAGES_ON_FAILURE=1
      shift
      ;;
    -y|--yes)
      ASSUME_YES=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --)
      shift
      while [[ $# -gt 0 ]]; do
        FILES+=("$1")
        shift
      done
      ;;
    *)
      die "Unknown argument: $1"
      ;;
  esac
done

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || die "Run this from inside the repository."
cd "$REPO_ROOT"

parse_files_from_env

if [[ -z "$WORK_BRANCH" ]]; then
  WORK_BRANCH="$(git branch --show-current)"
fi

if [[ -n "$VERIFY_PATH" && "${VERIFY_PATH:0:1}" != "/" ]]; then
  VERIFY_PATH="/$VERIFY_PATH"
fi

step "Preflight"
require_command git
require_command gh
require_command curl
require_command grep

[[ -n "$WORK_BRANCH" ]] || die "Could not determine the current branch."
[[ "$WORK_BRANCH" != "main" ]] || die "WORK_BRANCH must not be main."
[[ -n "$COMMIT_MESSAGE" ]] || die "Missing --message or COMMIT_MESSAGE."
[[ -n "$VERIFY_PATH" ]] || die "Missing --verify-path or VERIFY_PATH."
[[ -n "$EXPECTED_TEXT" ]] || die "Missing --expected-text or EXPECTED_TEXT."
[[ ${#FILES[@]} -gt 0 ]] || die "Provide explicit files after --, with --files, or through FILES_TO_STAGE."

run git branch --show-current
run git status --short --ignored

if ! git diff --cached --quiet; then
  git diff --cached --name-status
  die "There are already staged changes. Unstage or commit them before using this publisher."
fi

conflicts="$(git diff --name-only --diff-filter=U)"
[[ -z "$conflicts" ]] || die "Resolve merge conflicts before publishing: $conflicts"

extra_changes=""
status_output="$(git status --porcelain=v1 --untracked-files=all)"
if [[ -n "$status_output" ]]; then
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    path="${line:3}"
    path="${path##* -> }"

    if ! is_requested_path "$path"; then
      extra_changes+="${path}"$'\n'
    fi
  done <<< "$status_output"
fi

if [[ -n "$extra_changes" ]]; then
  if [[ $ALLOW_EXTRA_CHANGES -eq 1 ]]; then
    warn "Uncommitted files outside the explicit publish list will remain unstaged:"
    printf '%s' "$extra_changes" >&2
  else
    printf '%s' "$extra_changes" >&2
    die "Uncommitted files exist outside the explicit publish list. Commit, stash, clean them, or rerun with --allow-extra-changes if you are certain."
  fi
fi

pages_source="$(gh api "repos/$REPO/pages" --jq '.source.branch + " " + .source.path')"
printf 'GitHub Pages source: %s\n' "$pages_source"
[[ "$pages_source" == "$EXPECTED_PAGES_SOURCE" ]] || die "Expected GitHub Pages source '$EXPECTED_PAGES_SOURCE' but found '$pages_source'. Stop and update the procedure."

tracked_scratch="$(git ls-files .DS_Store output tmp)"
[[ -z "$tracked_scratch" ]] || die "Tracked scratch paths found. Ask a senior developer before publishing: $tracked_scratch"

run git diff --check

step "Stage explicit files"
run git add -- "${FILES[@]}"
run git diff --cached --name-status

bad_staged="$(git diff --cached --name-only | grep -E '(^|/)(\.DS_Store|favicon\.ico)$|(^|/)(tmp|output)/|(\.log|\.pdf|\.zip)$' || true)"
if [[ -n "$bad_staged" ]]; then
  printf '%s\n' "$bad_staged" >&2
  die "Accidental or generated file is staged. Unstage it before publishing."
fi

if git diff --cached --quiet; then
  die "No staged changes after adding explicit files."
fi

cat <<SUMMARY

Publish summary:
  repo:          $REPO
  pages url:     $PAGES_URL
  work branch:   $WORK_BRANCH
  verify path:   $VERIFY_PATH
  expected text: $EXPECTED_TEXT
  files:
SUMMARY

for file in "${FILES[@]}"; do
  printf '    - %s\n' "$file"
done

confirm_or_abort

step "Commit and push working branch"
run git commit -m "$COMMIT_MESSAGE"
run git show --name-status --oneline HEAD
run git push origin "$WORK_BRANCH"

if ! git diff --quiet || ! git diff --cached --quiet; then
  show_failure_context
  die "Working tree is not clean after the publish commit. Stop before switching branches."
fi

remaining_untracked="$(git ls-files --others --exclude-standard)"
if [[ -n "$remaining_untracked" && $ALLOW_EXTRA_CHANGES -ne 1 ]]; then
  printf '%s\n' "$remaining_untracked" >&2
  die "Untracked files remain after commit. Stop before switching branches."
fi

step "Fast-forward main"
RETURN_TO_WORK_BRANCH=1
run git fetch origin
run git switch main
run git merge --ff-only origin/main
run git merge --ff-only "$WORK_BRANCH"

PUBLISH_SHA="$(git rev-parse HEAD)"
run git log --oneline -1
run git show --name-status --oneline HEAD
run git push origin main

step "Watch GitHub Pages"
RUN_ID=""
for attempt in 1 2 3 4 5 6 7 8 9 10 11 12; do
  RUN_ID="$(gh run list --repo "$REPO" --branch main --limit 20 --json databaseId,name,headSha,status,conclusion --jq ".[] | select(.name==\"pages build and deployment\" and .headSha==\"$PUBLISH_SHA\") | .databaseId" | head -n 1 || true)"

  if [[ -n "$RUN_ID" ]]; then
    break
  fi

  printf 'Waiting for Pages run for %s (%s/12)...\n' "$PUBLISH_SHA" "$attempt"
  sleep 5
done

if [[ -z "$RUN_ID" ]]; then
  gh run list --repo "$REPO" --branch main --limit 10 --json databaseId,name,headSha,status,conclusion,createdAt || true
  die "Could not find a Pages run for $PUBLISH_SHA."
fi

printf 'Pages run id: %s\n' "$RUN_ID"

if ! gh run watch "$RUN_ID" --repo "$REPO" --exit-status; then
  pages_failure_diagnostics "$RUN_ID"

  if [[ $RERUN_PAGES_ON_FAILURE -eq 1 ]]; then
    step "Rerun failed Pages job once"
    run gh run rerun "$RUN_ID" --repo "$REPO" --failed
    if ! gh run watch "$RUN_ID" --repo "$REPO" --exit-status; then
      pages_failure_diagnostics "$RUN_ID"
      die "Pages rerun failed. Stop and inspect the failed log."
    fi
  else
    die "Pages run failed. Review the diagnostics above; rerun with --rerun-pages-on-failure only if the failure is transient."
  fi
fi

run gh run view "$RUN_ID" --repo "$REPO" --json status,conclusion,headSha,url
run_conclusion="$(gh run view "$RUN_ID" --repo "$REPO" --json conclusion --jq '.conclusion')"
[[ "$run_conclusion" == "success" ]] || die "Pages conclusion was '$run_conclusion', expected success."

pages_status="$(gh api "repos/$REPO/pages" --jq '.status')"
printf 'GitHub Pages status: %s\n' "$pages_status"
[[ "$pages_status" == "built" ]] || die "GitHub Pages status was '$pages_status', expected built."

step "Verify live page"
tmp_file="$(mktemp "${TMPDIR:-/tmp}/page-check.XXXXXX")"
CHECK_URL="${PAGES_URL%/}${VERIFY_PATH}?verify=${PUBLISH_SHA}"
printf 'Check URL: %s\n' "$CHECK_URL"

curl_result="$(curl -L -s -o "$tmp_file" -w '%{http_code} %{url_effective}' "$CHECK_URL")"
printf '%s\n' "$curl_result"
http_status="${curl_result%% *}"

if [[ "$http_status" != "200" ]]; then
  live_page_diagnostics "$RUN_ID" "$PUBLISH_SHA"
  die "Live page returned HTTP $http_status, expected 200."
fi

if ! grep -Fq "$EXPECTED_TEXT" "$tmp_file"; then
  live_page_diagnostics "$RUN_ID" "$PUBLISH_SHA"
  die "Expected text was not found on the live page."
fi

step "Return to working branch"
run git switch "$WORK_BRANCH"
RETURN_TO_WORK_BRANCH=0

cat <<SUCCESS

Publish complete.
  commit: $PUBLISH_SHA
  live:   $CHECK_URL

Browser check:
  Open $CHECK_URL and inspect the changed page visually.
SUCCESS
