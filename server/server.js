const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Champion data
const CHAMPIONS = [
  { id: 1, name: 'Annie', image: 'annie.png' },
  { id: 2, name: 'Olaf', image: 'olaf.png' },
  { id: 3, name: 'Garen', image: 'garen.png' },
  { id: 4, name: 'Lux', image: 'lux.png' },
  { id: 5, name: 'Yasuo', image: 'yasuo.png' },
];

// Store active connections and rooms
const activeConnections = new Map(); // socket.id -> { username, roomName, team }
const rooms = [];

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Get list of rooms
  socket.on('getRooms', () => {
    socket.emit('roomList', rooms);
  });

  // Create a new room
  socket.on('createRoom', (data) => {
    const { roomName, creator } = data;
    console.log('Creating room:', roomName, 'Creator:', creator);
    
    // Check if room already exists
    const existingRoom = rooms.find(room => room.name === roomName);
    if (existingRoom) {
      socket.emit('roomError', 'Room already exists');
      return;
    }

    // Create new room
    const newRoom = {
      name: roomName,
      creator,
      blueTeam: [],
      redTeam: [],
      draftState: {
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
        availableChampions: [...CHAMPIONS]
      }
    };

    rooms.push(newRoom);
    
    // Join the socket room
    socket.join(roomName);

    // Broadcast updated room list to all clients
    io.emit('roomList', rooms);

    // Broadcast room state to the creator
    socket.emit('draftState', newRoom.draftState);
    
    console.log('Room created:', newRoom);
  });

  // Join a room
  socket.on('joinRoom', (data) => {
    const { roomName, username, team } = data;
    console.log(`${username} attempting to join ${roomName} on ${team} team`);
    
    // Find room or return if it doesn't exist
    const room = rooms.find(r => r.name === roomName);
    if (!room) {
      socket.emit('roomError', 'Room does not exist');
      return;
    }

    // Handle team assignments
    if (team === 'blue') {
      if (room.blueTeam.length >= 5) {
        socket.emit('roomError', 'Blue team is full');
        return;
      }
      // Remove from red team if switching
      room.redTeam = room.redTeam.filter(player => player !== username);
      // Add to blue team if not already there
      if (!room.blueTeam.includes(username)) {
        room.blueTeam.push(username);
      }
    } else if (team === 'red') {
      if (room.redTeam.length >= 5) {
        socket.emit('roomError', 'Red team is full');
        return;
      }
      // Remove from blue team if switching
      room.blueTeam = room.blueTeam.filter(player => player !== username);
      // Add to red team if not already there
      if (!room.redTeam.includes(username)) {
        room.redTeam.push(username);
      }
    }

    // Update connection info
    activeConnections.set(socket.id, { username, roomName, team });

    // Join the socket room
    socket.join(roomName);

    // Broadcast updates
    io.emit('roomList', rooms);
    io.to(roomName).emit('roomUpdated', room);
    socket.emit('draftState', room.draftState);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    const userInfo = activeConnections.get(socket.id);
    
    if (userInfo) {
      const { username, roomName, team } = userInfo;
      const room = rooms.find(r => r.name === roomName);
      
      if (room) {
        // Remove player from their team
        if (team === 'blue') {
          room.blueTeam = room.blueTeam.filter(player => player !== username);
        } else if (team === 'red') {
          room.redTeam = room.redTeam.filter(player => player !== username);
        }

        // Only remove room if both teams are empty AND no other connections exist for this room
        const roomConnections = Array.from(activeConnections.values())
          .filter(conn => conn.roomName === roomName);
        
        if (room.blueTeam.length === 0 && room.redTeam.length === 0 && roomConnections.length === 0) {
          const roomIndex = rooms.findIndex(r => r.name === roomName);
          if (roomIndex !== -1) {
            rooms.splice(roomIndex, 1);
          }
        }

        // Broadcast updates
        io.emit('roomList', rooms);
        io.to(roomName).emit('roomUpdated', room);
      }
      
      // Remove from active connections
      activeConnections.delete(socket.id);
    }
  });

  // Rest of your socket handlers...
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});