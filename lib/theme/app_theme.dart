import 'package:flutter/material.dart';

/// Thème visuel centralisé pour GeoQuiz (variantes claire et sombre).
class AppTheme {
  AppTheme._();

  static const Color primary = Color(0xFF2E7D6B);
  static const Color secondary = Color(0xFFF2A65A);
  static const Color backgroundLight = Color(0xFFF7F7F2);
  static const Color backgroundDark = Color(0xFF121712);
  static const Color correct = Color(0xFF4CAF50);
  static const Color incorrect = Color(0xFFE05353);

  static ThemeData get light => _buildTheme(
    brightness: Brightness.light,
    scaffoldBackground: backgroundLight,
    appBarForeground: Colors.black87,
  );

  static ThemeData get dark => _buildTheme(
    brightness: Brightness.dark,
    scaffoldBackground: backgroundDark,
    appBarForeground: Colors.white,
  );

  static ThemeData _buildTheme({
    required Brightness brightness,
    required Color scaffoldBackground,
    required Color appBarForeground,
  }) {
    final base = ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primary,
        secondary: secondary,
        brightness: brightness,
      ),
      scaffoldBackgroundColor: scaffoldBackground,
    );
    return base.copyWith(
      textTheme: base.textTheme.apply(fontFamily: 'Roboto'),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        foregroundColor: appBarForeground,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
    );
  }
}
