import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Zap, Heart, Trophy, Clock, Star, Volume2 } from 'lucide-react';

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

  const letterPool = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const numberPool = '0123456789'.split('');
  const specialPool = '!@#$%^&*'.split('');
  const wordPools = {
    short: ['Cat', 'Dog', 'Sun', 'Car', 'Bed', 'Cup', 'Hat', 'Key', 'Pen', 'Box'],
    medium: ['Chair', 'Phone', 'House', 'Music', 'Water', 'Light', 'Table', 'Plant', 'Clock', 'Book'],
    long: ['Computer', 'Mountain', 'Elephant', 'Rainbow', 'Basketball', 'Adventure', 'Butterfly', 'Chocolate', 'Yesterday', 'Beautiful']
  };

  const getLevelConfig = (mode, level) => {
    if (mode === 'letters') {
      if (level <= 10) return { length: 2 + Math.floor(level/5), timing: 1500, pools: [letterPool] };
      if (level <= 25) return { length: 3 + Math.floor(level/8), timing: 1300, pools: [letterPool, numberPool] };
      if (level <= 40) return { length: 4 + Math.floor(level/10), timing: 1100, pools: [letterPool, numberPool] };
      if (level <= 60) return { length: 5 + Math.floor(level/12), timing: 900, pools: [letterPool, numberPool, specialPool] };
      if (level <= 80) return { length: 6 + Math.floor(level/15), timing: 700, pools: [letterPool, numberPool, specialPool] };
      return { length: 8 + Math.floor(level/20), timing: 500, pools: [letterPool, numberPool, specialPool] };
    }
    
    if (mode === 'words') {
      if (level <= 20) return { count: 2 + Math.floor(level/10), timing: 2000, wordType: 'short' };
      if (level <= 40) return { count: 3 + Math.floor(level/15), timing: 1800, wordType: 'medium' };
      if (level <= 60) return { count: 4 + Math.floor(level/15), timing: 1500, wordType: 'long' };
      if (level <= 80) return { count: 5 + Math.floor(level/20), timing: 1200, wordType: 'long' };
      return { count: 6 + Math.floor(level/25), timing: 1000, wordType: 'long' };
    }
    
    if (mode.startsWith('cards')) {
      const basePairs = 4 + Math.floor(level/10);
      const maxPairs = Math.min(24, basePairs);
      const timeLimit = level > 50 ? 60 - Math.floor(level/10) : null;
      return { pairs: maxPairs, timeLimit };
    }
  };

  const generateRandomString = (length, pools) => {
    const allChars = pools.flat();
    let result = '';
    for (let i = 0; i < length; i++) {
      result += allChars[Math.floor(Math.random() * allChars.length)];
    }
    return result;
  };

  const generateWordChain = (count, wordType) => {
    const pool = wordPools[wordType];
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
        const config = getLevelConfig('words', Math.min(level, 50));
        const wordChain = generateWordChain(config.count, config.wordType).join('');
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
    
    if (mode.startsWith('cards')) {
      const cardMode = mode.split('-')[1];
      const config = getLevelConfig(mode, 1);
      setCards(createCards(cardMode, config.pairs));
      setFlippedCards([]);
      setMatchedPairs([]);
      if (config.timeLimit) {
        setTimeLeft(config.timeLimit);
      }
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
      newSequence = generateWordChain(config.count, config.wordType);
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
    }
    if (newStreak >= 10 && !achievements.includes('streak10')) {
      newAchievements.push('streak10');
    }
    if (levelNum >= 25 && !achievements.includes('level25')) {
      newAchievements.push('level25');
    }
    if (levelNum >= 50 && !achievements.includes('level50')) {
      newAchievements.push('level50');
    }
    if (levelNum >= 100 && !achievements.includes('level100')) {
      newAchievements.push('level100');
    }
    
    if (newAchievements.length > 0) {
      setAchievements([...achievements, ...newAchievements]);
    }
  };

  const handleSubmit = () => {
    const expected = sequence.join('');
    const isCorrect = gameMode === 'letters' 
      ? playerInput.toUpperCase() === expected.toUpperCase()
      : playerInput.toLowerCase().replace(/\s/g, '') === expected.toLowerCase();
    
    if (isCorrect) {
      const streakBonus = Math.floor(streak / 5) * 10;
      const newScore = score + (level * 10) + streakBonus;
      const newStreak = streak + 1;
      const newLevel = level + 1;
      const newTotalCorrect = totalCorrect + 1;
      
      setScore(newScore);
      setStreak(newStreak);
      setTotalCorrect(newTotalCorrect);
      checkAchievements(newScore, newStreak, newLevel);
      
      if (newLevel > 100) {
        setGameOver(true);
        updateBestScore(newScore);
      } else {
        setLevel(newLevel);
        startLevel(gameMode, newLevel);
      }
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      setStreak(0);
      
      if (newLives <= 0) {
        setGameOver(true);
        updateBestScore(score);
      } else {
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
          const newScore = score + (level * 5);
          setScore(newScore);
          setFlippedCards([]);
          
          if (newMatchedPairs.length === cards.length) {
            const newLevel = level + 1;
            if (newLevel > 100) {
              setGameOver(true);
              updateBestScore(newScore);
            } else {
              setLevel(newLevel);
              const config = getLevelConfig(gameMode, newLevel);
              const cardMode = gameMode.split('-')[1];
              setCards(createCards(cardMode, config.pairs));
              setFlippedCards([]);
              setMatchedPairs([]);
              if (config.timeLimit) {
                setTimeLeft(config.timeLimit);
              }
            }
          }
        }, 500);
      } else {
        setTimeout(() => {
          setFlippedCards([]);
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
  };

  const getGridSize = (cardCount) => {
    if (cardCount <= 16) return 'grid-cols-4';
    if (cardCount <= 36) return 'grid-cols-6';
    return 'grid-cols-8';
  };

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
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Memory Chain Pro</h1>
            <p className="text-gray-600">100 levels of memory challenges!</p>
          </div>
          
          <div className="space-y-3 mb-6">
            <button
              onClick={() => startGame('letters')}
              className="w-full bg-purple-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-purple-600 transition-colors flex items-center justify-between"
            >
              <span>Letter Chains</span>
              <span className="text-sm bg-purple-400 px-2 py-1 rounded">Best: {bestScores.letters}</span>
            </button>
            
            <button
              onClick={() => startGame('words')}
              className="w-full bg-blue-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-600 transition-colors flex items-center justify-between"
            >
              <span>Word Chains</span>
              <span className="text-sm bg-blue-400 px-2 py-1 rounded">Best: {bestScores.words}</span>
            </button>
            
            <button
              onClick={() => startGame('cards-letters')}
              className="w-full bg-green-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-600 transition-colors flex items-center justify-between"
            >
              <span>Letter Cards</span>
              <span className="text-sm bg-green-400 px-2 py-1 rounded">Best: {bestScores['cards-letters']}</span>
            </button>
            
            <button
              onClick={() => startGame('cards-words')}
              className="w-full bg-teal-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-teal-600 transition-colors flex items-center justify-between"
            >
              <span>Word Cards</span>
              <span className="text-sm bg-teal-400 px-2 py-1 rounded">Best: {bestScores['cards-words']}</span>
            </button>
          </div>

          {achievements.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                <span className="font-semibold text-yellow-800">Achievements</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {achievements.map(achievement => (
                  <span key={achievement} className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs">
                    {achievement === 'streak5' && '5 Streak'}
                    {achievement === 'streak10' && '10 Streak'}
                    {achievement === 'level25' && 'Level 25'}
                    {achievement === 'level50' && 'Level 50'}
                    {achievement === 'level100' && 'Level 100'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (gameMode.startsWith('cards')) {
    const cardMode = gameMode.split('-')[1];
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 p-4">
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
                  {[...Array(3)].map((_, i) => (
                    <Heart key={i} className={`w-5 h-5 ${i < lives ? 'text-red-500 fill-current' : 'text-gray-300'}`} />
                  ))}
                </div>
                <div className="flex items-center gap-1 text-yellow-600">
                  <Star className="w-4 h-4" />
                  <span className="font-semibold">{streak}</span>
                </div>
                <span className="text-lg font-semibold text-purple-600">Score: {score}</span>
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
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(level / 100) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className={`grid ${getGridSize(cards.length)} gap-2 max-w-4xl mx-auto`}>
            {cards.map((card) => {
              const isFlipped = flippedCards.includes(card.id);
              const isMatched = matchedPairs.includes(card.id);
              const showContent = isFlipped || isMatched;
              
              return (
                <div
                  key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  className={`aspect-square rounded-lg cursor-pointer transition-all duration-300 ${
                    showContent
                      ? 'bg-white shadow-lg transform scale-105'
                      : 'bg-gray-400 hover:bg-gray-300 shadow-md'
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
                  <p className="text-gray-600">Total Time: {Math.floor((Date.now() - gameStartTime) / 1000)}s</p>
                </div>
                <button
                  onClick={resetGame}
                  className="bg-purple-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-purple-600"
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
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h2 className="text-xl font-bold text-gray-800">
            {gameMode === 'letters' ? 'Letter Chains' : 'Word Chains'} - Level {level}
          </h2>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1">
              {[...Array(3)].map((_, i) => (
                <Heart key={i} className={`w-5 h-5 ${i < lives ? 'text-red-500 fill-current' : 'text-gray-300'}`} />
              ))}
            </div>
            <div className="flex items-center gap-1 text-yellow-600">
              <Star className="w-4 h-4" />
              <span className="font-semibold">{streak}</span>
            </div>
            <span className="text-lg font-semibold text-purple-600">Score: {score}</span>
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
            className="bg-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(level / 100) * 100}%` }}
          ></div>
        </div>

        {showingSequence ? (
          <div className="text-center">
            <p className="text-gray-600 mb-6">Watch and memorize:</p>
            <div className="bg-gray-100 p-8 rounded-xl mb-6">
              <div className="text-3xl font-bold text-gray-800 min-h-[60px] flex items-center justify-center">
                {currentIndex >= 0 && sequence[currentIndex]}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {currentIndex + 1} of {sequence.length}
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
              <p className="text-gray-600">Accuracy: {Math.round((totalCorrect / (totalCorrect + (3 - lives))) * 100)}%</p>
              <p className="text-gray-600">Total Time: {Math.floor((Date.now() - gameStartTime) / 1000)}s</p>
            </div>
            <p className="text-sm text-gray-500 mb-6 font-mono bg-gray-100 p-3 rounded">
              Expected: {sequence.join('')}
            </p>
            <button
              onClick={resetGame}
              className="bg-purple-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-purple-600"
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
              className="w-full bg-green-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-600 mb-4"
            >
              Submit
            </button>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Sequence length: {sequence.length}</span>
              <span>Streak bonus: +{Math.floor(streak / 5) * 10}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryChainGame;