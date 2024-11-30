import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './login.js';
import Lobby from './lobby.js';
import DraftTool from './drafttool.js'; // Your existing draft component
import './App.css';

function App() {
  // Protected route component to check for authentication
  const ProtectedRoute = ({ children }) => {
    const username = localStorage.getItem('username');
    return username ? children : <Navigate to="/" replace />;
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Login route */}
          <Route path="/" element={<Login />} />
          
          {/* Protected lobby route */}
          <Route 
            path="/lobby" 
            element={
              <ProtectedRoute>
                <Lobby />
              </ProtectedRoute>
            } 
          />
          
          {/* Protected draft route with room parameter */}
          <Route 
            path="/draft/:roomName" 
            element={
              <ProtectedRoute>
                <DraftTool />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;