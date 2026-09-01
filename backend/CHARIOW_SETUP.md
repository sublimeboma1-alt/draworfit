# Paiement Chariow

Le paiement est intégré au backend Django. Il n'est pas nécessaire de déployer
`chariow-payment-app` : ce dossier est l'ancien prototype indépendant.

1. Dans Chariow, créez et publiez un produit téléchargeable par document, avec
   le même prix et la même devise que le document Draworfit.
2. Ajoutez les trois variables de `backend/.env.example` dans Railway (ou dans
   votre environnement de production).
3. Dans l'administration Draworfit, ouvrez chaque document et renseignez son
   `chariow_product_id` (format `prd_...`).
4. Dans Chariow, créez un Pulse HTTPS sur
   `https://votre-domaine/api/sales/webhooks/chariow/`, pour l'événement
   `successful.sale`. Copiez son secret dans `CHARIOW_WEBHOOK_SECRET`.

Le webhook signé est la seule preuve de paiement : la redirection client ne
débloque aucun document. Les livraisons sont dédupliquées en base de données et
une vente valide crée automatiquement les licences Draworfit.
