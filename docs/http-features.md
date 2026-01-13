# Phase 3: HTTP Features - Cookies, Forms & File Upload

ClearBoot v2 supporte maintenant les **Cookies**, **Form Data** (application/x-www-form-urlencoded) et **Upload de Fichiers** (multipart/form-data).

---

## 🍪 Cookies

### Lire les Cookies avec `@Cookie`

Le décorateur `@Cookie` permet d'extraire facilement les cookies envoyés par le client.

```typescript
import { Controller, Get, Cookie } from 'clearboot';

@Controller('/auth')
class AuthController {
    // Lire un cookie spécifique
    @Get('/session')
    checkSession(@Cookie('sessionId') sessionId: string) {
        if (!sessionId) {
            return { authenticated: false };
        }
        return { authenticated: true, sessionId };
    }

    // Lire tous les cookies
    @Get('/all-cookies')
    getAllCookies(@Cookie() cookies: Record<string, string>) {
        return { cookies };
    }
}
```

### Définir des Cookies avec `res.cookie()`

Utilisez `res.cookie()` pour envoyer des cookies au client avec des options de sécurité.

```typescript
import { Controller, Post, Res, Body } from 'clearboot';
import { ClearResponse } from 'clearboot';

@Controller('/auth')
class AuthController {
    @Post('/login')
    login(@Body() body: any, @Res() res: ClearResponse) {
        // Vérifier les identifiants...
        const sessionId = generateSessionId();

        // Définir un cookie sécurisé
        res.cookie('sessionId', sessionId, {
            httpOnly: true,      // Pas accessible en JavaScript
            secure: true,        // HTTPS uniquement
            maxAge: 3600000,     // 1 heure (en millisecondes)
            sameSite: 'Strict',  // Protection CSRF
            path: '/'            // Disponible partout
        });

        return res.json({ success: true });
    }
}
```

### Options de Cookie Disponibles

```typescript
interface CookieOptions {
    maxAge?: number;      // Durée de vie en millisecondes
    expires?: Date;       // Date d'expiration absolue
    httpOnly?: boolean;   // Non accessible via JavaScript (recommandé)
    secure?: boolean;     // HTTPS uniquement (production)
    sameSite?: 'Strict' | 'Lax' | 'None';  // Protection CSRF
    path?: string;        // Chemin (défaut: '/')
    domain?: string;      // Domaine du cookie
}
```

### Supprimer un Cookie avec `res.clearCookie()`

```typescript
@Post('/logout')
logout(@Res() res: ClearResponse) {
    res.clearCookie('sessionId');
    return res.json({ success: true });
}
```

---

## 📝 Form Data (application/x-www-form-urlencoded)

ClearBoot parse automatiquement les formulaires HTML classiques.

### Exemple de Formulaire HTML

```html
<form action="/contact" method="POST">
    <input type="text" name="name" />
    <input type="email" name="email" />
    <textarea name="message"></textarea>
    <button type="submit">Envoyer</button>
</form>
```

### Contrôleur Backend

```typescript
@Controller('/contact')
class ContactController {
    @Post('/')
    handleContact(@Body() body: any) {
        // body = { name: '...', email: '...', message: '...' }
        console.log('Contact reçu:', body);
        return { success: true };
    }

    // Extraction de champs spécifiques
    @Post('/subscribe')
    subscribe(@Body('email') email: string) {
        // Directement l'email
        return { subscribed: email };
    }
}
```

### Champs Multiples (Arrays)

Les formulaires peuvent envoyer plusieurs valeurs pour le même champ :

```html
<form action="/tags" method="POST">
    <input type="checkbox" name="tags" value="javascript" />
    <input type="checkbox" name="tags" value="typescript" />
    <input type="checkbox" name="tags" value="node" />
    <button type="submit">Envoyer</button>
</form>
```

```typescript
@Post('/tags')
saveTags(@Body('tags') tags: string[]) {
    // tags = ['javascript', 'typescript', 'node']
    return { tags };
}
```

### Content-Type Auto-Détecté

ClearBoot détecte automatiquement le bon parser selon le `Content-Type` :

- `application/json` → JSON parser (déjà existant)
- `application/x-www-form-urlencoded` → Form parser (nouveau)
- `multipart/form-data` → Multipart parser (upload de fichiers)

---

## 📤 Upload de Fichiers (multipart/form-data)

### Exemple Simple

```typescript
import { Controller, Post, Req, Body } from 'clearboot';

@Controller('/upload')
class UploadController {
    @Post('/avatar')
    uploadAvatar(@Req() req: any, @Body() fields: any) {
        const files = req.files || [];
        
        if (files.length === 0) {
            return { error: 'No file uploaded' };
        }

        const file = files[0];
        console.log('Fichier reçu:', {
            name: file.originalName,
            size: file.size,
            type: file.mimeType
        });

        // Sauvegarder le fichier
        fs.writeFileSync(`./uploads/${file.originalName}`, file.buffer);

        return { 
            success: true, 
            filename: file.originalName 
        };
    }
}
```

### Structure d'un Fichier Uploadé

```typescript
interface UploadedFile {
    fieldName: string;      // Nom du champ HTML
    originalName: string;   // Nom du fichier original
    mimeType: string;       // Type MIME (image/png, etc.)
    size: number;           // Taille en bytes
    buffer: Buffer;         // Contenu du fichier
}
```

### Upload Multiple

