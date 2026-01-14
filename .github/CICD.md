# CI/CD Pipeline

Simple CI/CD with GitHub Actions: test, build, and publish.

## Workflows

### CI (`ci.yml`)

Triggered on push to `main`/`dev`/`feature/**` and pull requests.

**Jobs:**
- **Tests**: Node 18.x, 20.x, 22.x matrix; runs `npm test` and coverage
- **Build**: Compiles TypeScript; saves `dist/` artifact

### Publish (`publish.yml`)

Triggered on push to `main` when `package.json` version changes (or manual trigger).

**Actions:**
- Detects version change
- Verifies version not already on npm
- Runs tests and build
- Publishes to npm (if new version)
- Creates git tag

### Deepsource

Code quality analysis runs automatically on PR/push via [Deepsource](https://deepsource.io).
Config: [.deepsource.yaml](.deepsource.yaml)

## Setup

### NPM Token

Set in **Settings → Secrets and variables → Actions**:

| Secret | Source |
|--------|--------|
| `NPM_TOKEN` | https://www.npmjs.com/settings/~/tokens |

### Deepsource

1. Go to https://deepsource.io and sign up with GitHub
2. Activate repository: `Maxenceboo/ClearBoot`
3. No additional config needed — Deepsource auto-analyzes PRs/pushes

## Secrets

Set in **Settings → Secrets and variables → Actions**:

| Secret | Source |
|--------|--------|
| `NPM_TOKEN` | https://www.npmjs.com/settings/~/tokens |


## Publish

1. Bump version in `package.json`:
   ```bash
   npm version patch
   ```

2. Push to `main`:
   ```bash
   git push origin main
   ```

CI automatically publishes if version changed.

## Local Testing

```bash
npm ci
npm test
npm run build
npm run test:cov
```
