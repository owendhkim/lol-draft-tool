import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

function Lobby() {
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState('');
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check for username in sessionStorage instead of localStorage
    const storedUsername = sessionStorage.getItem('username');
    if (!storedUsername) {
      navigate('/');
      return;
    }
    setUsername(storedUsername);

    const newSocket = io('http://localhost:4000');
    setSocket(newSocket);

    newSocket.on('roomList', (availableRooms) => {
      setRooms(availableRooms);
    });

    newSocket.emit('getRooms');

    return () => {
      if (newSocket) newSocket.close();
    };
  }, [navigate]);

  const createRoom = (e) => {
    e.preventDefault();
    if (socket && newRoomName.trim()) {
      socket.emit('createRoom', { 
        roomName: newRoomName, 
        creator: username 
      });
      setNewRoomName('');
    }
  };

  const joinTeam = (roomName, team) => {
    if (socket) {
      // Store the team info in sessionStorage
      sessionStorage.setItem('userTeam', team);
      
      socket.emit('joinRoom', { 
        roomName, 
        username,
        team
      });
      navigate(`/draft/${roomName}`);
    }
  };

  return (
    <div className="lobby-container">
      <h2>Welcome, {username}!</h2>
      <div className="room-section">
        <h3>Create a New Room</h3>
        <form onSubmit={createRoom}>
          <input 
            type="text" 
            placeholder="Enter room name" 
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            required
          />
          <button type="submit">Create Room</button>
        </form>
      </div>

      <div className="room-list">
        <h3>Available Rooms</h3>
        {rooms.length === 0 ? (
          <p>No rooms available. Create one!</p>
        ) : (
          rooms.map((room) => (
            <div key={room.name} className="room-item">
              <div className="room-info">
                <span className="room-name">{room.name}</span>
                <div className="team-counts">
                  <span>Blue Team: {room.blueTeam?.length || 0}/5</span>
                  <span>Red Team: {room.redTeam?.length || 0}/5</span>
                </div>
              </div>
              <div className="team-buttons">
                <button 
                  onClick={() => joinTeam(room.name, 'blue')}
                  disabled={room.blueTeam?.length >= 5}
                  className="blue-team-btn"
                >
                  Join Blue
                </button>
                <button 
                  onClick={() => joinTeam(room.name, 'red')}
                  disabled={room.redTeam?.length >= 5}
                  className="red-team-btn"
                >
                  Join Red
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Lobby;