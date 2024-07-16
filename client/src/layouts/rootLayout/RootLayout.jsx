import { Link, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { SignedIn, UserButton, ClerkProvider } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ModelMenu from '../../components/modelMenu/ModelMenu';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot } from '@fortawesome/free-solid-svg-icons';
import { useModel } from '../../context/ModelContext';
import './rootLayout.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

const queryClient = new QueryClient();

const RootLayout = () => {
  const location = useLocation();
  const { currentModel, setCurrentModel, resetModel } = useModel();
  const isDashboardRoute = location.pathname.startsWith("/dashboard");
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
            const text = await response.text(); // Read response as text
            console.error(`Unexpected response format: ${text}`); // Log the unexpected text
          }
        } catch (error) {
          console.error('Error fetching chat details:', error);
        }
      } else {
        // Reset isCustomChatbot and model when there is no chatId (i.e., when navigating back to the dashboard)
        setIsCustomChatbot(null);
        setCurrentModel(import.meta.env.VITE_DEFAULT_LLM_MODEL);
      }
    };

    fetchChatDetails();
  }, [chatId]);

  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <QueryClientProvider client={queryClient}>
        <div className="rootLayout">
          <header>
            <Link to="/" className="logo">
              <img src="/bot.png" alt="" />
              <span>Gen AI Chatbot</span>
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
            <div className="user">
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </header>
          <main>
            <Outlet />
          </main>
        </div>
      </QueryClientProvider>
    </ClerkProvider>
  );
};

export default RootLayout;