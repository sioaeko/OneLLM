import React, { useState } from 'react';
import './ChatHistory.css';
import { BackIcon, DeleteIcon, MoreIcon, RobotIcon } from './icons/OneUIIcons';

function ChatHistory({ isOpen, onClose, conversations, onSelectChat, onDeleteChat, onDeleteAllChats }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="history-overlay">
      <div className="history-container">
        <div className="history-header">
          <button className="close-button" onClick={onClose}>
            <BackIcon />
          </button>
          <h2>대화 기록</h2>
          <button 
            className="header-button"
            onClick={() => setShowOptions(true)}
          >
            <MoreIcon />
          </button>
        </div>
        
        <div className="history-content">
          {conversations.length > 0 ? (
            conversations.map((conversation, index) => (
              <div key={index} className="history-item">
                <div 
                  className="history-item-left"
                  onClick={() => onSelectChat(conversation.messages)}
                >
                  <div className="history-avatar">
                    <RobotIcon />
                  </div>
                  <div className="history-text">
                    <p className="history-preview">{conversation.lastMessage}</p>
                    <span className="history-date">{conversation.date}</span>
                  </div>
                </div>
                <button 
                  className="delete-button"
                  onClick={() => onDeleteChat(index)}
                >
                  <DeleteIcon />
                </button>
              </div>
            ))
          ) : (
            <div className="empty-history">
              <p>대화 기록이 없습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* 옵션 메뉴 */}
      {showOptions && (
        <div className="options-overlay" onClick={() => setShowOptions(false)}>
          <div className="options-menu" onClick={e => e.stopPropagation()}>
            <button 
              className="option-item"
              onClick={() => {
                setShowOptions(false);
                setShowDeleteConfirm(true);
              }}
            >
              <DeleteIcon />
              <span>모든 기록 삭제</span>
            </button>
          </div>
        </div>
      )}

      {/* 삭제 확인 대화상자 */}
      {showDeleteConfirm && (
        <div className="confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="confirm-dialog" onClick={e => e.stopPropagation()}>
            <h3>모든 대화 기록을 삭제하시겠습니까?</h3>
            <p>삭제된 대화 기록은 복구할 수 없습니다.</p>
            <div className="confirm-actions">
              <button 
                className="cancel-button"
                onClick={() => setShowDeleteConfirm(false)}
              >
                취소
              </button>
              <button 
                className="delete-button"
                onClick={() => {
                  onDeleteAllChats();
                  setShowDeleteConfirm(false);
                }}
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatHistory; 