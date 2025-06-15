import React from 'react';
import styled from 'styled-components';

// Styled Components
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

// Interfaces
interface Notification {
  id: number;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: number;
}

interface NotificationSystemProps {
  notifications: Notification[];
  onRemoveNotification: (id: number) => void;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ 
  notifications, 
  onRemoveNotification 
}) => {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <NotificationsContainer>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          type={notification.type}
          onClick={() => onRemoveNotification(notification.id)}
        >
          <NotificationContent>
            <NotificationIcon>
              {getNotificationIcon(notification.type)}
            </NotificationIcon>
            {notification.message}
          </NotificationContent>
          <NotificationClose 
            onClick={(e) => {
              e.stopPropagation();
              onRemoveNotification(notification.id);
            }}
          >
            ×
          </NotificationClose>
        </NotificationItem>
      ))}
    </NotificationsContainer>
  );
};

export default NotificationSystem; 