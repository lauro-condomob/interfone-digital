import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

interface IndicatorProps {
  $isActive: boolean;
}

const Indicator = styled.div<IndicatorProps>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: ${props => props.$isActive ? '#28a745' : '#6c757d'};
  transition: background-color 0.2s ease;
  box-shadow: ${props => props.$isActive ? '0 0 10px rgba(40, 167, 69, 0.5)' : 'none'};
`;

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Label = styled.span`
  font-size: 14px;
  color: #333;
`;

interface AudioIndicatorProps {
  stream: MediaStream | null;
  label?: string;
}

const AudioIndicator: React.FC<AudioIndicatorProps> = ({ stream, label = "Microfone" }) => {
  const [isActive, setIsActive] = useState(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!stream) {
      setIsActive(false);
      return;
    }

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    microphone.connect(analyser);
    
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const checkAudioLevel = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calcular a média dos valores de frequência
      const average = dataArray.reduce((acc, value) => acc + value, 0) / dataArray.length;
      
      // Threshold para detectar fala (ajustável)
      const threshold = 25;
      setIsActive(average > threshold);
      
      animationRef.current = requestAnimationFrame(checkAudioLevel);
    };

    checkAudioLevel();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, [stream]);

  return (
    <Container>
      <Indicator $isActive={isActive} />
      <Label>{label}</Label>
    </Container>
  );
};

export default AudioIndicator; 