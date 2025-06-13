import express from "express";
import { createServer } from "http";
import { createServer as createHttpsServer } from "https";
import cors from "cors";
import { Server } from "socket.io";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';
import twilio from 'twilio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());



app.get('/api/turn', async (req, res) => {
  // Substitua pelos seus dados da Twilio
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || undefined;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || undefined;
  
  try {
    const client = twilio(twilioAccountSid, twilioAuthToken);
    const token = await client.tokens.create();
    res.json([...token.iceServers]);
  } catch (error) {
    console.error('Erro ao gerar credenciais TURN:', error);
    res.status(500).json({ error: 'Erro ao gerar credenciais TURN' });
  }
});


// Usar HTTPS para evitar Mixed Content com o cliente HTTPS
let server;
const certPath = path.join(__dirname, '..', 'cert.pem');
const keyPath = path.join(__dirname, '..', 'key.pem');

try {
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    console.log('📋 Usando HTTPS para o servidor...');
    const httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };
    server = createHttpsServer(httpsOptions, app);
  } else {
    console.log('⚠️ Certificados não encontrados, usando HTTP (pode causar Mixed Content)');
    server = createServer(app);
  }
} catch (error) {
  console.log('⚠️ Erro ao configurar HTTPS, usando HTTP:', error.message);
  server = createServer(app);
}

const io = new Server(server, {
  cors: {
    origin: true, // Permite qualquer origem durante desenvolvimento  
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["*"]
  },
});

// Mapeamento global de IDs customizados para socket.ids
const users = new Map(); // customId -> socketId
const socketToUser = new Map(); // socketId -> customId

function broadcastUsersList() {
  io.emit("usersList", Array.from(users.keys()));
}

io.on("connection", (socket) => {
  console.log(`Socket Connected: ${socket.id}`);
  socket.emit("usersList", Array.from(users.keys()));

  socket.on("setUserId", (data) => {
    const { customId } = data;
    
    // Verificar se o ID já está em uso
    if (users.has(customId)) {
      socket.emit("userIdError", { message: "Este ID já está em uso. Escolha outro." });
      return;
    }

    // Remover mapeamento anterior se existir
    const oldCustomId = socketToUser.get(socket.id);
    if (oldCustomId) {
      users.delete(oldCustomId);
    }

    // Adicionar novo mapeamento
    users.set(customId, socket.id);
    socketToUser.set(socket.id, customId);
    
    console.log(`✅ User ${socket.id} registered with custom ID: ${customId}`);
    socket.emit("userIdConfirmed", { customId });
    broadcastUsersList();
  });

  socket.on("callUser", (data) => {
    const callerCustomId = socketToUser.get(socket.id);
    const targetSocketId = users.get(data.userToCall);
    
    if (!targetSocketId) {
      socket.emit("callError", { message: "Usuário não encontrado" });
      return;
    }

    console.log(`Call request from ${callerCustomId} (${socket.id}) to ${data.userToCall} (${targetSocketId})`);
    io.to(targetSocketId).emit("callUser", {
      offer: data.offer,
      from: callerCustomId,
      fromSocketId: socket.id
    });
  });

  socket.on("answerCall", (data) => {
    const answererCustomId = socketToUser.get(socket.id);
    const callerSocketId = users.get(data.to);
    
    if (!callerSocketId) {
      socket.emit("callError", { message: "Chamador não encontrado" });
      return;
    }

    console.log(`📞 Call answered by ${answererCustomId} (${socket.id}) to ${data.to} (${callerSocketId})`);
    console.log('Answer data received:', {
      hasAnswer: !!data.answer,
      to: data.to,
      from: answererCustomId
    });
    
    console.log(`📤 Sending callAnswered event to ${data.to} (${callerSocketId})`);
    io.to(callerSocketId).emit("callAnswered", {
      answer: data.answer,
      from: answererCustomId,
    });
    console.log(`✅ callAnswered event sent successfully`);
  });

  socket.on("iceCandidate", (data) => {
    const senderCustomId = socketToUser.get(socket.id);
    const targetSocketId = users.get(data.to);
    
    if (!targetSocketId) return;

    console.log(`ICE candidate from ${senderCustomId} (${socket.id}) to ${data.to} (${targetSocketId})`);
    io.to(targetSocketId).emit("iceCandidate", {
      candidate: data.candidate,
      from: senderCustomId,
    });
  });

  socket.on("endCall", (data) => {
    const senderCustomId = socketToUser.get(socket.id);
    const targetSocketId = users.get(data.to);
    
    if (!targetSocketId) return;

    console.log(`Call ended by ${senderCustomId} (${socket.id}), notifying ${data.to} (${targetSocketId})`);
    io.to(targetSocketId).emit("callEnded", {
      from: senderCustomId,
    });
  });

  socket.on("rejectCall", (data) => {
    const rejectorCustomId = socketToUser.get(socket.id);
    const callerSocketId = users.get(data.to);
    
    if (!callerSocketId) return;

    console.log(`Call rejected by ${rejectorCustomId} (${socket.id}), notifying ${data.to} (${callerSocketId})`);
    io.to(callerSocketId).emit("callRejected", {
      from: rejectorCustomId,
    });
  });

  socket.on("disconnect", () => {
    const customId = socketToUser.get(socket.id);
    if (customId) {
      users.delete(customId);
      socketToUser.delete(socket.id);
      console.log(`User Disconnected: ${customId} (${socket.id})`);
    } else {
      console.log(`Socket Disconnected: ${socket.id}`);
    }
    broadcastUsersList();
  });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  const protocol = server.constructor.name === 'Server' ? 'https' : 'http';
  console.log(`🚀 Server is running on ${protocol}://localhost:${PORT}`);
  if (protocol === 'https') {
    console.log(`🔒 HTTPS enabled - evitando Mixed Content`);
  }
}); 