# Paiement Chariow Snap

Chaque livre utilise uniquement le widget Snap de Chariow. Aucune clé API,
aucun checkout API et aucun webhook ne sont nécessaires pour *afficher* le
bouton, mais le **webhook Pulse est indispensable** pour savoir qui a payé
quel produit et créer automatiquement la licence.

## Configuration du livre

1. Dans Chariow, ouvrez **Marketing > Snap** et créez un Snap pour le produit.
2. Copiez le code HTML complet, qui commence par `<div id="chariow-widget"`.
3. Dans Draworfit > Superadmin > Documents, collez-le dans **Code HTML Snap
   Chariow** puis enregistrez le livre.
4. Copiez l'**ID du produit Chariow** (commence par `prd_`, visible dans le
   Snap ou la fiche produit) et collez-le dans le champ **ID produit Chariow
   (prd_)** du même livre, puis enregistrez.

Le widget apparaît directement sur la page du livre. Si le champ est vide, le
livre affiche « Ce livre n’est pas encore disponible à l’achat ».

## Webhook Pulse (obligatoire pour la livraison)

1. Dans Chariow, ouvrez **Pulse** et créez un webhook pour l'URL :
   `https://votre-domaine/api/sales/webhooks/chariow/`
2. Sélectionnez l'événement **`successful.sale`** et notez le **secret** fourni.
3. Configurez ce secret dans les variables d'environnement du backend :
   - `CHARIOW_WEBHOOK_SECRET` : le secret du Pulse
   - `CHARIOW_REDIRECT_URL` : l'URL publique du site (ex. `https://draworfit.example.com`)

À chaque paiement réussi, le webhook crée (ou retrouve) la commande du livre
via le `prd_...`, associe l'acheteur par son e-mail, puis génère la licence
avec un code d'activation visible dans **Superadmin > Licences**.
