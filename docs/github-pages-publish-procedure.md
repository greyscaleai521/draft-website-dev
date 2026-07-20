# GitHub Pages Fast Publish Procedure

This repo publishes GitHub Pages from the `main` branch at the repository root.

Live draft site:

```text
https://greyscaleai521.github.io/draft-website-dev/
```

Use this procedure when a working branch contains website changes that should become the live draft site.

## Operating Rule

Run the fast path first. Do not troubleshoot between successful steps.

Only switch to the troubleshooting section when one of these happens:

- a command exits with an error;
- an expected check prints the wrong value;
- GitHub Pages completes but the live page is missing or stale;
- push protection blocks the push.

Do not improvise a merge strategy. If a fast-forward command fails, stop and troubleshoot.

## Inputs

Set these values before starting.

```bash
export REPO="greyscaleai521/draft-website-dev"
export PAGES_URL="https://greyscaleai521.github.io/draft-website-dev/"
export WORK_BRANCH="$(git branch --show-current)"
export COMMIT_MESSAGE="Describe the website update"
export FILES_TO_STAGE="path/to/file path/to/another-file"
export VERIFY_PATH="/path-to-changed-page/"
export EXPECTED_TEXT="Expected text from the changed live page"
```

Examples:

```bash
export COMMIT_MESSAGE="Update industry pages"
export FILES_TO_STAGE="industries/seafood/index.html assets/css/styles.css"
export VERIFY_PATH="/industries/seafood/"
export EXPECTED_TEXT="Inspection intelligence for seafood"
```

Rules:

- `WORK_BRANCH` must not be `main`.
- `FILES_TO_STAGE` must be explicit. Do not use `git add .` for this procedure.
- `VERIFY_PATH` should point to a changed page, not only the homepage.
- `EXPECTED_TEXT` should be visible text that proves the new content published.

## Fast Path

### 1. Preflight

Run:

```bash
test "$WORK_BRANCH" != "main"
test -n "$FILES_TO_STAGE"
test -n "$VERIFY_PATH"
git branch --show-current
git status --short --ignored
```

Confirm GitHub Pages is publishing from `main` at `/`:

```bash
gh api "repos/$REPO/pages" --jq '.source.branch + " " + .source.path'
```

Expected output:

```text
main /
```

Confirm known scratch paths are ignored or absent:

```bash
git ls-files .DS_Store favicon.ico output tmp
```

Expected output: nothing.

Run the whitespace check:

```bash
git diff --check
```

Expected output: nothing.

### 2. Stage and Commit

Stage only the explicit files:

```bash
git add $FILES_TO_STAGE
```

Check for obvious accidental staged files:

```bash
git diff --cached --name-status
export BAD_STAGED="$(git diff --cached --name-only | grep -E '(^|/)(\.DS_Store|favicon\.ico)$|(^|/)(tmp|output)/|(\.log|\.pdf|\.zip)$' || true)"
test -z "$BAD_STAGED" || { echo "$BAD_STAGED"; false; }
```

If the guard prints a path, stop. Something accidental is staged.

Commit:

```bash
git commit -m "$COMMIT_MESSAGE"
```

Inspect the commit quickly:

```bash
git show --name-status --oneline HEAD
```

Push the working branch:

```bash
git push origin "$WORK_BRANCH"
```

### 3. Fast-Forward Main

Fetch and update local `main`:

```bash
git fetch origin
git switch main
git merge --ff-only origin/main
```

Fast-forward `main` to the working branch:

```bash
git merge --ff-only "$WORK_BRANCH"
```

Capture the publishing commit:

```bash
export PUBLISH_SHA="$(git rev-parse HEAD)"
git log --oneline -1
git show --name-status --oneline HEAD
```

Push `main`:

```bash
git push origin main
```

This push starts the GitHub Pages deployment.

### 4. Watch the Pages Run

Find the newest Pages run for `main`:

```bash
export RUN_ID="$(gh run list --repo "$REPO" --branch main --limit 10 --json databaseId,name,headSha --jq 'map(select(.name=="pages build and deployment"))[0].databaseId')"
echo "$RUN_ID"
```

Watch it:

```bash
gh run watch "$RUN_ID" --repo "$REPO" --exit-status
```

Inspect the result:

```bash
gh run view "$RUN_ID" --repo "$REPO" --json status,conclusion,headSha,url
```

Expected:

```text
status: completed
conclusion: success
```

Check Pages status:

```bash
gh api "repos/$REPO/pages" --jq '.status'
```

Expected:

```text
built
```

### 5. Verify the Live Page

Fetch the live page with a commit-based cache buster:

```bash
export CHECK_URL="${PAGES_URL%/}${VERIFY_PATH}?verify=${PUBLISH_SHA}"
curl -L -s -o /tmp/page-check.html -w '%{http_code} %{url_effective}\n' "$CHECK_URL"
```

Expected HTTP status:

```text
200
```

Confirm expected text appears:

```bash
grep -F "$EXPECTED_TEXT" /tmp/page-check.html
```

