import React, { useState, useEffect, useCallback } from "react";
import {
  Play, RotateCcw, Zap, Heart, Trophy, Clock, Star, Volume2, Target, Flame, TrendingUp, Gift, Moon, Sun
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip as ChartTooltip, ResponsiveContainer } from "recharts";

// --- Level Titles/Ranks ---
const levelTitles = [
  { min: 1, max: 10, name: "Novice" },
  { min: 11, max: 20, name: "Apprentice" },
  { min: 21, max: 40, name: "Master" },
  { min: 41, max: 70, name: "Savant" },
  { min: 71, max: 100, name: "Legend" }
];
function getRank(level) {
  return levelTitles.find((t) => level >= t.min && level <= t.max)?.name || "";
}

// --- Unlockable Themes, Cards ---
const allThemes = ["default", "neon", "dark"];
const allCardDesigns = ["classic", "modern", "pixel"];

// --- Encouragement ---
const encouragementMessages = [
  "🔥 You're on fire!", "💪 Incredible focus!", "🎯 Perfect aim!", "⚡ Lightning fast!", "🧠 Brain power activated!",
  "🌟 Amazing memory!", "🚀 Unstoppable!", "💎 Flawless execution!", "🎪 Mind-blowing!", "🏆 Champion level!", "🎨 Beautiful precision!", "🌈 Spectacular!"
];

const getTimeBasedGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning, Memory Master! 🌅";
  if (h < 18) return "Good afternoon, Brain Champion! ☀️";
  return "Good evening, Mind Wizard! 🌙";
};

const generateDailySeed = () => {
  const today = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < today.length; i++) hash = today.charCodeAt(i) + ((hash << 5) - hash);
  return hash;
};

