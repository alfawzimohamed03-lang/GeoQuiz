/// Catégories de questions disponibles dans GeoQuiz.
enum QuizCategory {
  geographie('Géographie', '🌍'),
  histoire('Histoire', '🏛️'),
  sciences('Sciences', '🔬'),
  sport('Sport', '⚽'),
  divers('Divers', '🎬');

  const QuizCategory(this.label, this.emoji);

  final String label;
  final String emoji;
}
