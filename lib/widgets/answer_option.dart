import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Statut visuel d'une option de réponse pendant/après sélection.
enum AnswerStatus { idle, selectedCorrect, selectedIncorrect, revealedCorrect }

/// Un bouton de réponse affichant son état (neutre, correct, incorrect).
class AnswerOption extends StatelessWidget {
  const AnswerOption({
    super.key,
    required this.label,
    required this.status,
    required this.onTap,
    required this.enabled,
  });

  final String label;
  final AnswerStatus status;
  final VoidCallback onTap;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    final (
      Color background,
      Color border,
      Color foreground,
      IconData? icon,
    ) = switch (status) {
      AnswerStatus.idle => (
        colorScheme.surface,
        colorScheme.outlineVariant,
        colorScheme.onSurface,
        null,
      ),
      AnswerStatus.selectedCorrect => (
        AppTheme.correct.withValues(alpha: 0.15),
        AppTheme.correct,
        AppTheme.correct,
        Icons.check_circle,
      ),
      AnswerStatus.selectedIncorrect => (
        AppTheme.incorrect.withValues(alpha: 0.15),
        AppTheme.incorrect,
        AppTheme.incorrect,
        Icons.cancel,
      ),
      AnswerStatus.revealedCorrect => (
        AppTheme.correct.withValues(alpha: 0.1),
        AppTheme.correct,
        AppTheme.correct,
        Icons.check_circle_outline,
      ),
    };

    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      margin: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: background,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: enabled ? onTap : null,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: border, width: 1.5),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    label,
                    style: TextStyle(
                      fontSize: 16,
                      color: foreground,
                      fontWeight: status == AnswerStatus.idle
                          ? FontWeight.normal
                          : FontWeight.w600,
                    ),
                  ),
                ),
                if (icon != null) Icon(icon, color: foreground),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
