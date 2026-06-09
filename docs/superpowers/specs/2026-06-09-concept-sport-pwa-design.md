# Concept Sport PWA — Design Spec
*Date : 2026-06-09*

## Contexte

Concept Sport SARL fabrique et distribue des équipements de fitness outdoor et terrains multisports. L'objectif est de guider les utilisateurs sur l'utilisation correcte de chaque agrès via un QR code collé dessus. L'utilisateur scanne le QR code, une PWA s'ouvre dans le navigateur mobile sans téléchargement, et lui présente les vidéos de démonstration ainsi que les instructions de posture, mouvement, muscles ciblés et conseils coach.

## Architecture

### Approche retenue : SPA avec hash routing

Un seul fichier `index.html`. Le JavaScript gère la navigation via le fragment `#` de l'URL. Compatible GitHub Pages sans configuration serveur.

- Page accueil → `conceptsport.github.io/app/`
- Fiche agrès → `conceptsport.github.io/app/#capsule/{id}`

### Structure des fichiers

```
ConceptSport-App/
├── index.html            ← page unique, toute la navigation ici
├── app.css               ← styles mobile-first, thème Concept Sport
├── app.js                ← routing hash + rendu des vues
├── data.json             ← toute la donnée (agrès, exercices, vidéos)
├── manifest.json         ← PWA (icône, nom, couleurs, display standalone)
├── service-worker.js     ← cache offline (HTML, CSS, JS, JSON, vidéos)
├── capsule/              ← vidéos MP4 (existant)
│   ├── 2945_AGRES_A_DIPS_SEMI-AMPLITUDE_1.mp4
│   ├── 8100_ANNEAUX_TIRAGE_JAMBES_PLIEES.mp4
│   ├── 8103_ANNEAUX_TIRAGE.mp4
│   └── 8388_CAPSULE_ANNEAUX_SQUAT_TIRAGE.mp4
├── qrcodes/              ← QR codes PNG générés automatiquement
│   ├── qr-accueil.png
│   └── qr-{id}.png par agrès
└── docs/
    └── superpowers/specs/
        └── 2026-06-09-concept-sport-pwa-design.md
```

### Hébergement

- **Code PWA** : GitHub Pages (gratuit, illimité pour fichiers légers)
- **Vidéos** : dans le repo `capsule/` (limite 1 GB repo GitHub). Migration vers Cloudflare R2 (10 GB gratuits, bande passante gratuite) quand le repo approche 1 GB — seules les URLs dans `data.json` changent, aucun code à modifier.

## Structure des données (`data.json`)

```json
{
  "equipements": [
    {
      "id": "anneaux",
      "nom": "Anneaux de Gymnaste",
      "categorie": "Haut du corps",
      "description": "Développe force, stabilité et coordination du haut du corps.",
      "thumbnail": "capsule/thumbs/anneaux.jpg",   // optionnel — fallback : dégradé coloré auto selon catégorie
      "exercices": [
        {
          "id": "anneaux-tirage",
          "titre": "Tirage aux Anneaux",
          "niveau": 2,
          "duree": "3 séries × 8 répétitions",
          "video": "capsule/8103_ANNEAUX_TIRAGE.mp4",
          "muscles": [
            { "nom": "Dorsaux", "zone": "dos" },
            { "nom": "Biceps", "zone": "bras" },
            { "nom": "Trapèzes", "zone": "dos" }
          ],
          "posture": [
            "Bras tendus, corps gainé",
            "Épaules abaissées et loin des oreilles",
            "Regard vers l'avant, nuque dans l'axe"
          ],
          "mouvement": [
            "Inspirez et amorcez la traction",
            "Tirez les anneaux vers les hanches",
            "Descendez lentement en 3 secondes"
          ],
          "conseil_coach": "Gardez les coudes proches du corps pour maximiser l'activation des dorsaux."
        }
      ]
    }
  ]
}
```

