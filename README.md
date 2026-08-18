# GeoQuiz 🌍

Application mobile de quiz de culture générale, développée avec **Flutter**.

## Fonctionnalités

- Sélection des catégories de questions : Géographie, Histoire, Sciences, Sport, Divers
- Banque de 80 questions de culture générale (16 par catégorie)
- Parties de 10 questions à choix multiples, piochées aléatoirement dans les catégories choisies
- Chrono de 15 secondes par question, avec bonus de points pour une réponse rapide
- Retour visuel immédiat (bonne / mauvaise réponse) après chaque réponse
- Écran de score final (score + points) avec message adapté à la performance
- Historique local des parties jouées, consultable et effaçable depuis l'accueil
- Mode sombre automatique (suit le thème du système)
- Rejouer une nouvelle partie en un clic

## Structure du projet

```
lib/
  main.dart                    # Point d'entrée de l'application
  models/
    category.dart              # Enum des catégories de quiz
    question.dart               # Modèle d'une question à choix multiples
    game_result.dart            # Modèle d'une partie jouée (pour l'historique)
  data/
    questions_data.dart         # Banque de questions de culture générale
  services/
    score_history_service.dart  # Persistance locale de l'historique (shared_preferences)
  screens/
    home_screen.dart            # Accueil + sélection des catégories
    quiz_screen.dart            # Déroulé du quiz (timer, score, points)
    result_screen.dart          # Écran de résultat / score
    history_screen.dart         # Historique des parties jouées
  widgets/
    answer_option.dart          # Bouton de réponse avec état visuel
  theme/
    app_theme.dart              # Thème centralisé (clair / sombre)
```

## Lancer le projet

Prérequis : [Flutter SDK](https://docs.flutter.dev/get-started/install) installé.

```bash
flutter pub get
flutter run
```

## Tests

```bash
flutter test
```

## Construire l'APK

```bash
flutter build apk --release
```
