# 🚗 Dr Driving Africa

Jeu de course-conduite **en 3D** (Three.js/WebGL), caméra à la troisième personne façon
arcade, sur le thème de l'Afrique de l'Ouest. Roule dans une rue de ville animée et
nocturne à double sens de circulation, esquive le trafic (y compris les voitures en
face, façon "tout le risque est permis"), et relève des défis.

> **Note d'honnêteté sur le périmètre** : ceci est un jeu web (navigateur), pas une
> application mobile native. Le rendu est en 3D stylisée basse-poly avec un éclairage
> dynamique — pas photoréaliste façon AAA (ça demanderait des assets 3D texturés
> professionnels hors de portée ici). Les véhicules sont des silhouettes génériques par
> catégorie (citadine / berline / SUV / bolide), **sans nom ni logo de marque réelle**,
> pour éviter tout problème de droit d'auteur. Voir la Roadmap ci-dessous pour ce qui
> reste à construire (autres biomes, multijoueur).

## Concept actuel (v2 — Phase 1 : fondation 3D)

- **Moteur 3D réel** avec caméra de poursuite, éclairage (ambiance + directionnelle +
  phares du joueur), brouillard atmosphérique, ciel en dégradé, ombres portées.
- **Route à double sens** : 2 voies dans le sens du joueur, 2 voies de trafic en face
  (vitesse de rapprochement combinée = très risqué si tu empiètes pour doubler).
- **Embouteillages dynamiques** : des zones de trafic ralenti apparaissent le long du
  trajet, forçant à ralentir et slalomer.
- **4 classes de véhicules** sélectionnables (Citadine, Berline Sport, SUV Tout-Terrain,
  Bolide), chacune avec ses propres caractéristiques (vitesse, accélération, tenue de
  route) et plusieurs couleurs.
- **4 pilotes** sélectionnables (bustes bas-poly simples, visibles au volant).
- **3 défis** : Survie, Contre-la-montre, Zéro Collision.
- **Score**, bonus "Presque !" pour les évitements de justesse, meilleurs scores
  sauvegardés localement par route/défi.
- Obstacles variés (nids-de-poule, dos d'âne, débris, cônes, animal qui traverse).

## Contrôles

- **Flèches** ou **ZQSD** : diriger / accélérer / freiner
- **Échap** ou **P** : pause
- Boutons tactiles à l'écran sur mobile

## Démarrer le projet

```bash
npm install
npm run dev
```

Puis ouvre l'URL affichée (par défaut http://localhost:5173).

### Build de production

```bash
npm run build
npm run preview
```

## Stack technique

- [Vite](https://vitejs.dev/) + TypeScript
- [Three.js](https://threejs.org/) (WebGL) pour la scène 3D, la caméra, l'éclairage et
  les ombres — aucun moteur de jeu externe
- Sauvegarde des meilleurs scores via `localStorage`

## Structure du code

```
src/
  main.ts              Menu (pilote/véhicule/route/défi), aperçu 3D, câblage des écrans
  style.css             Thème visuel, HUD, menus, contrôles tactiles
  world/
    Game3D.ts            Scène, boucle de jeu, caméra, collisions, HUD, fin de partie
    PlayerController.ts   Physique du véhicule du joueur (accélération, direction)
    carFactory.ts          Construction procédurale des véhicules et des pilotes (3D)
    cityTrack.ts            Route, marquage au sol, tuiles de ville recyclées, ciel
    traffic.ts               Génération et gestion du trafic + obstacles
    Preview.ts                Mini-scène 3D pour l'aperçu dans le menu
    input.ts                   Clavier + contrôles tactiles
    storage.ts                  Meilleurs scores (localStorage)
    types.ts                     Configuration des routes, défis, véhicules, pilotes
    utils.ts                      Fonctions utilitaires
```

## Roadmap (phases suivantes)

Le périmètre demandé (biomes multiples, multijoueur, campagne complète) est vaste — il
est construit par phases pour garder chaque étape solide et sans régression :

1. ✅ **Phase 1 — Fondation 3D** : moteur Three.js, niveau "Rue de la Ville" complet,
   4 classes de véhicules, sélection de pilote, HUD, embouteillages, trafic à double
   sens.
2. ⏳ **Phase 2 — Nouveaux biomes** : Désert du Ténéré (dunes, oasis, montagnes),
   Forêt & Savane (végétation, animaux sauvages visibles/évitables), Route de Village.
3. ⏳ **Phase 3 — Progression** : mode carrière niveau par niveau, déblocage de
   véhicules/pilotes.
4. ⏳ **Phase 4 — Multijoueur local (LAN)** : un appareil héberge une petite partie
   serveur, les autres rejoignent via navigateur sur le même réseau Wi-Fi/point d'accès
   (l'équivalent web le plus proche d'un multijoueur façon Mini Militia — une vraie
   appli P2P native demanderait un tout autre outillage, non disponible ici).
