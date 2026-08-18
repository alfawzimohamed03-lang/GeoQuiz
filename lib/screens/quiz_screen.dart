import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';

import '../data/questions_data.dart';
import '../models/category.dart';
import '../models/question.dart';
import '../theme/app_theme.dart';
import '../widgets/answer_option.dart';
import 'result_screen.dart';

/// Nombre de questions posées par partie.
const int kQuestionsPerRound = 10;

/// Délai avant de passer automatiquement à la question suivante.
const Duration kFeedbackDelay = Duration(milliseconds: 900);

class QuizScreen extends StatefulWidget {
  const QuizScreen({super.key, required this.categories});

  final Set<QuizCategory> categories;

  @override
  State<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends State<QuizScreen> {
  late final List<Question> _questions;
  int _currentIndex = 0;
  int _score = 0;
  int? _selectedIndex;
  bool _answered = false;
  Timer? _advanceTimer;

  @override
  void initState() {
    super.initState();
    _questions = _pickQuestions();
  }

  @override
  void dispose() {
    _advanceTimer?.cancel();
    super.dispose();
  }

  List<Question> _pickQuestions() {
    final pool =
        questionsBank
            .where((q) => widget.categories.contains(q.category))
            .toList()
          ..shuffle(Random());
    final count = min(kQuestionsPerRound, pool.length);
    return pool.take(count).toList();
  }

  Question get _currentQuestion => _questions[_currentIndex];

  void _selectAnswer(int index) {
    if (_answered) return;
    setState(() {
      _selectedIndex = index;
      _answered = true;
      if (index == _currentQuestion.correctIndex) {
        _score++;
      }
    });

    _advanceTimer = Timer(kFeedbackDelay, _goToNext);
  }

  void _goToNext() {
    if (!mounted) return;
    if (_currentIndex + 1 >= _questions.length) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => ResultScreen(score: _score, total: _questions.length),
        ),
      );
      return;
    }
    setState(() {
      _currentIndex++;
      _selectedIndex = null;
      _answered = false;
    });
  }

  AnswerStatus _statusFor(int index) {
    if (!_answered) return AnswerStatus.idle;
    final correctIndex = _currentQuestion.correctIndex;
    if (index == correctIndex) {
      return _selectedIndex == index
          ? AnswerStatus.selectedCorrect
          : AnswerStatus.revealedCorrect;
    }
    if (index == _selectedIndex) return AnswerStatus.selectedIncorrect;
    return AnswerStatus.idle;
  }

  @override
  Widget build(BuildContext context) {
    final progress = (_currentIndex + 1) / _questions.length;
    final question = _currentQuestion;

    return Scaffold(
      appBar: AppBar(
        title: Text('Question ${_currentIndex + 1}/${_questions.length}'),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                  value: progress,
                  minHeight: 8,
                  backgroundColor: Colors.black12,
                  valueColor: const AlwaysStoppedAnimation(AppTheme.primary),
                ),
              ),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child: Text(
                  'Score : $_score',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    color: AppTheme.primary,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Chip(
                label: Text(
                  '${question.category.emoji} ${question.category.label}',
                ),
                backgroundColor: AppTheme.secondary.withValues(alpha: 0.2),
              ),
              const SizedBox(height: 16),
              Text(
                question.text,
                style: Theme.of(context).textTheme.headlineSmall
                    ?.copyWith(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 28),
              Expanded(
                child: ListView.builder(
                  itemCount: question.options.length,
                  itemBuilder: (context, index) => AnswerOption(
                    label: question.options[index],
                    status: _statusFor(index),
                    enabled: !_answered,
                    onTap: () => _selectAnswer(index),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
