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

/// Temps accordé pour répondre à chaque question, en secondes.
const int kQuestionSeconds = 15;

/// Points de base attribués pour une bonne réponse.
const int kBasePoints = 100;

/// Points bonus maximum, obtenus en répondant instantanément.
const int kMaxBonusPoints = 50;

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
  int _points = 0;
  int? _selectedIndex;
  bool _answered = false;
  int _remainingMs = kQuestionSeconds * 1000;
  Timer? _countdownTimer;
  Timer? _feedbackTimer;

  @override
  void initState() {
    super.initState();
    _questions = _pickQuestions();
    _startCountdown();
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _feedbackTimer?.cancel();
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

  void _startCountdown() {
    _remainingMs = kQuestionSeconds * 1000;
    _countdownTimer?.cancel();
    _countdownTimer = Timer.periodic(const Duration(milliseconds: 100), (
      timer,
    ) {
      setState(() => _remainingMs -= 100);
      if (_remainingMs <= 0) {
        timer.cancel();
        _handleTimeout();
      }
    });
  }

  void _handleTimeout() {
    if (_answered) return;
    setState(() {
      _answered = true;
      _selectedIndex = null;
    });
    _feedbackTimer = Timer(kFeedbackDelay, _goToNext);
  }

  void _selectAnswer(int index) {
    if (_answered) return;
    _countdownTimer?.cancel();

    final isCorrect = index == _currentQuestion.correctIndex;
    setState(() {
      _selectedIndex = index;
      _answered = true;
      if (isCorrect) {
        _score++;
        final fraction = (_remainingMs / (kQuestionSeconds * 1000)).clamp(
          0.0,
          1.0,
        );
        _points += kBasePoints + (fraction * kMaxBonusPoints).round();
      }
    });

    _feedbackTimer = Timer(kFeedbackDelay, _goToNext);
  }

  void _goToNext() {
    if (!mounted) return;
    if (_currentIndex + 1 >= _questions.length) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => ResultScreen(
            score: _score,
            total: _questions.length,
            points: _points,
            categoryLabels: widget.categories.map((c) => c.label).toList(),
          ),
        ),
      );
      return;
    }
    setState(() {
      _currentIndex++;
      _selectedIndex = null;
      _answered = false;
    });
    _startCountdown();
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
    final colorScheme = Theme.of(context).colorScheme;
    final progress = (_currentIndex + 1) / _questions.length;
    final timeFraction = (_remainingMs / (kQuestionSeconds * 1000)).clamp(
      0.0,
      1.0,
    );
    final timeColor = timeFraction <= 0.25
        ? AppTheme.incorrect
        : AppTheme.secondary;
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
                  backgroundColor: colorScheme.surfaceContainerHighest,
                  valueColor: const AlwaysStoppedAnimation(AppTheme.primary),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(Icons.timer_outlined, size: 18, color: timeColor),
                  const SizedBox(width: 6),
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: LinearProgressIndicator(
                        value: timeFraction,
                        minHeight: 6,
                        backgroundColor: colorScheme.surfaceContainerHighest,
                        valueColor: AlwaysStoppedAnimation(timeColor),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '${(_remainingMs / 1000).ceil().clamp(0, kQuestionSeconds)}s',
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: timeColor,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child: Text(
                  'Score : $_score · $_points pts',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    color: AppTheme.primary,
                  ),
                ),
              ),
              const SizedBox(height: 20),
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
