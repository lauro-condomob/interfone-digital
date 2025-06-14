import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import io from 'socket.io-client';

// ============================================================================
// STYLED COMPONENTS
// ============================================================================

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  min-height: 100vh;
  width: 100%;
  max-width: 100vw;
  background-color: #f0f0f0;
  box-sizing: border-box;
  
  @media (max-width: 768px) {
    padding: 10px;
    min-height: 100vh;
    min-width: 100vw;
  }
`;

const VideoContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin: 20px 0;
  width: 100%;
  max-width: 1000px;
  justify-items: center;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 15px;
    margin: 15px 0;
    max-width: 100%;
  }
`;

const VideoContainerSingle = styled.div`
  display: flex;
  justify-content: center;
  margin: 20px 0;
  width: 100%;
  max-width: 1000px;
  
  @media (max-width: 768px) {
    margin: 15px 0;
    max-width: 100%;
  }
`;

const CallActiveContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 1000px;
  margin: 20px 0;
  
  @media (max-width: 768px) {
    margin: 15px 0;
    max-width: 100%;
  }
`;


const VideoInitialState = styled.video`
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 12px;
  background-color: #000;
  object-fit: cover;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  
  @media (max-width: 768px) {
    aspect-ratio: 4/3;
    border-radius: 8px;
  }
`;

const PartnerVideoFull = styled.video`
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 12px;
  background-color: #000;
  object-fit: cover;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  
  @media (max-width: 768px) {
    aspect-ratio: 4/3;
    border-radius: 8px;
  }
`;

const LocalVideoOverlay = styled.video`
  position: absolute;
  bottom: 15px;
  right: 10px;
  width: 20%;
  aspect-ratio: 16/9;
  border-radius: 8px;
  background-color: #000;
  object-fit: cover;
  border: 3px solid white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  z-index: 10;
  transition: transform 0.2s ease;
  
  @media (max-width: 768px) {
    aspect-ratio: 4/3;
    width: 25%;
    bottom: 15px;
    right: 7px;
    border-radius: 6px;
    border-width: 2px;
  }
  
`;

// Input Components

const BaseInput = styled.input`
  padding: 15px;
  margin: 0;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  width: 100%;
  max-width: 300px;
  min-width: 200px;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #007bff;
    box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
  }
  
  @media (max-width: 768px) {
    padding: 12px;
    font-size: 14px;
    flex: 1;
    max-width: none;
    min-width: 150px;
  }
`;

const IdSetupInput = styled(BaseInput)``;

// Button Components
const BaseButton = styled.button`
  padding: 15px 25px;
  margin: 0;
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  min-height: 50px;
  min-width: 140px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  @media (max-width: 768px) {
    padding: 12px;
    font-size: 14px;
  }
`;

const ResponsiveButton = styled(BaseButton)`
  background-color: #007bff;

  &:hover:not(:disabled) {
    background-color: #0056b3;
  }
  
  @media (max-width: 768px) {
    padding: 12px;
    font-size: 14px;
    min-width: 60px;
    width: 60px;
    min-height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .button-text {
    display: inline;
  }
  
  .button-icon {
    display: none;
  }
  
  @media (max-width: 768px) {
    .button-text {
      display: none;
    }
    
    .button-icon {
      display: inline;
      font-size: 14px;
    }
  }
`;

const CallButton = styled(ResponsiveButton)``;
const IdSetupButton = styled(ResponsiveButton)``;

const Button = styled(BaseButton)`
  background-color: #007bff;
  margin: 8px;

  &:hover:not(:disabled) {
    background-color: #0056b3;
  }
  
  @media (max-width: 768px) {
    padding: 12px 30px;
    font-size: 14px;
    margin: 10px 0;
    width: 100%;
    max-width: 350px;
    min-height: 30px;
  }
`;

const EndCallButton = styled(BaseButton)`
  background: linear-gradient(135deg, #dc3545, #c82333);
  margin: 8px;
  box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #c82333, #bd2130);
    box-shadow: 0 6px 16px rgba(220, 53, 69, 0.4);
  }
  
  @media (max-width: 768px) {
    padding: 12px 30px;
    font-size: 14px;
    margin: 10px 0;
    width: 100%;
    max-width: 350px;
    min-height: 30px;
  }
`;

const OverlayButton = styled.button`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
  padding: 20px 30px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
  cursor: pointer;
  font-size: 18px;
  font-weight: 600;
  min-height: 60px;
  min-width: 200px;
  box-shadow: 0 8px 24px rgba(40, 167, 69, 0.4);
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);
  border: 2px solid rgba(255, 255, 255, 0.2);

  &:hover {
    transform: translate(-50%, -50%) translateY(-2px);
    box-shadow: 0 12px 32px rgba(40, 167, 69, 0.6);
    background: linear-gradient(135deg, #218838, #1ea080);
  }

  &:active {
    transform: translate(-50%, -50%) translateY(0px);
  }
  
  @media (max-width: 768px) {
    padding: 12px 35px;
    font-size: 14px;
    min-height: 30px;
    min-width: 250px;
    border-radius: 16px;
  }
  
  @media (max-width: 480px) {
    padding: 12px 25px;
    font-size: 14px;
    min-height: 30px;
    min-width: 200px;
  }
`;

// Display Components
const IdDisplay = styled.div`
  margin: 15px 0;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #dee2e6;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  
  @media (max-width: 768px) {
    text-align: center;
    padding: 25px 15px;
    margin: 20px 0;
    max-width: 90%;
  }
`;

const IdText = styled.span`
  word-break: break-all;
  font-family: monospace;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  
  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const MainTitle = styled.h1`
  color: #333;
  margin-bottom: 20px;
  font-size: 32px;
  font-weight: 600;
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: 28px;
    margin-bottom: 25px;
    margin-top: 50px;
  }
`;

// Message Components
const BaseMessage = styled.div`
  border-radius: 12px;
  padding: 20px;
  margin: 15px 0;
  text-align: center;
  max-width: 500px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  
  @media (max-width: 768px) {
    margin: 20px 0;
    padding: 25px 15px;
    max-width: 100%;
  }
`;

const ErrorMessage = styled(BaseMessage)`
  background-color: #ffe6e6;
  border: 1px solid #ff9999;
  color: #cc0000;
`;

const LoadingMessage = styled(BaseMessage)`
  background-color: #e6f3ff;
  border: 1px solid #99ccff;
  color: #0066cc;
`;

const StatusMessage = styled(BaseMessage)`
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  color: #666;
  font-size: 14px;
`;

// Overlay Components
const PartnerIdOverlay = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  font-family: monospace;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 15;
  
  @media (max-width: 768px) {
    top: 15px;
    left: 15px;
    font-size: 13px;
    padding: 6px 10px;
  }
  
  @media (max-width: 480px) {
    top: 10px;
    left: 10px;
    font-size: 12px;
    padding: 5px 8px;
  }
`;

const MicrophoneOverlay = styled.div<{ isActive: boolean }>`
  position: absolute;
  bottom: 15px;
  right: 15px;
  width: 40px;
  height: 40px;
  background: ${props => props.isActive ? 'rgba(34, 197, 94, 0.9)' : 'rgba(64, 64, 64, 0.9)'};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: white;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 20;
  transition: all 0.2s ease;
  
  @media (max-width: 768px) {
    width: 35px;
    height: 35px;
    font-size: 16px;
    bottom: 12px;
    right: 12px;
  }
  
  @media (max-width: 480px) {
    width: 32px;
    height: 32px;
    font-size: 14px;
    bottom: 10px;
    right: 10px;
  }
`;

const MicrophoneOverlaySmall = styled.div<{ isActive: boolean }>`
  position: absolute;
  bottom: 25px;
  right: 25px;
  width: 24px;
  height: 24px;
  background: ${props => props.isActive ? 'rgba(34, 197, 94, 0.9)' : 'rgba(64, 64, 64, 0.9)'};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: white;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 20;
  transition: all 0.2s ease;
  
  @media (max-width: 768px) {
    bottom: 20px;
    right: 15px;
    width: 20px;
    height: 20px;
    font-size: 10px;
  }
  
`;

// ID Setup Components
const IdSetupContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
  max-width: 100vw;
  padding: 20px;
  background-color: #f8f9fa;
  box-sizing: border-box;
  
  @media (max-width: 768px) {
    padding: 15px;
  }
`;

const IdSetupCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
  text-align: center;
  
  @media (max-width: 768px) {
    padding: 30px 20px;
    border-radius: 12px;
    max-width: 100%;
  }
`;

const IdSetupTitle = styled.h1`
  color: #333;
  margin-bottom: 15px;
  font-size: 32px;
  font-weight: 600;
  
  @media (max-width: 768px) {
    font-size: 28px;
    margin-bottom: 20px;
  }
`;

const IdSetupDescription = styled.p`
  color: #666;
  margin-bottom: 35px;
  font-size: 16px;
  line-height: 1.6;
  
  @media (max-width: 768px) {
    font-size: 16px;
    margin-bottom: 30px;
    line-height: 1.5;
  }
`;

const IdInputGroup = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 25px;
  width: 100%;
  
  @media (max-width: 768px) {
    gap: 10px;
    margin-bottom: 25px;
  }
`;

// Popup Components
const PopupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  box-sizing: border-box;
`;

const PopupContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 30px;
  max-width: 400px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  
  @media (max-width: 768px) {
    padding: 20px;
    max-width: 90%;
    max-height: 70vh;
  }
`;

const PopupTitle = styled.h2`
  color: #333;
  margin-bottom: 20px;
  font-size: 24px;
  font-weight: 600;
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: 20px;
    margin-bottom: 15px;
  }
`;

const PartnersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
  max-height: 300px;
  overflow-y: auto;
`;

const PartnerItem = styled.button`
  display: flex;
  align-items: center;
  padding: 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 16px;
  color: #333;
  
  &:hover {
    border-color: #007bff;
    background-color: #f8f9ff;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  @media (max-width: 768px) {
    padding: 10px;
    font-size: 18px;
  }
`;

const PartnerIcon = styled.span`
  margin-right: 12px;
  font-size: 20px;
`;

const EmptyMessage = styled.div`
  text-align: center;
  color: #666;
  font-size: 16px;
  padding: 30px 20px;
  font-style: italic;
`;

const PopupCloseButton = styled.button`
  width: 100%;
  padding: 12px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background-color: #5a6268;
  }
  
  @media (max-width: 768px) {
    padding: 12px;
    font-size: 14px;
  }
