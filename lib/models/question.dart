import 'category.dart';

/// Représente une question à choix multiples du quiz.
class Question {
  const Question({
    required this.text,
    required this.options,
    required this.correctIndex,
    required this.category,
  }) : assert(
         correctIndex >= 0 && correctIndex < 4,
         'correctIndex doit être compris entre 0 et 3',
       );

  final String text;
  final List<String> options;
  final int correctIndex;
  final QuizCategory category;

  String get correctAnswer => options[correctIndex];
}
