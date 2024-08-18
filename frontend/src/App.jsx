
import './App.css'
import PlayerScreen from './player.jsx'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import FrontScreen from './frontscreen.jsx';
import { GlobalProvider } from './GlobalContext';



function App() {

  return (
    
    <>
    <GlobalProvider>
      <Router>
        <Routes>
          <Route path="/playerscreen" element={<PlayerScreen />} />
          <Route path="/" element={<FrontScreen />} />
        </Routes>
      </Router>
    </GlobalProvider>
    </>
  )
}

export default App
