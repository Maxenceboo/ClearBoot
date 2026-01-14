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
