import './chatPage.css';
import NewPrompt from '../../components/newPrompt/NewPrompt';
import FooterWithDisclaimer from '../../components/footerWithDisclaimer/FooterWithDisclaimer';
import MessageMenu from '../../components/messageMenu/MessageMenu';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import React, { useState, useRef, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import throttle from 'lodash/throttle';

const ChatPage = () => {
  const chatId = useLocation().pathname.split('/').pop();
  const [copied, setCopied] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [userScrolled, setUserScrolled] = useState(false);
  const bottomRef = useRef(null);
  const chatPageRef = useRef(null);
  const scrollPositionRef = useRef(null);

  const { isPending, error, data } = useQuery({
    queryKey: ['chat', chatId],
    queryFn: () =>
      fetch(`${import.meta.env.VITE_API_URL}/api/chats/${chatId}`, {
        credentials: 'include',
      }).then((res) => res.json()),
  });

  const isCustomChatbot = data?.isCustomChatbot || false;

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Capture the scroll position before resetting the answer
  const captureScrollPosition = () => {
    if (chatPageRef.current) {
      scrollPositionRef.current = chatPageRef.current.scrollTop;
    }
  };

  // Restore the scroll position after re-render
  const restoreScrollPosition = () => {
    if (chatPageRef.current && scrollPositionRef.current !== null) {
      chatPageRef.current.scrollTop = scrollPositionRef.current;
    }
  };

  useEffect(() => {
    restoreScrollPosition(); // Restore scroll position after the component re-renders
  }, [data]);

  const onUserScroll = () => {
    setUserScrolled(true);
  };

  useEffect(() => {
    const chatPageElement = chatPageRef.current;
    const throttledOnUserScroll = throttle(onUserScroll, 3000);

    if (chatPageElement) {
      chatPageElement.addEventListener('wheel', throttledOnUserScroll);
    }

    return () => {
      if (chatPageElement) {
        chatPageElement.removeEventListener('wheel', throttledOnUserScroll);
      }
    };
  }, []);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleGenerateNew = () => {
    alert('Generate new message functionality not yet implemented');
  };

  const messages = data?.history || [];
  const latestMessageIndex = messages.length - 1;

  const components = {
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      const codeString = String(children).replace(/\n$/, '');
      return !inline && match ? (
        <div className="custom-code-block-wrapper">
          <SyntaxHighlighter
            lineProps={{style: {wordBreak: 'break-all', whiteSpace: 'pre-wrap'}}}
            wrapLines={true} 
            className="custom-code-block"
            style={atomDark}
            language={match[1]}
            PreTag="div"
            {...props}
          >
            {codeString}
          </SyntaxHighlighter>
          <button
            className={`copy-button ${copied ? 'copied' : ''}`}
            onClick={() => handleCopy(codeString)}
          >
            Copy
          </button>
        </div>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  return (
    <div className="chatPage" ref={chatPageRef}>
      <div className="wrapper">
        <div className="chat">
          {isPending ? 'Loading...' : error ? 'Something went wrong!' : data?.history?.map((message, i) => (
            <React.Fragment key={i}>
              <div
                className={`message ${message.role === 'user' ? 'user' : 'bot'}`}
              >
                {message.role !== 'user' ? (
                  <ReactMarkdown components={components}>
                    {message.parts[0].text}
                  </ReactMarkdown>
                ) : (
                  <div className="user-message">{message.parts[0].text}</div>
                )}
                {message.role !== 'user' && (
                  <MessageMenu
                    onCopy={() => handleCopy(message.parts[0].text)}
                    onGenerateNew={handleGenerateNew}
                    showAll={i === latestMessageIndex}
                    isCustomChatbot={isCustomChatbot}
                  />
                )}
              </div>
            </React.Fragment>
          ))}
          <div className="newPromptContainer" ref={bottomRef}>
            {data && <NewPrompt
              data={data}
              setIsTyping={setIsTyping}
              isTyping={isTyping}
              userScrolled={userScrolled}
              setUserScrolled={setUserScrolled}
              captureScrollPosition={captureScrollPosition}
              chatPageRef={chatPageRef}
              chatId={chatId}
            />}
            <FooterWithDisclaimer />
          </div>
        </div>
        <button className="scrollToBottomButton" onClick={scrollToBottom}>
          <FontAwesomeIcon icon={faChevronDown} />
        </button>
      </div>
    </div>
  );
};

export default ChatPage;