`;

// Novos styled components para substituir estilos inline
const LogsButton = styled(Button)`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 10000;
`;

const LogsOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LogsContainer = styled.div`
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  width: 90vw;
  max-width: 600px;
  max-height: 80vh;
  overflow: auto;
`;

const LogsContent = styled.div`
  max-height: 400px;
  overflow-y: auto;
  background: #222;
  color: #fff;
  padding: 12px;
  border-radius: 4px;
`;

const LogEntry = styled.div<{ logType: 'log' | 'warn' | 'error' }>`
  margin-bottom: 8px;
  border-bottom: 1px solid #444;
  padding-bottom: 4px;
  color: ${props => 
    props.logType === 'error' ? '#ff5555' : 
    props.logType === 'warn' ? '#ffcc00' : '#fff'
  };
  font-weight: ${props => 
    props.logType === 'error' || props.logType === 'warn' ? 'bold' : 'normal'
  };
`;

const LogIcon = styled.span`
  margin-right: 8px;
`;

const LogsCloseButton = styled(Button)`
  margin-top: 16px;
`;

const ReloadButton = styled.button`
  margin-top: 10px;
  padding: 5px 10px;
`;

const CallButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  margin: 20px 0;
`;

const VideoPlaceholder = styled.div<{ aspectRatio?: string; fontSize?: string }>`
  width: 100%;
  aspect-ratio: ${props => props.aspectRatio || '16/9'};
  background-color: #333;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: ${props => props.fontSize || '18px'};
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    aspect-ratio: 4/3;
  }
`;

const VideoWrapper = styled.div`
  position: relative;
`;

const WaitingVideoPlaceholder = styled.div`
  width: 100%;
  aspect-ratio: 4/3;
  background-color: #333;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
`;

const CameraErrorPlaceholder = styled.div`
  width: 100%;
  aspect-ratio: 4/3;
  background-color: #666;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  text-align: center;
  padding: 20px;
  box-sizing: border-box;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const CallEndedContainer = styled.div`
  text-align: center;
`;

const CallEndedMessage = styled(StatusMessage)`
  margin-bottom: 10px;
`;

const ErrorContainer = styled.div`
  padding: 20px;
  text-align: center;
  background-color: #ffe6e6;
`;

const ErrorReloadButton = styled.button`
  padding: 10px 20px;
  margin-top: 10px;
`;

// Componentes de notificação
const NotificationsContainer = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10002;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
  
  @media (max-width: 768px) {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
`;

const NotificationItem = styled.div<{ type: 'success' | 'info' | 'warning' | 'error' }>`
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  animation: slideIn 0.3s ease-out;
  cursor: pointer;
  
  background: ${props => {
    switch (props.type) {
      case 'success': return '#d4edda';
      case 'info': return '#d1ecf1';
      case 'warning': return '#fff3cd';
      case 'error': return '#f8d7da';
      default: return '#d1ecf1';
    }
  }};
  
  color: ${props => {
    switch (props.type) {
      case 'success': return '#155724';
      case 'info': return '#0c5460';
      case 'warning': return '#856404';
      case 'error': return '#721c24';
      default: return '#0c5460';
    }
  }};
  
  border-left: 4px solid ${props => {
    switch (props.type) {
      case 'success': return '#28a745';
      case 'info': return '#17a2b8';
      case 'warning': return '#ffc107';
      case 'error': return '#dc3545';
      default: return '#17a2b8';
    }
  }};
  
  &:hover {
    opacity: 0.8;
  }
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

const NotificationContent = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
`;

