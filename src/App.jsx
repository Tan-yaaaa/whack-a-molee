import React, { useState, useEffect, useRef } from "react";
import "./index.css";
const NUM_HOLES = 9;
const INITIAL_GAME_TIME = 30;
const INITIAL_POP_INTERVAL = 1000;
const MOLE_POP_TIME = 800;

export default function App() {
  const [screen, setScreen] = useState("start"); // start | game | end
  const [moles, setMoles] = useState(Array(NUM_HOLES).fill(false));
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(INITIAL_GAME_TIME);
  const [highScore, setHighScore] = useState(
    Number(localStorage.getItem("whackHighScore")) || 0
  );
  const [popInterval, setPopInterval] = useState(INITIAL_POP_INTERVAL);
  const popperRef = useRef(null);

  // Start game
  const startGame = () => {
    setScore(0);
    setTimeLeft(INITIAL_GAME_TIME);
    setMoles(Array(NUM_HOLES).fill(false));
    setPopInterval(INITIAL_POP_INTERVAL);
    setScreen("game");
  };

  // Countdown timer
  useEffect(() => {
    if (screen !== "game") return;
    if (timeLeft <= 0) {
      setScreen("end");
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("whackHighScore", score);
      }
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [screen, timeLeft, score, highScore]);

  // Mole popper
  useEffect(() => {
    if (screen !== "game") return;

    popperRef.current = setInterval(() => {
      const index = Math.floor(Math.random() * NUM_HOLES);
      setMoles((prev) => {
        const newM = [...prev];
        newM[index] = true;
        return newM;
      });
      setTimeout(() => {
        setMoles((prev) => {
          const newM = [...prev];
          newM[index] = false;
          return newM;
        });
      }, MOLE_POP_TIME);
    }, popInterval);

    return () => clearInterval(popperRef.current);
  }, [screen, popInterval]);

  // Increase difficulty
  useEffect(() => {
    if (screen !== "game") return;
    const difficulty = setInterval(() => {
      setPopInterval((prev) => Math.max(prev - 50, 400));
    }, 5000);
    return () => clearInterval(difficulty);
  }, [screen]);

  const hitMole = (index) => {
    if (!moles[index] || screen !== "game") return;
    setScore((s) => s + 1);
    setMoles((prev) => {
      const newM = [...prev];
      newM[index] = false;
      return newM;
    });
  };

  return (
    <>
      {screen === "start" && (
        <div className="start-screen">
          <h1>Whack-a-Mole</h1>
          <button className="start-btn" onClick={startGame}>
            Start
          </button>
        </div>
      )}

      {screen === "game" && (
        <div className="game-screen">
          <div className="stats">
            <span>⏱️ {timeLeft}s</span>
            <span>🎯 {score}</span>
            <span>🏆 {highScore}</span>
          </div>
          <div className="grid">
            {moles.map((isMole, i) => (
              <div
                key={i}
                className={`hole ${isMole ? "active" : ""}`}
                onClick={() => hitMole(i)}
              >
                {isMole ? "🐹" : ""}
              </div>
            ))}
          </div>
        </div>
      )}

      {screen === "end" && (
        <div className="end-screen">
          <h1>Game Over</h1>
          <p>Score: {score}</p>
          <p>High Score: {highScore}</p>
          <button className="start-btn" onClick={() => setScreen("start")}>
            Play Again
          </button>
        </div>
      )}

      {/* Fixed bottom-right credit for all screens */}
      <div className="creator-credit">Created by Tanya 🤍</div>
    </>
  );
}
