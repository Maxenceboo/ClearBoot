# CI/CD Pipeline Documentation

ClearBoot utilise GitHub Actions pour l'intégration et le déploiement continus.

## 🔄 Workflows disponibles

### 1. **CI/CD Pipeline** (`ci.yml`)

**Déclenché sur:**
- Push sur `main`, `dev`, ou branches `feature/**`
- Pull requests vers `main` ou `dev`

**Jobs:**

#### Test & Quality
- Teste sur Node.js 18.x, 20.x, 22.x
- Exécute `npm test`
- Génère la couverture de code
- Upload sur Codecov

#### Build
- Compile TypeScript
- Sauvegarde les artefacts (`dist/`)


---

### 2. **Publish to npm** (`publish.yml`)

**Déclenché sur:**
- Push sur `main` qui modifie `package.json`
- Manuellement via workflow_dispatch

**Actions:**
- ✅ Détecte si la version a changé
- ✅ Vérifie que la version n'existe pas déjà sur npm
- ✅ Exécute les tests
- ✅ Build le projet
- ✅ Publie sur npm (si nouvelle version)
- ✅ Crée un tag git automatiquement

**Configuration requise:**
Ajouter `NPM_TOKEN` dans GitHub Secrets (Settings → Secrets → Actions)

**Usage:**
1. Modifiez la version dans `package.json`
2. Commit et push sur `main`
3. La publication se fait automatiquement

---

---

## 🔐 Secrets requis

Ajoutez ces secrets dans **Settings → Secrets and variables → Actions**:

| Secret | Description | Obtention |
|--------|-------------|-----------|
| `NPM_TOKEN` | Token npm pour publication | https://www.npmjs.com/settings/~/tokens |
| `GITHUB_TOKEN` | Auto-fourni par GitHub | Automatique |

---

## 📊 Badges pour le README

```markdown
![CI/CD](https://github.com/Maxenceboo/clearboot/workflows/CI%2FCD%20Pipeline/badge.svg)
[![Coverage](https://codecov.io/gh/Maxenceboo/clearboot/branch/main/graph/badge.svg)](https://codecov.io/gh/Maxenceboo/clearboot)
[![npm version](https://badge.fury.io/js/clearboot.svg)](https://www.npmjs.com/package/clearboot)
```

---

## 🚀 Utilisation

### Publier une nouvelle version

**Workflow automatique:**
1. Modifiez la version dans `package.json`:
   ```bash
   npm version patch  # 2.0.3 → 2.0.4
   # ou
   npm version minor  # 2.0.3 → 2.1.0
   # ou
   npm version major  # 2.0.3 → 3.0.0
   ```

2. Commit et push sur `main`:
   ```bash
   git add package.json package-lock.json
   git commit -m "chore: bump version to 2.0.4"
   git push origin main
   ```

3. La CI/CD:
   - Détecte le changement de version
   - Exécute les tests
   - Build le projet
   - Publie sur npm
   - Crée le tag git `v2.0.4`

**Méthode manuelle:**
1. Allez dans Actions → Publish to npm
2. Cliquez "Run workflow"
3. Sélectionnez `main`
4. Run

### Tester localement

```bash
# Simuler le workflow CI
npm ci
npm test
npm run build

# Avec couverture
npm run test:cov

 
```

---

## 📈 Métriques suivies

- ✅ **Tests**: 125 tests (100% passing)
- ✅ **Coverage**: 100%
- ✅ **Build**: TypeScript compilation
- ✅ **Security**: Dependabot alerts
- ✅ **Node versions**: 18.x, 20.x, 22.x

---

## 🔧 Maintenance

### Publication automatique
La publication se fait automatiquement quand la version change dans `package.json` et que c'est pushé sur `main`.

### Dépendances
Dependabot crée des PRs automatiques. Vous devez les merger manuellement après vérification des tests.

### Versions Node.js
Modifier la matrice dans `.github/workflows/ci.yml`:
```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x, 22.x]
```

### Cache npm
Le cache npm est activé pour accélérer les builds:
```yaml
with:
  cache: 'npm'
```

---

## 📝 Workflow de développement

```bash
# Créer une feature
git checkout dev
git checkout -b feature/ma-feature

# Développer + tests
npm test

# Commit
git commit -m "feat: description"

# Push (déclenche CI/CD)
git push origin feature/ma-feature

# Créer PR vers dev → Tests automatiques
# Merger manuellement après review

# Quand prêt à publier:
git checkout main
git merge dev
npm version patch  # Bump la version
git push origin main  # → Publication automatique sur npm
```

---

## ⚠️ Troubleshooting

### Tests échouent en CI mais passent localement
- Vérifier les versions Node.js
- Nettoyer cache: `npm ci` au lieu de `npm install`

### Publication npm échoue
- Vérifier que `NPM_TOKEN` est configuré
- Vérifier les droits du token (Publish packages)
- Version déjà publiée? Bumper la version

---

## 🎯 Prochaines étapes

- [ ] Ajouter ESLint/Prettier checks
- [ ] Performance benchmarks
- [ ] E2E tests
- [ ] Docker image publishing
- [ ] Changelog automation
