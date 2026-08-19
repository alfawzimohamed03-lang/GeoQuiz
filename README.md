# 🚗 Dr Driving Africa

Jeu de simulation de conduite en vue du dessus, sur le thème de l'Afrique de l'Ouest : roule à travers différents types de voies, esquive les embouteillages et relève des défis.

## Concept

- **3 types de routes**, chacune avec son ambiance et ses dangers :
  - 🏙️ **Route Urbaine** — trafic dense, dos d'âne, cônes de chantier.
  - 🛣️ **Autoroute** — plusieurs voies, trafic rapide, débris et plaques d'huile.
  - 🌍 **Piste de Brousse** — piste en terre, nids-de-poule, animaux qui traversent.
- **Embouteillages dynamiques** : des zones de trafic ralenti apparaissent régulièrement le long du trajet, obligeant à ralentir et slalomer entre les véhicules.
- **3 défis** sélectionnables avant de démarrer :
  - ❤️ **Survie** — roule le plus loin possible sans épuiser tes points de vie.
  - ⏱️ **Contre-la-montre** — atteins 1500 m avant la fin du chrono.
  - 💎 **Zéro Collision** — 1000 m sans le moindre accrochage.
- **Score** basé sur la distance parcourue, avec bonus pour les dépassements en évitement de justesse ("Presque !").
- **Meilleurs scores** sauvegardés localement par route et par défi.

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
- Rendu du jeu en Canvas 2D (`requestAnimationFrame`), sans framework ni dépendance de rendu externe
- Sauvegarde des meilleurs scores via `localStorage`

## Structure du code

```
src/
  main.ts            Menu, sélection route/défi, câblage des écrans
  style.css           Thème visuel et mise en page (HUD, menus, contrôles tactiles)
  game/
    Game.ts           Boucle de jeu, logique, rendu Canvas
    PlayerCar.ts       Physique du véhicule du joueur
    entities.ts        Génération du trafic et des obstacles
    input.ts           Clavier + contrôles tactiles
    storage.ts          Meilleurs scores (localStorage)
    types.ts            Configuration des routes et des défis
    utils.ts             Fonctions utilitaires (collisions, clamp, etc.)
```

## Roadmap (idées pour une v2)

- Nouveaux véhicules jouables avec caractéristiques différentes
- Mode carrière avec progression entre les routes
- Effets sonores et musique
- Classement en ligne des meilleurs scores
