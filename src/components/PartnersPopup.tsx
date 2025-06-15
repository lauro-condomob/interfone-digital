import React from 'react';
import styled from 'styled-components';

// Styled Components
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

// Interface
interface PartnersPopupProps {
  isOpen: boolean;
  availableUsers: string[];
  onSelectPartner: (partnerId: string) => void;
  onClose: () => void;
}

const PartnersPopup: React.FC<PartnersPopupProps> = ({ 
  isOpen, 
  availableUsers, 
  onSelectPartner, 
  onClose 
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <PopupOverlay onClick={onClose}>
      <PopupContainer onClick={(e) => e.stopPropagation()}>
        <PopupTitle>👥 Parceiros Disponíveis</PopupTitle>
        
        {availableUsers.length > 0 ? (
          <PartnersList>
            {availableUsers.map((user) => (
              <PartnerItem
                key={user}
                onClick={() => onSelectPartner(user)}
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
        
        <PopupCloseButton onClick={onClose}>
          Cancelar
        </PopupCloseButton>
      </PopupContainer>
    </PopupOverlay>
  );
};

export default PartnersPopup; 