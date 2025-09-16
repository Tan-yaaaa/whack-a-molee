import React, { useState, useEffect, useRef } from "react";
import "./App.css";

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
  const popperRef = useRef(null);

  // Start game function
  const startGame = () => {
    setScreen("game");
    setScore(0);
    setTimeLeft(INITIAL_GAME_TIME);
  };

  // Game timer
  useEffect(() => {
    if (screen !== "game") return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setScreen("end");
          if (score > highScore) localStorage.setItem("whackHighScore", score);
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [screen]);

  // Mole popper
  useEffect(() => {
    if (screen !== "game") return;

    const popMole = () => {
      const idx = Math.floor(Math.random() * NUM_HOLES);
      setMoles((prev) => {
        const newArr = [...prev];
        newArr[idx] = true;
        return newArr;
      });
      setTimeout(() => {
        setMoles((prev) => {
          const newArr = [...prev];
          newArr[idx] = false;
          return newArr;
        });
      }, MOLE_POP_TIME);
    };

    popperRef.current = setInterval(popMole, INITIAL_POP_INTERVAL);

    return () => clearInterval(popperRef.current);
  }, [screen]);

  const whackMole = (idx) => {
    if (!moles[idx]) return;
    setScore((s) => s + 1);
    setMoles((prev) => {
      const newArr = [...prev];
      newArr[idx] = false;
      return newArr;
    });
  };

  return (
    <div className="container">
      {screen === "start" && (
        <div className="start-screen">
          <h1>Whack-a-Mole</h1>
          <button onClick={startGame}>Start</button>
          <div className="creator-credit">Created by Tanya</div>
        </div>
      )}
      {screen === "game" && (
        <div className="game-screen">
          <div className="scoreboard">
            <div>Score: {score}</div>
            <div>High Score: {highScore}</div>
            <div>Time: {timeLeft}</div>
          </div>
          <div className="holes">
            {moles.map((active, i) => (
              <div
                key={i}
                className={`hole ${active ? "mole" : ""}`}
                onClick={() => whackMole(i)}
              />
            ))}
          </div>
          <div className="creator-credit">Created by Tanya</div>
        </div>
      )}
      {screen === "end" && (
        <div className="end-screen">
          <h1>Game Over!</h1>
          <div>Score: {score}</div>
          <div>High Score: {highScore}</div>
          <button onClick={() => setScreen("start")}>Restart</button>
          <div className="creator-credit">Created by Tanya</div>
        </div>
      )}
    </div>
  );
}
