import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Homepage from './routes/homepage/Homepage';
import DashboardPage from './routes/dashboardPage/DashboardPage';
import ChatPage from './routes/chatPage/ChatPage';
import RootLayout from './layouts/rootLayout/RootLayout';
import DashboardLayout from './layouts/dashboardLayout/DashboardLayout';
import { ModelProvider } from './context/ModelContext';
import CustomChatbotPage from './routes/customChatbotPage/CustomChatbotPage';
import WikiPage from './routes/wikiPage/WikiPage';

// Set browser tab title from env
document.title = import.meta.env.VITE_APP_NAME || 'Lighthouse';

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <Homepage />,
      },
      {
        path: "/create-custom-chatbot",
        element: <CustomChatbotPage />,
      },
      {
        element: <DashboardLayout />,
        children: [
          {
            path: "/dashboard",
            element: <DashboardPage />,
          },
          {
            path: "/dashboard/chats/:id",
            element: <ChatPage />,
          },
          {
            path: "/dashboard/wiki",
            element: <WikiPage />,
          }
        ]
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <ModelProvider>
    <RouterProvider router={router} />
  </ModelProvider>,
);
