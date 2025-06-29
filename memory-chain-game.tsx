import React, { useState, useEffect, useCallback } from 'react';
import { Play, RotateCcw, Zap, Heart, Trophy, Clock, Star, Volume2, Target, Flame, TrendingUp, Gift } from 'lucide-react';

const MemoryChainGame = () => {
  const [gameMode, setGameMode] = useState('menu');
  const [level, setLevel] = useState(1);
  const [sequence, setSequence] = useState([]);
  const [playerInput, setPlayerInput] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showingSequence, setShowingSequence] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [streak, setStreak] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [timeLeft, setTimeLeft] = useState(null);
  const [bestScores, setBestScores] = useState({
    letters: 0,
    words: 0,
    'cards-letters': 0,
    'cards-words': 0
  });
  const [gameStartTime, setGameStartTime] = useState(null);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [achievements, setAchievements] = useState([]);
  
  // New psychological and meta-game states
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [dailyChallengeCompleted, setDailyChallengeCompleted] = useState(false);
  const [personalBests, setPersonalBests] = useState({});
  const [sessionStats, setSessionStats] = useState({
    gamesPlayed: 0,
    totalScore: 0,
    perfectRounds: 0,
    comebacks: 0
  });
  const [powerUps, setPowerUps] = useState({
    slowTime: 2,
    extraLife: 1,
    peek: 3
  });
  const [activePowerUp, setActivePowerUp] = useState(null);
  const [multiplier, setMultiplier] = useState(1);
  const [comboCounter, setComboCounter] = useState(0);
  const [recentFeedback, setRecentFeedback] = useState('');
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState(1.0);
  const [playerTrends, setPlayerTrends] = useState({
    strongestMode: '',
    weakestMode: '',
    optimalPlayTime: 'afternoon'
  });
  const [notifications, setNotifications] = useState([]);

  // Enhanced content pools with categories
  const contentCategories = {
    letters: {
      basic: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
      numbers: '0123456789'.split(''),
      special: '!@#$%^&*'.split(''),
      mixed: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')
    },
    words: {
      animals: ['Cat', 'Dog', 'Lion', 'Tiger', 'Eagle', 'Shark', 'Wolf', 'Bear', 'Fox', 'Owl'],
      colors: ['Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Brown', 'Black', 'White'],
      food: ['Pizza', 'Burger', 'Cake', 'Apple', 'Bread', 'Cheese', 'Coffee', 'Tea', 'Rice', 'Fish'],
      tech: ['Computer', 'Phone', 'Internet', 'Software', 'Robot', 'AI', 'Code', 'Data', 'Cloud', 'App'],
      nature: ['Mountain', 'Ocean', 'Forest', 'River', 'Sky', 'Sun', 'Moon', 'Star', 'Wind', 'Rain'],
      emotions: ['Happy', 'Sad', 'Angry', 'Calm', 'Excited', 'Peaceful', 'Brave', 'Kind', 'Smart', 'Strong']
    }
  };

  const encouragementMessages = [
    "🔥 You're on fire!", "💪 Incredible focus!", "🎯 Perfect aim!", "⚡ Lightning fast!",
    "🧠 Brain power activated!", "🌟 Amazing memory!", "🚀 Unstoppable!", "💎 Flawless execution!",
    "🎪 Mind-blowing!", "🏆 Champion level!", "🎨 Beautiful precision!", "🌈 Spectacular!"
  ];

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning, Memory Master! 🌅";
    if (hour < 18) return "Good afternoon, Brain Champion! ☀️";
    return "Good evening, Mind Wizard! 🌙";
  };

  const generateDailyChallenge = () => {
    const today = new Date().toDateString();
    const challengeTypes = [
      { type: 'streak', target: 15, desc: 'Achieve a 15-streak in any mode', reward: 500 },
      { type: 'perfect', target: 5, desc: 'Complete 5 perfect rounds', reward: 300 },
      { type: 'level', target: 25, desc: 'Reach level 25 in Letter Chains', reward: 400 },
      { type: 'speed', target: 30, desc: 'Complete a round in under 30 seconds', reward: 250 }
    ];
    
    const challenge = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];
    return { ...challenge, date: today, progress: 0 };
  };

  const usePowerUp = (type) => {
    if (powerUps[type] <= 0) return;
    
    setPowerUps(prev => ({ ...prev, [type]: prev[type] - 1 }));
    setActivePowerUp(type);
    
    if (type === 'extraLife') {
      setLives(prev => Math.min(5, prev + 1));
      showFeedback("💚 Extra life granted!");
    } else if (type === 'slowTime') {
      showFeedback("⏰ Time slowed down!");
      setTimeout(() => setActivePowerUp(null), 10000);
    } else if (type === 'peek') {
      showFeedback("👁️ Peek activated!");
      setTimeout(() => setActivePowerUp(null), 3000);
    }
  };

  const showFeedback = useCallback((message) => {
    setRecentFeedback(message);
    setTimeout(() => setRecentFeedback(''), 2000);
  }, []);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const calculateDynamicDifficulty = () => {
    const recentPerformance = sessionStats.totalScore / (sessionStats.gamesPlayed || 1);
    if (recentPerformance > 500) return Math.min(1.5, adaptiveDifficulty + 0.1);
    if (recentPerformance < 200) return Math.max(0.7, adaptiveDifficulty - 0.1);
    return adaptiveDifficulty;
  };

  const getVariedContent = (mode, level, category = null) => {
    if (mode === 'letters') {
      const categories = Object.keys(contentCategories.letters);
      const selectedCategory = category || categories[Math.floor(Math.random() * categories.length)];
      return contentCategories.letters[selectedCategory];
    } else {
      const categories = Object.keys(contentCategories.words);
      const selectedCategory = category || categories[Math.floor(Math.random() * categories.length)];
      return contentCategories.words[selectedCategory];
    }
  };

  const getLevelConfig = (mode, level) => {
    const difficulty = calculateDynamicDifficulty();
    const baseConfig = {
      letters: {
        length: Math.floor((2 + Math.floor(level/5)) * difficulty),
        timing: Math.max(500, Math.floor((1500 - level * 20) / difficulty)),
        pools: [getVariedContent('letters', level)]
      },
      words: {
        count: Math.floor((2 + Math.floor(level/10)) * difficulty),
        timing: Math.max(800, Math.floor((2000 - level * 30) / difficulty)),
        wordType: level > 40 ? 'long' : level > 20 ? 'medium' : 'short'
      }
    };

    if (activePowerUp === 'slowTime') {
      baseConfig[mode].timing *= 1.5;
    }

    return baseConfig[mode] || baseConfig.letters;
  };

  const generateRandomString = (length, pools) => {
    const allChars = pools.flat();
    let result = '';
    for (let i = 0; i < length; i++) {
      result += allChars[Math.floor(Math.random() * allChars.length)];
    }
    return result;
  };

  const generateWordChain = (count, category = null) => {
    const pool = getVariedContent('words', level, category);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };

  const createCards = (mode, pairs) => {
    const cardPairs = [];
    if (mode === 'letters') {
      for (let i = 0; i < pairs; i++) {
        const config = getLevelConfig('letters', Math.min(level, 50));
        const randomStr = generateRandomString(config.length, config.pools);
        cardPairs.push(randomStr, randomStr);
      }
    } else {
      for (let i = 0; i < pairs; i++) {
        const wordChain = generateWordChain(3).join('');
        cardPairs.push(wordChain, wordChain);
      }
    }
    
    const shuffled = cardPairs.sort(() => Math.random() - 0.5);
    return shuffled.map((content, index) => ({
      id: index,
      content,
      isFlipped: false,
      isMatched: false
    }));
  };

  const startGame = (mode) => {
    setGameMode(mode);
    setLevel(1);
    setScore(0);
    setLives(3);
    setStreak(0);
    setGameOver(false);
    setPlayerInput('');
    setGameStartTime(Date.now());
    setTotalCorrect(0);
    setMultiplier(1);
    setComboCounter(0);
    
    // Update session stats
    setSessionStats(prev => ({
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1
    }));
    
    if (mode.startsWith('cards')) {
      const cardMode = mode.split('-')[1];
      const config = getLevelConfig(mode, 1);
      setCards(createCards(cardMode, 4 + Math.floor(level/10)));
      setFlippedCards([]);
      setMatchedPairs([]);
    } else {
      startLevel(mode, 1);
    }
  };

  const startLevel = (mode, levelNum) => {
    const config = getLevelConfig(mode, levelNum);
    let newSequence;
    
    if (mode === 'letters') {
      newSequence = [generateRandomString(config.length, config.pools)];
    } else if (mode === 'words') {
      newSequence = generateWordChain(config.count);
    }
    
    setSequence(newSequence);
    setCurrentIndex(0);
    setPlayerInput('');
    showSequence(newSequence, config.timing);
  };

  const showSequence = (seq, timing) => {
    setShowingSequence(true);
    setCurrentIndex(0);
    
    seq.forEach((item, index) => {
      setTimeout(() => {
        setCurrentIndex(index);
        if (index === seq.length - 1) {
          setTimeout(() => {
            setShowingSequence(false);
            setCurrentIndex(-1);
          }, timing);
        }
      }, index * timing);
    });
  };

  const checkAchievements = (newScore, newStreak, levelNum) => {
    const newAchievements = [];
    
    if (newStreak >= 5 && !achievements.includes('streak5')) {
      newAchievements.push('streak5');
      addNotification("🔥 Achievement Unlocked: 5-Streak Master!", 'achievement');
    }
    if (newStreak >= 15 && !achievements.includes('streak15')) {
      newAchievements.push('streak15');
      addNotification("🌟 Achievement Unlocked: Streak Legend!", 'achievement');
    }
    if (levelNum >= 25 && !achievements.includes('level25')) {
      newAchievements.push('level25');
      addNotification("🏆 Achievement Unlocked: Quarter Century!", 'achievement');
    }
    
    if (newAchievements.length > 0) {
      setAchievements([...achievements, ...newAchievements]);
      // Award power-ups for achievements
      setPowerUps(prev => ({
        ...prev,
        slowTime: prev.slowTime + 1,
        peek: prev.peek + 1
      }));
    }
  };

  const handleSubmit = () => {
    const expected = sequence.join('');
    const isCorrect = gameMode === 'letters' 
      ? playerInput.toUpperCase() === expected.toUpperCase()
      : playerInput.toLowerCase().replace(/\s/g, '') === expected.toLowerCase();
    
    if (isCorrect) {
      const streakBonus = Math.floor(streak / 5) * 10;
      const timeBonus = Math.max(0, 100 - Math.floor((Date.now() - gameStartTime) / 100));
      const comboBonus = comboCounter * 5;
      const totalBonus = (level * 10 + streakBonus + timeBonus + comboBonus) * multiplier;
      
      const newScore = score + totalBonus;
      const newStreak = streak + 1;
      const newLevel = level + 1;
      const newTotalCorrect = totalCorrect + 1;
      const newCombo = comboCounter + 1;
      
      setScore(newScore);
      setStreak(newStreak);
      setTotalCorrect(newTotalCorrect);
      setComboCounter(newCombo);
      
      // Dynamic multiplier based on performance
      if (newStreak > 0 && newStreak % 5 === 0) {
        setMultiplier(prev => Math.min(3, prev + 0.2));
        showFeedback(`🚀 Multiplier increased to ${(multiplier + 0.2).toFixed(1)}x!`);
      }
      
      // Encouraging feedback
      const randomEncouragement = encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)];
      showFeedback(randomEncouragement);
      
      checkAchievements(newScore, newStreak, newLevel);
      
      // Update session stats
      setSessionStats(prev => ({
        ...prev,
        totalScore: prev.totalScore + totalBonus,
        perfectRounds: prev.perfectRounds + (lives === 3 ? 1 : 0)
      }));
      
      if (newLevel > 100) {
        setGameOver(true);
        updateBestScore(newScore);
        addNotification("🎉 Congratulations! You've mastered all 100 levels!", 'victory');
      } else {
        setLevel(newLevel);
        startLevel(gameMode, newLevel);
      }
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      setStreak(0);
      setMultiplier(1);
      setComboCounter(0);
      
      // Comeback detection
      if (newLives === 1 && lives === 2) {
        setSessionStats(prev => ({
          ...prev,
          comebacks: prev.comebacks + 1
        }));
      }
      
      if (newLives <= 0) {
        setGameOver(true);
        updateBestScore(score);
        showFeedback("💪 Don't give up! You're getting stronger!");
      } else {
        showFeedback(`💔 Close one! ${newLives} ${newLives === 1 ? 'life' : 'lives'} remaining.`);
        startLevel(gameMode, level);
      }
    }
  };

  const handleCardClick = (cardId) => {
    if (flippedCards.length === 2 || flippedCards.includes(cardId) || matchedPairs.includes(cardId)) return;
    
    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);
    
    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      const firstCard = cards.find(c => c.id === first);
      const secondCard = cards.find(c => c.id === second);
      
      if (firstCard.content === secondCard.content) {
        setTimeout(() => {
          const newMatchedPairs = [...matchedPairs, first, second];
          setMatchedPairs(newMatchedPairs);
          const comboBonus = comboCounter * 10;
          const newScore = score + (level * 5) + comboBonus;
          setScore(newScore);
          setComboCounter(prev => prev + 1);
          setFlippedCards([]);
          
          showFeedback("✨ Perfect match!");
          
          if (newMatchedPairs.length === cards.length) {
            const newLevel = level + 1;
            if (newLevel > 100) {
              setGameOver(true);
              updateBestScore(newScore);
            } else {
              setLevel(newLevel);
              const cardMode = gameMode.split('-')[1];
              setCards(createCards(cardMode, 4 + Math.floor(newLevel/10)));
              setFlippedCards([]);
              setMatchedPairs([]);
            }
          }
        }, 500);
      } else {
        setTimeout(() => {
          setFlippedCards([]);
          setComboCounter(0);
          const newLives = lives - 1;
          setLives(newLives);
          if (newLives <= 0) {
            setGameOver(true);
            updateBestScore(score);
          }
        }, 1000);
      }
    }
  };

  const updateBestScore = (finalScore) => {
    const currentBest = bestScores[gameMode] || 0;
    if (finalScore > currentBest) {
      setBestScores({
        ...bestScores,
        [gameMode]: finalScore
      });
      addNotification("🎉 New Personal Best!", 'achievement');
    }
  };

  const resetGame = () => {
    setGameMode('menu');
    setLevel(1);
    setSequence([]);
    setPlayerInput('');
    setCurrentIndex(-1);
    setShowingSequence(false);
    setScore(0);
    setLives(3);
    setStreak(0);
    setGameOver(false);
    setCards([]);
    setFlippedCards([]);
    setMatchedPairs([]);
    setTimeLeft(null);
    setGameStartTime(null);
    setTotalCorrect(0);
    setMultiplier(1);
    setComboCounter(0);
    setActivePowerUp(null);
  };

  const getGridSize = (cardCount) => {
    if (cardCount <= 16) return 'grid-cols-4';
    if (cardCount <= 36) return 'grid-cols-6';
    return 'grid-cols-8';
  };

  // Initialize daily challenge
  useEffect(() => {
    if (!dailyChallenge) {
      setDailyChallenge(generateDailyChallenge());
    }
  }, [dailyChallenge]);

  // Timer effect for card games
  useEffect(() => {
    if (timeLeft > 0 && gameMode.startsWith('cards') && !gameOver) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setGameOver(true);
      updateBestScore(score);
    }
  }, [timeLeft, gameMode, gameOver, score]);

  if (gameMode === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
        {/* Notifications */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg shadow-lg transform transition-all duration-300 ${
                notification.type === 'achievement' ? 'bg-yellow-400 text-yellow-900' :
                notification.type === 'victory' ? 'bg-green-400 text-green-900' :
                'bg-blue-400 text-blue-900'
              }`}
            >
              {notification.message}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-xl">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-10 h-10 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Memory Chain Pro
            </h1>
            <p className="text-gray-600 mb-2">{getTimeBasedGreeting()}</p>
            <p className="text-sm text-gray-500">100 levels of adaptive challenges!</p>
          </div>

          {/* Daily Challenge */}
          {dailyChallenge && !dailyChallengeCompleted && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="w-5 h-5 text-yellow-600" />
                <span className="font-semibold text-yellow-800">Daily Challenge</span>
              </div>
              <p className="text-sm text-yellow-700 mb-2">{dailyChallenge.desc}</p>
              <div className="flex justify-between items-center">
                <div className="text-xs text-yellow-600">
                  Progress: {dailyChallenge.progress}/{dailyChallenge.target}
                </div>
                <div className="text-xs text-yellow-600 font-semibold">
                  +{dailyChallenge.reward} points
                </div>
              </div>
            </div>
          )}

          {/* Session Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">{sessionStats.gamesPlayed}</div>
              <div className="text-xs text-gray-600">Games Today</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{sessionStats.perfectRounds}</div>
              <div className="text-xs text-gray-600">Perfect Rounds</div>
            </div>
          </div>

          {/* Power-ups */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-indigo-600" />
              <span className="font-semibold text-indigo-800">Power-ups</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <div className="bg-indigo-100 rounded-lg p-2 mb-1">
                  <Clock className="w-4 h-4 text-indigo-600 mx-auto" />
                </div>
                <div className="text-xs text-indigo-700">Slow Time</div>
                <div className="text-sm font-bold text-indigo-800">{powerUps.slowTime}</div>
              </div>
              <div className="text-center">
                <div className="bg-indigo-100 rounded-lg p-2 mb-1">
                  <Heart className="w-4 h-4 text-indigo-600 mx-auto" />
                </div>
                <div className="text-xs text-indigo-700">Extra Life</div>
                <div className="text-sm font-bold text-indigo-800">{powerUps.extraLife}</div>
              </div>
              <div className="text-center">
                <div className="bg-indigo-100 rounded-lg p-2 mb-1">
                  <Target className="w-4 h-4 text-indigo-600 mx-auto" />
                </div>
                <div className="text-xs text-indigo-700">Peek</div>
                <div className="text-sm font-bold text-indigo-800">{powerUps.peek}</div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3 mb-6">
            <button
              onClick={() => startGame('letters')}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105 flex items-center justify-between shadow-lg"
            >
              <span>Letter Chains</span>
              <span className="text-sm bg-purple-400 px-2 py-1 rounded">Best: {bestScores.letters}</span>
            </button>
            
            <button
              onClick={() => startGame('words')}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 flex items-center justify-between shadow-lg"
            >
              <span>Word Chains</span>
              <span className="text-sm bg-blue-400 px-2 py-1 rounded">Best: {bestScores.words}</span>
            </button>
            
            <button
              onClick={() => startGame('cards-letters')}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 flex items-center justify-between shadow-lg"
            >
              <span>Letter Cards</span>
              <span className="text-sm bg-green-400 px-2 py-1 rounded">Best: {bestScores['cards-letters']}</span>
            </button>
            
            <button
              onClick={() => startGame('cards-words')}
              className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-teal-600 hover:to-teal-700 transition-all transform hover:scale-105 flex items-center justify-between shadow-lg"
            >
              <span>Word Cards</span>
              <span className="text-sm bg-teal-400 px-2 py-1 rounded">Best: {bestScores['cards-words']}</span>
            </button>
          </div>

          {achievements.length > 0 && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                <span className="font-semibold text-yellow-800">Achievements ({achievements.length})</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {achievements.slice(0, 6).map(achievement => (
                  <span key={achievement} className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs">
                    {achievement === 'streak5' && '🔥 5-Streak'}
                    {achievement === 'streak15' && '🌟 15-Streak'}
                    {achievement === 'level25' && '🏆 Level 25'}
                    {achievement === 'level50' && '💎 Level 50'}
                    {achievement === 'level100' && '👑 Level 100'}
                  </span>
                ))}
                {achievements.length > 6 && (
                  <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs">
                    +{achievements.length - 6} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Enhanced feedback display
  const FeedbackDisplay = () => {
    if (!recentFeedback) return null;
    return (
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl p-4 shadow-xl z-50 animate-pulse">
        <div className="text-center font-bold text-lg text-purple-600">
          {recentFeedback}
        </div>
      </div>
    );
  };

  if (gameMode.startsWith('cards')) {
    const cardMode = gameMode.split('-')[1];
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-4">
        <FeedbackDisplay />
        
        {/* Notifications */}
        <div className="fixed top-4 right-4 z-40 space-y-2">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`p-3 rounded-lg shadow-lg transform transition-all duration-300 ${
                notification.type === 'achievement' ? 'bg-yellow-400 text-yellow-900' :
                notification.type === 'victory' ? 'bg-green-400 text-green-900' :
                'bg-blue-400 text-blue-900'
              }`}
            >
              {notification.message}
            </div>
          ))}
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl p-4 mb-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <h2 className="text-xl font-bold text-gray-800">
                {cardMode === 'letters' ? 'Letter Cards' : 'Word Cards'} - Level {level}
              </h2>
              <div className="flex items-center gap-4 flex-wrap">
                {timeLeft && (
                  <div className="flex items-center gap-1 text-red-600">
                    <Clock className="w-4 h-4" />
                    <span className="font-semibold">{timeLeft}s</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, Math.max(3, lives)))].map((_, i) => (
                    <Heart key={i} className={`w-5 h-5 ${i < lives ? 'text-red-500 fill-current' : 'text-gray-300'}`} />
                  ))}
                </div>
                <div className="flex items-center gap-1 text-yellow-600">
                  <Flame className="w-4 h-4" />
                  <span className="font-semibold">{streak}</span>
                </div>
                <div className="flex items-center gap-1 text-blue-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-semibold">{multiplier.toFixed(1)}x</span>
                </div>
                <span className="text-lg font-semibold text-purple-600">Score: {score}</span>
                
                {/* Power-up buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => usePowerUp('extraLife')}
                    disabled={powerUps.extraLife <= 0}
                    className={`p-2 rounded-lg ${powerUps.extraLife > 0 ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-300 text-gray-500'}`}
                    title="Extra Life"
                  >
                    <Heart className="w-4 h-4" />
                    <span className="text-xs">{powerUps.extraLife}</span>
                  </button>
                  <button
                    onClick={() => usePowerUp('peek')}
                    disabled={powerUps.peek <= 0}
                    className={`p-2 rounded-lg ${powerUps.peek > 0 ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'}`}
                    title="Peek"
                  >
                    <Target className="w-4 h-4" />
                    <span className="text-xs">{powerUps.peek}</span>
                  </button>
                </div>
                
                <button
                  onClick={resetGame}
                  className="bg-gray-500 text-white p-2 rounded-lg hover:bg-gray-600"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(level / 100) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className={`grid ${getGridSize(cards.length)} gap-2 max-w-4xl mx-auto`}>
            {cards.map((card) => {
              const isFlipped = flippedCards.includes(card.id);
              const isMatched = matchedPairs.includes(card.id);
              const showContent = isFlipped || isMatched || (activePowerUp === 'peek');
              
              return (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  className={`aspect-square rounded-lg cursor-pointer transition-all duration-300 ${
                    showContent
                      ? 'bg-white shadow-lg transform scale-105'
                      : 'bg-gradient-to-br from-gray-400 to-gray-500 hover:from-gray-300 hover:to-gray-400 shadow-md'
                  } ${isMatched ? 'ring-2 ring-green-400' : ''}`}
                >
                  <div className="w-full h-full flex items-center justify-center p-1">
                    {showContent && (
                      <span className="text-center font-bold text-gray-800 text-xs break-all">
                        {card.content}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {gameOver && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full">
                <h3 className="text-2xl font-bold text-purple-600 mb-4">
                  {level > 100 ? '🎉 You Win!' : '💔 Game Over'}
                </h3>
                <div className="space-y-2 mb-6">
                  <p className="text-gray-600">Level Reached: {level}</p>
                  <p className="text-gray-600">Final Score: {score}</p>
                  <p className="text-gray-600">Best Streak: {Math.max(streak, sessionStats.perfectRounds)}</p>
                  <p className="text-gray-600">Total Time: {Math.floor((Date.now() - gameStartTime) / 1000)}s</p>
                </div>
                <button
                  onClick={resetGame}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600"
                >
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
      <FeedbackDisplay />
      
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-40 space-y-2">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`p-3 rounded-lg shadow-lg transform transition-all duration-300 ${
              notification.type === 'achievement' ? 'bg-yellow-400 text-yellow-900' :
              notification.type === 'victory' ? 'bg-green-400 text-green-900' :
              'bg-blue-400 text-blue-900'
            }`}
          >
            {notification.message}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h2 className="text-xl font-bold text-gray-800">
            {gameMode === 'letters' ? 'Letter Chains' : 'Word Chains'} - Level {level}
          </h2>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, Math.max(3, lives)))].map((_, i) => (
                <Heart key={i} className={`w-5 h-5 ${i < lives ? 'text-red-500 fill-current' : 'text-gray-300'}`} />
              ))}
            </div>
            <div className="flex items-center gap-1 text-yellow-600">
              <Flame className="w-4 h-4" />
              <span className="font-semibold">{streak}</span>
            </div>
            <div className="flex items-center gap-1 text-blue-600">
              <TrendingUp className="w-4 h-4" />
              <span className="font-semibold">{multiplier.toFixed(1)}x</span>
            </div>
            <span className="text-lg font-semibold text-purple-600">Score: {score}</span>
            
            {/* Power-up buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => usePowerUp('slowTime')}
                disabled={powerUps.slowTime <= 0 || activePowerUp === 'slowTime'}
                className={`p-2 rounded-lg ${powerUps.slowTime > 0 && activePowerUp !== 'slowTime' ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'}`}
                title="Slow Time"
              >
                <Clock className="w-4 h-4" />
                <span className="text-xs">{powerUps.slowTime}</span>
              </button>
              <button
                onClick={() => usePowerUp('extraLife')}
                disabled={powerUps.extraLife <= 0 || lives >= 5}
                className={`p-2 rounded-lg ${powerUps.extraLife > 0 && lives < 5 ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-300 text-gray-500'}`}
                title="Extra Life"
              >
                <Heart className="w-4 h-4" />
                <span className="text-xs">{powerUps.extraLife}</span>
              </button>
            </div>
            
            <button
              onClick={resetGame}
              className="bg-gray-500 text-white p-2 rounded-lg hover:bg-gray-600"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="mb-4 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(level / 100) * 100}%` }}
          ></div>
        </div>

        {showingSequence ? (
          <div className="text-center">
            <p className="text-gray-600 mb-6">Watch and memorize:</p>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-xl mb-6 border-2 border-purple-200">
              <div className="text-3xl font-bold text-gray-800 min-h-[60px] flex items-center justify-center">
                {currentIndex >= 0 && sequence[currentIndex]}
              </div>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>{currentIndex + 1} of {sequence.length}</span>
              {activePowerUp === 'slowTime' && (
                <span className="text-blue-600 font-semibold">⏰ Slow Time Active</span>
              )}
            </div>
          </div>
        ) : gameOver ? (
          <div className="text-center">
            <h3 className="text-2xl font-bold text-purple-600 mb-4">
              {level > 100 ? '🎉 You Win!' : '💔 Game Over'}
            </h3>
            <div className="space-y-2 mb-6">
              <p className="text-gray-600">Level Reached: {level}</p>
              <p className="text-gray-600">Final Score: {score}</p>
              <p className="text-gray-600">Best Streak: {Math.max(streak, sessionStats.perfectRounds)}</p>
              <p className="text-gray-600">Accuracy: {Math.round((totalCorrect / (totalCorrect + (3 - lives) + 1)) * 100)}%</p>
              <p className="text-gray-600">Total Time: {Math.floor((Date.now() - gameStartTime) / 1000)}s</p>
            </div>
            <p className="text-sm text-gray-500 mb-6 font-mono bg-gray-100 p-3 rounded">
              Expected: {sequence.join('')}
            </p>
            <button
              onClick={resetGame}
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600"
            >
              Play Again
            </button>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-4 text-center">
              Type the complete sequence:
            </p>
            <input
              type="text"
              value={playerInput}
              onChange={(e) => setPlayerInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full p-4 border-2 border-gray-200 rounded-xl text-lg text-center focus:border-purple-500 focus:outline-none mb-4"
              placeholder={gameMode === 'letters' ? 'Enter letters...' : 'Enter words...'}
              autoFocus
            />
            <button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 mb-4"
            >
              Submit
            </button>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Sequence length: {sequence.length}</span>
              <span>Combo: {comboCounter}</span>
              <span>Multiplier: {multiplier.toFixed(1)}x</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryChainGame;
