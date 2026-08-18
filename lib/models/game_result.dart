/// Résultat d'une partie de GeoQuiz, sauvegardé dans l'historique local.
class GameResult {
  const GameResult({
    required this.playedAt,
    required this.correctCount,
    required this.totalQuestions,
    required this.points,
    required this.categoryLabels,
  });

  final DateTime playedAt;
  final int correctCount;
  final int totalQuestions;
  final int points;

  /// Libellés des catégories jouées (ex: ['Géographie', 'Sport']).
  final List<String> categoryLabels;

  double get ratio => totalQuestions == 0 ? 0 : correctCount / totalQuestions;

  Map<String, dynamic> toJson() => {
    'playedAt': playedAt.toIso8601String(),
    'correctCount': correctCount,
    'totalQuestions': totalQuestions,
    'points': points,
    'categoryLabels': categoryLabels,
  };

  factory GameResult.fromJson(Map<String, dynamic> json) => GameResult(
    playedAt: DateTime.parse(json['playedAt'] as String),
    correctCount: json['correctCount'] as int,
    totalQuestions: json['totalQuestions'] as int,
    points: json['points'] as int,
    categoryLabels: (json['categoryLabels'] as List<dynamic>)
        .map((e) => e as String)
        .toList(),
  );
}
