import { useState } from 'react';
import Leaderboard from './Leaderboard';

const HomePage = ({ onStartGame, highScores }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      onStartGame(username.trim());
    }
  };

  return (
    <div className="home-container">
      <h2 className="home-title">Cosmic Whack-A-Mole</h2>
      
      <form onSubmit={handleSubmit} className="username-form">
        <div className="form-group">
          <label htmlFor="username">Enter Your Name:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your name"
            required
          />
        </div>
        <button type="submit" className="start-btn glow-effect">
          Start Game
        </button>
      </form>
      
      <div className="leaderboard-section">
        <h3 className="leaderboard-title">High Scores</h3>
        <Leaderboard highScores={highScores} />
      </div>
    </div>
  );
};

export default HomePage;
