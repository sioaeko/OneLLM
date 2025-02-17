import React, { useState } from 'react';
import './Settings.css';
import { 
  RobotIcon,
  DarkModeIcon,
  BackIcon,
  TextSizeIcon
} from './icons/OneUIIcons';
import { models } from '../data/models';
import { useTheme } from '../contexts/ThemeContext';

function Settings({ isOpen, onClose, selectedModel, onModelChange }) {
  const { isDarkMode, setIsDarkMode } = useTheme();
  const [fontSize, setFontSize] = useState('medium');

  const handleFontSizeChange = (size) => {
    setFontSize(size);
    document.documentElement.setAttribute('data-font-size', size);
  };

  if (!isOpen) return null;

  return (
    <div className="settings-overlay">
      <div className="settings-container">
        <div className="settings-header">
          <button className="close-button" onClick={onClose}>
            <BackIcon />
          </button>
          <h2>설정</h2>
        </div>
        
        <div className="settings-content">
          <div className="settings-section">
            <h3>AI 설정</h3>
            <div className="settings-item model-header">
              <div className="settings-item-left">
                <RobotIcon />
                <span>모델 선택</span>
              </div>
            </div>
            <div className="model-list">
              {models.map(model => (
                <label key={model.id} className="model-item">
                  <div className="model-item-content">
                    <div className="model-info">
                      <span className="model-name">{model.name}</span>
                      <span className="model-description">{model.description}</span>
                    </div>
                    <div className="radio-container">
                      <input
                        type="radio"
                        name="model"
                        value={model.id}
                        checked={selectedModel === model.id}
                        onChange={(e) => onModelChange(e.target.value)}
                      />
                      <span className="radio-circle"></span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="settings-section">
            <h3>화면</h3>
            <div className="settings-item">
              <div className="settings-item-left">
                <DarkModeIcon />
                <span>다크 모드</span>
              </div>
              <label className="switch">
                <input 
                  type="checkbox"
                  checked={isDarkMode}
                  onChange={(e) => setIsDarkMode(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
            <div className="settings-item">
              <div className="settings-item-left">
                <TextSizeIcon />
                <span>글자 크기</span>
              </div>
              <select 
                className="size-select" 
                value={fontSize} 
                onChange={(e) => handleFontSizeChange(e.target.value)}
              >
                <option value="small">작게</option>
                <option value="medium">보통</option>
                <option value="large">크게</option>
              </select>
            </div>
          </div>

          <div className="settings-section">
            <h3>정보</h3>
            <div className="settings-item">
              <span>버전</span>
              <span className="settings-value">1.0.0</span>
            </div>
            <div className="settings-item">
              <span>개발자</span>
              <a 
                href="https://github.com/sioaeko" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="settings-value settings-link"
              >
                Sioaeko
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings; 