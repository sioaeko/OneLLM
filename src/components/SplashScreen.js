import React, { useEffect, useState } from 'react';
import './SplashScreen.css';

function SplashScreen({ onComplete }) {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
      setTimeout(onComplete, 500); // 페이드아웃 후 완료
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`splash-screen ${!isAnimating ? 'fade-out' : ''}`}>
      <div className="splash-content">
        <div className="logo-container">
          <div className="logo-piece piece1"></div>
          <div className="logo-piece piece2"></div>
          <div className="logo-piece piece3"></div>
          <div className="logo-piece piece4"></div>
        </div>
        <h1 className="splash-title">OneLLM</h1>
        <p className="splash-subtitle">Redesign your AI</p>
      </div>
    </div>
  );
}

export default SplashScreen; 