**Champs clés :**
- `id` : identifiant URL (ex: `anneaux` → `#capsule/anneaux`)
- `niveau` : 1 = débutant, 2 = intermédiaire, 3 = confirmé
- `muscles[].zone` : `dos`, `bras`, `jambes`, `abdos`, `épaules`, `pectoraux` — utilisé pour coloriser les chips
- `posture` et `mouvement` : tableaux ordonnés, affichés en étapes numérotées
- `conseil_coach` : mise en avant visuelle sur la fiche

## Interface utilisateur

### Design system

| Élément | Valeur |
|---|---|
| Fond header/vidéo | `#0f172a` (bleu nuit) |
| Accent | `#f97316` (orange vif) |
| Fond contenu | `#f8fafc` (blanc cassé) |
| Texte principal | `#1e293b` |
| Typographie | System-UI, grande taille, lisible en plein soleil |

### Écran 1 — Page d'accueil

- Header : logo Concept Sport + tagline "Scannez. Apprenez. Progressez."
- Filtres catégorie : chips horizontaux scrollables (Haut du corps, Bas du corps, Full Body, Cardio)
- Grille 2 colonnes : cards équipements avec thumbnail, nom, niveau moyen, nombre d'exercices
- Tap sur une card → navigation vers `#capsule/{id}`

### Écran 2 — Fiche agrès

- Bouton retour → accueil
- Lecteur vidéo plein largeur : autoplay muet en boucle, tap pour activer le son
- Tabs exercices si plusieurs exercices sur cet agrès
- Pour l'exercice sélectionné :
  - Titre + niveau (étoiles) + durée recommandée
  - Chips muscles colorées par zone anatomique
  - Section Posture : étapes numérotées
  - Section Mouvement : étapes numérotées
  - Encart "Conseil du Coach" mis en avant (fond orange)

### Écran 3 — Page d'impression QR codes

- Accessible depuis un menu discret en bas d'écran
- Affiche tous les QR codes avec leur nom d'agrès
- Optimisée pour impression (CSS print)

## PWA

### manifest.json

- `name` : "Concept Sport Fitness"
- `short_name` : "CS Fitness"
- `display` : `standalone` (plein écran, pas de barre navigateur)
- `theme_color` : `#0f172a`
- `background_color` : `#0f172a`
- Icônes : 192×192 et 512×512

### service-worker.js — Stratégie cache

- **Cache-first** pour HTML, CSS, JS, JSON, images : toujours rapide
- **Cache-then-network** pour les vidéos : lit depuis le cache si disponible, sinon charge et met en cache
- Mise à jour : quand le service worker détecte une nouvelle version, il notifie l'utilisateur et recharge

## QR codes

Générés via la librairie `qrcode.js` (légère, vanilla JS, sans dépendance serveur). Au chargement de la page d'impression, le JS génère un canvas par agrès depuis `data.json`. Chaque QR code est téléchargeable en un clic (bouton "Télécharger PNG" sous chaque QR). Un bouton "Tout télécharger" génère un ZIP de tous les QR codes.

Format des URLs encodées :
- Accueil : `https://[username].github.io/ConceptSport-App/`
- Agrès : `https://[username].github.io/ConceptSport-App/#capsule/{id}`

> **Note déploiement :** remplacer `[username]` par le nom du compte GitHub Concept Sport lors de la configuration initiale. Cette valeur sera stockée dans `data.json` (champ `baseUrl`) pour que les QR codes se génèrent avec la bonne URL sans toucher au code.

## Flux d'ajout d'un nouvel agrès

1. Déposer la vidéo MP4 dans `capsule/`
2. Ajouter un bloc JSON dans `data.json`
3. Déployer sur GitHub (git push)
4. Ouvrir la page d'impression → télécharger le nouveau QR code PNG
5. Imprimer et coller sur l'agrès

Aucune modification de code requise.

## Contraintes et décisions

| Contrainte | Décision |
|---|---|
| Pas de téléchargement app | PWA native dans le navigateur |
| Usage terrain, plein soleil | Grande typo, contrastes forts, interface épurée |
| Beaucoup d'agrès à terme | Données dans `data.json`, code générique |
| Stockage vidéo limité | Repo GitHub pour l'instant, Cloudflare R2 si >1 GB |
| Utilisateur non-tech doit pouvoir ajouter des agrès | Seul `data.json` à modifier |