// --- Main Component ---
const MemoryChainGame = () => {
  // --- Game States ---
  const [gameMode, setGameMode] = useState("menu");
  const [level, setLevel] = useState(1);
  const [sequence, setSequence] = useState([]);
  const [playerInput, setPlayerInput] = useState("");
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
  const [bestScores, setBestScores] = useState(() =>
    JSON.parse(localStorage.getItem("bestScores") || '{"letters":0,"words":0,"cards-letters":0,"cards-words":0}')
  );
  const [gameStartTime, setGameStartTime] = useState(null);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [achievements, setAchievements] = useState(() =>
    JSON.parse(localStorage.getItem("achievements") || "[]")
  );

  // --- Unlocks ---
  const [unlockedThemes, setUnlockedThemes] = useState(() =>
    JSON.parse(localStorage.getItem("unlockedThemes") || '["default"]')
  );
  const [theme, setTheme] = useState(() =>
    localStorage.getItem("theme") || "default"
  );
  const [unlockedCards, setUnlockedCards] = useState(() =>
    JSON.parse(localStorage.getItem("unlockedCards") || '["classic"]')
  );
  const [cardDesign, setCardDesign] = useState(() =>
    localStorage.getItem("cardDesign") || "classic"
  );

  // --- Power-ups & Cooldown ---
  const [powerUps, setPowerUps] = useState({ slowTime: 2, extraLife: 1, peek: 3 });
  const [powerUpCooldowns, setPowerUpCooldowns] = useState({ slowTime: 0, extraLife: 0, peek: 0 });
  const [activePowerUp, setActivePowerUp] = useState(null);
  const [recentFeedback, setRecentFeedback] = useState("");
  const [tooltipTip, setTooltipTip] = useState("");
  const [consecutiveFails, setConsecutiveFails] = useState(0);

  // --- Analytics ---
  const [responseTimes, setResponseTimes] = useState([]);
  const [mistakeStats, setMistakeStats] = useState({});
  const [scoreHistory, setScoreHistory] = useState(() =>
    JSON.parse(localStorage.getItem("scoreHistory") || "{}")
  );

  // --- Trend/Chart Data ---
  const [weeklyTrend, setWeeklyTrend] = useState([]);

  // --- Daily Challenge ---
  const [dailySeed, setDailySeed] = useState(generateDailySeed());
  const [dailyStreak, setDailyStreak] = useState(() =>
    parseInt(localStorage.getItem("dailyStreak") || "0")
  );
  const [lastDailyDate, setLastDailyDate] = useState(
    localStorage.getItem("lastDailyDate") || ""
  );
  const [dailyCompleted, setDailyCompleted] = useState(false);

  // --- Adaptive Difficulty ---
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState(1);
  const [failCount, setFailCount] = useState(0);

  // --- Rematch ---
  const [lastChallengeConfig, setLastChallengeConfig] = useState(null);

  // --- Misc ---
  const [notifications, setNotifications] = useState([]);

  // --- Content Pools ---
  const letterPool = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const numberPool = "0123456789".split("");
  const specialPool = "!@#$%^&*".split("");
  const wordPools = {
    short: ["Cat", "Dog", "Sun", "Car", "Bed", "Cup", "Hat", "Key", "Pen", "Box"],
    medium: ["Chair", "Phone", "House", "Music", "Water", "Light", "Table", "Plant", "Clock", "Book"],
    long: ["Computer", "Mountain", "Elephant", "Rainbow", "Basketball", "Adventure", "Butterfly", "Chocolate", "Yesterday", "Beautiful"]
  };

  // --- Helpers ---
  function saveBestScores(bs) {
    setBestScores(bs);
    localStorage.setItem("bestScores", JSON.stringify(bs));
  }
  function saveAchievements(a) {
    setAchievements(a);
    localStorage.setItem("achievements", JSON.stringify(a));
  }
  function saveUnlockedThemes(t) {
    setUnlockedThemes(t);
    localStorage.setItem("unlockedThemes", JSON.stringify(t));
  }
  function saveTheme(t) {
    setTheme(t);
    localStorage.setItem("theme", t);
  }
  function saveUnlockedCards(c) {
    setUnlockedCards(c);
    localStorage.setItem("unlockedCards", JSON.stringify(c));
  }
  function saveCardDesign(c) {
    setCardDesign(c);
    localStorage.setItem("cardDesign", c);
  }

  // --- Level Config (Adaptive) ---
  const getLevelConfig = (mode, levelNum, perf = adaptiveDifficulty) => {
    // Adaptive - perf in [0.7, 2.0]
    if (mode === "letters") {
      if (levelNum <= 10) return { length: Math.round((2 + levelNum / 5) * perf), timing: Math.round(1500 / perf), pools: [letterPool] };
      if (levelNum <= 25) return { length: Math.round((3 + levelNum / 8) * perf), timing: Math.round(1300 / perf), pools: [letterPool, numberPool] };
      if (levelNum <= 40) return { length: Math.round((4 + levelNum / 10) * perf), timing: Math.round(1100 / perf), pools: [letterPool, numberPool] };
      if (levelNum <= 60) return { length: Math.round((5 + levelNum / 12) * perf), timing: Math.round(900 / perf), pools: [letterPool, numberPool, specialPool] };
      if (levelNum <= 80) return { length: Math.round((6 + levelNum / 15) * perf), timing: Math.round(700 / perf), pools: [letterPool, numberPool, specialPool] };
      return { length: Math.round((8 + levelNum / 20) * perf), timing: Math.round(500 / perf), pools: [letterPool, numberPool, specialPool] };
    }
    if (mode === "words") {
      if (levelNum <= 20) return { count: Math.round((2 + levelNum / 10) * perf), timing: Math.round(2000 / perf), wordType: "short" };
      if (levelNum <= 40) return { count: Math.round((3 + levelNum / 15) * perf), timing: Math.round(1800 / perf), wordType: "medium" };
      if (levelNum <= 60) return { count: Math.round((4 + levelNum / 15) * perf), timing: Math.round(1500 / perf), wordType: "long" };
      if (levelNum <= 80) return { count: Math.round((5 + levelNum / 20) * perf), timing: Math.round(1200 / perf), wordType: "long" };
      return { count: Math.round((6 + levelNum / 25) * perf), timing: Math.round(1000 / perf), wordType: "long" };
    }
    if (mode.startsWith("cards")) {
      const basePairs = Math.round((4 + levelNum / 10) * perf);
      const maxPairs = Math.min(24, basePairs);
      const timeLimit = levelNum > 50 ? 60 - Math.floor(levelNum / 10) : null;
      return { pairs: maxPairs, timeLimit };
    }
  };

  // --- Content Generators ---
  const generateRandomString = (length, pools) => {
    const allChars = pools.flat();
    let result = "";
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
    if (mode === "letters") {
      for (let i = 0; i < pairs; i++) {
        const config = getLevelConfig("letters", Math.min(level, 50));
        const randomStr = generateRandomString(config.length, config.pools);
        cardPairs.push(randomStr, randomStr);
      }
    } else {
      for (let i = 0; i < pairs; i++) {
        const config = getLevelConfig("words", Math.min(level, 50));
        const wordChain = generateWordChain(config.count, config.wordType).join("");
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

  // --- Power-Ups: Use and Cooldown Logic ---
  const usePowerUp = (type) => {
    if (powerUps[type] <= 0 || powerUpCooldowns[type] > 0) return;
    setPowerUps((prev) => ({ ...prev, [type]: prev[type] - 1 }));
    setPowerUpCooldowns((prev) => ({ ...prev, [type]: 10 })); // 10s cooldown for demo
    setActivePowerUp(type);
    if (type === "extraLife") {
      setLives((prev) => Math.min(5, prev + 1));
      showFeedback("💚 Extra life granted!");
    } else if (type === "slowTime") {
      showFeedback("⏰ Time slowed down!");
      setTimeout(() => setActivePowerUp(null), 5000);
    } else if (type === "peek") {
      showFeedback("👁️ Peek activated!");
      setTimeout(() => setActivePowerUp(null), 3000);
    }
  };

  // --- Notifications ---
  const addNotification = (message, type = "info") => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  // --- Feedback & Tooltips ---
  const showFeedback = useCallback((msg) => {
    setRecentFeedback(msg);
    setTimeout(() => setRecentFeedback(""), 2500);
  }, []);

  // --- Start Game/Level/Reset ---
  const startGame = (mode, config = null) => {
    setGameMode(mode);
    setLevel(1);
    setScore(0);
    setLives(3);
    setStreak(0);
    setGameOver(false);
    setPlayerInput("");
    setGameStartTime(Date.now());
    setTotalCorrect(0);
    setResponseTimes([]);
    setMistakeStats({});
    setConsecutiveFails(0);
    setAdaptiveDifficulty(1);
    setFailCount(0);
    setTooltipTip("");
    setLastChallengeConfig(config);
    if (mode.startsWith("cards")) {
      const cardMode = mode.split("-")[1];
      const cfg = getLevelConfig(mode, 1);
      setCards(createCards(cardMode, cfg.pairs));
      setFlippedCards([]);
      setMatchedPairs([]);
      if (cfg.timeLimit) setTimeLeft(cfg.timeLimit);
    } else {
      startLevel(mode, 1);
    }
  };

  const startLevel = (mode, levelNum) => {
    const config = getLevelConfig(mode, levelNum);
    let newSequence;
    if (mode === "letters") {
      newSequence = [generateRandomString(config.length, config.pools)];
    } else if (mode === "words") {
      newSequence = generateWordChain(config.count, config.wordType);
    }
    setSequence(newSequence);
    setCurrentIndex(0);
    setPlayerInput("");
    showSequence(newSequence, config.timing);
  };

  const showSequence = (seq, timing) => {
    setShowingSequence(true);
    setCurrentIndex(0);
    seq.forEach((item, idx) => {
      setTimeout(() => {
        setCurrentIndex(idx);
        if (idx === seq.length - 1) {
          setTimeout(() => {
            setShowingSequence(false);
            setCurrentIndex(-1);
          }, timing);
        }
      }, idx * timing);
    });
  };

  // --- Achievements, Unlocks, and Adaptive Difficulty ---
  const checkAchievements = (newScore, newStreak, levelNum) => {
    const newAchievements = [];
    if (newStreak >= 5 && !achievements.includes("streak5")) {
      newAchievements.push("streak5");
      addNotification("🔥 Achievement: 5-Streak!", "achievement");
    }
    if (newStreak >= 10 && !achievements.includes("streak10")) {
      newAchievements.push("streak10");
      addNotification("🌟 Achievement: Streak Legend!", "achievement");
      if (!unlockedThemes.includes("neon")) {
        const newThemes = [...unlockedThemes, "neon"];
        saveUnlockedThemes(newThemes);
        addNotification("🎉 Neon Theme Unlocked!", "achievement");
      }
    }
    if (levelNum >= 25 && !achievements.includes("level25")) {
      newAchievements.push("level25");
      addNotification("🏆 Achievement: Level 25!", "achievement");
      if (!unlockedCards.includes("pixel")) {
        const newCards = [...unlockedCards, "pixel"];
        saveUnlockedCards(newCards);
        addNotification("🃏 Pixel Cards Unlocked!", "achievement");
      }
    }
    if (levelNum >= 30 && !unlockedThemes.includes("dark")) {
      const newThemes = [...unlockedThemes, "dark"];
      saveUnlockedThemes(newThemes);
      addNotification("🌙 Dark Mode Unlocked!", "achievement");
    }
    if (levelNum >= 50 && !achievements.includes("level50")) {
      newAchievements.push("level50");
      addNotification("💎 Achievement: Level 50!", "achievement");
    }
    if (levelNum >= 100 && !achievements.includes("level100")) {
      newAchievements.push("level100");
      addNotification("👑 Achievement: Level 100!", "achievement");
    }
    if (newAchievements.length > 0) saveAchievements([...achievements, ...newAchievements]);
  };

  // --- Submission and Analytics ---
  const [inputStart, setInputStart] = useState(Date.now());
  useEffect(() => {
    if (!showingSequence && !gameOver) setInputStart(Date.now());
  }, [showingSequence, gameOver, level]);

  const handleSubmit = () => {
    const expected = sequence.join("");
    const isCorrect = gameMode === "letters"
      ? playerInput.toUpperCase() === expected.toUpperCase()
      : playerInput.toLowerCase().replace(/\s/g, "") === expected.toLowerCase();
    const respTime = Date.now() - inputStart;

    setResponseTimes((prev) => [...prev, respTime]);
    if (isCorrect) {
      setConsecutiveFails(0);
      setFailCount(0);
      const streakBonus = Math.floor(streak / 5) * 10;
      const timeBonus = Math.max(0, 100 - Math.floor(respTime / 100));
      const newScore = score + (level * 10) + streakBonus + timeBonus;
      const newStreak = streak + 1;
      const newLevel = level + 1;
      const newTotalCorrect = totalCorrect + 1;
      setScore(newScore);
      setStreak(newStreak);
      setTotalCorrect(newTotalCorrect);
      checkAchievements(newScore, newStreak, newLevel);

      // Adaptive Difficulty: accelerate if quick and correct
      let perf = adaptiveDifficulty;
      if (respTime < 2000) perf = Math.min(2, perf + 0.05);
      setAdaptiveDifficulty(perf);

      // Encourage
      showFeedback(encouragementMessages[Math.floor(Math.random() * encouragementMessages.length)]);

      if (newLevel > 100) {
        setGameOver(true);
        updateBestScore(newScore);
        saveScoreHistory(newScore);
      } else {
        setLevel(newLevel);
        startLevel(gameMode, newLevel);
      }
    } else {
      // Mistake Analytics
      setMistakeStats((prev) => {
        const wrong = playerInput.split("");
        const exp = expected.split("");
        let err = prev;
        exp.forEach((char, idx) => {
          if (wrong[idx] !== char) {
            err[`${char}@${idx}`] = (err[`${char}@${idx}`] || 0) + 1;
          }
        });
        return { ...err };
      });
      setConsecutiveFails((prev) => prev + 1);
      setFailCount((prev) => prev + 1);

      // Adaptive Difficulty: ease if repeated fail
      let perf = adaptiveDifficulty;
      if (respTime > 4000 || failCount + 1 >= 2) perf = Math.max(0.7, perf - 0.1);
      setAdaptiveDifficulty(perf);

      // Tooltips for fail
      if (consecutiveFails + 1 >= 2) setTooltipTip("🔥 Tip: Use Peek if you’re unsure!");

      // Fail recovery curve
      if (failCount + 1 >= 2) {
        setLevel((prev) => Math.max(1, prev - 1));
        setFailCount(0);
        addNotification("📉 Difficulty eased. Try focusing on the middle letters first!", "info");
      }

      const newLives = lives - 1;
      setLives(newLives);
      setStreak(0);

      if (newLives <= 0) {
        setGameOver(true);
        updateBestScore(score);
        saveScoreHistory(score);
      } else {
        showFeedback(`💔 Incorrect. ${newLives} lives left.`);
        startLevel(gameMode, level);
      }
    }
  };

  // --- Card Game Logic (with Flip Animation) ---
  const handleCardClick = (cardId) => {
    if (flippedCards.length === 2 || flippedCards.includes(cardId) || matchedPairs.includes(cardId)) return;
    const newFlipped = [...flippedCards, cardId];
    setFlippedCards(newFlipped);
    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      const firstCard = cards.find((c) => c.id === first);
      const secondCard = cards.find((c) => c.id === second);
      if (firstCard.content === secondCard.content) {
        setTimeout(() => {
          const newMatchedPairs = [...matchedPairs, first, second];
          setMatchedPairs(newMatchedPairs);
          setScore((prev) => prev + (level * 5));
          setFlippedCards([]);
          showFeedback("✨ Perfect match!");
          if (newMatchedPairs.length === cards.length) {
            const newLevel = level + 1;
            if (newLevel > 100) {
              setGameOver(true);
              updateBestScore(score);
              saveScoreHistory(score);
            } else {
              setLevel(newLevel);
              const config = getLevelConfig(gameMode, newLevel);
              const cardMode = gameMode.split("-")[1];
              setCards(createCards(cardMode, config.pairs));
              setFlippedCards([]);
              setMatchedPairs([]);
              if (config.timeLimit) setTimeLeft(config.timeLimit);
            }
          }
        }, 600);
      } else {
        setTimeout(() => {
          setFlippedCards([]);
          setLives((prev) => {
            const newL = prev - 1;
            if (newL <= 0) {
              setGameOver(true);
              updateBestScore(score);
              saveScoreHistory(score);
            }
            return newL;
          });
        }, 1000);
      }
    }
  };

  // --- Best Score, Score History, Weekly Trend ---
  const updateBestScore = (finalScore) => {
    if (finalScore > (bestScores[gameMode] || 0)) {
      const newBs = { ...bestScores, [gameMode]: finalScore };
      saveBestScores(newBs);
      addNotification("🎉 New Personal Best!", "achievement");
    }
  };
  function saveScoreHistory(newScore) {
    const today = new Date().toISOString().slice(0, 10);
    const hist = JSON.parse(localStorage.getItem("scoreHistory") || "{}");
    hist[today] = (hist[today] || []).concat(newScore);
    setScoreHistory(hist);
    localStorage.setItem("scoreHistory", JSON.stringify(hist));
  }
  useEffect(() => {
    // Weekly trend chart data
    const hist = JSON.parse(localStorage.getItem("scoreHistory") || "{}");
    const res = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      res.push({ date: k.slice(5), score: (hist[k] || []).reduce((a, b) => a + b, 0) });
    }
    setWeeklyTrend(res);
  }, [scoreHistory, bestScores, gameOver]);

  // --- Power-up Cooldown Timer ---
  useEffect(() => {
    if (Object.values(powerUpCooldowns).some((v) => v > 0)) {
      const t = setInterval(() => {
        setPowerUpCooldowns((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((k) => next[k] = Math.max(0, next[k] - 1));
          return next;
        });
      }, 1000);
      return () => clearInterval(t);
    }
  }, [powerUpCooldowns]);

  // --- Card Timer ---
  useEffect(() => {
    if (timeLeft > 0 && gameMode.startsWith("cards") && !gameOver) {
      const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setGameOver(true);
      updateBestScore(score);
      saveScoreHistory(score);
    }
  }, [timeLeft, gameMode, gameOver, score]);

  // --- Daily Challenge Logic & Streaks ---
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (lastDailyDate !== today && dailyCompleted) {
      setDailyCompleted(false);
    }
  }, [lastDailyDate, dailyCompleted]);
  function completeDailyChallenge() {
    const today = new Date().toISOString().slice(0, 10);
    if (lastDailyDate !== today) {
      setDailyStreak((prev) => {
        const s = prev + 1;
        localStorage.setItem("dailyStreak", s.toString());
        return s;
      });
      setLastDailyDate(today);
      localStorage.setItem("lastDailyDate", today);
      setDailyCompleted(true);
      addNotification("🔥 Daily Streak Increased!", "achievement");
    }
  }

  // --- Rematch This Challenge ---
  const handleRematch = () => {
    if (lastChallengeConfig) {
      startGame(lastChallengeConfig.mode, lastChallengeConfig);
    }
  };

  // --- Theme (Dark Mode) Switch ---
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    saveTheme(theme);
  }, [theme]);

  // --- Card Flip Animation CSS (global, can move to CSS file) ---
  const cardFlipCSS = `
.card-inner {
  transition: transform 0.6s; transform-style: preserve-3d; position: relative;
}
.card-front, .card-back {
  position: absolute; width: 100%; height: 100%; top: 0; left: 0; backface-visibility: hidden;
}
.card-back { transform: rotateY(180deg); }
.card.flipped .card-inner { transform: rotateY(180deg); }
`;

  // --- Main UI Render ---
  // --- MENU ---
  if (gameMode === "menu") {
    return (
      <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900" : "bg-gradient-to-br from-purple-600 to-blue-600"} flex items-center justify-center p-4`}>
        <style>{cardFlipCSS}</style>
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className={`p-3 rounded-lg shadow-lg transition-all ${n.type === "achievement" ? "bg-yellow-400 text-yellow-900" : n.type === "victory" ? "bg-green-400 text-green-900" : "bg-blue-400 text-blue-900"}`}>{n.message}</div>
          ))}
        </div>
        <div className={`bg-white ${theme === "dark" ? "dark:bg-gray-800" : ""} rounded-2xl p-8 max-w-lg w-full shadow-xl`}>
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-10 h-10 text-purple-600" />
            </div>
            <h1 className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-gray-800"} mb-2`}>
              Memory Chain Pro
            </h1>
            <p className="text-gray-600 mb-2">{getTimeBasedGreeting()}</p>
            <p className="text-sm text-gray-500">100 levels of adaptive challenges!</p>
          </div>

          {/* Theme/Card Unlocks */}
          <div className="mb-4">
            <div className="flex gap-2 items-center">
              <span className="text-xs">Theme:</span>
              {unlockedThemes.map((t) => (
                <button key={t} onClick={() => setTheme(t)} className={`px-2 py-1 rounded text-xs border ${theme === t ? "bg-purple-300" : ""}`}>{t}</button>
              ))}
              <span className="ml-4 text-xs">Cards:</span>
              {unlockedCards.map((c) => (
                <button key={c} onClick={() => setCardDesign(c)} className={`px-2 py-1 rounded text-xs border ${cardDesign === c ? "bg-green-300" : ""}`}>{c}</button>
              ))}
              {theme === "dark" ? <Moon className="w-4 h-4 text-purple-700 ml-2" /> : <Sun className="w-4 h-4 text-yellow-500 ml-2" />}
            </div>
          </div>

          {/* Weekly Trend Chart */}
          <div className="mb-4">
            <div className="font-semibold text-xs text-gray-700 mb-1">Weekly Score Trend</div>
            <ResponsiveContainer width="100%" height={60}>
              <LineChart data={weeklyTrend}>
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                <ChartTooltip />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Play Buttons */}
          <div className="space-y-3 mb-6">
            <button onClick={() => startGame("letters")} className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 transition-all flex items-center justify-between">
              <span>Letter Chains</span>
              <span className="text-sm bg-purple-400 px-2 py-1 rounded">Best: {bestScores.letters}</span>
            </button>
            <button onClick={() => startGame("words")} className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-between">
              <span>Word Chains</span>
              <span className="text-sm bg-blue-400 px-2 py-1 rounded">Best: {bestScores.words}</span>
            </button>
            <button onClick={() => startGame("cards-letters")} className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-between">
              <span>Letter Cards</span>
              <span className="text-sm bg-green-400 px-2 py-1 rounded">Best: {bestScores["cards-letters"]}</span>
            </button>
            <button onClick={() => startGame("cards-words")} className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-teal-600 hover:to-teal-700 transition-all flex items-center justify-between">
              <span>Word Cards</span>
              <span className="text-sm bg-teal-400 px-2 py-1 rounded">Best: {bestScores["cards-words"]}</span>
            </button>
          </div>

          {/* Achievements */}
          {achievements.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-2">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                <span className="font-semibold text-yellow-800">Achievements</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {achievements.map((a) => (
                  <span key={a} className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-xs">{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Daily Challenge */}
          <div className="mt-2 text-center">
            <div className="mb-1 font-semibold text-sm text-orange-600">
              Daily Streak: {dailyStreak}
            </div>
            <button
              className="text-xs underline text-orange-700"
              onClick={() => startGame("letters", { mode: "letters", seed: dailySeed })}
            >
              Play Daily Challenge
            </button>
            {lastChallengeConfig && (
              <button
                className="text-xs underline text-blue-600 ml-4"
                onClick={handleRematch}
              >
                Rematch This Challenge
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- CARD GAME ---
  if (gameMode.startsWith("cards")) {
    const cardMode = gameMode.split("-")[1];
    return (
      <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900" : "bg-gradient-to-br from-purple-600 to-blue-600"} p-4`}>
        <style>{cardFlipCSS}</style>
        <FeedbackDisplay feedback={recentFeedback} />
        <div className="fixed top-4 right-4 z-40 space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className={`p-3 rounded-lg shadow-lg transition-all ${n.type === "achievement" ? "bg-yellow-400 text-yellow-900" : n.type === "victory" ? "bg-green-400 text-green-900" : "bg-blue-400 text-blue-900"}`}>{n.message}</div>
          ))}
        </div>
        <div className="max-w-6xl mx-auto">
          <div className={`bg-white ${theme === "dark" ? "dark:bg-gray-800" : ""} rounded-2xl p-4 mb-6`}>
            <div className="flex justify-between items-center flex-wrap gap-4">
              <h2 className="text-xl font-bold text-gray-800">
                {cardMode === "letters" ? "Letter Cards" : "Word Cards"} - Level {level} <span className="ml-2 text-xs text-purple-500">({getRank(level)})</span>
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
                    <Heart key={i} className={`w-5 h-5 ${i < lives ? "text-red-500 fill-current" : "text-gray-300"}`} />
                  ))}
                </div>
                <div className="flex items-center gap-1 text-yellow-600">
                  <Flame className="w-4 h-4" />
                  <span className="font-semibold">{streak}</span>
                </div>
                <span className="text-lg font-semibold text-purple-600">Score: {score}</span>
                {/* Power-Up Buttons */}
                <PowerUpButtons usePowerUp={usePowerUp} powerUps={powerUps} cooldowns={powerUpCooldowns} />
                <button onClick={() => setGameMode("menu")} className="bg-gray-500 text-white p-2 rounded-lg hover:bg-gray-600 ml-2">
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="mt-2 bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${(level / 100) * 100}%` }}></div>
            </div>
          </div>
          <div className={`grid ${getGridSize(cards.length)} gap-2 max-w-4xl mx-auto`}>
            {cards.map((card) => {
              const isFlipped = flippedCards.includes(card.id);
              const isMatched = matchedPairs.includes(card.id);
              const showContent = isFlipped || isMatched || (activePowerUp === "peek");
              return (
                <div key={card.id}
                  onClick={() => handleCardClick(card.id)}
                  className={`relative aspect-square rounded-lg cursor-pointer card ${showContent ? "flipped" : ""} ${isMatched ? "ring-2 ring-green-400" : ""}`}
                  style={{ background: cardDesign === "pixel" ? "repeating-linear-gradient(45deg,#eee,#eee 5px,#ccc 5px,#ccc 10px)" : "" }}
                >
                  <div className="card-inner w-full h-full">
                    <div className="card-front bg-gray-400 flex items-center justify-center w-full h-full text-2xl font-bold">?</div>
                    <div className="card-back bg-white flex items-center justify-center w-full h-full text-xs font-bold text-gray-800 break-all">{card.content}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {gameOver && <PostGameSummary {...{ level, score, streak, gameStartTime, setGameMode, responseTimes, mistakeStats }} />}
        </div>
      </div>
    );
  }

  // --- LETTER/WORD GAME ---
  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-gray-900" : "bg-gradient-to-br from-purple-600 to-blue-600"} flex items-center justify-center p-4`}>
      <style>{cardFlipCSS}</style>
      <FeedbackDisplay feedback={recentFeedback} />
      <div className="fixed top-4 right-4 z-40 space-y-2">
        {notifications.map((n) => (
          <div key={n.id} className={`p-3 rounded-lg shadow-lg transition-all ${n.type === "achievement" ? "bg-yellow-400 text-yellow-900" : n.type === "victory" ? "bg-green-400 text-green-900" : "bg-blue-400 text-blue-900"}`}>{n.message}</div>
        ))}
      </div>
      <div className={`bg-white ${theme === "dark" ? "dark:bg-gray-800" : ""} rounded-2xl p-6 max-w-lg w-full shadow-xl`}>
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h2 className="text-xl font-bold text-gray-800">
            {gameMode === "letters" ? "Letter Chains" : "Word Chains"} - Level {level} <span className="ml-2 text-xs text-purple-500">({getRank(level)})</span>
          </h2>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, Math.max(3, lives)))].map((_, i) => (
                <Heart key={i} className={`w-5 h-5 ${i < lives ? "text-red-500 fill-current" : "text-gray-300"}`} />
              ))}
            </div>
            <div className="flex items-center gap-1 text-yellow-600">
              <Flame className="w-4 h-4" />
              <span className="font-semibold">{streak}</span>
            </div>
            <span className="text-lg font-semibold text-purple-600">Score: {score}</span>
            <PowerUpButtons usePowerUp={usePowerUp} powerUps={powerUps} cooldowns={powerUpCooldowns} />
            <button onClick={() => setGameMode("menu")} className="bg-gray-500 text-white p-2 rounded-lg hover:bg-gray-600 ml-2">
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="mb-4 bg-gray-200 rounded-full h-2">
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${(level / 100) * 100}%` }}></div>
        </div>
        {showingSequence ? (
          <div className="text-center">
            <p className="text-gray-600 mb-6">Watch and memorize:</p>
            <div className="bg-gray-100 p-8 rounded-xl mb-6 border-2 border-purple-200">
              <div className="text-3xl font-bold text-gray-800 min-h-[60px] flex items-center justify-center">
                {currentIndex >= 0 && sequence[currentIndex]}
              </div>
            </div>
            <div className="text-sm text-gray-500">{currentIndex + 1} of {sequence.length}</div>
          </div>
        ) : gameOver ? (
          <PostGameSummary {...{ level, score, streak, gameStartTime, setGameMode, responseTimes, mistakeStats }} />
        ) : (
          <div>
            <p className="text-gray-600 mb-4 text-center">Type the complete sequence:</p>
            <input
              type="text"
              value={playerInput}
              onChange={(e) => setPlayerInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full p-4 border-2 border-gray-200 rounded-xl text-lg text-center focus:border-purple-500 focus:outline-none mb-4"
              placeholder={gameMode === "letters" ? "Enter letters..." : "Enter words..."}
              autoFocus
            />
            <button onClick={handleSubmit} className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 mb-4">Submit</button>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Sequence length: {sequence.length}</span>
              <span>Streak bonus: +{Math.floor(streak / 5) * 10}</span>
            </div>
            {tooltipTip && <div className="text-xs text-orange-600 mt-2">{tooltipTip}</div>}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Helper Components ---
function FeedbackDisplay({ feedback }) {
  if (!feedback) return null;
  return (
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl p-4 shadow-xl z-50 animate-pulse">
      <div className="text-center font-bold text-lg text-purple-600">{feedback}</div>
    </div>
  );
}

function PowerUpButtons({ usePowerUp, powerUps, cooldowns }) {
  const getRing = (cd) =>
    cd > 0 && (
      <svg className="absolute top-0 left-0 w-9 h-9 pointer-events-none" viewBox="0 0 36 36">
        <circle
          cx="18"
          cy="18"
          r="16"
          fill="none"
          stroke="#888"
          strokeWidth="3"
          strokeDasharray={100}
          strokeDashoffset={(cd / 10) * 100}
          style={{ transition: "stroke-dashoffset 1s" }}
        />
      </svg>
    );
  return (
    <div className="flex gap-2 relative">
      <button
        onClick={() => usePowerUp("slowTime")}
        disabled={powerUps.slowTime <= 0 || cooldowns.slowTime > 0}
        className={`relative p-2 rounded-lg ${powerUps.slowTime > 0 && cooldowns.slowTime === 0 ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-gray-300 text-gray-500"}`}
        title="Slow Time"
      >
        <Clock className="w-4 h-4" />
        <span className="text-xs">{powerUps.slowTime}</span>
        {getRing(cooldowns.slowTime)}
      </button>
      <button
        onClick={() => usePowerUp("extraLife")}
        disabled={powerUps.extraLife <= 0 || cooldowns.extraLife > 0}
        className={`relative p-2 rounded-lg ${powerUps.extraLife > 0 && cooldowns.extraLife === 0 ? "bg-green-500 hover:bg-green-600 text-white" : "bg-gray-300 text-gray-500"}`}
        title="Extra Life"
      >
        <Heart className="w-4 h-4" />
        <span className="text-xs">{powerUps.extraLife}</span>
        {getRing(cooldowns.extraLife)}
      </button>
      <button
        onClick={() => usePowerUp("peek")}
        disabled={powerUps.peek <= 0 || cooldowns.peek > 0}
        className={`relative p-2 rounded-lg ${powerUps.peek > 0 && cooldowns.peek === 0 ? "bg-purple-500 hover:bg-purple-600 text-white" : "bg-gray-300 text-gray-500"}`}
        title="Peek"
      >
        <Target className="w-4 h-4" />
        <span className="text-xs">{powerUps.peek}</span>
        {getRing(cooldowns.peek)}
      </button>
    </div>
  );
}

