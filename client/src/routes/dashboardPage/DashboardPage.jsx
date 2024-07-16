import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import FooterWithDisclaimer from '../../components/footerWithDisclaimer/FooterWithDisclaimer';
import { useModel } from '../../context/ModelContext';
import './dashboardPage.css';

const DashboardPage = () => {
  const [img, setImg] = useState({
    isLoading: false,
    error: "",
    dbData: {},
    aiData: {},
  });

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const formRef = useRef(null);
  const { currentModel } = useModel();

  const mutation = useMutation({
    mutationFn: (text) => {
      return fetch(`${import.meta.env.VITE_API_URL}/api/chats`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text, model: currentModel }),
      }).then(async (res) => {
        if (!res.ok) {
          const errorResponse = await res.json();
          throw new Error(errorResponse.error || 'Error creating chat');
        }
        return res.json();
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['userChats'] });
      navigate(`/dashboard/chats/${data.id}`);
    },
    onError: (error) => {
      console.error('Mutation error:', error.message);
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const text = formData.get('text');
    if (!text) return;
    mutation.mutate(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  };

  return (
    <div className='dashboardPage'>
      <div className="texts">
        <div className="logo">
          <img src='/bot.png' alt='' />
          <h1>Gen AI Chatbot</h1>
        </div>
        <div className='options'>
          <div className="option">
            <img src="/chat.png" alt="" />
            <span>Create a New Chat</span>
          </div>
          <div className="option">
            <img src="/image.png" alt="" />
            <span>Analyze Images</span>
          </div>
          <div className="option">
            <img src="/code.png" alt="" />
            <span>Help me with my Code</span>
          </div>
        </div>
      </div>
      <div className="formContainer">
        <form onSubmit={handleSubmit} ref={formRef}>
          <textarea
            name='text'
            placeholder='Please enter your prompt'
            onKeyDown={handleKeyDown}
          />
          <button type="submit">
            <img src="/arrow.png" alt="" />
          </button>
        </form>
        <FooterWithDisclaimer />
      </div>
    </div>
  );
};

export default DashboardPage;