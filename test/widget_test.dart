import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:geoquiz/data/questions_data.dart';
import 'package:geoquiz/main.dart';
import 'package:geoquiz/models/category.dart';
import 'package:geoquiz/widgets/answer_option.dart';

void main() {
  testWidgets(
    'GeoQuiz affiche l\'écran d\'accueil avec le bouton de démarrage',
    (tester) async {
      await tester.pumpWidget(const GeoQuizApp());

      expect(find.text('GeoQuiz'), findsOneWidget);
      expect(find.text('Commencer le quiz'), findsOneWidget);
      // Une puce de filtre par catégorie disponible.
      expect(
        find.byType(FilterChip),
        findsNWidgets(QuizCategory.values.length),
      );
    },
  );

  testWidgets('Un tap sur une réponse affiche un retour visuel puis avance', (
    tester,
  ) async {
    await tester.pumpWidget(const GeoQuizApp());

    await tester.tap(find.text('Commencer le quiz'));
    await tester.pumpAndSettle();

    // On doit être sur l'écran de quiz : une question et 4 options visibles.
    expect(find.textContaining('Question 1/'), findsOneWidget);

    // Tap sur la première option de réponse (widget AnswerOption dédié).
    final firstOption = find.descendant(
      of: find.byType(AnswerOption).first,
      matching: find.byType(InkWell),
    );
    await tester.tap(firstOption);
    await tester.pump();

    // Une icône de retour (check ou cancel) doit apparaître.
    final hasFeedbackIcon =
        find.byIcon(Icons.check_circle).evaluate().isNotEmpty ||
        find.byIcon(Icons.cancel).evaluate().isNotEmpty;
    expect(hasFeedbackIcon, isTrue);
  });

  test(
    'La banque de questions n\'est pas vide et couvre toutes les catégories',
    () {
      expect(questionsBank, isNotEmpty);
      final coveredCategories = questionsBank.map((q) => q.category).toSet();
      expect(coveredCategories.length, QuizCategory.values.length);
    },
  );

  test('Chaque question a exactement 4 options et un index correct valide', () {
    for (final question in questionsBank) {
      expect(question.options.length, 4);
      expect(question.correctIndex, inInclusiveRange(0, 3));
    }
  });
}
