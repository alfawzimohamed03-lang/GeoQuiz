import 'package:flutter/material.dart';

import '../models/game_result.dart';
import '../services/score_history_service.dart';
import '../theme/app_theme.dart';
import 'home_screen.dart';

class ResultScreen extends StatefulWidget {
  const ResultScreen({
    super.key,
    required this.score,
    required this.total,
    required this.points,
    required this.categoryLabels,
  });

  final int score;
  final int total;
  final int points;
  final List<String> categoryLabels;

  @override
  State<ResultScreen> createState() => _ResultScreenState();
}

class _ResultScreenState extends State<ResultScreen> {
  final ScoreHistoryService _historyService = ScoreHistoryService();

  @override
  void initState() {
    super.initState();
    // Sauvegarde la partie dans l'historique local, une seule fois.
    _historyService.addResult(
      GameResult(
        playedAt: DateTime.now(),
        correctCount: widget.score,
        totalQuestions: widget.total,
        points: widget.points,
        categoryLabels: widget.categoryLabels,
      ),
    );
  }

  double get _ratio => widget.total == 0 ? 0 : widget.score / widget.total;

  ({String emoji, String message}) get _feedback {
    if (_ratio == 1) {
      return (emoji: '🏆', message: 'Score parfait, bravo !');
    } else if (_ratio >= 0.7) {
      return (emoji: '🎉', message: 'Excellent travail !');
    } else if (_ratio >= 0.4) {
      return (emoji: '👍', message: 'Pas mal, continue comme ça !');
    }
    return (emoji: '💪', message: 'Retente ta chance !');
  }

  @override
  Widget build(BuildContext context) {
    final feedback = _feedback;
    final colorScheme = Theme.of(context).colorScheme;
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                feedback.emoji,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 80),
              ),
              const SizedBox(height: 16),
              Text(
                feedback.message,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineSmall
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 32),
              Text(
                '${widget.score} / ${widget.total}',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.displayMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '${(_ratio * 100).round()}% de bonnes réponses',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge
                    ?.copyWith(color: colorScheme.onSurfaceVariant),
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 10,
                ),
                decoration: BoxDecoration(
                  color: AppTheme.secondary.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.bolt, color: AppTheme.secondary, size: 20),
                    const SizedBox(width: 6),
                    Text(
                      '${widget.points} points',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AppTheme.secondary,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 48),
              ElevatedButton(
                onPressed: () {
                  Navigator.of(context).pushAndRemoveUntil(
                    MaterialPageRoute(builder: (_) => const HomeScreen()),
                    (route) => false,
                  );
                },
                child: const Text('Rejouer'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
