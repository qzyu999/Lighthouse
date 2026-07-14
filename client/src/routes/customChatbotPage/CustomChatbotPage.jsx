import React, { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useModel } from '../../context/ModelContext';
import './customChatbotPage.css';

const CustomChatbotPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const formRef = useRef(null);
  const [model, setModel] = useState('gpt-4.1-mini');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { setCurrentModel } = useModel();

  const mutation = useMutation({
    mutationFn: async (data) => {
      setIsLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/custom-chats`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Error creating chatbot');
      }
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['userChats'] });
      setCurrentModel(model);
      navigate(`/dashboard/chats/${data.id}`);
    },
    onError: (err) => {
      setError('Failed to create chatbot: ' + err.message);
    },
    onSettled: () => {
      setIsLoading(false);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const prompt = formData.get('prompt');
    if (!prompt) {
      setError('Prompt is required');
      return;
    }

    mutation.mutate({ prompt, model });
  };

  return (
    <div className="customChatbotPage">
      <h1>Create Custom Chatbot</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit} ref={formRef}>
        <div>
          <label>Model:</label>
          <select name="model" value={model} onChange={(e) => setModel(e.target.value)}>
            <option value="gpt-4.1-mini">gpt-4.1-mini</option>
            <option value="gpt-4o-mini">gpt-4o-mini</option>
            <option value="gemini-flash-1.5">Gemini Flash 1.5</option>
          </select>
        </div>
        <div>
          <label>Custom System Prompt:</label>
          <textarea
            name="prompt"
            placeholder="Enter your custom system prompt"
            required
          />
        </div>
        <button type="submit" disabled={isLoading}>{isLoading ? 'Creating...' : 'Create Chatbot'}</button>
      </form>
    </div>
  );
};

export default CustomChatbotPage;