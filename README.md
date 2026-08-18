# GeoQuiz 🌍

Application mobile de quiz de culture générale, développée avec **Flutter**.

## Fonctionnalités

- Sélection des catégories de questions : Géographie, Histoire, Sciences, Sport, Divers
- Parties de 10 questions à choix multiples, piochées aléatoirement dans les catégories choisies
- Retour visuel immédiat (bonne / mauvaise réponse) après chaque réponse
- Écran de score final avec message adapté à la performance
- Rejouer une nouvelle partie en un clic

## Structure du projet

```
lib/
  main.dart                 # Point d'entrée de l'application
  models/
    category.dart           # Enum des catégories de quiz
    question.dart            # Modèle d'une question à choix multiples
  data/
    questions_data.dart      # Banque de questions de culture générale
  screens/
    home_screen.dart         # Accueil + sélection des catégories
    quiz_screen.dart         # Déroulé du quiz
    result_screen.dart       # Écran de résultat / score
  widgets/
    answer_option.dart       # Bouton de réponse avec état visuel
  theme/
    app_theme.dart           # Thème centralisé (couleurs, styles)
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
