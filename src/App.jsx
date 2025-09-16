import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const HOLES = 9;

export default function App() {
  const [score, setScore] = useState(0);
  const [activeHole, setActiveHole] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [playing, setPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [moleSpeed, setMoleSpeed] = useState(800);
  const [lastWhack, setLastWhack] = useState(0);

  useEffect(() => {
    let moleTimer, countdown;

    if (playing) {
      setGameOver(false);
      setMoleSpeed(800);

      countdown = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(countdown);
            clearInterval(moleTimer);
            setPlaying(false);
            setGameOver(true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);

      moleTimer = setInterval(() => {
        setActiveHole(Math.floor(Math.random() * HOLES));
        setMoleSpeed((s) => (s > 300 ? s - 20 : s));
      }, moleSpeed);
    }

    return () => {
      clearInterval(countdown);
      clearInterval(moleTimer);
    };
  }, [playing, moleSpeed]);

  const handleWhack = (index) => {
    if (index === activeHole) {
      const now = Date.now();
      let points = 1;
      if (now - lastWhack < 500) points = 2; // Combo bonus
      setScore((s) => s + points);
      setLastWhack(now);
      setActiveHole(null);
    }
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setPlaying(true);
    setActiveHole(null);
    setGameOver(false);
    setMoleSpeed(800);
  };

  return (
    <div>
      {/* Start Screen */}
      {!playing && !gameOver && (
        <div className="start-screen">
          <h1>Whack-a-Mole</h1>
          <button className="start-btn" onClick={startGame}>
            Start Game
          </button>
        </div>
      )}

      {/* Game Screen */}
      {playing && !gameOver && (
        <div className="game-screen">
          <div className="stats">
            <div>⏱ Time: {timeLeft}</div>
            <div>⭐ Score: {score}</div>
          </div>

          <div className="grid">
            {Array.from({ length: HOLES }).map((_, i) => (
              <div
                key={i}
                className={`hole ${i === activeHole ? "active" : ""}`}
                onClick={() => handleWhack(i)}
              >
                <AnimatePresence>
                  {i === activeHole && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1.2 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      🐹
                    </motion.div>
                  )}
                </AnimatePresence>
                
              </div>
            ))}
          </div>
        </div>
      )}

      {/* End Screen */}
      {gameOver && (
        <div className="end-screen">
          <h1>🎉 Game Over 🎉</h1>
          <p>Final Score: {score}</p>
          <button className="restart-btn" onClick={startGame}>
            Restart 🔄
          </button>
        </div>
      )}

      <div className="creator-credit">created by Tanya 🤍</div>
    </div>
  );
}
