import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const HOLES = 9;
const INITIAL_TIME = 30; // seconds
const STORAGE_KEY = "wam_highscore_v1";

function useAudioSynth() {
  const ctxRef = useRef(null);
  const masterGainRef = useRef(null);

  useEffect(() => {
    return () => {
      if (ctxRef.current) ctxRef.current.close();
    };
  }, []);

  const ensure = () => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      masterGainRef.current = ctxRef.current.createGain();
      masterGainRef.current.gain.value = 0.12;
      masterGainRef.current.connect(ctxRef.current.destination);
    }
    return ctxRef.current;
  };

  const hitSound = (type = "small") => {
    const ctx = ensure();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type === "small" ? "sine" : "triangle";
    o.frequency.setValueAtTime(type === "small" ? 700 : 520, ctx.currentTime);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
    o.connect(g);
    g.connect(masterGainRef.current);
    o.start();
    o.stop(ctx.currentTime + 0.2);
  };

  const gameOverSound = () => {
    const ctx = ensure();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(220, ctx.currentTime);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
    o.connect(g);
    g.connect(masterGainRef.current);
    o.start();
    o.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.5);
    o.stop(ctx.currentTime + 0.8);
  };

  return { hitSound, gameOverSound, ensureCtx: ensure };
}

export default function App() {
  const [score, setScore] = useState(0);
  const [activeHole, setActiveHole] = useState(null);
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [moleSpeed, setMoleSpeed] = useState(900); 
  const [highScore, setHighScore] = useState(
    parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10)
  );
  const [comboPopups, setComboPopups] = useState([]); 
  const [muted, setMuted] = useState(false);

  const lastWhackRef = useRef(0);
  const moleTimerRef = useRef(null);
  const countdownRef = useRef(null);
  const activeTimeoutRef = useRef(null);
  const audio = useAudioSynth();

  const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  useEffect(() => {
    return () => {
      clearTimeout(moleTimerRef.current);
      clearInterval(countdownRef.current);
      clearTimeout(activeTimeoutRef.current);
    };
  }, []);

  const scheduleNextMole = (speed) => {
    clearTimeout(moleTimerRef.current);
    const gap = Math.max(150, speed + rnd(-120, 180));
    moleTimerRef.current = setTimeout(() => popMole(speed), gap);
  };

  const popMole = (speed) => {
    let idx = Math.floor(Math.random() * HOLES);
    if (idx === activeHole) idx = (idx + 1) % HOLES;
    setActiveHole(idx);

    const visibleFor = Math.max(350, Math.round(speed * (0.55 + Math.random() * 0.5)));
    clearTimeout(activeTimeoutRef.current);
    activeTimeoutRef.current = setTimeout(() => {
      setActiveHole(null);
      const nextSpeed = Math.max(300, speed - 12);
      setMoleSpeed(nextSpeed);
      scheduleNextMole(nextSpeed);
    }, visibleFor);
  };

  const startCountdown = () => {
    clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(countdownRef.current);
          setPlaying(false);
          setGameOver(true);
          setActiveHole(null);
          if (!muted) audio.gameOverSound();
          setTimeout(() => {
            setHighScore((prev) => {
              if (score > prev) {
                localStorage.setItem(STORAGE_KEY, String(score));
                return score;
              }
              return prev;
            });
          }, 80);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const startGame = () => {
    if (!muted) audio.ensureCtx();
    setScore(0);
    setTimeLeft(INITIAL_TIME);
    setMoleSpeed(900);
    setGameOver(false);
    setPlaying(true);
    setPaused(false);
    setActiveHole(null);
    lastWhackRef.current = 0;
    scheduleNextMole(900);
    startCountdown();
  };

  const pauseGame = () => {
    setPaused(true);
    setPlaying(false);
    clearTimeout(moleTimerRef.current);
    clearInterval(countdownRef.current);
    clearTimeout(activeTimeoutRef.current);
  };

  const resumeGame = () => {
    setPaused(false);
    setPlaying(true);
    scheduleNextMole(moleSpeed);
    startCountdown();
  };

  const restartGame = () => {
    clearTimeout(moleTimerRef.current);
    clearInterval(countdownRef.current);
    clearTimeout(activeTimeoutRef.current);
    startGame();
  };

  const showComboPopup = (holeIndex, text = "+1") => {
    const id = Math.random().toString(36).slice(2, 9);
    const col = holeIndex % 3;
    const row = Math.floor(holeIndex / 3);
    const x = col * 114 + 12;
    const y = row * 114 + 12;
    setComboPopups((arr) => [...arr, { id, x, y, text }]);
    setTimeout(() => {
      setComboPopups((arr) => arr.filter((p) => p.id !== id));
    }, 700);
  };

  const handleWhack = (index) => {
    if (!playing || paused) return;
    if (index === activeHole) {
      const now = Date.now();
      let points = 1;
      if (now - lastWhackRef.current < 550) points = 2;
      lastWhackRef.current = now;
      setScore((s) => s + points);
      setActiveHole(null);
      setMoleSpeed((s) => Math.max(320, s - 24));
      if (!muted) audio.hitSound(points === 2 ? "large" : "small");
      showComboPopup(index, points === 2 ? "+2" : "+1");
      scheduleNextMole(Math.max(320, moleSpeed - 40));
    } else {
      if (!muted) audio.hitSound("small");
      setMoleSpeed((s) => Math.min(1200, s + 12));
    }
  };

  useEffect(() => {
    if (muted) {
      if (audio.ensureCtx && audio.ensureCtx().state === "running") audio.ensureCtx().suspend().catch(()=>{});
    } else {
      if (audio.ensureCtx) {
        const ctx = audio.ensureCtx();
        if (ctx.state === "suspended") ctx.resume().catch(()=>{});
      }
    }
  }, [muted]);

  useEffect(() => {
    setHighScore(parseInt(localStorage.getItem(STORAGE_KEY) || "0", 10));
  }, []);

  return (
    <div className="app" role="application" aria-label="Whack a Mole game">
      {/* HEADER */}
      <div className="header">
        <div className="title">
          <div style={{ fontSize: 36 }}>🐹</div>
          <div>
            <h1>Whack-a-Mole</h1>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Cute Dark Theme</div>
          </div>
        </div>

        <div className="controls">
          <button className="btn secondary" onClick={() => setMuted(!muted)}>
            {muted ? "🔇 Mute" : "🔊 Sound"}
          </button>
          {!playing && !gameOver && <button className="btn" onClick={startGame}>Start</button>}
          {playing && !paused && <button className="btn secondary" onClick={pauseGame}>Pause</button>}
          {paused && <button className="btn" onClick={resumeGame}>Resume</button>}
          <button className="btn ghost" onClick={restartGame}>Restart</button>
        </div>
      </div>

      {/* STATS */}
      <div className="stats">
        <div className="card"><div className="label">Time</div><div className="value">{timeLeft}s</div></div>
        <div className="card"><div className="label">Score</div><div className="value">{score}</div></div>
        <div className="card"><div className="label">High Score</div><div className="value">{highScore}</div></div>
      </div>

      <div className="main-area">
        {/* GAME BOARD */}
        <div className="left-col board">
          <div className="grid">
            {Array.from({ length: HOLES }).map((_, idx) => (
              <div
                key={idx}
                className={`hole ${activeHole === idx ? "active" : ""}`}
                onClick={() => handleWhack(idx)}
              >
                {activeHole === idx ? "🐹" : ""}
              </div>
            ))}
            <AnimatePresence>
              {comboPopups.map((c) => (
                <motion.div
                  key={c.id}
                  className="combo"
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 0, y: -24 }}
                  exit={{ opacity: 0 }}
                  style={{ position: "absolute", left: c.x, top: c.y }}
                >
                  {c.text}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* SIDE PANEL */}
        <div className="side panel">
          <h3>How to Play</h3>
          <p>🐹 Click the moles as they pop up!</p>
          <p>⏳ Timer counts down</p>
          <p>⭐ Score combos for extra points</p>
          <p>🔊 Toggle sound</p>
          <p>⚡ Difficulty increases over time</p>
        </div>
      </div>

      {/* GAME OVER OVERLAY */}
      {gameOver && (
        <div className="overlay">
          <div className="end-card">
            <h2>Time's Up!</h2>
            <p>Your Score: {score}</p>
            <p>High Score: {Math.max(score, highScore)}</p>
            <button className="restart-btn btn" onClick={restartGame}>Play Again</button>
          </div>
        </div>
      )}

      <div className="creator-credit">Created by Tanya</div>
    </div>
  );
}