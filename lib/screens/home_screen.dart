import 'package:flutter/material.dart';

import '../models/category.dart';
import '../theme/app_theme.dart';
import 'history_screen.dart';
import 'quiz_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final Set<QuizCategory> _selectedCategories = {...QuizCategory.values};

  void _toggleCategory(QuizCategory category, bool selected) {
    setState(() {
      if (selected) {
        _selectedCategories.add(category);
      } else if (_selectedCategories.length > 1) {
        // On garde toujours au moins une catégorie sélectionnée.
        _selectedCategories.remove(category);
      }
    });
  }

  void _startQuiz() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => QuizScreen(categories: _selectedCategories),
      ),
    );
  }

  void _openHistory() {
    Navigator.of(context)
        .push(MaterialPageRoute(builder: (_) => const HistoryScreen()));
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        actions: [
          IconButton(
            icon: const Icon(Icons.history),
            tooltip: 'Historique',
            onPressed: _openHistory,
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(flex: 2),
              const Text('🌍', style: TextStyle(fontSize: 72)),
              const SizedBox(height: 16),
              Text(
                'GeoQuiz',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Teste ta culture générale !',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyLarge
                    ?.copyWith(color: colorScheme.onSurfaceVariant),
              ),
              const Spacer(flex: 2),
              Text(
                'Choisis tes catégories',
                style: Theme.of(context).textTheme.titleMedium
                    ?.copyWith(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: QuizCategory.values.map((category) {
                  final selected = _selectedCategories.contains(category);
                  return FilterChip(
                    label: Text('${category.emoji} ${category.label}'),
                    selected: selected,
                    onSelected: (value) => _toggleCategory(category, value),
                    selectedColor: AppTheme.primary.withValues(alpha: 0.18),
                    checkmarkColor: AppTheme.primary,
                    labelStyle: TextStyle(
                      color: selected
                          ? AppTheme.primary
                          : colorScheme.onSurface,
                      fontWeight: selected
                          ? FontWeight.w600
                          : FontWeight.normal,
                    ),
                    side: BorderSide(
                      color: selected
                          ? AppTheme.primary
                          : colorScheme.outlineVariant,
                    ),
                  );
                }).toList(),
              ),
              const Spacer(flex: 3),
              ElevatedButton(
                onPressed: _startQuiz,
                child: const Text('Commencer le quiz'),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
