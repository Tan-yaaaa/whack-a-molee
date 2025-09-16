import React, { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  const GRID_SIZE = 9; // 3x3 grid
  const GAME_TIME = 30; // seconds

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('highScore')) || 0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [gameRunning, setGameRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [activeMole, setActiveMole] = useState(null);

  const intervalRef = useRef(null);
  const moleTimeoutRef = useRef(null);
  const scoreRef = useRef(0); // <-- track live score

  const startGame = () => {
    setScore(0);
    scoreRef.current = 0;
    setTimeLeft(GAME_TIME);
    setGameRunning(true);
    setGameOver(false);

    clearInterval(intervalRef.current);
    clearTimeout(moleTimeoutRef.current);

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          clearTimeout(moleTimeoutRef.current);
          setGameRunning(false);
          setGameOver(true);
          updateHighScore(scoreRef.current); // <-- always use ref
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    spawnMole();
  };
const spawnMole = () => {
  if (!gameRunning) return;

  const randomHole = Math.floor(Math.random() * GRID_SIZE);
  setActiveMole(randomHole);

  // Mole stays visible for 800ms
  moleTimeoutRef.current = setTimeout(() => {
    setActiveMole(null);

    // Wait a random delay before next mole
    const delay = Math.random() * 1000 + 500; // 0.5–1.5s
    moleTimeoutRef.current = setTimeout(spawnMole, delay);
  }, 800);
};

  const whackMole = (index) => {
    if (index === activeMole) {
      setScore(prev => {
        const newScore = prev + 1;
        scoreRef.current = newScore; // <-- keep ref in sync
        return newScore;
      });
      setActiveMole(null);
    }
  };

  const updateHighScore = (newScore) => {
    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem('highScore', newScore);
    }
  };

  const stopGame = () => {
    clearInterval(intervalRef.current);
    clearTimeout(moleTimeoutRef.current);
    setGameRunning(false);
    setGameOver(true);
    updateHighScore(scoreRef.current);
  };

  return (
    <div className="game-screen">
      <h1>Whack-a-Mole</h1>

      {!gameOver && (
        <div className="stats">
          <div>⏱️ Time: {timeLeft}s</div>
          <div>⭐ Score: {score}</div>
          <div>🏆 High Score: {highScore}</div>
        </div>
      )}

      {!gameRunning && !gameOver && (
        <button className="start-btn" onClick={startGame}>Start Game</button>
      )}

      {gameRunning && (
        <div className="grid">
          {Array.from({ length: GRID_SIZE }).map((_, index) => (
            <div
              key={index}
              className={`hole ${activeMole === index ? 'active' : ''}`}
              onClick={() => whackMole(index)}
            >
              {activeMole === index && <span className="mole">🐹</span>}
            </div>
          ))}
        </div>
      )}

      {gameOver && (
        <div className="game-over">
          <h2>Game Over!</h2>
          <p>Final Score: {score}</p>
          <p>🏆 High Score: {highScore}</p>
          <button className="start-btn" onClick={startGame}>Play Again</button>
        </div>
      )}
    </div>
  );
}

export default App;