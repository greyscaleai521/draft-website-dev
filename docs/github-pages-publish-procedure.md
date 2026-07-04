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
```

Stage only the intended files:

```bash
git add path/to/file path/to/another-file
```

Commit:

```bash
git commit -m "Describe the website update"
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

Push `main`:

```bash
git push origin main
```

This push is what starts the GitHub Pages publish, because Pages uses `main` at `/`.

## 5. Verify the Pages build

Check Pages status:

```bash
gh api repos/greyscaleai521/draft-website-dev/pages
```

Look for:

```json
"status": "built"
```

Then confirm the expected commit is on `origin/main`:

```bash
git fetch origin
git log --oneline -1 origin/main
```

Finally, load the published URL in a browser and check the changed page:

`https://greyscaleai521.github.io/draft-website-dev/`

For a specific page, use its full path, for example:

`https://greyscaleai521.github.io/draft-website-dev/insights/enterprise-access/`

## 6. Return to the working branch if needed

After publishing, switch back to the feature branch if more work will continue there:

```bash
git switch your-working-branch
```
