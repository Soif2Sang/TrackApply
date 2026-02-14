# Plan d'implémentation : Système de Traitement d'Emails Gmail

## Objectif
Remplacer n8n par une solution native utilisant PG-Boss pour le traitement asynchrone des emails de recrutement.

## Architecture

Gmail API
  | Push Notifications              | Poll (cron)
  v                                 v
POST /webhooks/gmail           Cron: sync-old-emails
  |                                       |
  v                                       v
PG-Boss Queue
  - process-email (extraction)
  - analyze-content (Gemini AI)
  - label-email (Gmail API)
              |
              v
jobTracking.receiveEmail (tRPC) - Logique existante inchangée

## 1. Dépendances

npm install pg-boss googleapis @google-cloud/pubsub zod node-cron
npm install -D @types/node-cron

## 2. Variables d'environnement

GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
GMAIL_REDIRECT_URI=http://localhost:3002/auth/gmail/callback

GOOGLE_CLOUD_PROJECT_ID=...
PUBSUB_TOPIC_NAME=gmail-notifications-topic
PUBSUB_SUBSCRIPTION_NAME=gmail-notifications-sub
PUBSUB_VERIFICATION_TOKEN=...

GEMINI_API_KEY=...
EMAIL_PROCESSING_BATCH_SIZE=50
EMAIL_SYNC_MAX_AGE_DAYS=90

## 3. Structure des fichiers

apps/server/src/
├── jobs/
│   ├── boss.ts                 # Instance PG-Boss
│   ├── handlers/
│   │   ├── process-email.ts    # Extraction Gmail
│   │   ├── analyze-content.ts  # Classification Gemini
│   │   └── label-email.ts      # Application labels
│   └── schedule.ts             # Cron jobs
├── lib/
│   ├── gmail-client.ts         # Client Gmail API
│   ├── gemini-client.ts        # Client Gemini AI
│   └── pubsub.ts               # Handler Pub/Sub
├── routes/
│   └── webhooks.ts             # Routes webhook Hono

## 4. Jobs PG-Boss

### process-email
- Input: { emailId, userId, historyId? }
- Retries: 3
- ExpireIn: 5 minutes

### analyze-content
- Input: { emailData, userId }
- Retries: 2
- ExpireIn: 30 secondes

### label-email
- Input: { threadId, labelIds[], userId }
- Retries: 3
- ExpireIn: 1 minute

## 5. Configuration PG-Boss

import PgBoss from 'pg-boss';

export const boss = new PgBoss({
  connectionString: process.env.DATABASE_URL,
  schema: 'public',
  retentionDays: 7,
});

await boss.start();

## 6. Configuration Gmail Push

1. Activer Gmail API + Pub/Sub API dans Google Cloud
2. Creer topic Pub/Sub avec push vers /webhooks/gmail
3. Configurer watch Gmail:

curl https://www.googleapis.com/gmail/v1/users/me/watch \
  -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"topicName":"projects/PROJECT/topics/TOPIC","labelIds":["INBOX"]}'

## 7. Migration depuis n8n

### Conservé (inchangé)
- Router tRPC jobTracking.receiveEmail
- Schéma DB
- Authentification API key

### Remplacé
- Webhook n8n -> Route Hono /webhooks/gmail
- Code nodes n8n -> Jobs PG-Boss
- Trigger n8n -> Cron + Gmail Push

## 8. Checklist validation

- [ ] PG-Boss démarre sans erreur
- [ ] Webhook reçoit notifications Pub/Sub
- [ ] Jobs créés pour nouveaux emails
- [ ] Classification Gemini fonctionne
- [ ] Labels Gmail appliqués
- [ ] Données enregistrées via tRPC
- [ ] Cron pour anciens mails OK
- [ ] Retries en cas d'échec
- [ ] Pas de duplication

## Notes

- PG-Boss utilise PostgreSQL existant (pas de Redis)
- Tables créées automatiquement au démarrage
- Multi-instance supporté (lock DB)
