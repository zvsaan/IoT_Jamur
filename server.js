const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const WebSocket = require('ws');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Buat koneksi ke database MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root', // Ganti dengan username database Anda
  password: '', // Ganti dengan password database Anda
  database: 'sensor_db' // Ganti dengan nama database Anda
});

db.connect((err) => {
  if (err) {
    throw err;
  }
  console.log('MySQL Connected...');
});

// Endpoint untuk menyimpan data sensor
app.post('/save-data', (req, res) => {
  const { temperature, humidity } = req.body;

  const sql = 'INSERT INTO sensor_data (temperature, humidity) VALUES (?, ?)';
  db.query(sql, [temperature, humidity], (err, result) => {
    if (err) {
      console.error('Error saving data to database:', err);
      return res.status(500).json({ error: 'Failed to save data' });
    }
    console.log('Data saved to database:', result);
    res.status(200).json({ message: 'Data saved successfully' });
  });
});

// Endpoint untuk mengambil data suhu dan kelembapan
app.get('/get-data', (req, res) => {
  const sql = 'SELECT temperature, humidity, created_at FROM sensor_data ORDER BY created_at DESC LIMIT 100'; // Ambil 100 data terbaru
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching data from database:', err);
      return res.status(500).json({ error: 'Failed to fetch data' });
    }
    res.status(200).json(results);
  });
});

// Setup WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('WebSocket connected');

  ws.on('message', (message) => {
    console.log('Received:', message);
    if (message.startsWith("RELAY:")) {
      const command = message.split(":")[1];
      if (command === "ON") {
        // Logika untuk menghidupkan relay
        console.log("Relay turned ON");
        ws.send("RELAY:ON"); // Kirim status kembali ke klien
      } else if (command === "OFF") {
        // Logika untuk mematikan relay
        console.log("Relay turned OFF");
        ws.send("RELAY:OFF"); // Kirim status kembali ke klien
      }
    }
  });

  ws.on('close', () => {
    console.log('WebSocket disconnected');
  });
});

// Upgrade HTTP server ke WebSocket server
const server = app.listen(3001, () => {
  console.log(`Server running on port 3001`);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});