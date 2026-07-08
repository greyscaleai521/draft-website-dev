# Publishing a Commit to GitHub Pages

This repo publishes GitHub Pages from the `main` branch at the repository root.

Use this procedure when a working branch has a commit that should become the live draft site at:

`https://greyscaleai521.github.io/draft-website-dev/`

## 1. Start clean on the working branch

Check where you are:

```bash
git branch --show-current
git status --short --ignored
```

Only intended source files should be staged or committed. Local scratch files such as `.DS_Store`, `/tmp/`, `/output/`, and root `/favicon.ico` should be ignored by `.gitignore`.

If `git status --short --ignored` shows those paths with `!!`, that is good. They are ignored.

If those paths show with `??`, stop. They are untracked but not ignored, and they can be accidentally committed. Add or fix `.gitignore` before continuing.

Check that no scratch files are already tracked by Git:

```bash
git ls-files .DS_Store favicon.ico output tmp
```

This command should print nothing. If it prints a file path, stop and ask a senior developer before publishing. Do not delete or untrack files unless you understand why they are tracked.

## 2. Confirm GitHub Pages source

Confirm Pages is still publishing from `main`:

```bash
gh api repos/greyscaleai521/draft-website-dev/pages
```

Look for:

```json
"source": {
  "branch": "main",
  "path": "/"
}
```

If the source branch is not `main`, stop and use the branch shown by GitHub instead.

## 3. Commit the working branch

Review changes:

```bash
git diff --check
git diff --stat
git diff --name-status
```

Stage only the intended files. Prefer explicit paths:

```bash
git add path/to/file path/to/another-file
```

Avoid `git add .` and `git add -A` for publishing work unless you have already checked that the working tree contains only intended files.

Before committing, inspect the staged file list:

```bash
git diff --cached --name-status
```

Look carefully for accidental files. These should not be staged:

```text
.DS_Store
favicon.ico
tmp/
output/
old exports
generated screenshots
local PDFs
downloaded source pages
files containing API keys or tokens
```

If an accidental file is staged, unstage it before committing:

```bash
git restore --staged path/to/accidental-file
```

Commit:

```bash
git commit -m "Describe the website update"
```

After committing, inspect the commit contents before pushing:

```bash
git show --name-status --oneline HEAD
```

If the commit contains scratch files, generated artifacts, downloaded pages, or anything unexpected, fix the commit before pushing:

```bash
git rm --cached path/to/accidental-file
git commit --amend --no-edit
git show --name-status --oneline HEAD
```

Push the working branch:

```bash
git push origin HEAD
```

If GitHub blocks the push for push protection, do not bypass it. Remove the secret or accidental scratch file from the commit, amend the commit, and push again.

Common cleanup for accidental scratch files:

```bash
git rm --cached path/to/accidental-file
git commit --amend --no-edit
git push origin HEAD
```

Do not use GitHub's secret-scanning unblock URL unless the security owner has explicitly approved it. A blocked push usually means the commit needs to be cleaned.

## 4. Fast-forward main to the working branch

Fetch the latest remote state:

```bash
git fetch origin
```

Switch to `main`:

```bash
git switch main
```

Make sure local `main` exactly matches remote `main` before publishing:

```bash
git status --short
git merge --ff-only origin/main
```

Fast-forward `main` to the working branch commit:

```bash
git merge --ff-only your-working-branch
```

Confirm the commit that will publish:

```bash
git log --oneline -1
git show --name-status --oneline HEAD
```

Push `main`:

```bash
git push origin main
```

This push is what starts the GitHub Pages publish, because Pages uses `main` at `/`.

## 5. Verify the Pages build

Find the newest Pages workflow run:

```bash
gh run list --repo greyscaleai521/draft-website-dev --limit 5
```

Wait for the newest `pages build and deployment` run for `main` to complete. Then inspect it:

```bash
gh run view RUN_ID --repo greyscaleai521/draft-website-dev --json status,conclusion,headSha,url
```

The run must show:

```json
"status": "completed"
"conclusion": "success"
```

Check Pages status too:

```bash
gh api repos/greyscaleai521/draft-website-dev/pages
```

Look for:

```json
"status": "built"
```

If the run failed, inspect the failed log before doing anything else:

```bash
gh run view RUN_ID --repo greyscaleai521/draft-website-dev --log-failed
```

Use the log to decide what happened:

| Failure type | What it means | What to do |
| --- | --- | --- |
| Checkout, artifact upload, missing files, or build errors | The site artifact did not build correctly. | Fix the file or repo issue, commit, and push again. |
| Push protection or secret scanning | A commit contains a detected secret. | Clean the commit. Do not bypass protection. |
| `Deploy to GitHub Pages` says `Deployment failed, try again later` after `Found 1 artifact(s)` and `Created deployment` | The artifact was created, but GitHub's Pages deploy step failed. | Wait briefly, then rerun once or make a small follow-up commit to trigger a fresh deployment. |

If rerunning the failed workflow, use:

```bash
gh run rerun RUN_ID --repo greyscaleai521/draft-website-dev --failed
```

If the rerun stays queued for more than five minutes or does not publish, stop retrying the same run. Make a small real follow-up commit on `main` and push it to trigger a fresh Pages deployment. Document why you made the follow-up commit.

Then confirm the expected commit is on `origin/main`:

```bash
git fetch origin
git log --oneline -1 origin/main
```

Finally, load the published URL and check the changed page. Do not mark the publish complete until the live URL returns HTTP 200 and contains the expected content.

`https://greyscaleai521.github.io/draft-website-dev/`

For a specific page, use its full path, for example:

`https://greyscaleai521.github.io/draft-website-dev/insights/enterprise-access/`

Command-line check:

```bash
curl -L -s -o /tmp/page-check.html -w '%{http_code} %{url_effective}\n' 'https://greyscaleai521.github.io/draft-website-dev/insights/enterprise-access/?verify=COMMIT'
```

If the page returns `404`, Pages has not published that content yet.

## 6. Return to the working branch if needed

After publishing, switch back to the feature branch if more work will continue there:

```bash
git switch your-working-branch
```
