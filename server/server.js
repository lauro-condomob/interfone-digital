import 'dotenv/config';
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

const apiServer = express();
apiServer.use(cors());

apiServer.get('/api/turn', async (req, res) => {
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
let websocketServer;
const certPath = path.join(__dirname, '..', 'cert.pem');
const keyPath = path.join(__dirname, '..', 'key.pem');

try {
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    console.log('📋 Usando HTTPS para o servidor...');
    const httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };
    websocketServer = createHttpsServer(httpsOptions, apiServer);
  } else {
    console.log('⚠️ Certificados não encontrados, usando HTTP (pode causar Mixed Content)');
    websocketServer = createServer(apiServer);
  }
} catch (error) {
  console.log('⚠️ Erro ao configurar HTTPS, usando HTTP:', error.message);
  websocketServer = createServer(apiServer);
}

const io = new Server(websocketServer, {
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

// Rastreamento de chamadas ativas para detectar desconexões durante chamadas
const activeCalls = new Map(); // userId -> { partnerId, callState: 'calling' | 'active' }

function broadcastUsersList() {
  const usersList = Array.from(users.keys());
  io.emit("usersList", usersList);
}

// Funções para gerenciar chamadas ativas
function setCallState(userId, partnerId, state) {
  activeCalls.set(userId, { partnerId, callState: state });
  console.log(`📞 Call state updated: ${userId} -> ${partnerId} (${state})`);
}

function removeCallState(userId) {
  if (activeCalls.has(userId)) {
    const callInfo = activeCalls.get(userId);
    activeCalls.delete(userId);
    console.log(`📞 Call state removed for: ${userId} (was with ${callInfo.partnerId})`);
    return callInfo;
  }
  return null;
}

function getCallPartner(userId) {
  const callInfo = activeCalls.get(userId);
  return callInfo ? callInfo.partnerId : null;
}

// Remove o estado de ambos apenas se eles estiverem de fato em chamada um com o outro,
// para que um evento vindo de outra chamada não apague o registro da chamada em andamento
function removeCallPair(userA, userB) {
  if (getCallPartner(userA) === userB) removeCallState(userA);
  if (getCallPartner(userB) === userA) removeCallState(userB);
}

function notifyPartnerOfDisconnection(disconnectedUserId) {
  const callInfo = activeCalls.get(disconnectedUserId);
  if (callInfo) {
    const partnerId = callInfo.partnerId;
    const partnerSocketId = users.get(partnerId);
    
    if (partnerSocketId) {
      console.log(`📞 Notifying ${partnerId} that ${disconnectedUserId} disconnected during call`);
      io.to(partnerSocketId).emit("partnerDisconnected", {
        from: disconnectedUserId,
        message: `${disconnectedUserId} se desconectou durante a chamada`
      });
      
      // Remover o estado de chamada do parceiro também
      removeCallState(partnerId);
    }
    
    // Remover o estado de chamada do usuário desconectado
    removeCallState(disconnectedUserId);
  }
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
    
    // Broadcast da lista atualizada
    broadcastUsersList();
    
    // Notificar outros usuários sobre a nova conexão (exceto o próprio usuário)
    socket.broadcast.emit("userConnected", {
      userId: customId,
      message: `👋 ${customId} se conectou!`
    });
  });

  socket.on("callUser", (data) => {
    const callerCustomId = socketToUser.get(socket.id);
    const targetSocketId = users.get(data.userToCall);
    
    if (!targetSocketId) {
      socket.emit("callError", { message: "Usuário não encontrado" });
      return;
    }

    // Destinatário já está em outra chamada: recusar como "ocupado" sem tocar no estado dele
    if (activeCalls.has(data.userToCall)) {
      console.log(`📵 ${data.userToCall} is busy, rejecting call from ${callerCustomId}`);
      socket.emit("callRejected", { from: data.userToCall, reason: 'busy' });
      return;
    }

    console.log(`Call request from ${callerCustomId} (${socket.id}) to ${data.userToCall} (${targetSocketId})`);

    // Registrar estado de chamada como "calling"
    setCallState(callerCustomId, data.userToCall, 'calling');
    setCallState(data.userToCall, callerCustomId, 'calling');
    
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
    
    // Atualizar estado para chamada ativa
    setCallState(answererCustomId, data.to, 'active');
    setCallState(data.to, answererCustomId, 'active');
    
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
    
    // Remover estados de chamada
    removeCallPair(senderCustomId, data.to);
    
    io.to(targetSocketId).emit("callEnded", {
      from: senderCustomId,
    });
  });

  socket.on("rejectCall", (data) => {
    const rejectorCustomId = socketToUser.get(socket.id);
    const callerSocketId = users.get(data.to);
    
    if (!callerSocketId) return;

    const reason = data.reason || 'rejected';
    console.log(`Call ${reason} by ${rejectorCustomId} (${socket.id}), notifying ${data.to} (${callerSocketId})`);
    
    // Remover estados de chamada
    removeCallPair(rejectorCustomId, data.to);
    
    io.to(callerSocketId).emit("callRejected", {
      from: rejectorCustomId,
      reason: reason
    });
  });

  socket.on("disconnect", () => {
    const customId = socketToUser.get(socket.id);
    if (customId) {
      console.log(`User Disconnected: ${customId} (${socket.id})`);
      
      // Verificar se o usuário estava em uma chamada ativa e notificar o parceiro
      notifyPartnerOfDisconnection(customId);
      
      // Remover mapeamentos do usuário
      users.delete(customId);
      socketToUser.delete(socket.id);
      
      // Notificar outros usuários sobre a desconexão
      socket.broadcast.emit("userDisconnected", {
        userId: customId,
        message: `👋 ${customId} se desconectou`
      });
    } else {
      console.log(`Socket Disconnected: ${socket.id}`);
    }
    broadcastUsersList();
  });
});

const PORT = process.env.PORT || 8000;
websocketServer.listen(PORT, () => {
  const protocol = websocketServer.constructor.name === 'Server' ? 'https' : 'http';
  console.log(`🚀 Server is running on ${protocol}://localhost:${PORT}`);
  if (protocol === 'https') {
    console.log(`🔒 HTTPS enabled - evitando Mixed Content`);
  }
}); 