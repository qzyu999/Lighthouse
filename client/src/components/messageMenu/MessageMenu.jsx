import "./messageMenu.css";
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faRefresh, faCogs } from '@fortawesome/free-solid-svg-icons';
import { useModel } from "../../context/ModelContext";

const MessageMenu = ({ onCopy, onGenerateNew, showAll, isCustomChatbot }) => {
  const { currentModel, setCurrentModel } = useModel();
  const [isModalVisible, setModalVisible] = useState(false);

  const handleModelChange = (model) => {
    setCurrentModel(model);
    setModalVisible(false); // Close the modal
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
          {!isCustomChatbot && ( // Conditionally render the model change button and tooltip
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
                      <div
                        className={`model-option ${currentModel === "gpt-4.1-mini" ? 'selected' : ''}`}
                        onClick={() => handleModelChange("gpt-4.1-mini")}
                      >
                        <h4>gpt-4.1-mini (max tokens: 1,000,000)</h4>
                        <p>Best for most use cases. Our most cost-efficient model, it can analyze images and is smarter than GPT-4o-mini. Knowledge through June 2024.</p>
                      </div>
                      <div
                        className={`model-option ${currentModel === "gpt-4o-mini" ? 'selected' : ''}`}
                        onClick={() => handleModelChange("gpt-4o-mini")}
                      >
                        <h4>gpt-4o-mini (max tokens: 128,000)</h4>
                        <p>Best for most use cases. Our most cost-efficient model, it can analyze images and is smarter than GPT-35-turbo. Knowledge through October 2023.</p>
                      </div>
                      <div
                        className={`model-option ${currentModel === "gemini-flash-1.5" ? 'selected' : ''}`}
                        onClick={() => handleModelChange("gemini-flash-1.5")}
                      >
                        <h4>Gemini Flash 1.5 (Google)</h4>
                        <p>Ideal for real-time applications with fast responses.</p>
                      </div>
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