const NotificationIcon = styled.span`
  font-size: 16px;
`;

const NotificationClose = styled.button`
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 18px;
  padding: 0;
  margin-left: 10px;
  opacity: 0.7;
  
  &:hover {
    opacity: 1;
  }
`;

// ============================================================================
// INTERFACES & SOCKET SETUP
// ============================================================================

interface CallData {
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  from: string;
  candidate?: RTCIceCandidateInit;
}

const socket = io(`https://${window.location.hostname}:8000`, {
  transports: ['websocket', 'polling'],
  upgrade: true,
  rememberUpgrade: false,
  timeout: 20000,
  forceNew: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  secure: true,
  rejectUnauthorized: false
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

type LogEntry = { type: 'log' | 'warn' | 'error', message: string };
const globalLogs: LogEntry[] = [];

// Variável global para armazenar os servidores TURN
let globalTurnServers: RTCIceServer[] = [];

// Função para carregar os servidores TURN
const loadTurnServers = async () => {
  try {
    const response = await fetch(
      `https://${window.location.hostname}:8000/api/turn`,
      {
        headers: {"Accept": "application/json"},
      }
    );
    if (response.ok) {
      const turnServers = await response.json();
      console.log('🔍 TURN IceServers carregados:', turnServers);
      globalTurnServers = turnServers;
    }
  } catch (error) {
    console.error('Erro ao buscar iceServers do backend:', error);
  }
};

// Carregar servidores TURN assim que a página for carregada
loadTurnServers();

const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

console.log = (...args: any[]) => {
  globalLogs.push({
    type: 'log',
    message: args.map(a => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ')
  });
  originalConsoleLog(...args);
};
console.warn = (...args: any[]) => {
  globalLogs.push({
    type: 'warn',
    message: args.map(a => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ')
  });
  originalConsoleWarn(...args);
};
console.error = (...args: any[]) => {
  globalLogs.push({
    type: 'error',
    message: args.map(a => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' ')
  });
  originalConsoleError(...args);
};

const VideoCall: React.FC = () => {
  // States
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callAccepted, setCallAccepted] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [userId, setUserId] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isIdSet, setIsIdSet] = useState(false);
  const [tempUserId, setTempUserId] = useState("");
  const [idError, setIdError] = useState<string | null>(null);
  const [isSettingId, setIsSettingId] = useState(false);
  const [partnerEndedCall, setPartnerEndedCall] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callEndReason, setCallEndReason] = useState<'ended' | 'rejected' | 'busy' | 'disconnected' | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>(() => [...globalLogs]);
  const [showLogsPopup, setShowLogsPopup] = useState(false);
  const [allUsers, setAllUsers] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);
  const [showPartnersPopup, setShowPartnersPopup] = useState(false);
  const [shouldCall, setShouldCall] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: number;
    message: string;
    type: 'success' | 'info' | 'warning' | 'error';
    timestamp: number;
  }>>([]);

  // Estados derivados (computados) - simplifica lógica de renderização
  const isCallActive = callAccepted || isCalling || receivingCall;
  const isNormalState = !isCalling && !receivingCall && !callAccepted && !partnerEndedCall;
  const currentPartner = caller || partnerId;
  const canStartCall = !callAccepted && !isCalling && !receivingCall && !partnerEndedCall;

  // Refs
  const userVideo = useRef<HTMLVideoElement>(null);
  const partnerVideoFull = useRef<HTMLVideoElement>(null);
  const localVideoOverlay = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection>();
  const idInputRef = useRef<HTMLInputElement>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const microphone = useRef<MediaStreamAudioSourceNode | null>(null);
  const ringtoneInterval = useRef<number | null>(null);
  const ringtoneAudio = useRef<HTMLAudioElement | null>(null);
  const logsEndRef = useRef<HTMLDivElement | null>(null);
  const logsContainerRef = useRef<HTMLDivElement | null>(null);

  // Função utilitária para aplicar stream a elementos de vídeo
  const applyStreamToVideo = (videoRef: React.RefObject<HTMLVideoElement>, stream: MediaStream, description: string) => {
    if (videoRef.current && stream) {
      console.log(`🎥 ${description}`);
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => {
        console.log(`Erro ao reproduzir ${description.toLowerCase()}:`, e);
      });
    }
  };

  // Função para resetar estados de chamada
  const resetCallStates = () => {
    setCallAccepted(false);
    setIsCalling(false);
    setReceivingCall(false);
    setPartnerEndedCall(false);
    setCallEndReason(null);
    setCaller("");
    setPartnerId("");
    setRemoteStream(null);
  };

  const initializeCamera = async () => {
    console.log('🎥 Iniciando câmera após definição do ID...');
    setIsLoading(true);
    
    console.log('🔍 Detalhes do dispositivo:', {
      userAgent: navigator.userAgent,
      isSecureContext: window.isSecureContext,
      protocol: window.location.protocol,
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      hasMediaDevices: !!navigator.mediaDevices,
      hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    });
    
    if (!navigator.mediaDevices) {
      console.error('❌ navigator.mediaDevices não está disponível');
      setIsLoading(false);
      if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
        setCameraError("❌ HTTPS é obrigatório para acessar câmera/microfone. Acesse via HTTPS ou localhost.");
      } else {
        setCameraError("❌ Seu navegador não suporta acesso à câmera/microfone (navigator.mediaDevices não disponível).");
      }
      return;
    }

    if (!navigator.mediaDevices.getUserMedia) {
      console.error('❌ getUserMedia não está disponível');
      setIsLoading(false);
      setCameraError("❌ Seu navegador não suporta getUserMedia.");
      return;
    }
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      console.log('✅ Got local media stream successfully');
      setStream(mediaStream);
      setIsLoading(false);
      setCameraError(null);
    } catch (error) {
      console.error("❌ Error accessing media devices:", error);
      setIsLoading(false);
      
      if ((error as any).name === 'NotAllowedError' && !window.isSecureContext) {
        setCameraError("Este dispositivo precisa de HTTPS para usar a câmera. A aplicação funcionará apenas para chat de texto.");
      } else if ((error as any).name === 'NotAllowedError') {
        setCameraError("Permissão de câmera negada. Permita o acesso à câmera e recarregue a página.");
      } else if ((error as any).name === 'NotFoundError') {
        setCameraError("Nenhuma câmera encontrada neste dispositivo.");
      } else {
        setCameraError(`Erro ao acessar câmera: ${(error as any).message}`);
      }
      
      console.log('🔄 Continuando sem câmera...');
    }
  };

  const createPeerConnection = async () => {
    console.log('🔗 Creating peer connection');

    let iceServers: RTCIceServer[] = [
      // Servidores STUN gratuitos (funcionam na maioria dos casos)
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.google.com:19302' },
    ];

    // Adicionar servidores TURN da variável global
    if (globalTurnServers.length > 0) {
      console.log('🔍 Usando TURN IceServers da variável global:', globalTurnServers);
      iceServers = [...iceServers, ...globalTurnServers];
    }

    const pc = new RTCPeerConnection({ iceServers });
    
    console.log('✅ Peer connection created successfully');

    pc.onicecandidateerror = (event) => {
      console.error('❌ ICE Candidate Error:', 
        event.url, 
        event.errorCode+' - '+event.errorText,
        event.address+':'+event.port
      );
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate:', event.candidate);
        if (event.candidate.candidate.includes('relay')) {
          console.log('✅ TURN funcionando!');
        }
        socket.emit("iceCandidate", {
          candidate: event.candidate,
          to: caller || partnerId
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('🎯 *** ONTRACK FIRED! *** (RECEPTOR DE VÍDEO)');
      console.log('Remote streams received:', event.streams);
      console.log('Track details:', {
        kind: event.track.kind,
        label: event.track.label,
        enabled: event.track.enabled,
        readyState: event.track.readyState
      });
      
      if (event.streams && event.streams[0]) {
        const remoteStream = event.streams[0];
        console.log('Setting remote stream');
        setRemoteStream(remoteStream);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        console.log('ICE connection established successfully');
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
    };

    return pc;
  };

  // Função para inicializar o áudio do toque
  const initializeRingtone = () => {
    if (!ringtoneAudio.current) {
      ringtoneAudio.current = new Audio('/ringtone.mp3');
      ringtoneAudio.current.loop = true;
      ringtoneAudio.current.volume = 0.7;
      
      // Preload do áudio
      ringtoneAudio.current.preload = 'auto';
      
      // Event listeners para debug
      ringtoneAudio.current.addEventListener('canplaythrough', () => {
        console.log('🔔 Áudio do toque carregado e pronto');
      });
      
      ringtoneAudio.current.addEventListener('error', (e) => {
        console.error('❌ Erro ao carregar áudio do toque:', e);
      });
    }
  };

  // Iniciar toque
  const startRingtone = () => {
    console.log('🔔 Iniciando toque...');
    
    // Inicializar o áudio se ainda não foi
    initializeRingtone();
    
    // Tocar o áudio
    if (ringtoneAudio.current) {
      ringtoneAudio.current.currentTime = 0; // Reiniciar do início
      ringtoneAudio.current.play().catch((error) => {
        console.error('❌ Erro ao tocar áudio do toque:', error);
        // Fallback para toque sintético se o arquivo não funcionar
        console.log('🔄 Usando toque sintético como fallback...');
        createSyntheticRingtone();
      });
    }
  };

  // Parar toque
  const stopRingtone = () => {
    console.log('🔕 Parando toque...');
    
    if (ringtoneInterval.current) {
      clearInterval(ringtoneInterval.current);
      ringtoneInterval.current = null;
    }
    
    // Parar áudio
    if (ringtoneAudio.current) {
      ringtoneAudio.current.pause();
      ringtoneAudio.current.currentTime = 0;
    }
  };

  // Fallback - toque sintético caso o MP3 não funcione
  const createSyntheticRingtone = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(554, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.15);
      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
      
      // Repetir o toque sintético
      ringtoneInterval.current = window.setInterval(() => {
        const newOscillator = audioContext.createOscillator();
        const newGainNode = audioContext.createGain();
        
        newOscillator.connect(newGainNode);
        newGainNode.connect(audioContext.destination);
        
        newOscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        newOscillator.frequency.setValueAtTime(554, audioContext.currentTime + 0.1);
        
        newGainNode.gain.setValueAtTime(0, audioContext.currentTime);
        newGainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
        newGainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.15);
        newGainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.2);
        
        newOscillator.start(audioContext.currentTime);
        newOscillator.stop(audioContext.currentTime + 0.2);
      }, 2000);
      
    } catch (error) {
      console.warn('❌ Erro ao criar toque sintético:', error);
    }
  };

  useEffect(() => {
    console.log('🚀 VideoCall component mounted');
    
    try {
      console.log('Initial socket ID:', socket.id);
      
      if (socket.id) {
        console.log('Setting initial socket ID:', socket.id);
        setUserId(socket.id);
      }
      
      socket.on("connect", () => {
        console.log("✅ Socket connected successfully with ID:", socket.id);
        console.log("🔗 Transport used:", socket.io.engine.transport.name);
      });

      socket.on("connect_error", (error: any) => {
        console.error("❌ Socket connection error:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        
        // Tentar diagnosticar o problema
        const errorString = String(error);
        if (errorString.includes('CORS') || errorString.includes('cors')) {
          console.error('🚨 PROBLEMA CORS: Servidor não está configurado corretamente');
        }
        if (errorString.includes('Network') || errorString.includes('network')) {
          console.error('🚨 PROBLEMA REDE: Servidor pode não estar rodando');
        }
        if (errorString.includes('xhr poll error')) {
          console.error('🚨 PROBLEMA XHR: Provavelmente Mixed Content (HTTP/HTTPS)');
        }
      });

      socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
      });

      // Socket event handlers com try-catch
      socket.on("callUser", async (data: CallData) => {
        try {
          console.log('📞 RECEBENDO CHAMADA de:', data.from);
          console.log('Estado atual antes:', { 
            receivingCall, 
            isCalling, 
            callAccepted, 
            partnerEndedCall,
            stream: !!stream, 
            hasVideo: !!userVideo.current 
          });
          
          // Verificar se já está em uma chamada ativa
          const isInActiveCall = callAccepted || isCalling || receivingCall;
          
          if (isInActiveCall) {
            console.log('⚠️ Usuário já está em chamada ativa - rejeitando chamada automaticamente');
            // Notificar o chamador que está ocupado
            socket.emit("rejectCall", {
              to: data.from,
              from: userId,
              reason: "busy"
            });
            return;
          }
          
          // Resetar estados anteriores para garantir estado limpo
          resetCallStates();
          
          // Definir estado de recebimento de chamada
          setReceivingCall(true);
          setCaller(data.from);
          setPartnerEndedCall(false);
          setCallEndReason(null);
          
          console.log('✅ Estado automaticamente alterado para RECEBER CHAMADA');
          console.log('Estado atual após:', { 
            receivingCall: true, 
            caller: data.from,
            isCalling: false, 
            callAccepted: false, 
            partnerEndedCall: false 
          });
          
          // Iniciar toque
          startRingtone();
          
          if (data.offer) {
            console.log('🔗 Criando peer connection para resposta...');
            const pc = await createPeerConnection();
            peerConnection.current = pc;
            console.log('✅ Peer connection criado para recebimento');

            console.log('📋 Setting remote description (offer)');
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            console.log('✅ Remote description set - aguardando usuário clicar em Atender');
          }
        } catch (error) {
          console.error('❌ Error in callUser handler:', error);
        }
      });

      socket.on("callAnswered", async (data: CallData) => {
        try {
          console.log('🎉 CHAMADA ATENDIDA! Recebido do servidor:', data);
          console.log('Estado atual do iniciador:', {
            peerConnection: !!peerConnection.current,
            signalingState: peerConnection.current?.signalingState,
            hasAnswer: !!data.answer,
            callAccepted,
            isCalling
          });
          
          if (!peerConnection.current || !data.answer) {
            console.warn('❌ Peer connection ou answer não disponível');
            console.log('peerConnection.current:', !!peerConnection.current);
            console.log('data.answer:', !!data.answer);
            return;
          }

          console.log('📋 Current signaling state:', peerConnection.current.signalingState);
          
          if (peerConnection.current.signalingState === "stable") {
            console.warn('⚠️ Connection already stable, ignoring answer');
            return;
          }

          console.log('📋 Setting remote description (answer)...');
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
          console.log('✅ Remote description (answer) set successfully');
          
          setCallAccepted(true);
          console.log('✅ Call state updated to accepted');
          console.log('🎯 Aguardando ontrack event para receber vídeo do parceiro...');
        } catch (error) {
          console.error('❌ Error in callAnswered handler:', error);
        }
      });

      socket.on("iceCandidate", async (data: CallData) => {
        try {
          console.log('Received ICE candidate:', data.candidate);
          if (!peerConnection.current || !data.candidate) {
            return;
          }

          if (data.candidate.candidate && data.candidate.candidate.includes('relay')) {
              console.log('✅ TURN funcionando!');
          }
      
          await peerConnection.current.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
          console.log('ICE candidate added successfully');
        } catch (error) {
          console.error("Error adding ice candidate:", error);
        }
      });

      socket.on("callEnded", (data: { from: string }) => {
        try {
          console.log('🔴 PARCEIRO ENCERROU A CHAMADA! ID do parceiro:', data.from);
          console.log('*** A chamada foi encerrada pelo parceiro ***');
          
          // Parar toque se estiver tocando
          stopRingtone();
          
          // Marcar que o parceiro encerrou a chamada
          setPartnerEndedCall(true);
          setCallEndReason('ended');
          
          // Fechar peer connection
          if (peerConnection.current) {
            peerConnection.current.close();
          }
        } catch (error) {
          console.error('❌ Error in callEnded handler:', error);
        }
      });

      socket.on("callRejected", (data: { from: string, reason?: string }) => {
        try {
          const reason = data.reason || 'rejected';
          console.log(`❌ CHAMADA ${reason === 'busy' ? 'OCUPADO' : 'RECUSADA'}! ID do receptor:`, data.from);
          console.log(`*** A chamada foi ${reason === 'busy' ? 'recusada - usuário ocupado' : 'recusada pelo receptor'} ***`);
          console.log('Estados antes do processamento da recusa:', {
            callAccepted,
            isCalling,
            receivingCall,
            partnerEndedCall,
            hasStream: !!stream,
            hasRemoteStream: !!remoteStream
          });
          
          // Mostrar mensagem específica se o usuário estiver ocupado
          if (reason === 'busy') {
            alert(`📞 ${data.from} está ocupado em outra chamada. Tente novamente mais tarde.`);
          }
          
          // Fechar peer connection primeiro
          if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = undefined;
          }
          
          // Então atualizar estados em ordem específica
          setIsCalling(false);
          setPartnerEndedCall(true);
          setCallEndReason(reason === 'busy' ? 'busy' : 'rejected');
          
          console.log('✅ Estados atualizados após recusa da chamada');
          
        } catch (error) {
          console.error('❌ Error in callRejected handler:', error);
        }
      });

      // Novos handlers para ID customizado
      socket.on("userIdConfirmed", (data: { customId: string }) => {
        console.log("✅ Custom ID confirmed:", data.customId);
        setUserId(data.customId);
        setIsIdSet(true);
        setIsSettingId(false);
        setIdError(null);
        initializeCamera(); // Iniciar câmera após confirmar ID
      });

      socket.on("userIdError", (data: { message: string }) => {
        console.log("❌ ID error:", data.message);
        setIdError(data.message);
        setIsSettingId(false);
      });

      socket.on("callError", (data: { message: string }) => {
        console.log("❌ Call error:", data.message);
        alert(`Erro na chamada: ${data.message}`);
        setIsCalling(false);
      });

      socket.on("usersList", (users: string[]) => {
        console.log("👥 Lista de usuários disponíveis:", users);
        setAllUsers(users);
      });

      socket.on("userConnected", (data: { userId: string, message: string }) => {
        console.log("👋 Novo usuário conectado:", data);
        showNotification(data.message, 'success');
      });

      socket.on("userDisconnected", (data: { userId: string, message: string }) => {
        console.log("👋 Usuário desconectado:", data);
        showNotification(data.message, 'info');
      });

      socket.on("partnerDisconnected", (data: { from: string, message: string }) => {
        try {
          console.log('🔌 PARCEIRO SE DESCONECTOU DURANTE A CHAMADA!', data.from);
          console.log('*** Chamada interrompida por desconexão ***');
          
          // Parar toque se estiver tocando
          stopRingtone();
          
          // Fechar peer connection
          if (peerConnection.current) {
            peerConnection.current.close();
            peerConnection.current = undefined;
          }
          
          // Atualizar estados para indicar desconexão
          setPartnerEndedCall(true);
          setCallEndReason('disconnected');
          setCallAccepted(false);
          setIsCalling(false);
          setReceivingCall(false);
          
          // Mostrar notificação
          showNotification(data.message, 'warning');
          
          console.log('✅ Estados atualizados após desconexão do parceiro');
          
        } catch (error) {
          console.error('❌ Error in partnerDisconnected handler:', error);
        }
      });

    } catch (error) {
      console.error('❌ ERRO CRÍTICO no useEffect principal:', error);
      setCameraError(`Erro crítico na aplicação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setIsLoading(false);
    }

    return () => {
      try {
        // Parar toque se estiver tocando
        stopRingtone();
        
        socket.off("connect");
        socket.off("connect_error");
        socket.off("disconnect");
        socket.off("callUser");
        socket.off("callAnswered");
        socket.off("iceCandidate");
        socket.off("callEnded");
        socket.off("callRejected");
        socket.off("userIdConfirmed");
        socket.off("userIdError");
        socket.off("callError");
        socket.off("usersList");
        socket.off("userConnected");
        socket.off("userDisconnected");
        socket.off("partnerDisconnected");
        
        if (peerConnection.current) {
          peerConnection.current.close();
        }
      } catch (error) {
        console.error('❌ Erro no cleanup:', error);
      }
    };
  }, []);

  // useEffect consolidado para aplicar streams locais
  useEffect(() => {
    if (stream) {
      // Aplicar ao vídeo principal
      applyStreamToVideo(userVideo, stream, 'Aplicando stream local ao elemento de vídeo');
      
      // Configurar análise de áudio para detecção de fala
      setupAudioAnalysis(stream);
      
      // Aplicar ao vídeo overlay quando há atividade de chamada
      if (isCallActive) {
        applyStreamToVideo(localVideoOverlay, stream, 'Aplicando stream ao vídeo overlay');
      }
    }
  }, [stream, isCallActive]);

  // useEffect específico para reaplicar vídeo local quando sair do estado partnerEndedCall
  useEffect(() => {
    if (stream && isCallActive && localVideoOverlay.current && !localVideoOverlay.current.srcObject) {
      console.log('🔄 Reaplicando stream ao vídeo overlay após mudança de estado...');
      applyStreamToVideo(localVideoOverlay, stream, 'Reaplicando stream ao vídeo overlay');
    }
  }, [stream, isCallActive, partnerEndedCall]);

  // useEffect separado para adicionar stream ao peer connection quando disponível
  useEffect(() => {
    if (stream && peerConnection.current) {
      console.log('🎥 ADICIONANDO STREAM AO PEER CONNECTION');
      console.log('Stream tracks:', stream.getTracks().map(t => ({ kind: t.kind, label: t.label })));
      
      stream.getTracks().forEach(track => {
        const sender = peerConnection.current?.getSenders().find(s => s.track?.kind === track.kind);
        if (!sender) {
          console.log(`➕ Adicionando track ${track.kind}:`, track.label);
          peerConnection.current?.addTrack(track, stream);
        } else {
          console.log(`⚠️ Track ${track.kind} já existe, pulando...`);
        }
      });
      
      console.log('Total senders após adição:', peerConnection.current?.getSenders().length);
    } else {
      if (!stream) console.log('❌ Stream não disponível ainda');
      if (!peerConnection.current) console.log('❌ Peer connection não disponível ainda');
    }
  }, [stream]);



  // Cleanup do stream quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      // Cleanup do audio context
      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, [stream]);

  // useEffect para aplicar remote stream
  useEffect(() => {
    if (remoteStream && isCallActive) {
      applyStreamToVideo(partnerVideoFull, remoteStream, 'Aplicando remote stream ao vídeo fullscreen');
    }
  }, [remoteStream, isCallActive]);

  // useEffect para restaurar vídeo local após chamadas
  useEffect(() => {
    if (isNormalState && stream && userVideo.current?.srcObject !== stream) {
      console.log('🔄 Restaurando vídeo local no estado normal...');
      applyStreamToVideo(userVideo, stream, 'Re-aplicando stream ao vídeo local');
    }
  }, [stream, isNormalState]);

  // Focar automaticamente no campo de ID quando a tela for carregada
  useEffect(() => {
    if (!isIdSet && idInputRef.current) {
      const timer = setTimeout(() => {
        idInputRef.current?.focus();
      }, 100); // Small delay to ensure the component is fully rendered
      
      return () => clearTimeout(timer);
    }
  }, [isIdSet]);

  useEffect(() => {
    if (shouldCall) {
      // O partnerId já foi atualizado pelo selectPartner
      callUser();
      setShouldCall(false); // Reseta o gatilho
    }
  }, [shouldCall]);

  const callUser = async () => {
    console.log('📞 INICIANDO CHAMADA');
    
    if (!partnerId) {
      console.error("❌ ID do parceiro não definido");
      return;
    }

    if (partnerId === userId) {
      console.error("❌ Tentativa de chamar a si mesmo");
      return;
    }

    if (!stream) {
      console.log('❌ Stream não disponível ainda');
      alert("Aguarde o carregamento da câmera");
      return;
    }

    try {
      setPartnerEndedCall(false);
      setCallEndReason(null);
      setRemoteStream(null);
      
      setIsCalling(true);
      console.log('🔗 Criando peer connection...');
      const pc = await createPeerConnection();
      peerConnection.current = pc;

      console.log('🎥 Adding local stream to peer connection (caller)');
      stream.getTracks().forEach(track => {
        console.log('➕ Adding track:', track.kind, track.label);
        pc.addTrack(track, stream);
      });

      console.log('📋 Creating offer');
      const offer = await pc.createOffer();
      console.log('📋 Setting local description (offer)');
      await pc.setLocalDescription(offer);
      
      console.log('📤 Sending call to partner:', partnerId);
      socket.emit("callUser", {
        userToCall: partnerId,
        offer: pc.localDescription,
        from: userId
      });

      // Garantir que o vídeo local seja aplicado ao overlay após iniciar chamada
      setTimeout(() => {
        if (stream && localVideoOverlay.current) {
          console.log('🔄 GARANTINDO aplicação do stream ao vídeo overlay após iniciar chamada...');
          applyStreamToVideo(localVideoOverlay, stream, 'Garantindo stream no overlay após chamar');
        }
      }, 100);

    } catch (error) {
      console.error("❌ Error initiating call:", error);
      setIsCalling(false);
    }
  };

  const answerCall = async () => {
    console.log('📞 ATENDENDO CHAMADA');
    
    // Parar toque
    stopRingtone();
    
    if (!peerConnection.current || !stream) {
      console.error('❌ Peer connection ou stream não disponível');
      return;
    }

    try {
      setPartnerEndedCall(false);
      setCallEndReason(null);
      
      console.log('🎥 Adicionando stream local ao peer connection (receptor)');
      stream.getTracks().forEach(track => {
        console.log('➕ Adding track:', track.kind, track.label);
        peerConnection.current?.addTrack(track, stream);
      });

      console.log('📋 Creating answer');
      const answer = await peerConnection.current.createAnswer();
      console.log('📋 Setting local description (answer)');
      await peerConnection.current.setLocalDescription(answer);
      
      socket.emit("answerCall", {
        answer: peerConnection.current.localDescription,
        to: caller
      });
      
      setCallAccepted(true);
      setReceivingCall(false);
      
      // Garantir que o vídeo local seja aplicado ao overlay após aceitar
      setTimeout(() => {
        if (stream && localVideoOverlay.current) {
          console.log('🔄 GARANTINDO aplicação do stream ao vídeo overlay após aceitar chamada...');
          applyStreamToVideo(localVideoOverlay, stream, 'Garantindo stream no overlay após aceitar');
        }
      }, 100);
      
    } catch (error) {
      console.error('❌ Error creating/sending answer:', error);
    }
  };

  const rejectCall = () => {
    console.log('❌ RECUSANDO CHAMADA');
    
    // Parar toque
    stopRingtone();
    
    // Notificar o chamador que a chamada foi recusada
    if (caller) {
      socket.emit("rejectCall", {
        to: caller,
        from: userId
      });
    }
    
    // Resetar estados
    setReceivingCall(false);
    setCaller("");
    setCallEndReason(null);
    
    // Fechar peer connection se existir
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = undefined;
    }
    
    console.log('✅ Chamada recusada - Usuário voltou ao estado inicial');
  };

  const leaveCall = () => {
    console.log('🔴 ENCERRANDO CHAMADA');
    
    // Parar toque se estiver tocando
    stopRingtone();
    
    // Notificar parceiro se necessário
    if (currentPartner && !partnerEndedCall) {
      socket.emit("endCall", {
        to: currentPartner,
        from: userId
      });
    }
    
    // Resetar todos os estados de chamada
    resetCallStates();
    
    // Fechar peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = undefined;
    }
    
    console.log('✅ Chamada encerrada - Usuário voltou ao estado inicial');
  };

  const setCustomUserId = () => {
    if (!tempUserId.trim()) {
      setIdError("Por favor, digite um ID válido");
      return;
    }

    if (tempUserId.length < 3) {
      setIdError("ID deve ter pelo menos 3 caracteres");
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(tempUserId)) {
      setIdError("ID pode conter apenas letras, números, _ e -");
      return;
    }

    setIsSettingId(true);
    setIdError(null);
    console.log("Tentando definir ID customizado:", tempUserId);
    socket.emit("setUserId", { customId: tempUserId });
  };

  const handleIdInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setCustomUserId();
    }
  };



  const openPartnersPopup = () => {
    console.log('🔍 Abrindo popup de parceiros disponíveis');
    setShowPartnersPopup(true);
  };

  const selectPartner = (selectedPartnerId: string) => {
    console.log('👤 Parceiro selecionado:', selectedPartnerId);
    setPartnerId(selectedPartnerId);
    setShowPartnersPopup(false);
    setShouldCall(true);
  };

  const closePartnersPopup = () => {
    setShowPartnersPopup(false);
  };

  const setupAudioAnalysis = (stream: MediaStream) => {
    try {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      analyser.current = audioContext.current.createAnalyser();
      analyser.current.fftSize = 256;
      analyser.current.smoothingTimeConstant = 0.3;
      
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        microphone.current = audioContext.current.createMediaStreamSource(stream);
        microphone.current.connect(analyser.current);
        
        // Iniciar monitoramento de áudio
        startAudioMonitoring();
      }
    } catch (error) {
      console.error('Erro ao configurar análise de áudio:', error);
    }
  };

  const startAudioMonitoring = () => {
    if (!analyser.current) return;
    
    const dataArray = new Uint8Array(analyser.current.frequencyBinCount);
    
    const checkAudioLevel = () => {
      if (!analyser.current) return;
      
      analyser.current.getByteFrequencyData(dataArray);
      
      // Calcular nível médio de áudio
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      
      // Threshold para considerar que está falando (ajuste conforme necessário)
      const speechThreshold = 10;
      setIsSpeaking(average > speechThreshold);
      
      requestAnimationFrame(checkAudioLevel);
    };
    
    checkAudioLevel();
  };

  const isMicrophoneActive = () => {
    if (!stream) return false;
    const audioTracks = stream.getAudioTracks();
    return audioTracks.length > 0 && audioTracks[0].enabled;
  };

  // Sistema de notificações
  const showNotification = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: Date.now()
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Remover notificação após 5 segundos
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Debug useEffect para monitorar estados dos botões
  useEffect(() => {
    console.log('🔍 ESTADOS DOS BOTÕES:', {
      callAccepted,
      receivingCall,
      isCalling,
      partnerEndedCall,
      callEndReason,
      showOverlayLayout: (callAccepted || isCalling || receivingCall) && !partnerEndedCall,
      showNormalLayout: !isCalling && !receivingCall && !callAccepted && !partnerEndedCall,
      showAnswerButton: receivingCall && !callAccepted && !partnerEndedCall,
      showEndCallButton: (callAccepted || isCalling) && !partnerEndedCall,
      showPartnerEndedButton: partnerEndedCall
    });
  }, [callAccepted, receivingCall, isCalling, partnerEndedCall, callEndReason]);

  // Error boundary para capturar erros de renderização
  const [renderError, setRenderError] = useState<string | null>(null);

  // useEffect para filtrar a lista de usuários disponíveis
  useEffect(() => {
    const filteredUsers = allUsers.filter(user => user !== userId);
    console.log("🔍 Filtrando usuários:", {
      userId,
      allUsers,
      filteredUsers
    });
    setAvailableUsers(filteredUsers);
  }, [allUsers, userId]);

  useEffect(() => {
    // Sincroniza o state logs com o array global periodicamente
    const interval = setInterval(() => {
      setLogs([...globalLogs]);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Efeito para rolar para o final ao abrir o popup
  useEffect(() => {
    if (showLogsPopup && logsEndRef.current) {
      setTimeout(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 0);
    }
  }, [showLogsPopup]);

  // Efeito para rolar para o final ao adicionar novo log, se o usuário já estiver no final
  useEffect(() => {
    if (!showLogsPopup || !logsContainerRef.current || !logsEndRef.current) return;

    const container = logsContainerRef.current;
    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;

    // Considere "próximo do final" se menos de 50px do final
    if (distanceToBottom < 50) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, showLogsPopup]);

  // Antes do return principal do componente, defina o botão e o popup de logs para serem renderizados sempre
  const logsButtonAndPopup = <>
    <LogsButton onClick={() => setShowLogsPopup(true)}>
      Logs
    </LogsButton>
    {showLogsPopup && (
      <LogsOverlay>
        <LogsContainer>
          <h2>Logs capturados</h2>
          <LogsContent ref={logsContainerRef}>
            {logs.length === 0
              ? <div>Nenhum log capturado.</div>
              : logs.map((log, idx) => (
                  <LogEntry key={idx} logType={log.type}>
                    <LogIcon>
                      {log.type === 'error' ? '❌' : log.type === 'warn' ? '⚠️' : 'ℹ️'}
                    </LogIcon>
                    {log.message}
                  </LogEntry>
                ))
            }
            <div ref={logsEndRef} />
          </LogsContent>
          <LogsCloseButton onClick={() => setShowLogsPopup(false)}>
            Fechar
          </LogsCloseButton>
        </LogsContainer>
      </LogsOverlay>
    )}
  </>;

  try {
    // Se o ID ainda não foi configurado, mostrar tela de configuração
    if (!isIdSet) {
      return (
        <>
          <IdSetupContainer>
            <IdSetupCard>
              <IdSetupTitle>📱 Interfone Digital</IdSetupTitle>
              <IdSetupDescription>
                Escolha um ID único para suas videochamadas.<br/>
                Este será o ID que outros usuários usarão para te chamar.
              </IdSetupDescription>
              <IdInputGroup>
                <IdSetupInput
                  placeholder="Digite seu ID (ex: joao123, maria_silva)"
                  value={tempUserId}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempUserId(e.target.value)}
                  onKeyPress={handleIdInputKeyPress}
                  disabled={isSettingId}
                  ref={idInputRef}
                />
                <IdSetupButton 
                  onClick={setCustomUserId} 
                  disabled={!tempUserId.trim() || isSettingId}
                >
                  <span className="button-icon">✓</span>
                  <span className="button-text">
                    {isSettingId ? "Configurando..." : "Definir ID"}
                  </span>
                </IdSetupButton>
              </IdInputGroup>
              {idError && (
                <ErrorMessage>
                  ⚠️ {idError}
                </ErrorMessage>
              )}
              <StatusMessage>
                💡 Regras: mínimo 3 caracteres, apenas letras, números, _ e -
              </StatusMessage>
            </IdSetupCard>
          </IdSetupContainer>
          {logsButtonAndPopup}
        </>
      );
    }

    return (
      <Container>
        <MainTitle>📱 Interfone Digital</MainTitle>
        
        {renderError && (
          <ErrorMessage>
            🚨 Erro na aplicação: {renderError}
            <br />
            <ReloadButton onClick={() => window.location.reload()}>
              Recarregar Página
            </ReloadButton>
          </ErrorMessage>
        )}
        
        <IdDisplay>
          <IdText>Seu ID: {userId || "Configurando..."}</IdText>
        </IdDisplay>

        {isLoading && (
          <LoadingMessage>
            🔄 Carregando câmera e microfone...
          </LoadingMessage>
        )}

        {cameraError && (
          <ErrorMessage>
            ⚠️ {cameraError}
          </ErrorMessage>
        )}

        {cameraError && (
          <StatusMessage>
            💡 Você ainda pode usar a aplicação para copiar seu ID e tentar conectar (sem vídeo)
          </StatusMessage>
        )}

        {canStartCall && (
          <CallButtonContainer>
            <CallButton 
              onClick={openPartnersPopup} 
              disabled={false}
              title={
                cameraError 
                  ? "Chamada sem vídeo - apenas áudio/controle" 
                  : "Selecionar parceiro para videochamada"
              }
            >
              <span className="button-icon">📞</span>
              <span className="button-text">
                {cameraError ? "Conectar (sem vídeo)" : "📞 Iniciar Chamada"}
              </span>
            </CallButton>
          </CallButtonContainer>
        )}

        {/* Layout durante chamada ativa - vídeo overlay */}
        {isCallActive && !partnerEndedCall && (
          <CallActiveContainer>
            {/* Vídeo principal - sempre o vídeo do parceiro */}
            {remoteStream ? (
              <PartnerVideoFull playsInline ref={partnerVideoFull} autoPlay />
            ) : (
              <VideoPlaceholder>
                {isCalling ? '📞 Chamando...' : receivingCall ? '📞 Chamada recebida' : '📹 Aguardando vídeo do parceiro...'}
              </VideoPlaceholder>
            )}
            
            {/* ID do parceiro sobreposto */}
            {currentPartner && (
              <PartnerIdOverlay>
                👤 {currentPartner}
              </PartnerIdOverlay>
            )}
            
            {/* Vídeo local sobreposto */}
            {stream && (
              <>
                <LocalVideoOverlay 
                  playsInline 
                  muted 
                  ref={localVideoOverlay} 
                  autoPlay 
                />
                <MicrophoneOverlaySmall 
                  isActive={isSpeaking}
                >
                  🎙️
                </MicrophoneOverlaySmall>
              </>
            )}
            
            {/* Botão de atender chamada sobreposto */}
            {receivingCall && !callAccepted && !partnerEndedCall && (
              <OverlayButton onClick={answerCall}>
                📞 Atender Chamada
              </OverlayButton>
            )}
          </CallActiveContainer>
        )}

        {/* Layout normal - apenas quando não há atividade de chamada */}
        {isNormalState && (
          <VideoContainerSingle>
            {stream && (
              <VideoWrapper>
                <VideoInitialState playsInline muted ref={userVideo} autoPlay />
                <MicrophoneOverlay isActive={isSpeaking}>
                  🎙️
                </MicrophoneOverlay>
              </VideoWrapper>
            )}
            {!stream && !cameraError && (
              <WaitingVideoPlaceholder>
                📹 Aguardando câmera...
              </WaitingVideoPlaceholder>
            )}
            {cameraError && (
              <CameraErrorPlaceholder>
                📱 Câmera não disponível<br/>
                (HTTPS necessário no mobile)
              </CameraErrorPlaceholder>
            )}
          </VideoContainerSingle>
        )}

        <div>
          {(callAccepted || isCalling) && !partnerEndedCall && (
            <EndCallButton onClick={leaveCall}>
              Encerrar Chamada
            </EndCallButton>
          )}
          {receivingCall && !callAccepted && !partnerEndedCall && (
            <EndCallButton onClick={rejectCall}>
              Recusar Chamada
            </EndCallButton>
          )}
          {partnerEndedCall && (
            <CallEndedContainer>
              <CallEndedMessage>
                📞 {currentPartner} {
                  callEndReason === 'rejected' ? 'recusou a chamada' : 
                  callEndReason === 'busy' ? 'estava ocupado' : 
                  callEndReason === 'disconnected' ? 'se desconectou durante a chamada' :
                  'encerrou a chamada'
                }
              </CallEndedMessage>
              <Button onClick={leaveCall}>
                Finalizar e Voltar
              </Button>
            </CallEndedContainer>
          )}
        </div>

        {logsButtonAndPopup}

        {/* Popup de seleção de parceiros */}
        {showPartnersPopup && (
          <PopupOverlay onClick={closePartnersPopup}>
            <PopupContainer onClick={(e) => e.stopPropagation()}>
              <PopupTitle>👥 Parceiros Disponíveis</PopupTitle>
              
              {availableUsers.length > 0 ? (
                <PartnersList>
                  {availableUsers.map((user) => (
                    <PartnerItem
                      key={user}
                      onClick={() => selectPartner(user)}
                    >
                      <PartnerIcon>👤</PartnerIcon>
                      {user}
                    </PartnerItem>
                  ))}
                </PartnersList>
              ) : (
                <EmptyMessage>
                  Nenhum parceiro disponível no momento.<br/>
                  Aguarde outros usuários se conectarem.
                </EmptyMessage>
              )}
              
              <PopupCloseButton onClick={closePartnersPopup}>
                Cancelar
              </PopupCloseButton>
            </PopupContainer>
          </PopupOverlay>
        )}

        {/* Sistema de Notificações */}
        {notifications.length > 0 && (
          <NotificationsContainer>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                type={notification.type}
                onClick={() => removeNotification(notification.id)}
              >
                <NotificationContent>
                  <NotificationIcon>
                    {notification.type === 'success' ? '✅' : 
                     notification.type === 'info' ? 'ℹ️' : 
                     notification.type === 'warning' ? '⚠️' : '❌'}
                  </NotificationIcon>
                  {notification.message}
                </NotificationContent>
                <NotificationClose onClick={(e) => {
                  e.stopPropagation();
                  removeNotification(notification.id);
                }}>
                  ×
                </NotificationClose>
              </NotificationItem>
            ))}
          </NotificationsContainer>
        )}
      </Container>
    );
  } catch (error) {
    console.error('❌ ERRO CRÍTICO na renderização:', error);
    return (
      <ErrorContainer>
        <h2>🚨 Erro na Aplicação</h2>
        <p>Ocorreu um erro crítico. Verifique o console do navegador.</p>
        <ErrorReloadButton onClick={() => window.location.reload()}>
          Recarregar Página
        </ErrorReloadButton>
      </ErrorContainer>
    );
  }
};

export default VideoCall; 