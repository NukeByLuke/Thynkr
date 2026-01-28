# Thynkr Git Workflow

This document outlines the Git workflow and branching strategy for the Thynkr project.

## 🧭 Branching Model

| Branch      | Purpose                                                |
| ----------- | ------------------------------------------------------ |
| `main`      | Production-ready code only. Tagged releases.           |
| `develop`   | Integration branch for features and staging.           |
| `feature/*` | New features (e.g., `feature/stripe-integration`)      |
| `fix/*`     | Bug fixes (e.g., `fix/ai-tutor-stream`)                |
| `chore/*`   | Config or setup changes (e.g., `chore/docker-compose`) |
| `hotfix/*`  | Emergency fixes pushed directly to main                |

## 🛠️ Automation Scripts

Thynkr includes scripts to automate common Git workflows:

```bash
# Create a new feature branch (with setup & checks)
pnpm feature:new <feature-name>

# Merge a feature branch into develop (with checks)
pnpm feature:merge <feature-name>

# Create a release (merge develop → main, tag, push)
pnpm release <version>
```

## ⚙️ Workflow

### Starting a New Feature

```bash
# Always start from develop
git checkout develop
git pull origin develop

# Create your feature branch
git checkout -b feature/<feature-name>
```

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>: <description>

[optional body]

[optional footer]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `chore`: Configuration/setup changes
- `docs`: Documentation updates
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests

**Examples:**

```bash
feat: add AI tutor streaming backend
fix: correct Prisma course file relation
chore: update Tailwind theme tokens
docs: add API documentation for tutor endpoints
```

### Pushing Your Branch

```bash
git push origin feature/<feature-name>
```

### Creating a Pull Request

1. Push your branch to GitHub
2. Create a Pull Request targeting `develop`
3. Fill out the PR template
4. Wait for CI checks to pass
5. Request review from team members
6. Merge using **"Create a merge commit"** (--no-ff)

### Before Merging

```bash
# Rebase on latest develop to keep history clean
git checkout feature/<feature-name>
git fetch origin
git rebase origin/develop
git push --force-with-lease
```

## 🚀 Releases

### Release Process

Use the automated release script:

```bash
pnpm release 1.1.0
```

This will:

1. ✅ Run all checks (lint, typecheck, build)
2. ✅ Merge `develop` → `main`
3. ✅ Create version tag (e.g., `v1.1.0`)
4. ✅ Push main and tag to GitHub
5. ✅ Trigger auto-deploy via GitHub Actions

### Manual Release

If needed, you can release manually:

```bash
git checkout main
git pull origin main
git merge --no-ff develop -m "chore: release v1.1.0"
git tag -a v1.1.0 -m "Release v1.1.0"
git push origin main --tags
```

### PR Merge Checklist

Before merging any PR to `develop`:

- [ ] ✅ Tests pass (unit + e2e)
- [ ] ✅ Lint + build succeed
- [ ] ✅ No console warnings
- [ ] ✅ CHANGELOG updated
- [ ] ✅ PR title follows conventional format

### Semantic Versioning

Use `vX.Y.Z` format:

- **X** (Major): Breaking changes
- **Y** (Minor): New features, backwards compatible
- **Z** (Patch): Bug fixes, backwards compatible

## 🔥 Hotfixes

For critical production issues:

```bash
git checkout main
git pull origin main
git checkout -b hotfix/<issue-name>

# Make fixes, commit, push
git push origin hotfix/<issue-name>

# After merging to main, backport to develop
git checkout develop
git merge --no-ff hotfix/<issue-name>
git push origin develop
```

## 🧹 Branch Hygiene

- Delete merged branches after successful merge
- Keep branches small and focused
- Rebase before PR to avoid merge conflicts
- Never commit directly to `main` or `develop`

## 🔒 Protected Branches

Both `main` and `develop` are protected:

- Require pull request reviews
- Require status checks to pass
- No force pushes allowed
- No direct commits

## 📋 Quick Reference

```bash
# === FEATURE WORKFLOW ===
# Create feature branch (automated)
pnpm feature:new my-feature

# Or manually:
git checkout develop && git pull
git checkout -b feature/my-feature
# ... make changes ...
git add . && git commit -m "feat: add my feature"
git push origin feature/my-feature
# Create PR → Merge to develop

# Merge feature (automated, with checks)
pnpm feature:merge my-feature


# === RELEASE WORKFLOW ===
# Create release (automated)
pnpm release 1.1.0

# Or manually:
git checkout main && git pull
git merge --no-ff develop -m "chore: release v1.1.0"
git tag -a v1.1.0 -m "Release v1.1.0"
git push origin main --tags
```

## 📚 Related Docs

- [CHANGELOG.md](./docs/CHANGELOG.md) - Version history
- [ROADMAP.md](./docs/ROADMAP.md) - Planned features
