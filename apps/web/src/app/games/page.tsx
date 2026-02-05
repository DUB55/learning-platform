'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Gamepad2,
    Trophy,
    ArrowRight,
    Timer,
    Star,
    MousePointer2,
    GridIcon,
    GhostIcon,
    Car,
    Bird,
    Target,
    Zap,
    Box,
    Sparkles,
    Flame,
    Brain,
    Cloud,
    LayoutGrid,
    Gamepad
} from 'lucide-react';

import { useUISettings } from '@/contexts/UISettingsContext';

interface Game {
    id: string;
    title: string;
    description: string;
    icon: any;
    color: string;
    bg: string;
    status: 'playable' | 'coming-soon';
    xpReward?: string;
    category: 'study' | 'relax';
}

const GAMES: Game[] = [
    {
        id: 'study-city-3d',
        title: '3D Study City',
        description: 'Roblox-style exploration. Enter buildings to solve AI-generated study quests.',
        icon: Sparkles,
        color: 'text-purple-400',
        bg: 'from-purple-500/20 to-blue-600/5',
        status: 'playable',
        xpReward: '100 XP / Building',
        category: 'study'
    },
    {
        id: 'cloud-jump',
        title: 'Cloud Jump',
        description: 'AI-generated study game. Jump on the right clouds to master your subjects.',
        icon: Cloud,
        color: 'text-blue-400',
        bg: 'from-blue-400/20 to-indigo-600/5',
        status: 'playable',
        xpReward: '100 XP / Question',
        category: 'study'
    },
    {
        id: 'word-scramble',
        title: 'Word Scramble',
        description: 'Unscramble terms from your learning set.',
        icon: Brain,
        color: 'text-emerald-400',
        bg: 'from-emerald-500/20 to-green-600/5',
        status: 'playable',
        xpReward: '100 XP / Word',
        category: 'study'
    },
    {
        id: 'memory-match',
        title: 'Memory Match',
        description: 'Match terms with their definitions.',
        icon: Sparkles,
        color: 'text-purple-400',
        bg: 'from-purple-500/20 to-blue-600/5',
        status: 'playable',
        xpReward: '200 XP / Match',
        category: 'study'
    },
    {
        id: 'math-sprint',
        title: 'Math Sprint',
        description: 'Solve math problems as fast as you can.',
        icon: Timer,
        color: 'text-rose-400',
        bg: 'from-rose-500/20 to-pink-600/5',
        status: 'playable',
        xpReward: '10 XP / Correct',
        category: 'study'
    },
    {
        id: 'subway-surfers',
        title: 'Study Surfers',
        description: 'Fast-paced runner. Dodge obstacles and collect study boosters.',
        icon: Flame,
        color: 'text-orange-400',
        bg: 'from-orange-500/20 to-red-600/5',
        status: 'playable',
        category: 'relax'
    },
    {
        id: 'mario',
        title: 'Classic Mario',
        description: 'The ultimate platformer experience.',
        icon: Gamepad,
        color: 'text-red-400',
        bg: 'from-red-500/20 to-orange-600/5',
        status: 'playable',
        category: 'relax'
    },
    {
        id: 'battle-tactics',
        title: 'Battle Tactics',
        description: 'Strategic lane-based combat game.',
        icon: Target,
        color: 'text-red-500',
        bg: 'from-red-500/20 to-orange-600/5',
        status: 'playable',
        xpReward: '200 XP / Win',
        category: 'relax'
    },
    {
        id: 'city-builder',
        title: 'City Builder',
        description: 'Build and manage your growing city.',
        icon: GridIcon,
        color: 'text-emerald-500',
        bg: 'from-emerald-500/20 to-blue-600/5',
        status: 'playable',
        xpReward: '100 XP / House',
        category: 'relax'
    },
    {
        id: 'retro-racer',
        title: 'Retro Racer',
        description: '3D arcade racing on a circular track.',
        icon: Car,
        color: 'text-blue-500',
        bg: 'from-blue-500/20 to-indigo-600/5',
        status: 'playable',
        xpReward: '100 XP / Win',
        category: 'relax'
    },
    {
        id: 'tactical-breach',
        title: 'Tactical Breach',
        description: 'First-person tactical clearing simulation.',
        icon: Target,
        color: 'text-slate-300',
        bg: 'from-slate-500/20 to-slate-900/5',
        status: 'playable',
        xpReward: '150 XP / Clear',
        category: 'relax'
    },
    {
        id: '2048',
        title: '2048',
        description: 'Merge tiles to reach the 2048 tile.',
        icon: LayoutGrid,
        color: 'text-orange-400',
        bg: 'from-orange-500/20 to-yellow-600/5',
        status: 'playable',
        xpReward: '100 XP / Win',
        category: 'relax'
    },
    {
        id: 'minesweeper',
        title: 'Minesweeper',
        description: 'Classic puzzle game. Clear the grid without detonating mines.',
        icon: GridIcon,
        color: 'text-slate-400',
        bg: 'from-slate-500/20 to-slate-900/5',
        status: 'playable',
        xpReward: '250 XP / Clear',
        category: 'relax'
    },
    {
        id: 'neon-dash',
        title: 'Neon Dash',
        description: 'Rhythm-based platformer. Jump over spikes to the beat.',
        icon: Zap,
        color: 'text-yellow-400',
        bg: 'from-yellow-400/20 to-orange-600/5',
        status: 'playable',
        xpReward: '100 XP / Level',
        category: 'relax'
    },
    {
        id: 'csgo',
        title: 'Aim Trainer 3D',
        description: 'Train your reflexes and accuracy in this 3D simulation.',
        icon: Target,
        color: 'text-blue-400',
        bg: 'from-blue-400/20 to-indigo-600/5',
        status: 'playable',
        xpReward: '50 XP / Target',
        category: 'relax'
    },
    {
        id: 'snake',
        title: 'Neon Snake',
        description: 'Classic snake with a modern neon twist.',
        icon: Zap,
        color: 'text-emerald-400',
        bg: 'from-emerald-500/20 to-green-600/5',
        status: 'playable',
        xpReward: '10 XP / Food',
        category: 'relax'
    },
    {
        id: 'tetris',
        title: 'Block Drop',
        description: 'The ultimate puzzle game. Clear lines and score big.',
        icon: Box,
        color: 'text-blue-400',
        bg: 'from-blue-500/20 to-indigo-600/5',
        status: 'playable',
        xpReward: '100 XP / Line',
        category: 'relax'
    },
    {
        id: 'sudoku',
        title: 'Logic Grid',
        description: 'Challenge your mind with classic number logic.',
        icon: GridIcon,
        color: 'text-orange-400',
        bg: 'from-orange-500/20 to-red-600/5',
        status: 'playable',
        xpReward: '500 XP / Solve',
        category: 'relax'
    },
    {
        id: 'block-blast',
        title: 'Block Blast',
        description: 'Clear lines by placing blocks in this addictive puzzle.',
        icon: GridIcon,
        color: 'text-rose-400',
        bg: 'from-rose-500/20 to-pink-600/5',
        status: 'playable',
        xpReward: '100 XP / Combo',
        category: 'relax'
    },
    {
        id: 'crossy-road',
        title: 'Crossy Road',
        description: 'Cross the road without getting hit. Watch out for cars!',
        icon: Car,
        color: 'text-indigo-400',
        bg: 'from-indigo-400/20 to-blue-600/5',
        status: 'playable',
        xpReward: '5 XP / Meter',
        category: 'relax'
    },
    {
        id: 'flappy-bird',
        title: 'Flappy Bird',
        description: 'Fly through the pipes and set a new high score.',
        icon: Bird,
        color: 'text-yellow-500',
        bg: 'from-yellow-400/20 to-orange-500/5',
        status: 'playable',
        xpReward: '20 XP / Pipe',
        category: 'relax'
    },
    {
        id: 'match',
        title: 'Match 3',
        description: 'Match three or more shapes to clear them from the board.',
        icon: Star,
        color: 'text-pink-400',
        bg: 'from-pink-400/20 to-rose-600/5',
        status: 'playable',
        xpReward: '10 XP / Match',
        category: 'relax'
    },
    {
        id: 'meteor',
        title: 'Meteor Strike',
        description: 'Protect your base from falling meteors.',
        icon: Flame,
        color: 'text-orange-500',
        bg: 'from-orange-500/20 to-red-600/5',
        status: 'playable',
        xpReward: '50 XP / Meteor',
        category: 'relax'
    }
];

