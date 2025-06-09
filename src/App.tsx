import VideoCall from './components/VideoCall'
import styled from 'styled-components'

const AppContainer = styled.div`
  min-height: 100vh;
  min-width: 100vw;
  background-color: #f0f2f5;
  display: flex;
  justify-content: center;
  align-items: center;
`;

function App() {
  return (
    <AppContainer>
      <VideoCall />
    </AppContainer>
  )
}

export default App
