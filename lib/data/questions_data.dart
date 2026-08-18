import '../models/category.dart';
import '../models/question.dart';

/// Banque de questions de culture générale pour GeoQuiz.
final List<Question> questionsBank = [
  // ---------------------------------------------------------------------
  // Géographie
  // ---------------------------------------------------------------------
  const Question(
    text: 'Quelle est la capitale de l\'Australie ?',
    options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'],
    correctIndex: 2,
    category: QuizCategory.geographie,
  ),
  const Question(
    text: 'Quel est le plus long fleuve du monde ?',
    options: ['Amazone', 'Nil', 'Yangzi Jiang', 'Mississippi'],
    correctIndex: 1,
    category: QuizCategory.geographie,
  ),
  const Question(
    text: 'Combien de pays composent le continent africain ?',
    options: ['48', '54', '62', '39'],
    correctIndex: 1,
    category: QuizCategory.geographie,
  ),
  const Question(
    text: 'Quel pays possède le plus de fuseaux horaires ?',
    options: ['États-Unis', 'Russie', 'France', 'Chine'],
    correctIndex: 2,
    category: QuizCategory.geographie,
  ),
  const Question(
    text: 'Quelle chaîne de montagnes sépare l\'Europe de l\'Asie ?',
    options: ['Les Alpes', 'Les Carpates', 'L\'Oural', 'Les Pyrénées'],
    correctIndex: 2,
    category: QuizCategory.geographie,
  ),
  const Question(
    text: 'Quel est le plus petit pays du monde ?',
    options: ['Monaco', 'Saint-Marin', 'Le Vatican', 'Liechtenstein'],
    correctIndex: 2,
    category: QuizCategory.geographie,
  ),
  const Question(
    text: 'Dans quel désert se trouve la ville de Tombouctou ?',
    options: ['Sahara', 'Gobi', 'Kalahari', 'Namib'],
    correctIndex: 0,
    category: QuizCategory.geographie,
  ),
  const Question(
    text: 'Quelle mer borde la ville d\'Alexandrie ?',
    options: ['Mer Rouge', 'Mer Méditerranée', 'Mer Noire', 'Mer d\'Arabie'],
    correctIndex: 1,
    category: QuizCategory.geographie,
  ),
  const Question(
    text: 'Quel pays a pour capitale Ottawa ?',
    options: ['États-Unis', 'Canada', 'Australie', 'Nouvelle-Zélande'],
    correctIndex: 1,
    category: QuizCategory.geographie,
  ),
  const Question(
    text: 'Quel est le plus grand désert chaud du monde ?',
    options: ['Sahara', 'Gobi', 'Kalahari', 'Atacama'],
    correctIndex: 0,
    category: QuizCategory.geographie,
  ),
  const Question(
    text: 'Quel océan est le plus grand du monde ?',
    options: ['Atlantique', 'Indien', 'Arctique', 'Pacifique'],
    correctIndex: 3,
    category: QuizCategory.geographie,
  ),
  const Question(
    text: 'Quelle ville est surnommée la « Ville Lumière » ?',
    options: ['Rome', 'Paris', 'Vienne', 'Londres'],
    correctIndex: 1,
    category: QuizCategory.geographie,
  ),

  // ---------------------------------------------------------------------
  // Histoire
  // ---------------------------------------------------------------------
  const Question(
    text: 'En quelle année a eu lieu la prise de la Bastille ?',
    options: ['1789', '1799', '1804', '1815'],
    correctIndex: 0,
    category: QuizCategory.histoire,
  ),
  const Question(
    text: 'Qui a été le premier président des États-Unis ?',
    options: [
      'Thomas Jefferson',
      'George Washington',
      'Abraham Lincoln',
      'John Adams',
    ],
    correctIndex: 1,
    category: QuizCategory.histoire,
  ),
  const Question(
    text: 'En quelle année le mur de Berlin est-il tombé ?',
    options: ['1985', '1987', '1989', '1991'],
    correctIndex: 2,
    category: QuizCategory.histoire,
  ),
  const Question(
    text: 'Quelle civilisation a construit les pyramides de Gizeh ?',
    options: ['Les Mayas', 'Les Égyptiens', 'Les Romains', 'Les Grecs'],
    correctIndex: 1,
    category: QuizCategory.histoire,
  ),
  const Question(
    text: 'Quel empereur français est mort en exil à Sainte-Hélène ?',
    options: ['Louis XVI', 'Napoléon Bonaparte', 'Napoléon III', 'Charlemagne'],
    correctIndex: 1,
    category: QuizCategory.histoire,
  ),
  const Question(
    text: 'La Seconde Guerre mondiale s\'est terminée en quelle année ?',
    options: ['1943', '1944', '1945', '1946'],
    correctIndex: 2,
    category: QuizCategory.histoire,
  ),
  const Question(
    text: 'Quel explorateur est crédité de la découverte de l\'Amérique en 1492 ?',
    options: [
      'Vasco de Gama',
      'Christophe Colomb',
      'Fernand de Magellan',
      'James Cook',
    ],
    correctIndex: 1,
    category: QuizCategory.histoire,
  ),
  const Question(
    text: 'Quelle reine d\'Égypte est célèbre pour sa relation avec Marc Antoine ?',
    options: ['Néfertiti', 'Cléopâtre', 'Hatchepsout', 'Isis'],
    correctIndex: 1,
    category: QuizCategory.histoire,
  ),
  const Question(
    text:
        'Quel traité a officiellement mis fin à la Première Guerre mondiale ?',
    options: [
      'Traité de Versailles',
      'Traité de Paris',
      'Traité de Vienne',
      'Traité de Rome',
    ],
    correctIndex: 0,
    category: QuizCategory.histoire,
  ),
  const Question(
    text: 'Qui était le leader de la résistance non-violente en Inde ?',
    options: [
      'Jawaharlal Nehru',
      'Mahatma Gandhi',
      'Indira Gandhi',
      'Muhammad Ali Jinnah',
    ],
    correctIndex: 1,
    category: QuizCategory.histoire,
  ),

  // ---------------------------------------------------------------------
  // Sciences
  // ---------------------------------------------------------------------
  const Question(
    text: 'Quel est le symbole chimique de l\'or ?',
    options: ['Or', 'Ag', 'Au', 'Fe'],
    correctIndex: 2,
    category: QuizCategory.sciences,
  ),
  const Question(
    text: 'Quelle planète est la plus proche du Soleil ?',
    options: ['Vénus', 'Mercure', 'Mars', 'Terre'],
    correctIndex: 1,
    category: QuizCategory.sciences,
  ),
  const Question(
    text: 'Combien d\'os compte le corps humain adulte ?',
    options: ['186', '206', '226', '246'],
    correctIndex: 1,
    category: QuizCategory.sciences,
  ),
  const Question(
    text: 'Quel scientifique a formulé la théorie de la relativité ?',
    options: [
      'Isaac Newton',
      'Albert Einstein',
      'Niels Bohr',
      'Galileo Galilei',
    ],
    correctIndex: 1,
    category: QuizCategory.sciences,
  ),
  const Question(
    text: 'Quel gaz les plantes absorbent-elles principalement pour la photosynthèse ?',
    options: ['Oxygène', 'Azote', 'Dioxyde de carbone', 'Hydrogène'],
    correctIndex: 2,
    category: QuizCategory.sciences,
  ),
  const Question(
    text: 'Quelle est l\'unité de mesure de la force dans le système international ?',
    options: ['Le watt', 'Le joule', 'Le newton', 'Le pascal'],
    correctIndex: 2,
    category: QuizCategory.sciences,
  ),
  const Question(
    text: 'Quel organe humain produit l\'insuline ?',
    options: ['Le foie', 'Le pancréas', 'Les reins', 'L\'estomac'],
    correctIndex: 1,
    category: QuizCategory.sciences,
  ),
  const Question(
    text: 'Combien de chromosomes possède une cellule humaine normale ?',
    options: ['23', '42', '46', '48'],
    correctIndex: 2,
    category: QuizCategory.sciences,
  ),
  const Question(
    text: 'Quelle est la vitesse approximative de la lumière dans le vide ?',
    options: ['300 000 km/s', '150 000 km/s', '1 000 000 km/s', '30 000 km/s'],
    correctIndex: 0,
    category: QuizCategory.sciences,
  ),
  const Question(
    text: 'Quel est le plus grand organe du corps humain ?',
    options: ['Le foie', 'Le cerveau', 'La peau', 'Le cœur'],
    correctIndex: 2,
    category: QuizCategory.sciences,
  ),

  // ---------------------------------------------------------------------
  // Sport
  // ---------------------------------------------------------------------
  const Question(
    text:
        'Tous les combien d\'années se déroulent les Jeux Olympiques d\'été ?',
    options: ['2 ans', '3 ans', '4 ans', '5 ans'],
    correctIndex: 2,
    category: QuizCategory.sport,
  ),
  const Question(
    text: 'Combien de joueurs compte une équipe de football sur le terrain ?',
    options: ['9', '10', '11', '12'],
    correctIndex: 2,
    category: QuizCategory.sport,
  ),
  const Question(
    text: 'Dans quel pays sont nés les Jeux Olympiques antiques ?',
    options: ['Italie', 'Grèce', 'Égypte', 'Turquie'],
    correctIndex: 1,
    category: QuizCategory.sport,
  ),
  const Question(
    text: 'Quel pays a remporté la Coupe du Monde de football 2018 ?',
    options: ['Croatie', 'Brésil', 'France', 'Allemagne'],
    correctIndex: 2,
    category: QuizCategory.sport,
  ),
  const Question(
    text: 'Combien de sets faut-il gagner pour remporter un match de tennis en Grand Chelem (messieurs) ?',
    options: ['2', '3', '4', '5'],
    correctIndex: 1,
    category: QuizCategory.sport,
  ),
  const Question(
    text: 'Quel sport se pratique à Roland-Garros ?',
    options: ['Golf', 'Tennis', 'Rugby', 'Athlétisme'],
    correctIndex: 1,
    category: QuizCategory.sport,
  ),
  const Question(
    text: 'Combien de joueurs compte une équipe de basketball sur le terrain ?',
    options: ['4', '5', '6', '7'],
    correctIndex: 1,
    category: QuizCategory.sport,
  ),
  const Question(
    text: 'Quel athlète est surnommé « Eclair » ou « Lightning Bolt » pour ses records du 100m ?',
    options: ['Justin Gatlin', 'Usain Bolt', 'Tyson Gay', 'Yohan Blake'],
    correctIndex: 1,
    category: QuizCategory.sport,
  ),

  // ---------------------------------------------------------------------
  // Divers
  // ---------------------------------------------------------------------
  const Question(
    text: 'Qui a peint la Joconde ?',
    options: [
      'Michel-Ange',
      'Léonard de Vinci',
      'Raphaël',
      'Sandro Botticelli',
    ],
    correctIndex: 1,
    category: QuizCategory.divers,
  ),
  const Question(
    text: 'Quel est l\'instrument de musique à 88 touches ?',
    options: ['Le violon', 'La guitare', 'Le piano', 'La harpe'],
    correctIndex: 2,
    category: QuizCategory.divers,
  ),
  const Question(
    text: 'Dans quel film culte entend-on la réplique « Que la Force soit avec toi » ?',
    options: ['Star Trek', 'Star Wars', 'Dune', 'Interstellar'],
    correctIndex: 1,
    category: QuizCategory.divers,
  ),
  const Question(
    text: 'Quelle est la monnaie utilisée au Japon ?',
    options: ['Le won', 'Le yuan', 'Le yen', 'Le ringgit'],
    correctIndex: 2,
    category: QuizCategory.divers,
  ),
  const Question(
    text: 'Combien de cordes possède une guitare classique ?',
    options: ['4', '5', '6', '7'],
    correctIndex: 2,
    category: QuizCategory.divers,
  ),
  const Question(
    text: 'Quel écrivain a créé le détective Sherlock Holmes ?',
    options: [
      'Agatha Christie',
      'Arthur Conan Doyle',
      'Edgar Allan Poe',
      'Charles Dickens',
    ],
    correctIndex: 1,
    category: QuizCategory.divers,
  ),
  const Question(
    text: 'Quel réseau social est symbolisé par un petit oiseau bleu à l\'origine ?',
    options: ['Facebook', 'Instagram', 'Twitter (X)', 'LinkedIn'],
    correctIndex: 2,
    category: QuizCategory.divers,
  ),
  const Question(
    text: 'Combien de couleurs compte un arc-en-ciel traditionnel ?',
    options: ['5', '6', '7', '8'],
    correctIndex: 2,
    category: QuizCategory.divers,
  ),
];
