const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.json());
app.use(express.static(__dirname));

// Routes principales vers index.html et admin.html à la racine
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// ── Base de mots ──────────────────────────────────────────────
const WORDS_FILE = path.join(__dirname, 'words.json');

function loadWords() {
  try {
    if (fs.existsSync(WORDS_FILE)) return JSON.parse(fs.readFileSync(WORDS_FILE, 'utf8'));
  } catch (err) {}
  return ['Poulpe', 'Trampoline', 'Boomerang', 'Cactus', 'Parachute'];
}

function saveWords(words) {
  try { fs.writeFileSync(WORDS_FILE, JSON.stringify(words, null, 2), 'utf8'); } catch (err) {}
}

let wordBank = loadWords();

function pick5Words() {
  if (wordBank.length < 5) return ['Poulpe', 'Trampoline', 'Boomerang', 'Cactus', 'Parachute'];
  return [...wordBank].sort(() => Math.random() - 0.5).slice(0, 5);
}

// ── API REST ──────────────────────────────────────────────────
app.get('/api/words', (req, res) => {
  res.json({ words: wordBank, count: wordBank.length });
});

app.post('/api/words', (req, res) => {
  const { word, words } = req.body;
  const toAdd = [];
  if (word && typeof word === 'string') toAdd.push(word.trim());
  if (Array.isArray(words)) words.forEach(w => { if (typeof w === 'string' && w.trim()) toAdd.push(w.trim()); });

  let addedCount = 0;
  toAdd.forEach(w => {
    const formatted = w.charAt(0).toUpperCase() + w.slice(1);
    if (!wordBank.some(existing => existing.toLowerCase() === formatted.toLowerCase())) {
      wordBank.push(formatted);
      addedCount++;
    }
  });

  if (addedCount > 0) {
    wordBank.sort((a, b) => a.localeCompare(b, 'fr'));
    saveWords(wordBank);
  }
  res.json({ success: true, added: addedCount, total: wordBank.length });
});

app.delete('/api/words/:word', (req, res) => {
  const target = decodeURIComponent(req.params.word).toLowerCase();
  const initialLen = wordBank.length;
  wordBank = wordBank.filter(w => w.toLowerCase() !== target);
  if (wordBank.length !== initialLen) {
    saveWords(wordBank);
    res.json({ success: true, total: wordBank.length });
  } else {
    res.status(404).json({ error: 'Mot introuvable' });
  }
});

// ── Salles multijoueur ────────────────────────────────────────
const rooms = {};

function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function broadcastRoom(room) {
  io.to(room.code).emit('roomState', {
    code: room.code,
    host: room.host,
    phase: room.phase,
    words: room.words,
    revealPos: room.revealPos,
    players: Object.entries(room.players).map(([id, p]) => ({
      id,
      name: p.name,
      submitted: p.submitted,
      ranking: room.phase === 'reveal' ? p.ranking : null,
    }))
  });
}

io.on('connection', (socket) => {
  socket.on('createRoom', ({ name }, cb) => {
    let code = genCode();
    while (rooms[code]) code = genCode();
    const room = {
      code, host: socket.id, phase: 'lobby', words: [], revealPos: 5,
      players: { [socket.id]: { name: name || 'Joueur', submitted: false, ranking: null } }
    };
    rooms[code] = room;
    socket.join(code);
    if (cb) cb({ code });
    broadcastRoom(room);
  });

  socket.on('joinRoom', ({ code, name }, cb) => {
    const cleanCode = (code || '').trim().toUpperCase();
    const room = rooms[cleanCode];
    if (!room) return cb && cb({ error: 'Salle introuvable' });
    if (room.phase !== 'lobby') return cb && cb({ error: 'La partie a déjà commencé' });

    room.players[socket.id] = { name: name || 'Invité', submitted: false, ranking: null };
    socket.join(cleanCode);
    if (cb) cb({ code: cleanCode });
    broadcastRoom(room);
  });

  socket.on('startRound', ({ code }) => {
    const room = rooms[code];
    if (!room || room.host !== socket.id) return;
    room.words = pick5Words();
    room.phase = 'ranking';
    room.revealPos = 5;
    Object.values(room.players).forEach(p => { p.submitted = false; p.ranking = null; });
    broadcastRoom(room);
  });

  socket.on('submitRanking', ({ code, ranking }) => {
    const room = rooms[code];
    if (!room) return;
    const player = room.players[socket.id];
    if (!player) return;
    player.ranking = ranking;
    player.submitted = true;
    broadcastRoom(room);

    if (Object.values(room.players).every(p => p.submitted) && Object.keys(room.players).length > 0) {
      room.phase = 'reveal';
      room.revealPos = 5;
      broadcastRoom(room);
    }
  });

  socket.on('nextReveal', ({ code }) => {
    const room = rooms[code];
    if (!room || room.host !== socket.id) return;
    if (room.revealPos > 1) {
      room.revealPos -= 1;
      broadcastRoom(room);
    }
  });

  socket.on('restartGame', ({ code }) => {
    const room = rooms[code];
    if (!room || room.host !== socket.id) return;
    room.phase = 'lobby';
    room.words = [];
    room.revealPos = 5;
    Object.values(room.players).forEach(p => { p.submitted = false; p.ranking = null; });
    broadcastRoom(room);
  });

  socket.on('disconnect', () => {
    for (const code of Object.keys(rooms)) {
      const room = rooms[code];
      if (room.players[socket.id]) {
        delete room.players[socket.id];
        const remaining = Object.keys(room.players);
        if (remaining.length === 0) delete rooms[code];
        else {
          if (room.host === socket.id) room.host = remaining[0];
          broadcastRoom(room);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur TOP 5 démarré sur port ${PORT}`);
});
