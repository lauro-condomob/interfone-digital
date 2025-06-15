import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

// Styled Components
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
  background-color: #007bff;

  &:hover:not(:disabled) {
    background-color: #0056b3;
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

const ErrorMessage = styled.div`
  border-radius: 12px;
  padding: 20px;
  margin: 15px 0;
  text-align: center;
  max-width: 500px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  background-color: #ffe6e6;
  border: 1px solid #ff9999;
  color: #cc0000;
  
  @media (max-width: 768px) {
    margin: 20px 0;
    padding: 25px 15px;
    max-width: 100%;
  }
`;

const StatusMessage = styled.div`
  border-radius: 12px;
  padding: 20px;
  margin: 15px 0;
  text-align: center;
  max-width: 500px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  color: #666;
  font-size: 14px;
  
  @media (max-width: 768px) {
    margin: 20px 0;
    padding: 25px 15px;
    max-width: 100%;
  }
`;

// Interface
interface IdSetupProps {
  onIdSet: (id: string) => void;
}

const IdSetup: React.FC<IdSetupProps> = ({ onIdSet }) => {
  const [tempUserId, setTempUserId] = useState("");
  const [idError, setIdError] = useState<string | null>(null);
  const [isSettingId, setIsSettingId] = useState(false);
  const idInputRef = useRef<HTMLInputElement>(null);

  // Focar automaticamente no campo de ID quando a tela for carregada
  useEffect(() => {
    const timer = setTimeout(() => {
      idInputRef.current?.focus();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

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
    
    // Simular processo de configuração (na implementação real, enviaria para o socket)
    setTimeout(() => {
      onIdSet(tempUserId);
      setIsSettingId(false);
    }, 1000);
  };

  const handleIdInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setCustomUserId();
    }
  };

  return (
    <IdSetupContainer>
      <IdSetupCard>
        <IdSetupTitle>📱 Interfone Digital</IdSetupTitle>
        <IdSetupDescription>
          Escolha um ID único para suas videochamadas.<br/>
          Este será o ID que outros usuários usarão para te chamar.
        </IdSetupDescription>
        <IdInputGroup>
          <BaseInput
            placeholder="Digite seu ID (ex: joao123, maria_silva)"
            value={tempUserId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTempUserId(e.target.value)}
            onKeyPress={handleIdInputKeyPress}
            disabled={isSettingId}
            ref={idInputRef}
          />
          <BaseButton 
            onClick={setCustomUserId} 
            disabled={!tempUserId.trim() || isSettingId}
          >
            <span className="button-icon">✓</span>
            <span className="button-text">
              {isSettingId ? "Configurando..." : "Definir ID"}
            </span>
          </BaseButton>
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
  );
};

export default IdSetup; 