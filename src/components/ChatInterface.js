import React, { useState, useRef, useEffect } from 'react';
import './ChatInterface.css';
import Settings from './Settings';
import { SendIcon, SearchIcon, MenuIcon, RobotIcon, HistoryIcon, NewChatIcon, ImageIcon } from './icons/OneUIIcons';
import ChatHistory from './ChatHistory';
import { models } from '../data/models';
import SearchDialog from './SearchDialog';

function ChatInterface({ apiKey }) {
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem('currentMessages');
    return savedMessages ? JSON.parse(savedMessages) : [{
      text: '안녕하세요! 무엇을 도와드릴까요?',
      isUser: false,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })
    }];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const messageRefs = useRef({});
  const [conversation, setConversation] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState(() => {
    const savedHistory = localStorage.getItem('chatHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });
  const [selectedModel, setSelectedModel] = useState('mixtral-8x7b-32768');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // scrollToBottom 함수 선언
  const scrollToBottom = () => {
    const timeoutId = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timeoutId);
  };

  // 시스템 메시지 선언
  const systemMessage = {
    role: 'system',
    content: `당신은 도움이 되는 AI 어시스턴트입니다. 
    - 항상 정중하고 친절하게 응답해주세요
    - 한국어로 자연스럽게 대화해주세요
    - 답변은 간단명료하게 해주세요
    - 불확실한 내용은 솔직히 모른다고 말해주세요`
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('currentMessages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);

  useEffect(() => {
    const savedMessages = localStorage.getItem('currentMessages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }

    return () => {
      // cleanup
      messageRefs.current = {};
    };
  }, []);

  const handleModelChange = (modelId) => {
    setSelectedModel(modelId);
    const initialMessage = {
      text: '안녕하세요! 무엇을 도와드릴까요?',
      isUser: false,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })
    };
    setMessages([initialMessage]);
    setConversation([]);
    localStorage.setItem('currentMessages', JSON.stringify([initialMessage]));
  };

  const callGroqAPI = async (messages) => {
    const model = models.find(m => m.id === selectedModel);
    
    // Vision 모델인 경우 다른 엔드포인트 사용
    const API_URL = model.id === 'llama-3.2-90b-vision-preview' 
      ? 'https://api.groq.com/openai/v1/vision/chat/completions'
      : 'https://api.groq.com/openai/v1/chat/completions';

    try {
      // 메시지 형식 수정
      let messagesToSend = [
        systemMessage,
        ...conversation,
        {
          role: 'user',
          content: messages[0].text  // userMessage의 text를 content로 사용
        }
      ];

      // 이미지가 있고 비전 모델인 경우 이미지 데이터 추가
      if (selectedImage && model.id === 'llama-3.2-90b-vision-preview') {
        const base64Image = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Data = reader.result.split(',')[1];
            resolve(base64Data);
          };
          reader.readAsDataURL(selectedImage);
        });

        messagesToSend = [
          ...messagesToSend.slice(0, -1),
          {
            role: 'user',
            content: [
              {
                type: 'image',
                image_url: {
                  url: `data:${selectedImage.type};base64,${base64Image}`
                }
              },
              {
                type: 'text',
                text: messages[messages.length - 1].text
              }
            ]
          }
        ];
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: messagesToSend,
          temperature: 0.7,
          max_tokens: model?.maxTokens || 4096,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);
        
        // 요청 제한 오류
        if (response.status === 429) {
          return '죄송합니다. 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
        }
        
        // 이미지 처리 오류 (이미지가 있을 때만)
        if (response.status === 400 && selectedImage) {
          return '죄송합니다. 이미지 처리 중 오류가 발생했습니다. 다른 이미지를 시도해주세요.';
        }

        // 일반적인 API 오류
        if (errorData.error?.message) {
          return `오류가 발생했습니다: ${errorData.error.message}`;
        }

        // 기타 오류
        return '죄송합니다. 요청 처리 중 오류가 발생했습니다.';
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling Groq API:', error);
      if (error.message.includes('Failed to fetch')) {
        return '죄송합니다. 네트워크 연결을 확인해주세요.';
      }
      return '죄송합니다. 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    }
  };

  // 초기 웰컴 메시지
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          text: '안녕하세요! 무엇을 도와드릴까요?',
          isUser: false,
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })
        }
      ]);
    }
  }, [messages.length]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (input.trim() === '' || isLoading) return;

    const userMessage = {
      text: input,
      isUser: true,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })
    };

    try {
      setMessages(prev => [...prev, userMessage]);
      setConversation(prev => [...prev, { role: 'user', content: input }]);
      setInput('');
      setIsLoading(true);

      const aiResponse = await callGroqAPI([userMessage]);
      
      const aiMessage = {
        text: aiResponse,
        isUser: false,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMessage]);
      setConversation(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
      console.error('Error in handleSend:', error);
      // 에러 메시지 표시
      const errorMessage = {
        text: '메시지 전송 중 오류가 발생했습니다.',
        isUser: false,
        isError: true,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
    setSelectedImage(null);
    setImagePreview(null);
  };

  // 대화 저장 함수 수정
  const saveConversation = (messages) => {
    if (messages.length > 1) {
      const lastUserMessage = messages.filter(m => m.isUser).pop()?.text || messages[messages.length - 1].text;
      const newConversation = {
        id: Date.now(),  // 고유 ID 추가
        lastMessage: lastUserMessage,
        date: new Date().toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        messages: [...messages]
      };

      // 중복 체크 개선
      setChatHistory(prev => {
        const isDuplicate = prev.some(conv => 
          conv.messages.length === messages.length &&
          conv.messages.every((msg, idx) => 
            msg.text === messages[idx].text && 
            msg.isUser === messages[idx].isUser
          )
        );
        return isDuplicate ? prev : [newConversation, ...prev];
      });
    }
  };

  // 대화 완료 시 저장 로직 수정
  useEffect(() => {
    if (!isLoading && messages.length > 1) {
      const timeoutId = setTimeout(() => {
        saveConversation(messages);
      }, 1000);  // 1초 딜레이로 연속 저장 방지
      return () => clearTimeout(timeoutId);
    }
  }, [messages, isLoading]);

  // 새 채팅 시작 함수 수정
  const handleNewChat = () => {
    if (messages.length > 1) {
      saveConversation(messages);
    }
    
    const initialMessage = {
      text: '안녕하세요! 무엇을 도와드릴까요?',
      isUser: false,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' })
    };
    
    setMessages([initialMessage]);
    setConversation([]);
    setInput('');
    localStorage.setItem('currentMessages', JSON.stringify([initialMessage]));
  };

  // 대화 선택 핸들러 수정
  const handleSelectChat = (selectedMessages) => {
    setMessages(selectedMessages);
    setConversation(selectedMessages.map(msg => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.text
    })));
    setIsHistoryOpen(false);
    
    // requestAnimationFrame을 사용하여 더 부드러운 스크롤
    requestAnimationFrame(() => {
      const container = document.querySelector('.messages-container');
      if (container) {
        container.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    });
  };

  // 개별 대화 삭제
  const handleDeleteChat = (index) => {
    const newHistory = [...chatHistory];
    newHistory.splice(index, 1);
    setChatHistory(newHistory);
    localStorage.setItem('chatHistory', JSON.stringify(newHistory));
  };

  // 모든 대화 삭제
  const handleDeleteAllChats = () => {
    setChatHistory([]);
    localStorage.setItem('chatHistory', JSON.stringify([]));
  };

  // 메모이제이션 추가
  const MemoizedMessage = React.memo(({ message, index, messageRef }) => (
    <div 
      ref={messageRef}
      className={`message ${message.isUser ? 'user-message' : 'ai-message'}`}
    >
      {!message.isUser && (
        <div className="avatar">
          <RobotIcon />
        </div>
      )}
      <div className="message-content">
        <p>{message.text}</p>
        <span className="timestamp">{message.timestamp}</span>
      </div>
    </div>
  ));

  // 특정 메시지로 스크롤하는 함수
  const scrollToMessage = (messageIndex) => {
    if (messageRefs.current[messageIndex]) {
      messageRefs.current[messageIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  // 특정 메시지로 이동하는 핸들러 추가
  const handleSelectMessage = (messageIndex) => {
    setIsSearchOpen(false);
    setTimeout(() => {
      scrollToMessage(messageIndex);
    }, 100);
  };

  // 이미지 업로드 핸들러 추가
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB 제한
        alert('파일 크기는 5MB를 초과할 수 없습니다.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(file);
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // API 키 체크는 렌더링 부분에서 처리
  if (!apiKey) {
    return <div className="error-message">Error: API key is not configured</div>;
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="header-content">
          <div className="header-bottom">
            <h1 className="header-title">
              One<span>LLM</span>
            </h1>
            <div className="header-actions">
              <button 
                className="header-button"
                onClick={handleNewChat}
                title="새 채팅"
              >
                <NewChatIcon />
              </button>
              <button 
                className="header-button"
                onClick={() => setIsSearchOpen(true)}
              >
                <SearchIcon />
              </button>
              <button 
                className="header-button"
                onClick={() => setIsHistoryOpen(true)}
              >
                <HistoryIcon />
              </button>
              <button 
                className="header-button"
                onClick={() => setIsSettingsOpen(true)}
              >
                <MenuIcon />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="messages-container">
        {messages.map((message, index) => (
          <MemoizedMessage
            key={index}
            message={message}
            index={index}
            messageRef={el => messageRefs.current[index] = el}
          />
        ))}
        {isLoading && (
          <div className="message ai-message">
            <div className="avatar">
              <RobotIcon />
            </div>
            <div className="message-content loading">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form 
        className="input-container" 
        onSubmit={handleSend} 
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
      >
        <div className="input-wrapper">
          {selectedModel === 'llama-3.2-90b-vision-preview' && (
            <>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                ref={fileInputRef}
                style={{ display: 'none' }}
                autoComplete="off"
              />
              <button
                type="button"
                className="image-upload-button"
                onClick={() => fileInputRef.current?.click()}
                title="이미지 업로드"
              >
                <ImageIcon />
              </button>
            </>
          )}
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" />
              <button
                type="button"
                className="remove-image"
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
              >
                ×
              </button>
            </div>
          )}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="메시지를 입력하세요..."
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            data-form-type="other"
          />
          <button 
            type="submit" 
            className="send-button" 
            disabled={!input.trim() || isLoading}
          >
            <SendIcon />
          </button>
        </div>
      </form>

      <Settings 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        selectedModel={selectedModel}
        onModelChange={handleModelChange}
      />

      <ChatHistory 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        conversations={chatHistory}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onDeleteAllChats={handleDeleteAllChats}
      />

      <SearchDialog 
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        messages={messages}
        onSelectMessage={handleSelectMessage}
      />
    </div>
  );
}

export default ChatInterface; 