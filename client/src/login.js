import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const currentSession = sessionStorage.getItem('username');
    if (currentSession) {
      navigate('/lobby');
    }
  }, [navigate]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username.trim()) {
      // Store in sessionStorage instead of localStorage
      sessionStorage.setItem('username', username);
      navigate('/lobby');
    } else {
      alert('Please enter a username');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>League of Legends Draft Tool</h2>
        <form onSubmit={handleLogin}>
          <input 
            type="text" 
            placeholder="Enter your username" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}

export default Login;