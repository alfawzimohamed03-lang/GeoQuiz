import 'package:flutter/material.dart';

import '../models/category.dart';
import '../theme/app_theme.dart';
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
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
                    ?.copyWith(color: Colors.black54),
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
                      color: selected ? AppTheme.primary : Colors.black87,
                      fontWeight: selected
                          ? FontWeight.w600
                          : FontWeight.normal,
                    ),
                    side: BorderSide(
                      color: selected ? AppTheme.primary : Colors.black26,
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
