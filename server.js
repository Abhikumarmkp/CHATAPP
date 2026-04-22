// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname + '/public'));

// Store connected users: { username: socketId }
let users = {};

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // User joins with a username
    socket.on('register', (username) => {
        if (!username || typeof username !== 'string') return;
        users[username] = socket.id;
        console.log(`${username} registered with ID ${socket.id}`);
        io.emit('userList', Object.keys(users));
    });

    // Handle private messages
    socket.on('privateMessage', ({ to, message }) => {
        if (!to || !message) return;
        const targetSocketId = users[to];
        if (targetSocketId) {
            io.to(targetSocketId).emit('privateMessage', {
                from: getUsernameBySocket(socket.id),
                message
            });
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        const username = getUsernameBySocket(socket.id);
        if (username) {
            delete users[username];
            io.emit('userList', Object.keys(users));
        }
        console.log('Client disconnected:', socket.id);
    });
});

// Helper to find username by socket ID
function getUsernameBySocket(socketId) {
    return Object.keys(users).find((name) => users[name] === socketId);
}

server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
