import React, { useState } from 'react';
import './App.css';
import ChatInterface from './components/ChatInterface';
import SplashScreen from './components/SplashScreen';
import { ThemeProvider } from './contexts/ThemeContext';

// API 키는 유지하되 콘솔 로그 제거
const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <ThemeProvider>
      <div className="App">
        {showSplash ? (
          <SplashScreen onComplete={() => setShowSplash(false)} />
        ) : (
          <ChatInterface apiKey={GROQ_API_KEY} />
        )}
      </div>
    </ThemeProvider>
  );
}

export default App; 