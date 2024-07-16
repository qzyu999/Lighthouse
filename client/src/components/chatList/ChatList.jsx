import { Link } from 'react-router-dom';
import './chatList.css';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FaEllipsisV } from 'react-icons/fa';
import { useState } from 'react';

const ChatList = () => {
  const queryClient = useQueryClient();
  const { isPending, error, data } = useQuery({
    queryKey: ['userChats'],
    queryFn: () =>
      fetch(`${import.meta.env.VITE_API_URL}/api/userchats`, {
        credentials: 'include',
      }).then((res) =>
        res.json(),
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (chatId) =>
      fetch(`${import.meta.env.VITE_API_URL}/api/chats/${chatId}`, {
        method: 'DELETE',
        credentials: 'include',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['userChats']);
    },
  });

  const handleDelete = (chatId) => {
    deleteMutation.mutate(chatId);
  };

  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleDropdown = (chatId) => {
    setOpenDropdown(openDropdown === chatId ? null : chatId);
  };

  return (
    <div className='chatList'>
      <span className='title'>DASHBOARD</span>
      <Link to='/dashboard'>Create a new Chat</Link>
      <Link to='/create-custom-chatbot'>Create Custom Chatbots</Link>
      <Link to='/'>Explore Available Features</Link>
      <Link to='/'>Contact</Link>
      <hr />
      <span className='title'>RECENT CHATS</span>
      <div className='list'>
        {isPending ? 'Loading...' : error ? 'Something went wrong!' : data?.slice().reverse().map((chat) => (
              <div key={chat._id} className="chatItem">
                <Link to={`/dashboard/chats/${chat._id}`}>
                  {chat.title}
                </Link>
                <div className="dropdown">
                  <button className="dropdownButton" onClick={() => toggleDropdown(chat._id)}>
                    <FaEllipsisV />
                  </button>
                  {openDropdown === chat._id && (
                    <div className="dropdownContent">
                      <button onClick={() => handleDelete(chat._id)}>Delete</button>
                    </div>
                  )}
                </div>
              </div>
            ))}
      </div>
      <hr />
      <div className="upgrade">
        <img src='/bot.png' alt='' />
        <div className="texts">
          <span>Gen AI Chatbot</span>
        </div>
      </div>
    </div>
  );
};

export default ChatList;