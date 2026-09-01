# Application de paiement Chariow

Application indépendante de DRAWORFIT. La clé Chariow reste uniquement côté serveur.

## Démarrer

1. Copiez `.env.example` vers `.env` et renseignez `CHARIOW_API_KEY`, `CHARIOW_WEBHOOK_SECRET` et `APP_URL`.
2. Lancez `npm run dev` (Node 20+), puis ouvrez `http://localhost:3000`.
3. Déployez ce dossier comme service séparé. En production, configurez les variables d’environnement dans l’hébergeur — ne téléversez jamais `.env`.

## Chariow

- Créez une clé API dans Chariow, puis placez-la dans `CHARIOW_API_KEY`.
- Créez un Pulse pour `https://votre-domaine/webhooks/chariow`, sélectionnez `successful.sale` et conservez son secret dans `CHARIOW_WEBHOOK_SECRET`.
- Cette application crée une session via `POST https://api.chariow.com/v1/checkout`, puis redirige le client vers l’URL de paiement renvoyée par Chariow.

Le webhook vérifie la signature HMAC SHA-256 `x-chariow-signature` et déduplique `x-pulse-delivery-id` en mémoire. Pour une vraie production multi-instance, remplacez ce stockage en mémoire par une base de données ou Redis.
