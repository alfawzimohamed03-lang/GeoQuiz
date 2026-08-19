# 🚗 Dr Driving Africa

Jeu de course-conduite **en 3D** (Three.js/WebGL), caméra à la troisième personne façon
arcade, sur le thème de l'Afrique de l'Ouest. Quatre routes bien différentes — ville
nocturne, désert du Ténéré, forêt & savane, route de village — chacune avec son relief,
son horizon et sa faune, à double sens de circulation ("tout le risque est permis"), et
des défis à la clé.

> **Note d'honnêteté sur le périmètre** : ceci est un jeu web (navigateur), pas une
> application mobile native. Le rendu est en 3D stylisée basse-poly avec éclairage
> dynamique, terrain en relief, montagnes lointaines et reflets d'environnement — pas
> photoréaliste façon AAA (ça demanderait des assets 3D texturés professionnels hors de
> portée ici). Les véhicules sont des silhouettes génériques par catégorie (citadine /
> berline / SUV / bolide), **sans nom ni logo de marque réelle**, pour éviter tout
> problème de droit d'auteur. Voir la Roadmap ci-dessous pour ce qui reste à construire
> (progression en mode carrière, multijoueur).

## Concept actuel (v2 — Phases 1 & 2)

- **Moteur 3D réel** avec caméra de poursuite, éclairage (ambiance + directionnelle +
  phares du joueur), brouillard atmosphérique, ciel en dégradé, ombres portées, et une
  **carte d'environnement** (reflets du ciel bakés) qui donne aux carrosseries un rendu
  bien moins plastique/plat.
- **4 routes** jouables, chacune avec son propre relief (dunes, collines, plat), sa
  texture de sol (bitume marqué vs piste en terre avec ornières), son horizon (montagnes,
  collines, silhouette urbaine) et son soleil visible dans le ciel :
  - 🌃 **Rue de la Ville** — route pavée, double sens marqué au sol, gratte-ciels
    éclairés la nuit.
  - 🏜️ **Désert du Ténéré** — dunes qui ondulent réellement en relief, montagnes à
    l'horizon, rochers, oasis occasionnelle (palmiers, point d'eau, chameau), poussière
    en suspension dans l'air.
  - 🌳 **Forêt & Savane** — collines verdoyantes, arbres et acacias denses en bord de
    piste, gazelles visibles (et évitables... ou non).
  - 🏘️ **Route de Village** — cases, étals de marché colorés, villageois en décor,
    chèvres en liberté sur la piste.
- **Route à double sens** partout : 2 voies dans le sens du joueur, 2 voies de trafic en
  face (vitesse de rapprochement combinée = très risqué si tu empiètes pour doubler).
- **Embouteillages dynamiques** : des zones de trafic ralenti apparaissent le long du
  trajet, forçant à ralentir et slalomer.
- **4 classes de véhicules** sélectionnables (Citadine, Berline Sport, SUV Tout-Terrain,
  Bolide), chacune avec ses propres caractéristiques (vitesse, accélération, tenue de
  route) et plusieurs couleurs.
- **4 pilotes** sélectionnables (bustes bas-poly simples, visibles au volant).
- **3 défis** : Survie, Contre-la-montre, Zéro Collision.
- **Score**, bonus "Presque !" pour les évitements de justesse, meilleurs scores
  sauvegardés localement par route/défi.
- Obstacles variés par biome (nids-de-poule, dos d'âne, débris, cônes, animal qui
  traverse — chien/chèvre en ville et au village, gazelle en forêt, chameau au désert).

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
- [Three.js](https://threejs.org/) (WebGL) pour la scène 3D, la caméra, l'éclairage,
  les ombres et les reflets d'environnement — aucun moteur de jeu externe
- Bruit procédural fait maison (`noise.ts`, value-noise + fBm) pour le relief des dunes,
  des collines et l'horizon montagneux — aucune dépendance externe
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
    track.ts                Route, marquage au sol, pool de tuiles générique, ciel,
                              soleil, horizon (montagnes/collines/silhouette urbaine)
    biomes.ts                 Peuplement de chaque route : bâtiments, dunes, arbres,
                                cases de village... + relief de terrain par tuile
    traffic.ts                 Génération et gestion du trafic + obstacles (par biome)
    particles.ts                 Poussière/pollen en suspension dans l'air
    noise.ts                      Bruit procédural (value-noise, fBm, ridged noise)
    Preview.ts                     Mini-scène 3D pour l'aperçu dans le menu
    input.ts                        Clavier + contrôles tactiles
    storage.ts                       Meilleurs scores (localStorage)
    types.ts                          Configuration des routes, défis, véhicules, pilotes
    utils.ts                           Fonctions utilitaires
```

## Roadmap (phases suivantes)

Le périmètre demandé (biomes multiples, multijoueur, campagne complète) est vaste — il
est construit par phases pour garder chaque étape solide et sans régression :

1. ✅ **Phase 1 — Fondation 3D** : moteur Three.js, niveau "Rue de la Ville" complet,
   4 classes de véhicules, sélection de pilote, HUD, embouteillages, trafic à double
   sens.
2. ✅ **Phase 2 — Nouveaux biomes** : Désert du Ténéré (dunes en relief, oasis,
   montagnes), Forêt & Savane (collines, arbres, gazelles), Route de Village (cases,
   marché, chèvres) — plus terrain en relief, horizon lointain, soleil visible,
   poussière atmosphérique et reflets d'environnement sur toutes les routes.
3. ⏳ **Phase 3 — Progression** : mode carrière niveau par niveau, déblocage de
   véhicules/pilotes.
4. ⏳ **Phase 4 — Multijoueur local (LAN)** : un appareil héberge une petite partie
   serveur, les autres rejoignent via navigateur sur le même réseau Wi-Fi/point d'accès
   (l'équivalent web le plus proche d'un multijoueur façon Mini Militia — une vraie
   appli P2P native demanderait un tout autre outillage, non disponible ici).
