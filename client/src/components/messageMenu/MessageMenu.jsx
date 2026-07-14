import "./messageMenu.css";
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faRefresh, faCogs } from '@fortawesome/free-solid-svg-icons';
import { useModel } from "../../context/ModelContext";

const API_URL = import.meta.env.VITE_API_URL || "";

const MessageMenu = ({ onCopy, onGenerateNew, showAll, isCustomChatbot }) => {
  const { currentModel, setCurrentModel } = useModel();
  const [isModalVisible, setModalVisible] = useState(false);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isModalVisible && models.length === 0) {
      setLoading(true);
      fetch(`${API_URL}/api/models`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          setModels(data.models || []);
        })
        .catch(err => {
          console.error('Failed to fetch models:', err);
          setModels([
            { id: "gpt-4.1-mini", displayName: "gpt-4.1-mini", description: "", maxTokens: "" },
            { id: "gpt-4o-mini", displayName: "gpt-4o-mini", description: "", maxTokens: "" },
            { id: "gpt-4o", displayName: "gpt-4o", description: "", maxTokens: "" },
          ]);
        })
        .finally(() => setLoading(false));
    }
  }, [isModalVisible]);

  const handleModelChange = (modelId) => {
    setCurrentModel(modelId);
    setModalVisible(false);
  };

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  return (
    <div className="message-menu">
      {showAll ? (
        <>
          <button onClick={onCopy}>
            <FontAwesomeIcon icon={faCopy} />
            <div className="tooltip">Copy Message</div>
          </button>
          <button onClick={onGenerateNew}>
            <FontAwesomeIcon icon={faRefresh} />
            <div className="tooltip">Generate New Response</div>
          </button>
          {!isCustomChatbot && (
            <>
              <button onClick={toggleModal}>
                <FontAwesomeIcon icon={faCogs} />
                <div className="tooltip">Change Model (current: {currentModel})</div>
              </button>
              {isModalVisible && (
                <div className="modal">
                  <div className="modal-content">
                    <h3>Select a Model</h3>
                    <p>Choose a model from the list below:</p>
                    <div className="model-options">
                      {loading && <p>Loading models...</p>}
                      {!loading && models.map((model) => (
                        <div
                          key={model.id}
                          className={`model-option ${currentModel === model.id ? 'selected' : ''}`}
                          onClick={() => handleModelChange(model.id)}
                        >
                          <h4>{model.displayName}{model.maxTokens && ` (${model.maxTokens} tokens)`}</h4>
                          {model.description && <p>{model.description}</p>}
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setModalVisible(false)} className="close-modal">Close</button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <button onClick={onCopy}>
          <FontAwesomeIcon icon={faCopy} />
          <div className="tooltip">Copy Message</div>
        </button>
      )}
    </div>
  );
};

export default MessageMenu;