export default function ArcadePage() {
    const router = useRouter();
    const { settings } = useUISettings();
    const [activeCategory, setActiveCategory] = useState<'all' | 'study' | 'relax'>('all');

    const translations = {
        nl: {
            title: "ARCADE",
            subtitle: "Verbeter je kennis met ",
            studyGames: "Studie Games",
            orTakeBreak: " of neem een pauze met ",
            relaxGames: "Ontspannings Games",
            all: "Alle",
            study: "Studie",
            relax: "Ontspanning",
            dailyChallenges: "Dagelijkse Uitdagingen",
            seasonRankings: "Seizoensranglijst",
            strikeMultiplier: "Strike Multiplier",
            handcrafted: "Handgemaakt door High Focus Team",
            xpReward: "XP Beloning",
            games: {
                'study-city-3d': { title: '3D Studie Stad', desc: 'Roblox-stijl verkenning. Betreed gebouwen om AI-gegenereerde studiequests op te lossen.' },
                'cloud-jump': { title: 'Wolkensprong', desc: 'AI-gegenereerde studiegame. Spring op de juiste wolken om je vakken te beheersen.' },
                'word-scramble': { title: 'Woordhussel', desc: 'Ontrafel termen uit je leerset.' },
                'memory-match': { title: 'Memory Match', desc: 'Koppel termen aan hun definities.' },
                'math-sprint': { title: 'Wiskunde Sprint', desc: 'Los wiskundeproblemen zo snel mogelijk op.' },
                'subway-surfers': { title: 'Studie Surfers', desc: 'Snel renspel. Ontwijk obstakels en verzamel studieboosters.' },
                'mario': { title: 'Klassieke Mario', desc: 'De ultieme platformervaring.' },
                'battle-tactics': { title: 'Slagveld Tactiek', desc: 'Strategisch lane-based gevechtsspel.' },
                'city-builder': { title: 'Stadsbouwer', desc: 'Bouw en beheer je groeiende stad.' },
                'retro-racer': { title: 'Retro Racer', desc: '3D arcade racen op een cirkelvormig circuit.' },
                'tactical-breach': { title: 'Tactische Inbraak', desc: 'Eerstepersoons tactische simulatie.' },
                '2048': { title: '2048', desc: 'Voeg tegels samen om de 2048 tegel te bereiken.' },
                'minesweeper': { title: 'Mijnenveger', desc: 'Klassiek puzzelspel. Maak het veld leeg zonder mijnen te raken.' },
                'neon-dash': { title: 'Neon Dash', desc: 'Ritme-gebaseerde platformer. Spring over stekels op de maat.' },
                'csgo': { title: 'Aim Trainer 3D', desc: 'Train je reflexen en nauwkeurigheid in deze 3D-simulatie.' },
                'snake': { title: 'Neon Snake', desc: 'Klassieke snake met een moderne neon twist.' },
                'tetris': { title: 'Blokken Drop', desc: 'Het ultieme puzzelspel. Wis lijnen en scoor groot.' },
                'sudoku': { title: 'Logica Raster', desc: 'Daag je geest uit met klassieke getallenlogica.' },
                'block-blast': { title: 'Blokken Blast', desc: 'Wis lijnen door blokken te plaatsen in deze verslavende puzzel.' },
                'crossy-road': { title: 'Oversteekweg', desc: 'Steek de weg over zonder geraakt te worden. Pas op voor auto\'s!' },
                'flappy-bird': { title: 'Flappy Bird', desc: 'Vlieg door de pijpen en zet een nieuwe highscore.' },
                'match': { title: 'Match 3', desc: 'Combineer drie of meer vormen om ze van het bord te verwijderen.' },
                'meteor': { title: 'Meteoor Inslag', desc: 'Bescherm je basis tegen vallende meteoren.' }
            }
        },
        en: {
            title: "ARCADE",
            subtitle: "Level up your knowledge with ",
            studyGames: "Study Games",
            orTakeBreak: " or take a break with ",
            relaxGames: "Relax Games",
            all: "All",
            study: "Study",
            relax: "Relax",
            dailyChallenges: "Daily Challenges",
            seasonRankings: "Season Rankings",
            strikeMultiplier: "Strike Multiplier",
            handcrafted: "Handcrafted by High Focus Team",
            xpReward: "XP Reward",
            games: {
                'study-city-3d': { title: '3D Study City', desc: 'Roblox-style exploration. Enter buildings to solve AI-generated study quests.' },
                'cloud-jump': { title: 'Cloud Jump', desc: 'AI-generated study game. Jump on the right clouds to master your subjects.' },
                'word-scramble': { title: 'Word Scramble', desc: 'Unscramble terms from your learning set.' },
                'memory-match': { title: 'Memory Match', desc: 'Match terms with their definitions.' },
                'math-sprint': { title: 'Math Sprint', desc: 'Solve math problems as fast as you can.' },
                'subway-surfers': { title: 'Study Surfers', desc: 'Fast-paced runner. Dodge obstacles and collect study boosters.' },
                'mario': { title: 'Classic Mario', desc: 'The ultimate platformer experience.' },
                'battle-tactics': { title: 'Battle Tactics', desc: 'Strategic lane-based combat game.' },
                'city-builder': { title: 'City Builder', desc: 'Build and manage your growing city.' },
                'retro-racer': { title: 'Retro Racer', desc: '3D arcade racing on a circular track.' },
                'tactical-breach': { title: 'Tactical Breach', desc: 'First-person tactical clearing simulation.' },
                '2048': { title: '2048', desc: 'Merge tiles to reach the 2048 tile.' },
                'minesweeper': { title: 'Minesweeper', desc: 'Classic puzzle game. Clear the grid without detonating mines.' },
                'neon-dash': { title: 'Neon Dash', desc: 'Rhythm-based platformer. Jump over spikes to the beat.' },
                'csgo': { title: 'Aim Trainer 3D', desc: 'Train your reflexes and accuracy in this 3D simulation.' },
                'snake': { title: 'Neon Snake', desc: 'Classic snake with a modern neon twist.' },
                'tetris': { title: 'Block Drop', desc: 'The ultimate puzzle game. Clear lines and score big.' },
                'sudoku': { title: 'Logic Grid', desc: 'Challenge your mind with classic number logic.' },
                'block-blast': { title: 'Block Blast', desc: 'Clear lines by placing blocks in this addictive puzzle.' },
                'crossy-road': { title: 'Crossy Road', desc: 'Cross the road without getting hit. Watch out for cars!' },
                'flappy-bird': { title: 'Flappy Bird', desc: 'Fly through the pipes and set a new high score.' },
                'match': { title: 'Match 3', desc: 'Match three or more shapes to clear them from the board.' },
                'meteor': { title: 'Meteor Strike', desc: 'Protect your base from falling meteors.' }
            }
        },
        de: {
            title: "ARCADE",
            subtitle: "Verbessern Sie Ihr Wissen mit ",
            studyGames: "Lernspielen",
            orTakeBreak: " oder machen Sie eine Pause mit ",
            relaxGames: "Entspannungsspielen",
            all: "Alle",
            study: "Lernen",
            relax: "Entspannen",
            dailyChallenges: "Tägliche Herausforderungen",
            seasonRankings: "Saison-Ranglisten",
            strikeMultiplier: "Strike-Multiplikator",
            handcrafted: "Handgefertigt vom High Focus Team",
            xpReward: "XP Belohnung",
            games: {
                'study-city-3d': { title: '3D Lernstadt', desc: 'Erkundung im Roblox-Stil. Betreten Sie Gebäude, um KI-generierte Lernquests zu lösen.' },
                'cloud-jump': { title: 'Wolkensprung', desc: 'KI-generiertes Lernspiel. Springen Sie auf die richtigen Wolken, um Ihre Fächer zu meistern.' },
                'word-scramble': { title: 'Wortsalat', desc: 'Entschlüsseln Sie Begriffe aus Ihrem Lernset.' },
                'memory-match': { title: 'Memory Match', desc: 'Begriffe mit ihren Definitionen abgleichen.' },
                'math-sprint': { title: 'Mathe-Sprint', desc: 'Lösen Sie Matheaufgaben so schnell wie möglich.' },
                'subway-surfers': { title: 'Lern-Surfer', desc: 'Rasantes Laufspiel. Weichen Sie Hindernissen aus und sammeln Sie Lern-Booster.' },
                'mario': { title: 'Klassischer Mario', desc: 'Das ultimative Platformer-Erlebnis.' },
                'battle-tactics': { title: 'Schlachttaktik', desc: 'Strategisches lane-basiertes Kampfspiel.' },
                'city-builder': { title: 'Städtebauer', desc: 'Bauen und verwalten Sie Ihre wachsende Stadt.' },
                'retro-racer': { title: 'Retro Racer', desc: '3D-Arcade-Rennen auf einer kreisförmigen Strecke.' },
                'tactical-breach': { title: 'Taktischer Durchbruch', desc: 'Taktische First-Person-Simulation.' },
                '2048': { title: '2048', desc: 'Kacheln zusammenfügen, um die 2048er Kachel zu erreichen.' },
                'minesweeper': { title: 'Minesweeper', desc: 'Klassisches Puzzlespiel. Räumen Sie das Feld ohne Minen zu treffen.' },
                'neon-dash': { title: 'Neon Dash', desc: 'Rhythmus-basierter Platformer. Springen Sie im Takt über Stacheln.' },
                'csgo': { title: 'Aim Trainer 3D', desc: 'Trainieren Sie Ihre Reflexe und Genauigkeit in dieser 3D-Simulation.' },
                'snake': { title: 'Neon Snake', desc: 'Klassische Schlange mit modernem Neon-Twist.' },
                'tetris': { title: 'Block Drop', desc: 'Das ultimative Puzzlespiel. Linien löschen und groß punkten.' },
                'sudoku': { title: 'Logik-Gitter', desc: 'Fordern Sie Ihren Geist mit klassischer Zahlenlogik heraus.' },
                'block-blast': { title: 'Block Blast', desc: 'Linien löschen durch Platzieren von Blöcken.' },
                'crossy-road': { title: 'Crossy Road', desc: 'Überqueren Sie die Straße, ohne getroffen zu werden.' },
                'flappy-bird': { title: 'Flappy Bird', desc: 'Fliegen Sie durch die Rohre und setzen Sie einen neuen Highscore.' },
                'match': { title: 'Match 3', desc: 'Kombinieren Sie drei oder mehr Formen.' },
                'meteor': { title: 'Meteoreinschlag', desc: 'Schützen Sie Ihre Basis vor fallenden Meteoren.' }
            }
        },
        fr: {
            title: "ARCADE",
            subtitle: "Améliorez vos connaissances avec des ",
            studyGames: "Jeux d'Étude",
            orTakeBreak: " ou faites une pause avec des ",
            relaxGames: "Jeux de Détente",
            all: "Tout",
            study: "Étude",
            relax: "Détente",
            dailyChallenges: "Défis Quotidiens",
            seasonRankings: "Classements de Saison",
            strikeMultiplier: "Multiplicateur de Strike",
            handcrafted: "Conçu par l'équipe High Focus",
            xpReward: "Récompense XP",
            games: {
                'study-city-3d': { title: 'Ville d\'Étude 3D', desc: 'Exploration style Roblox. Entrez dans des bâtiments pour résoudre des quêtes d\'étude IA.' },
                'cloud-jump': { title: 'Saut de Nuage', desc: 'Jeu d\'étude généré par IA. Sautez sur les bons nuages pour maîtriser vos sujets.' },
                'word-scramble': { title: 'Mots Mêlés', desc: 'Déchiffrez les termes de votre ensemble d\'apprentissage.' },
                'memory-match': { title: 'Memory Match', desc: 'Associez les termes à leurs définitions.' },
                'math-sprint': { title: 'Sprint Math', desc: 'Résolvez des problèmes mathématiques le plus vite possible.' },
                'subway-surfers': { title: 'Surfeurs d\'Étude', desc: 'Jeu de course rapide. Évitez les obstacles et collectez des boosters d\'étude.' },
                'mario': { title: 'Mario Classique', desc: 'L\'expérience ultime du jeu de plateforme.' },
                'battle-tactics': { title: 'Tactiques de Bataille', desc: 'Jeu de combat stratégique par couloirs.' },
                'city-builder': { title: 'Constructeur de Ville', desc: 'Construisez et gérez votre ville en pleine croissance.' },
                'retro-racer': { title: 'Retro Racer', desc: 'Course d\'arcade 3D sur un circuit circulaire.' },
                'tactical-breach': { title: 'Brèche Tactique', desc: 'Simulation tactique à la première personne.' },
                '2048': { title: '2048', desc: 'Fusionnez les tuiles pour atteindre la tuile 2048.' },
                'minesweeper': { title: 'Démineur', desc: 'Jeu de puzzle classique. Videz la grille sans faire sauter les mines.' },
                'neon-dash': { title: 'Neon Dash', desc: 'Plateforme basée sur le rythme. Sautez les pointes en suivant le rythme.' },
                'csgo': { title: 'Aim Trainer 3D', desc: 'Entraînez vos réflexes et votre précision dans cette simulation 3D.' },
                'snake': { title: 'Serpent Néon', desc: 'Le serpent classique avec une touche néon moderne.' },
                'tetris': { title: 'Block Drop', desc: 'Le puzzle ultime. Effacez les lignes et marquez des points.' },
                'sudoku': { title: 'Grille Logique', desc: 'Défiez votre esprit avec la logique classique des nombres.' },
                'block-blast': { title: 'Block Blast', desc: 'Effacez les lignes en plaçant des blocs.' },
                'crossy-road': { title: 'Crossy Road', desc: 'Traversez la route sans vous faire écraser.' },
                'flappy-bird': { title: 'Flappy Bird', desc: 'Volez à travers les tuyaux et établissez un nouveau record.' },
                'match': { title: 'Match 3', desc: 'Associez trois formes ou plus.' },
                'meteor': { title: 'Frappe de Météore', desc: 'Protégez votre base contre les météores tombants.' }
            }
        },
        es: {
            title: "ARCADE",
            subtitle: "Mejora tus conocimientos con ",
            studyGames: "Juegos de Estudio",
            orTakeBreak: " o tómate un descanso con ",
            relaxGames: "Juegos de Relax",
            all: "Todo",
            study: "Estudio",
            relax: "Relax",
            dailyChallenges: "Desafíos Diarios",
            seasonRankings: "Rankings de Temporada",
            strikeMultiplier: "Multiplicador de Strike",
            handcrafted: "Hecho a mano por el equipo High Focus",
            xpReward: "Recompensa XP",
            games: {
                'study-city-3d': { title: 'Ciudad de Estudio 3D', desc: 'Exploración estilo Roblox. Entra en edificios para resolver misiones de estudio con IA.' },
                'cloud-jump': { title: 'Salto de Nube', desc: 'Juego de estudio con IA. Salta sobre las nubes correctas para dominar tus materias.' },
                'word-scramble': { title: 'Palabras Revueltas', desc: 'Descifra términos de tu conjunto de aprendizaje.' },
                'memory-match': { title: 'Memory Match', desc: 'Empareja términos con sus definiciones.' },
                'math-sprint': { title: 'Sprint Matemático', desc: 'Resuelve problemas matemáticos lo más rápido posible.' },
                'subway-surfers': { title: 'Study Surfers', desc: 'Juego de carrera rápida. Esquiva obstáculos y recoge potenciadores de estudio.' },
                'mario': { title: 'Mario Clásico', desc: 'La experiencia definitiva de plataformas.' },
                'battle-tactics': { title: 'Tácticas de Batalla', desc: 'Juego de combate estratégico por carriles.' },
                'city-builder': { title: 'Constructor de Ciudad', desc: 'Construye y gestiona tu ciudad en crecimiento.' },
                'retro-racer': { title: 'Retro Racer', desc: 'Carreras arcade 3D en una pista circular.' },
                'tactical-breach': { title: 'Brecha Táctica', desc: 'Simulación táctica en primera persona.' },
                '2048': { title: '2048', desc: 'Fusiona fichas para llegar a la ficha 2048.' },
                'minesweeper': { title: 'Buscaminas', desc: 'Juego de puzzle clásico. Limpia la rejilla sin detonar minas.' },
                'neon-dash': { title: 'Neon Dash', desc: 'Plataformas basado en el ritmo. Salta pinchos al compás.' },
                'csgo': { title: 'Aim Trainer 3D', desc: 'Entrena tus reflejos y precisión en esta simulación 3D.' },
                'snake': { title: 'Serpiente Neón', desc: 'La serpiente clásica con un toque moderno de neón.' },
                'tetris': { title: 'Block Drop', desc: 'El puzzle definitivo. Limpia líneas y puntúa alto.' },
                'sudoku': { title: 'Cuadrícula Lógica', desc: 'Desafía tu mente con la lógica clásica de los números.' },
                'block-blast': { title: 'Block Blast', desc: 'Limpia líneas colocando bloques.' },
                'crossy-road': { title: 'Crossy Road', desc: 'Cruza la carretera sin que te atropellen.' },
                'flappy-bird': { title: 'Flappy Bird', desc: 'Vuela por las tuberías y establece un nuevo récord.' },
                'match': { title: 'Match 3', desc: 'Combina tres o más formas.' },
                'meteor': { title: 'Ataque de Meteoritos', desc: 'Protege tu base de los meteoritos que caen.' }
            }
        }
    };

    const t = translations[settings.language as keyof typeof translations] || translations.en;

    const filteredGames = GAMES.filter(game => 
        activeCategory === 'all' || game.category === activeCategory
    );

    useEffect(() => {
        // Prefetch common games to speed up initial load
        // These imports warm the module cache without rendering
        Promise.allSettled([
            import('@/components/games/AimTrainer3D'),
            import('@/components/games/NeonDash'),
            import('@/components/games/CloudJump'),
        ]).catch(() => {});
    }, []);

    return (
        <div className="min-h-full bg-[#0a0f1e] text-white">
            {/* Background Glows */}
            <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-8 py-16 relative z-10">
                {/* Header Section */}
                <header className="mb-16">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                            <Gamepad2 className="w-8 h-8 text-blue-400" />
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter italic">{t.title}</h1>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <p className="text-slate-400 text-lg max-w-2xl font-medium leading-relaxed">
                            {t.subtitle}<span className="text-blue-400 font-bold">{t.studyGames}</span>{t.orTakeBreak}<span className="text-purple-400 font-bold">{t.relaxGames}</span>.
                        </p>
                        
                        {/* Category Tabs */}
                        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-xl">
                            <button 
                                onClick={() => setActiveCategory('all')}
                                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeCategory === 'all' ? 'bg-white text-black shadow-lg' : 'text-slate-400 hover:text-white'}`}
                            >
                                <LayoutGrid className="w-4 h-4" /> {t.all}
                            </button>
                            <button 
                                onClick={() => setActiveCategory('study')}
                                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeCategory === 'study' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white'}`}
                            >
                                <Brain className="w-4 h-4" /> {t.study}
                            </button>
                            <button 
                                onClick={() => setActiveCategory('relax')}
                                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeCategory === 'relax' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white'}`}
                            >
                                <Gamepad className="w-4 h-4" /> {t.relax}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Games Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredGames.map((game) => {
                        const gameTranslation = (t.games as any)[game.id] || { title: game.title, desc: game.description };
                        return (
                            <div
                                key={game.id}
                                onClick={() => game.status === 'playable' && router.push(`/games/${game.id}`)}
                                className={`group relative glass-card p-1 rounded-[2rem] border border-white/5 transition-all duration-500 cursor-pointer overflow-hidden ${
                                    game.status === 'playable' 
                                    ? 'hover:scale-[1.02] hover:border-white/20 hover:shadow-2xl hover:shadow-blue-500/10' 
                                    : 'opacity-60 grayscale'
                                }`}
                            >
                                {/* Inner Content */}
                                <div className="relative z-10 p-8 rounded-[1.8rem] h-full flex flex-col">
                                    {/* Game Icon & Category Tag */}
                                    <div className="flex justify-between items-start mb-8">
                                        <div className={`p-4 rounded-2xl bg-gradient-to-br ${game.bg} border border-white/10`}>
                                            <game.icon className={`w-8 h-8 ${game.color}`} />
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                            game.category === 'study' 
                                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                                            : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                        }`}>
                                            {(t as any)[game.category] || game.category}
                                        </span>
                                    </div>

                                    {/* Text Content */}
                                    <div className="mb-8">
                                        <h3 className="text-2xl font-black italic mb-2 group-hover:text-blue-400 transition-colors">
                                            {gameTranslation.title}
                                        </h3>
                                        <p className="text-slate-400 text-sm font-medium leading-relaxed line-clamp-2">
                                            {gameTranslation.desc}
                                        </p>
                                    </div>

                                    {/* Footer Stats */}
                                    <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            <Star className="w-3.5 h-3.5 text-yellow-500" />
                                            {game.xpReward ? game.xpReward.replace('XP', (t as any).xpReward || 'XP') : ''}
                                        </div>
                                        <div className="p-2 bg-white/5 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-all">
                                            <ArrowRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>

                                {/* Hover Background Decor */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${game.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                            </div>
                        );
                    })}
                </div>

                {/* Footer Section */}
                <footer className="mt-24 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-8 text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em]">
                        <div className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> {t.dailyChallenges}</div>
                        <div className="flex items-center gap-2"><Trophy className="w-4 h-4" /> {t.seasonRankings}</div>
                        <div className="flex items-center gap-2"><Flame className="w-4 h-4" /> {t.strikeMultiplier}</div>
                    </div>
                    <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                        {t.handcrafted}
                    </p>
                </footer>
            </div>

            <style jsx global>{`
                .glass-card {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(12px);
                    border-radius: 1.5rem;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
