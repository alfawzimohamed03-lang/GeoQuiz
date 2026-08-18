import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import 'home_screen.dart';

class ResultScreen extends StatelessWidget {
  const ResultScreen({super.key, required this.score, required this.total});

  final int score;
  final int total;

  double get _ratio => total == 0 ? 0 : score / total;

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
                '$score / $total',
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
                    ?.copyWith(color: Colors.black54),
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
