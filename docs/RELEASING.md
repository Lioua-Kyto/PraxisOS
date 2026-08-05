# Releasing

How a new version of PraxisOS gets from your machine to a public download.

If you have never published a GitHub Release before, read this top to bottom
once. After that, the whole process is four commands.

---

## What a "release" actually is

Three separate things share the word *version*, and they have to agree:

| Thing | Where it lives | Who sets it |
| --- | --- | --- |
| The version number | `version` in `package.json` | you (or the bump step below) |
| The tag | a git label like `v0.2.0` | you, with `git tag` |
| The Release | a page on GitHub with the `.exe` attached | **built automatically** |

A **tag** is a bookmark on one commit. Pushing a tag whose name starts with `v`
is the trigger: GitHub sees it, runs the workflow in
[`.github/workflows/release.yml`](../.github/workflows/release.yml), builds the
Windows installer on a clean machine, and attaches it to a new public Release.

You never build or upload the `.exe` yourself.

---

## One-time setup

Do this once, ever. It takes two minutes.

### 1. Allow the workflow to publish

1. Open your repository on github.com.
2. **Settings** → **Actions** → **General**.
3. Scroll to **Workflow permissions**.
4. Select **Read and write permissions**.
5. **Save**.

Without this, the build succeeds but the upload fails with a 403, because the
workflow is not allowed to create a Release.

> There is nothing else to configure. `GITHUB_TOKEN` is provided automatically —
> you do not create a token, and you must never paste one into the repository.

### 2. Check Actions are enabled

**Settings** → **Actions** → **General** → **Allow all actions**. This is the
default; only change it if it has been turned off.

---

## Releasing a version

Say the current version is `0.1.0` and you have finished some fixes.

### Step 1 — write the changelog entry

Open `CHANGELOG.md` and add a new section **at the top**, above the previous
version:

```markdown
## 0.1.1 — 2026-08-12

### Fixed

- The pinned timer drifted out of step with the main window.
- The installer did not ask you to accept the licence.
```

Rules that matter:

- **Only this version's changes go in this section.** Do not repeat anything
  from an older release. The app shows one section, and a user updating from
  0.1.0 to 0.1.1 should see exactly what changed in 0.1.1.
- Use `### Added`, `### Changed`, `### Fixed`, `### Removed` as needed.
- Write for the person using the app, not for the person who wrote the code.
  "Fixed the timer drifting" — not "refactored `useFocusSync` to broadcast".

This file is read by the app to show the What's New dialog after an update. A
version with no section here ships an empty dialog.

### Step 2 — bump the version

Edit `version` in `package.json`:

```json
"version": "0.1.1"
```

Which number to raise:

| Change | Bump | Example |
| --- | --- | --- |
| Bug fixes only | the third number (PATCH) | 0.1.0 → 0.1.1 |
| New features | the second number (MINOR) | 0.1.1 → 0.2.0 |
| Breaking change | the first number (MAJOR) | never, before 1.0 |

### Step 3 — commit, tag, push

```bash
git add package.json CHANGELOG.md
```

```bash
git commit -m "chore: bump version to v0.1.1"
```

```bash
git tag v0.1.1
```

```bash
git push && git push origin v0.1.1
```

The tag name **must** match `package.json` exactly, with a `v` in front. The
workflow checks this and stops if they disagree — electron-builder names the
installer from `package.json`, so a mismatch would publish a "v0.1.1" release
containing `PraxisOS-Setup-0.1.0.exe`.

### Step 4 — watch it build

1. Go to your repository → **Actions** tab.
2. The run named after your tag appears within a few seconds.
3. It takes roughly five to ten minutes.
4. Green tick = done. Your Release is under the **Releases** section on the
   repository home page, with `PraxisOS-Setup-0.1.1.exe` attached.

Anyone can now download and install it. Existing users see an update banner the
next time they open the app, because it checks that Releases page on launch.

---

## If something goes wrong

**Red X on the workflow.** Click the run, then the failed step, and read the
last few lines. The three common causes:

- *403 / "Resource not accessible by integration"* — you skipped one-time setup
  step 1.
- *"Tag vX does not match package.json version vY"* — you tagged before saving
  the version bump. Fix it with the delete-tag recipe below, then re-tag.
- *A typecheck error* — the code does not compile. Fix it, commit, then delete
  and re-push the tag.

**Deleting a tag you pushed by mistake:**

```bash
git tag -d v0.1.1 && git push origin :refs/tags/v0.1.1
```

Then delete the Release on GitHub too (Releases → the release → **Delete**), if
one was created. Re-tagging without deleting the old Release will fail.

**Rebuilding without a new tag.** Actions → **Release** → **Run workflow**, and
type the existing tag name. Useful when the build was fine but the upload
failed.

---

## Where the version shows up

Once released, the version appears in:

- the installer window title and the Add/Remove Programs entry;
- **Settings → About** inside the app;
- the update banner shown to users on an older build;
- the What's New dialog, populated from your `CHANGELOG.md` section.

---

## A note on the SmartScreen warning

The installer is not code-signed, so Windows will show
*"Windows protected your PC"* the first time someone runs it. They can click
**More info** → **Run anyway**.

Removing that warning requires a code-signing certificate (roughly €200–400 a
year from a certificate authority). It is worth doing before promoting the app
widely; it is not required to publish.
