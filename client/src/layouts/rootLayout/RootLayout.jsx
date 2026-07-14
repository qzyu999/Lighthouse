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
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="currentColor" style={{color: '#7c3aed'}}>
              <path d="M16 4L16 6" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M14 6h4l1.2 4.5h-6.4L14 6z" strokeWidth="1.2" fill="none"/>
              <rect x="13" y="10.5" width="6" height="2" rx="0.5" strokeWidth="1.2" fill="none"/>
              <path d="M13.5 12.5l-1.5 12h8l-1.5-12" strokeWidth="1.2" fill="none"/>
              <path d="M11 24.5h10" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M9 7.5l2.5 1" strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
              <path d="M23 7.5l-2.5 1" strokeWidth="1" strokeLinecap="round" opacity="0.7"/>
              <path d="M6 14l1 2.5L6 19l-1-2.5z" fill="#7c3aed" stroke="none" opacity="0.8"/>
              <path d="M6 14l2.5 1L6 19l-2.5-1z" fill="#7c3aed" stroke="none" opacity="0.4"/>
              <path d="M26 12l0.7 1.8L26 15.5l-0.7-1.8z" fill="#7c3aed" stroke="none" opacity="0.8"/>
              <path d="M26 12l1.8 0.7L26 15.5l-1.8-0.7z" fill="#7c3aed" stroke="none" opacity="0.4"/>
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