If the HTTP status is `200` and the expected text appears, publishing is complete.

### 6. Return to the Working Branch

```bash
git switch "$WORK_BRANCH"
```

## Troubleshooting

Use this section only after the fast path fails or the final live-page check is wrong.

### Preflight Fails

If `WORK_BRANCH` is `main`:

- stop;
- switch to the intended working branch;
- rerun the fast path.

If `FILES_TO_STAGE` is empty:

- get the exact file list from the task owner or `git status --short`;
- set `FILES_TO_STAGE`;
- rerun from Stage and Commit.

If Pages source is not `main /`:

- stop;
- use the source branch and path shown by GitHub;
- do not assume `main` is correct.

If `git ls-files .DS_Store favicon.ico output tmp` prints a path:

- stop;
- ask a senior developer why that file is tracked;
- do not delete or untrack it blindly.

If `git diff --check` prints errors:

- fix the whitespace issue;
- rerun `git diff --check`;
- restart the fast path from Stage and Commit.

### Staging or Commit Looks Wrong

If an accidental file is staged:

```bash
git restore --staged path/to/accidental-file
```

Then rerun:

```bash
git diff --cached --name-status
git commit -m "$COMMIT_MESSAGE"
```

If `git commit` says there is nothing to commit:

- confirm whether the intended changes were already committed;
- if yes, skip to Push the working branch;
- if no, fix `FILES_TO_STAGE` and stage the intended files.

If the commit contains scratch files after committing:

```bash
git rm --cached path/to/accidental-file
git commit --amend --no-edit
git show --name-status --oneline HEAD
```

### Push Protection Blocks the Working Branch Push

Do not bypass GitHub push protection.

Do not use a secret-scanning unblock URL unless the security owner explicitly approves it.

Clean the commit:

```bash
git rm --cached path/to/problem-file
git commit --amend --no-edit
git push origin "$WORK_BRANCH"
```

If the secret is inside a file that should remain committed, edit the file to remove the secret, amend, and push again.

### Fast-Forward Main Fails

If this fails:

```bash
git merge --ff-only origin/main
```

Run:

```bash
git status --short
git fetch origin
git log --oneline --decorate --max-count=8 main origin/main
```

Then stop and ask a senior developer. Do not force-push or reset.

If this fails:

```bash
git merge --ff-only "$WORK_BRANCH"
```

The working branch is not a direct fast-forward from `main`.

Run:

```bash
git log --oneline --decorate --graph --max-count=20 main "$WORK_BRANCH"
```

Then stop and ask whether to rebase, merge normally, or create a new branch. Do not invent the merge strategy.

### Main Push Fails

Run:

```bash
git status --short
git fetch origin
git log --oneline --decorate --max-count=8 main origin/main
```

If `origin/main` moved, stop and ask a senior developer. Do not force-push.

### Pages Run Fails

Inspect the failed log:

```bash
gh run view "$RUN_ID" --repo "$REPO" --log-failed
```

Use this table:

| Failure type | Meaning | Action |
| --- | --- | --- |
| Checkout, artifact upload, missing files, build errors | The site artifact did not build correctly. | Fix the repo issue, commit, push the working branch, fast-forward `main`, and publish again. |
| Push protection or secret scanning | A commit contains a detected secret. | Clean the commit. Do not bypass protection. |
| `Deploy to GitHub Pages` says `Deployment failed, try again later` after an artifact and deployment were created | GitHub's deploy step failed after the artifact was prepared. | Rerun once. If it fails again or stays queued, make a small real follow-up commit and push `main` again. |

Rerun once:

```bash
gh run rerun "$RUN_ID" --repo "$REPO" --failed
gh run watch "$RUN_ID" --repo "$REPO" --exit-status
```

If the rerun does not publish, stop repeating the same run. Make a small real follow-up commit on `main`, document why, and push it to trigger a fresh Pages deployment.

### Live Page Is 404 or Stale

Confirm `origin/main` contains the intended commit:

```bash
git fetch origin
git rev-parse origin/main
echo "$PUBLISH_SHA"
```

The two SHAs should match.

Check Pages status:

```bash
gh api "repos/$REPO/pages" --jq '.status'
```

If status is not `built`, wait for the Pages run or inspect the run failure.

If status is `built` but the page is stale:

```bash
curl -L -s -o /tmp/page-check.html -w '%{http_code} %{url_effective}\n' "$CHECK_URL"
grep -F "$EXPECTED_TEXT" /tmp/page-check.html
```

If the expected text still does not appear:

- confirm `VERIFY_PATH` is the changed page;
- confirm the expected text exists in the committed file;
- check the Pages run `headSha`;
- do not mark the publish complete.

### Browser Check

After command-line verification passes, open the changed page in a browser:

```text
https://greyscaleai521.github.io/draft-website-dev/<changed-path>/?verify=<PUBLISH_SHA>
```

Check the visible page, not only the homepage. If the browser shows old content but `curl` shows new content, clear cache or use the `?verify=` URL.
