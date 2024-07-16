import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import './newPrompt.css';
import geminiModel from '../../lib/gemini';
import azureOpenAIModel from '../../lib/azureopenai';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useModel } from '../../context/ModelContext';

const NewPrompt = ({
  data,
  setIsTyping,
  isTyping,
  userScrolled,
  setUserScrolled,
  captureScrollPosition,
  chatPageRef,
  chatId,
}) => {
  const { currentModel } = useModel();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const accumulatedTextRef = useRef('');
  const [img, setImg] = useState({
    isLoading: false,
    error: '',
    dbData: {},
    aiData: {},
  });

  const customSystemPrompt = data?.history[0]?.role === 'system'
    ? data.history[0].parts[0].text
    : 'You are a helpful assistant.';

  const prepareChatHistory = (history, lastUserMessage) => {
    const systemMessage = { role: 'system', content: customSystemPrompt };

    const mappedHistory = history.map(({ role, parts }) => ({
      role: role === 'model' ? 'assistant' : role,
      content: parts[0].text,
    }));

    const userMessage = lastUserMessage ? { role: 'user', content: lastUserMessage } : null;

    return [systemMessage, ...mappedHistory, userMessage].filter(Boolean);
  };

  const userEndRef = useRef(null);
  const formRef = useRef(null);
  const textareaRef = useRef(null);
  const latestMessageRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    if (question) {
      userEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [question]);

  useEffect(() => {
    if (answer !== '' && isTyping && !userScrolled) {
      latestMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [answer]);

  useEffect(() => {
    const chatPageElement = chatPageRef.current;
    const endElement = endRef.current;
    
    if (chatPageElement && endElement && !userScrolled) {
      // Get the visible height of the chat container
      const chatPageHeight = chatPageElement.clientHeight;
      // Get the position of the end element relative to the chat container
      const endElementRelativeOffset = endElement.getBoundingClientRect().top - chatPageElement.getBoundingClientRect().top;
      
      // Include the -200 buffer to accomodate the .chat: padding-bottom: 50px in chatPage.css
      // in addition to the chunking from the streaming text
      if (endElementRelativeOffset < chatPageHeight - 200) {
        endRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [answer, question, chatPageRef]);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => {
      return fetch(`${import.meta.env.VITE_API_URL}/api/chats/${data._id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.length ? question : undefined,
          answer,
          img: img.dbData?.filePath || undefined,
        }),
      }).then((res) => res.json());
    },
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: ['chat', data._id] })
        .then(() => {
          formRef.current.reset();
          setQuestion('');
          captureScrollPosition();
          setAnswer('');
          setImg({
            isLoading: false,
            error: '',
            dbData: {},
            aiData: {},
          });
          setIsTyping(false);
        });

      textareaRef.current.focus();
    },
    onError: (err) => {
      console.error('Mutation error:', err);
      setIsTyping(false);
    },
  });

  const handleStreamingResponse = async (chatHistory, modelToUse) => {
    const stream = await azureOpenAIModel.chat.completions.create({
      model: modelToUse,
      messages: chatHistory,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content || '';
      if (content) {
        accumulatedTextRef.current += content;
        flushSync(() => {
          setAnswer(accumulatedTextRef.current);
        });
      }
    }

    mutation.mutate();
  };

  const add = async (text, isInitial) => {
    if (!isInitial) setQuestion(text);
    setIsTyping(true);
    setUserScrolled(false);

    accumulatedTextRef.current = '';

    try {
      const chatHistory = prepareChatHistory(data?.history || [], text);

      if (currentModel === "gemini-flash-1.5") {
        const chat = geminiModel.startChat({
          history: data?.history.map(({ role, parts }) => ({
            role,
            parts: [{ text: parts[0].text }],
          })),
          generationConfig: {},
        });

        const result = await chat.sendMessageStream(
          Object.entries(img.aiData).length ? [img.aiData, text] : [text]
        );

        for await (const chunk of result.stream) {
          const chunkText = await chunk.text();
          accumulatedTextRef.current += chunkText;
          setAnswer(accumulatedTextRef.current);
        }

        flushSync(() => {
          setAnswer(accumulatedTextRef.current);
        });
        mutation.mutate();
      } else {
        // Route all OpenAI-compatible models through Azure OpenAI
        await handleStreamingResponse(chatHistory, currentModel);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const text = e.target.text.value;
    if (!text) return;

    add(text, false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  };

  const hasRun = useRef(false);
  useEffect(() => {
    if (!hasRun.current) {
      if (data?.history.length === 1) {
        add(data.history[0].parts[0].text, true);
      }
    }
    hasRun.current = true;
  }, []);

  const components = {
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      const codeString = String(children).replace(/\n$/, '');
      return !inline && match ? (
        <div className="custom-code-block-wrapper">
          <SyntaxHighlighter
            lineProps={{ style: { wordBreak: 'break-all', whiteSpace: 'pre-wrap' } }}
            wrapLines={true}
            className="custom-code-block"
            style={atomDark}
            language={match[1]}
            PreTag="div"
            {...props}
          >
            {codeString}
          </SyntaxHighlighter>
          <button className="copy-button" onClick={() => handleCopy(codeString)}>
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
    <>
      {question && (
        <div className="message user">
          <div className="user-message" ref={userEndRef}>
            {question}
          </div>
        </div>
      )}
      {answer && (
        <div className="message bot" ref={latestMessageRef}>
          {isTyping && (
            <div className="typing-indicator extended">
              <div className="typing-icon"></div>
              <div className="typing-icon"></div>
              <div className="typing-icon"></div>
              <span className="typing-text">Typing...</span>
            </div>
          )}
          <ReactMarkdown components={components}>{answer}</ReactMarkdown>
        </div>
      )}
      <div ref={endRef}></div>
      <form className="newForm" onSubmit={handleSubmit} ref={formRef}>
        <input id="file" type="file" multiple={false} hidden />
        <textarea
          name="text"
          placeholder="Please enter your prompt"
          onKeyDown={handleKeyDown}
          ref={textareaRef}
        />
        <button>
          <img src="/arrow.png" alt="" />
        </button>
      </form>
    </>
  );
};

export default NewPrompt;