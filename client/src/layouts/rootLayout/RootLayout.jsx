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
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{color: '#7c3aed'}}>
              <path d="M12 2L12 4"/>
              <path d="M10 4h4l1 4h-6l1-4z"/>
              <path d="M9 8h6v2H9z"/>
              <path d="M9.5 10l-1.5 10h8l-1.5-10"/>
              <path d="M7 20h10"/>
              <path d="M12 10v10"/>
              <path d="M5 6l2 1"/>
              <path d="M19 6l-2 1"/>
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
