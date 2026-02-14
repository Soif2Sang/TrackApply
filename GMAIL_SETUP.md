# Guide d'activation Gmail API + Pub/Sub

## Étape 1 : Accéder à Google Cloud Console

1. Allez sur https://console.cloud.google.com/
2. Connectez-vous avec votre compte Google
3. Sélectionnez ou créez un projet

## Étape 2 : Activer les APIs

### 2.1 Activer Gmail API
1. Menu hamburger (☰) → **APIs & Services** → **Library**
2. Recherchez **"Gmail API"**
3. Cliquez sur **Gmail API**
4. Cliquez sur **ENABLE**

### 2.2 Activer Pub/Sub API
1. Retournez dans **APIs & Services** → **Library**
2. Recherchez **"Cloud Pub/Sub API"**
3. Cliquez sur **Cloud Pub/Sub API**
4. Cliquez sur **ENABLE**

## Étape 3 : Créer les credentials OAuth 2.0

1. Menu hamburger (☰) → **APIs & Services** → **Credentials**
2. Cliquez sur **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Si demandé, configurez l'écran de consentement OAuth :
   - **User Type** : External
   - Remplissez les informations (nom app, email support, etc.)
   - Scopes : Ajoutez `https://www.googleapis.com/auth/gmail.modify`
   - Ajoutez votre email comme test user
4. Créez le client ID :
   - **Application type** : Web application
   - **Name** : Job Tracker Web Client
   - **Authorized redirect URIs** :
     - `http://localhost:3002/auth/gmail/callback` (dev)
     - `https://api.soif2sang.xyz/auth/gmail/callback` (prod)
5. Cliquez **CREATE**
6. **Copiez le Client ID et Client Secret** dans votre `.env`

## Étape 4 : Configurer Pub/Sub

### 4.1 Créer un Topic
1. Menu hamburger (☰) → **Pub/Sub** → **Topics**
2. Cliquez sur **CREATE TOPIC**
3. **Topic ID** : `gmail-notifications`
4. Cliquez **CREATE TOPIC**

### 4.2 Créer une Subscription (Push)
1. Cliquez sur votre topic `gmail-notifications`
2. Onglet **Subscriptions** → **CREATE SUBSCRIPTION**
3. **Subscription ID** : `gmail-notifications-push`
4. **Delivery type** : **Push**
5. **Endpoint URL** : `https://api.soif2sang.xyz/webhooks/gmail?token=VOTRE_TOKEN_SECRET`
   
   ⚠️ **Important** : Ajoutez `?token=VOTRE_TOKEN_SECRET` à la fin de l'URL
   
6. **Enable authentication** : **DÉCOCHEZ** (on utilise un token secret dans l'URL)
7. Cliquez **CREATE**

## Étape 5 : Configurer le Watch Gmail

Après avoir démarré votre serveur, exécutez ce script pour activer les notifications push :

```bash
# Remplacez YOUR_ACCESS_TOKEN par un token OAuth2 valide
curl "https://www.googleapis.com/gmail/v1/users/me/watch" \
  -X POST \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topicName": "projects/YOUR_PROJECT_ID/topics/gmail-notifications",
    "labelIds": ["INBOX"],
    "labelFilterAction": "include"
  }'
```

**Réponse attendue :**
```json
{
  "historyId": "12345",
  "expiration": "1234567890000"
}
```

⚠️ **Important** : Le watch expire après 7 jours. Il faut le renouveler automatiquement via un cron job.

## Étape 6 : Configurer les variables d'environnement

1. **Générez un token secret aléatoire** (pour sécuriser le webhook) :
   ```bash
   # Sur Linux/Mac
   openssl rand -hex 32
   
   # Sur Windows (PowerShell)
   -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
   ```

2. **Dans votre fichier `.env`** :

```bash
# Gmail OAuth
GMAIL_CLIENT_ID=xxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=xxx
GMAIL_REDIRECT_URI=http://localhost:3002/auth/gmail/callback

# Pub/Sub
GOOGLE_CLOUD_PROJECT_ID=your-project-id
PUBSUB_VERIFICATION_TOKEN=le-token-secret-généré-au-dessus

# Gemini
GEMINI_API_KEY=xxx
```

## Étape 7 : Vérification

1. **Démarrez votre serveur** : `npm run dev`
2. **Vérifiez les logs** : Vous devriez voir "✅ PG-Boss started successfully"
3. **Testez le webhook** : Envoyez un email à votre adresse Gmail
4. **Vérifiez les jobs** : Les logs devraient montrer le traitement de l'email

## Résolution des problèmes courants

### Erreur "Push notifications not enabled"
- Vérifiez que Gmail API est bien activée
- Vérifiez que le projet a un compte de facturation (même gratuit)

### Erreur "Unauthorized webhook"
- Vérifiez que le token dans l'URL du webhook correspond à `PUBSUB_VERIFICATION_TOKEN`
- Vérifiez que l'endpoint HTTPS est accessible publiquement

### Erreur "Token expired"
- Renouvelez le watch Gmail (étape 5)
- Le refresh token est géré automatiquement par le service

## Architecture du flux complet

```
Nouvel email dans Gmail
        ↓
Gmail envoie notification Pub/Sub
        ↓
POST /webhooks/gmail (votre serveur)
        ↓
Sync des emails récents
        ↓
Jobs PG-Boss (process → analyze → label)
        ↓
Données enregistrées en DB
```

---

**Besoin d'aide sur une étape spécifique ?**
