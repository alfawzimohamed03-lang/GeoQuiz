import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/game_result.dart';

/// Service de persistance locale de l'historique des parties jouées.
class ScoreHistoryService {
  static const String _storageKey = 'geoquiz_score_history';

  /// Nombre maximum de parties conservées dans l'historique.
  static const int maxEntries = 50;

  /// Récupère l'historique, trié du plus récent au plus ancien.
  Future<List<GameResult>> loadHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final rawList = prefs.getStringList(_storageKey) ?? [];
    final results = rawList
        .map(
          (raw) => GameResult.fromJson(jsonDecode(raw) as Map<String, dynamic>),
        )
        .toList();
    results.sort((a, b) => b.playedAt.compareTo(a.playedAt));
    return results;
  }

  /// Ajoute une partie à l'historique (en tête de liste).
  Future<void> addResult(GameResult result) async {
    final prefs = await SharedPreferences.getInstance();
    final rawList = prefs.getStringList(_storageKey) ?? [];
    rawList.insert(0, jsonEncode(result.toJson()));
    if (rawList.length > maxEntries) {
      rawList.removeRange(maxEntries, rawList.length);
    }
    await prefs.setStringList(_storageKey, rawList);
  }

  /// Efface tout l'historique.
  Future<void> clearHistory() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_storageKey);
  }
}
