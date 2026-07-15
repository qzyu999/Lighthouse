import { Link, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ModelMenu from '../../components/modelMenu/ModelMenu';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot } from '@fortawesome/free-solid-svg-icons';
import { useModel } from '../../context/ModelContext';
import './rootLayout.css';

const queryClient = new QueryClient();

const RootLayout = () => {
  const location = useLocation();
  const { currentModel, setCurrentModel, resetModel } = useModel();
  const isDashboardRoute = location.pathname.startsWith("/dashboard") && !location.pathname.includes("/wiki");
  const [isCustomChatbot, setIsCustomChatbot] = useState(null);

  useEffect(() => {
    if (location.pathname === '/dashboard') {
      setIsCustomChatbot(null);
    }
  }, [location.pathname]);

  const getChatIdFromPath = () => {
    const pathParts = location.pathname.split('/');
    return pathParts.length > 2 ? pathParts[pathParts.length - 1] : null;
  };

  const chatId = getChatIdFromPath();

  useEffect(() => {
    const fetchChatDetails = async () => {
      if (chatId) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chats/${chatId}`, {
            credentials: 'include',
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const chatData = await response.json();
            setIsCustomChatbot(chatData.isCustomChatbot ?? null);
            setCurrentModel(chatData.model ?? import.meta.env.VITE_DEFAULT_LLM_MODEL);
          } else {
            const text = await response.text();
            console.error(`Unexpected response format: ${text}`);
          }
        } catch (error) {
          console.error('Error fetching chat details:', error);
        }
      } else {
        setIsCustomChatbot(null);
        setCurrentModel(import.meta.env.VITE_DEFAULT_LLM_MODEL);
      }
    };

    fetchChatDetails();
  }, [chatId]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="rootLayout">
        <header>
          <Link to="/" className="logo">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" style={{flexShrink: 0}}>
              <circle cx="16" cy="10.1" r="1.0" fill="#7C3AED" opacity="0.10"/>
              <path d="M19.6 5.1 C19.98 6.34 20.36 6.72 21.6 7.1 C20.36 7.48 19.98 7.86 19.6 9.1 C19.22 7.86 18.84 7.48 17.6 7.1 C18.84 6.72 19.22 6.34 19.6 5.1Z" stroke="#7C3AED" strokeWidth="0.55" strokeLinejoin="round" strokeLinecap="round" opacity="0.97" fill="none"/>
              <path d="M11.0 7.0 C11.26 7.82 11.54 8.1 12.36 8.36 C11.54 8.62 11.26 8.9 11.0 9.72 C10.74 8.9 10.46 8.62 9.64 8.36 C10.46 8.1 10.74 7.82 11.0 7.0Z" stroke="#7C3AED" strokeWidth="0.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.76" fill="none"/>
              <path d="M21.8 9.0 C22.0 9.64 22.22 9.86 22.86 10.06 C22.22 10.26 22.0 10.48 21.8 11.12 C21.6 10.48 21.38 10.26 20.74 10.06 C21.38 9.86 21.6 9.64 21.8 9.0Z" stroke="#7C3AED" strokeWidth="0.46" strokeLinejoin="round" strokeLinecap="round" opacity="0.54" fill="none"/>
              <path d="M16 4.7V5.4" stroke="#7C3AED" strokeWidth="1.1" strokeLinecap="round" opacity="0.9"/>
              <path d="M14.4 6.1H17.6L18.25 7.9H13.75L14.4 6.1Z" stroke="#7C3AED" strokeWidth="1.0" strokeLinejoin="round" opacity="0.88"/>
              <rect x="13.9" y="7.9" width="4.2" height="1.9" rx="0.45" stroke="#7C3AED" strokeWidth="1.0" opacity="0.88"/>
              <path d="M14.15 10.2L12.9 24.0H19.1L17.85 10.2" stroke="#7C3AED" strokeWidth="1.0" strokeLinejoin="round" opacity="0.82"/>
              <path d="M12.5 24.4H19.5" stroke="#7C3AED" strokeWidth="1.2" strokeLinecap="round" opacity="0.85"/>
              <path d="M8 26.2C9.2 25.45 10.4 25.45 11.6 26.2C12.8 26.95 14 26.95 15.2 26.2C16.4 25.45 17.6 25.45 18.8 26.2C20 26.95 21.2 26.95 22.4 26.2C23.6 25.45 24.8 25.45 26 26.2" stroke="#7C3AED" strokeWidth="1.1" strokeLinecap="round" opacity="0.40"/>
            </svg>
            <span>{import.meta.env.VITE_APP_NAME || 'Lighthouse'}</span>
          </Link>
          <div className="model-controller">
            {isDashboardRoute && !isCustomChatbot && <ModelMenu />}
            {isDashboardRoute && isCustomChatbot && (
              <div className="current-model">
                <button>
                  <FontAwesomeIcon icon={faRobot} />
                  <span>Current Model: {currentModel}</span>
                </button>
              </div>
            )}
          </div>
          <div className="user"></div>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </QueryClientProvider>
  );
};

export default RootLayout;
