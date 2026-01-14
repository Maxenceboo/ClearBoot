# SonarCloud Integration

Ce projet utilise SonarCloud pour l'analyse de qualité du code.

## Configuration

### 1. Fichiers ajoutés
- `sonar-project.properties` - Configuration SonarCloud
- `.github/workflows/sonarcloud.yml` - GitHub Action pour l'analyse automatique

### 2. Configuration sur SonarCloud.io

1. **Connectez-vous** sur [sonarcloud.io](https://sonarcloud.io) avec votre compte GitHub
2. **Importez le projet** `Maxenceboo/clearboot`
3. **Créez un token** dans votre compte SonarCloud (My Account → Security)
4. **Ajoutez le secret** dans GitHub:
   - Allez dans Settings → Secrets and variables → Actions
   - Créez `SONAR_TOKEN` avec le token généré

### 3. Lancer l'analyse

#### Manuellement (local)
```bash
# Installer sonar-scanner
npm install -g sonar-scanner

# Générer la couverture
npm run test:cov

# Lancer l'analyse
npm run sonar
```

#### Automatiquement (GitHub Actions)
L'analyse se lance automatiquement sur:
- Push sur `main` ou `dev`
- Pull requests

### 4. Métriques suivies

- **Coverage**: >80% (actuel: 100%)
- **Bugs**: 0
- **Vulnerabilities**: 0
- **Code Smells**: <10
- **Duplications**: <3%
- **Security Hotspots**: 0

### 5. Badge Quality Gate

Ajoutez ce badge au README:

```markdown
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Maxenceboo_clearboot&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Maxenceboo_clearboot)
```

### 6. Exclusions configurées

- `node_modules/**`
- `dist/**`
- `coverage/**`
- `**/*.test.ts`
- `test/**`
- `**/*.d.ts`
- `docs/**`

### 7. Voir les résultats

Dashboard: https://sonarcloud.io/dashboard?id=Maxenceboo_clearboot

---

## Commandes

```bash
# Tests avec couverture
npm run test:cov

# Analyse SonarCloud locale
npm run sonar
```