function PostGameSummary({ level, score, streak, gameStartTime, setGameMode, responseTimes, mistakeStats }) {
  // Analytics: streak trend, avg response, most frequent mistake
  const avgResp = responseTimes.length ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0;
  let mostMistake = null, maxMistake = 0;
  Object.entries(mistakeStats).forEach(([k, v]) => {
    if (v > maxMistake) { mostMistake = k; maxMistake = v; }
  });
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full">
        <h3 className="text-2xl font-bold text-purple-600 mb-4">
          {level > 100 ? "🎉 You Win!" : "💔 Game Over"}
        </h3>
        <div className="space-y-2 mb-6">
          <p className="text-gray-600">Level Reached: {level}</p>
          <p className="text-gray-600">Rank: {getRank(level)}</p>
          <p className="text-gray-600">Final Score: {score}</p>
          <p className="text-gray-600">Best Streak: {streak}</p>
          <p className="text-gray-600">Avg Response: {avgResp}ms</p>
          {mostMistake && (
            <p className="text-gray-600">Most frequent mistake: {mostMistake.replace("@", " at position ")} ×{maxMistake}</p>
          )}
          <p className="text-gray-600">Total Time: {Math.floor((Date.now() - gameStartTime) / 1000)}s</p>
        </div>
        <button
          onClick={() => setGameMode("menu")}
          className="bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-600 hover:to-blue-600"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
}

// --- Grid Size Helper ---
function getGridSize(cardCount) {
  if (cardCount <= 16) return "grid-cols-4";
  if (cardCount <= 36) return "grid-cols-6";
  return "grid-cols-8";
}

export default MemoryChainGame;
export default MemoryChainGame;