```typescript
@Post('/documents')
uploadDocuments(@Req() req: any) {
    const files = req.files || [];
    
    return {
        uploaded: files.map(f => ({
            name: f.originalName,
            size: f.size
        }))
    };
}
```

### Formulaire HTML avec Upload

```html
<form action="/upload/avatar" method="POST" enctype="multipart/form-data">
    <input type="text" name="username" />
    <input type="file" name="avatar" />
    <button type="submit">Upload</button>
</form>
```

### Limites de Sécurité

**Fichiers:**
- 10 MB par fichier (MAX_FILE_SIZE)
- 50 MB au total (MAX_TOTAL_SIZE)

**Body (JSON/Form):**
- 1 MB (MAX_BODY_SIZE)

Les limites sont configurables dans le code source si nécessaire.

---

## 🔒 Bonnes Pratiques de Sécurité

### Cookies Sécurisés

```typescript
// ✅ BON - Cookie sécurisé pour auth
res.cookie('sessionId', token, {
    httpOnly: true,      // Protection XSS
    secure: true,        // HTTPS only
    sameSite: 'Strict',  // Protection CSRF
    maxAge: 3600000      // 1 heure
});

// ❌ MAUVAIS - Cookie non sécurisé
res.cookie('sessionId', token);
```

### Validation des Fichiers

```typescript
@Post('/upload')
uploadFile(@Req() req: any) {
    const files = req.files || [];
    const file = files[0];

    // Vérifier le type MIME
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.mimeType)) {
        throw new BadRequestException('Type de fichier non autorisé');
    }

    // Vérifier la taille
    if (file.size > 5 * 1024 * 1024) {
        throw new BadRequestException('Fichier trop volumineux (max 5MB)');
    }

    // Nettoyer le nom de fichier
    const safeName = file.originalName.replace(/[^a-zA-Z0-9.-]/g, '_');

    return { uploaded: safeName };
}
```

### Validation Form Data avec Zod

```typescript
const ContactSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    message: z.string().min(10)
});

@Post('/contact')
@Validate(ContactSchema)
handleContact(@Body() body: any) {
    // Le body est validé par Zod
    return { success: true };
}
```

---

## 🧪 Tests

### Test de Cookies

```typescript
test('devrait lire et écrire des cookies', async () => {
    // Écrire un cookie
    const res1 = await request(server).post('/auth/login');
    const cookie = res1.headers['set-cookie'][0];

    // Lire le cookie
    const res2 = await request(server)
        .get('/auth/session')
        .set('Cookie', cookie);

    expect(res2.body.authenticated).toBe(true);
});
```

### Test de Form Data

```typescript
test('devrait parser les formulaires', async () => {
    const res = await request(server)
        .post('/contact')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('name=Max&email=max@test.com');

    expect(res.body).toMatchObject({
        name: 'Max',
        email: 'max@test.com'
    });
});
```

### Test d'Upload

```typescript
test('devrait uploader un fichier', async () => {
    const res = await request(server)
        .post('/upload/avatar')
        .field('username', 'Max')
        .attach('avatar', Buffer.from('fake image'), 'avatar.png');

    expect(res.body.success).toBe(true);
});
```

---

## ⚠️ Erreurs Courantes

### ❌ Oublier `httpOnly` sur les cookies de session

```typescript
// ❌ DANGEREUX - Accessible en JavaScript (XSS)
res.cookie('token', jwt);

// ✅ SÉCURISÉ
res.cookie('token', jwt, { httpOnly: true });
```

### ❌ Ne pas valider les fichiers uploadés

```typescript
// ❌ MAUVAIS - Accepte n'importe quel fichier
const file = req.files[0];
fs.writeFileSync(`./uploads/${file.originalName}`, file.buffer);

// ✅ BON - Validation avant sauvegarde
if (!file.mimeType.startsWith('image/')) {
    throw new BadRequestException('Only images allowed');
}
```

### ❌ Stocker les fichiers dans le code (production)

```typescript
// ❌ MAUVAIS - Les fichiers disparaissent au redémarrage
fs.writeFileSync('./uploads/file.txt', buffer);

// ✅ BON - Utiliser un stockage cloud
await s3.upload({ Key: filename, Body: buffer });
```

---

## 📊 Résumé des Nouvelles Fonctionnalités

| Feature | Décorateur/API | Usage |
|---------|---------------|-------|
| Lire cookies | `@Cookie('name')` | Extraction cookies client |
| Définir cookies | `res.cookie(name, value, opts)` | Envoyer cookies au client |
| Supprimer cookies | `res.clearCookie(name)` | Expirer un cookie |
| Form data | `@Body()` | Parse automatique (urlencoded) |
| Upload fichiers | `req.files` | Accès aux fichiers uploadés |

---

## ✅ Checklist Phase 3

- [x] Parser de cookies (`parseCookies`)
- [x] `@Cookie` décorateur
- [x] `res.cookie()` et `res.clearCookie()`
- [x] Parser Form Data (`parseFormData`)
- [x] Parser Multipart (`parseMultipart`)
- [x] Auto-détection Content-Type
- [x] Tests cookies
- [x] Tests form-data
- [x] Tests file upload
- [x] Documentation complète

---

## 🚀 Prochain: Phase 4 - Optimisations

La prochaine phase ajoutera:
- Optimisation du routing (Radix Tree)
- Request Scoping avancé
- Performance monitoring
