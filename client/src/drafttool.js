import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import './drafttool.css';

// Utility to load champions (you'll need to populate this)
const CHAMPIONS = [
  { id: 1, name: 'Annie', image: 'https://example.com/annie.png' },
  { id: 2, name: 'Olaf', image: 'https://example.com/olaf.png' },
  { id: 3, name: 'Garen', image: 'https://example.com/garen.png' },
  { id: 4, name: 'Lux', image: 'https://example.com/lux.png' },
  { id: 5, name: 'Yasuo', image: 'https://example.com/yasuo.png' },
  // Add more champions
];

function DraftTool() {
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState('');
  const [draftState, setDraftState] = useState({
    blueTeam: { 
      bans: [], 
      picks: [],
      currentPhase: 'ban' 
    },
    redTeam: { 
      bans: [], 
      picks: [],
      currentPhase: 'ban' 
    },
    availableChampions: CHAMPIONS
  });

  const { roomName } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const storedUsername = sessionStorage.getItem('username');
    const storedTeam = sessionStorage.getItem('userTeam');
    
    if (!storedUsername || !storedTeam) {
      navigate('/');
      return;
    }
    setUsername(storedUsername);

    const newSocket = io('http://localhost:4000');
    setSocket(newSocket);

    // Now include the team info when reconnecting to the room
    newSocket.emit('joinRoom', { 
      roomName, 
      username: storedUsername,
      team: storedTeam
    });

    // Listen for draft state updates
    newSocket.on('draftState', (updatedState) => {
      setDraftState(updatedState);
    });

    // Clean up on component unmount
    return () => {
        if (newSocket) newSocket.close();
      };
    }, [roomName, navigate]);

  const handleBan = (championId) => {
    if (socket) {
      socket.emit('banChampion', {
        roomName,
        team: 'blue', // You might want to make this dynamic based on player's team
        championId
      });
    }
  };

  const handlePick = (championId) => {
    if (socket) {
      socket.emit('pickChampion', {
        roomName,
        team: 'blue', // You might want to make this dynamic based on player's team
        championId
      });
    }
  };

  return (
    <div className="draft-container">
      {/* Blue Team Draft Area */}
      <div className="team blue-team">
        <h2>Blue Team</h2>
        <div className="bans">
          <h3>Bans</h3>
          <div className="ban-list">
            {draftState.blueTeam.bans.map((banId) => {
              const champion = draftState.availableChampions.find(c => c.id === banId);
              return champion ? (
                <div key={banId} className="banned-champion">
                  <img 
                    src={champion.image} 
                    alt={`Banned ${champion.name}`} 
                    className="champion-icon"
                  />
                </div>
              ) : null;
            })}
          </div>
        </div>
        
        <div className="picks">
          <h3>Picks</h3>
          <div className="pick-list">
            {draftState.blueTeam.picks.map((pickId) => {
              const champion = draftState.availableChampions.find(c => c.id === pickId);
              return champion ? (
                <div key={pickId} className="picked-champion">
                  <img 
                    src={champion.image} 
                    alt={`Picked ${champion.name}`} 
                    className="champion-icon"
                  />
                </div>
              ) : null;
            })}
          </div>
        </div>
      </div>

      {/* Champion Selection Grid */}
      <div className="champion-grid">
        {draftState.availableChampions.map((champion) => (
          <div 
            key={champion.id} 
            className="champion-card"
            onClick={() => {
              draftState.blueTeam.currentPhase === 'ban' 
                ? handleBan(champion.id)
                : handlePick(champion.id);
            }}
          >
            <img 
              src={champion.image} 
              alt={champion.name} 
              className="champion-image"
            />
            <span className="champion-name">{champion.name}</span>
          </div>
        ))}
      </div>

      {/* Red Team Draft Area */}
      <div className="team red-team">
        <h2>Red Team</h2>
        <div className="bans">
          <h3>Bans</h3>
          <div className="ban-list">
            {draftState.redTeam.bans.map((banId) => {
              const champion = draftState.availableChampions.find(c => c.id === banId);
              return champion ? (
                <div key={banId} className="banned-champion">
                  <img 
                    src={champion.image} 
                    alt={`Banned ${champion.name}`} 
                    className="champion-icon"
                  />
                </div>
              ) : null;
            })}
          </div>
        </div>
        
        <div className="picks">
          <h3>Picks</h3>
          <div className="pick-list">
            {draftState.redTeam.picks.map((pickId) => {
              const champion = draftState.availableChampions.find(c => c.id === pickId);
              return champion ? (
                <div key={pickId} className="picked-champion">
                  <img 
                    src={champion.image} 
                    alt={`Picked ${champion.name}`} 
                    className="champion-icon"
                  />
                </div>
              ) : null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DraftTool;