import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCogs } from '@fortawesome/free-solid-svg-icons';
import './modelMenu.css';
import { useModel } from '../../context/ModelContext';

const ModelMenu = () => {
    const { currentModel, setCurrentModel } = useModel();
    const [isModalVisible, setModalVisible] = useState(false);

    const handleModelChange = (model) => {
        setCurrentModel(model);
        setModalVisible(false);
    };

    const toggleModal = () => {
        setModalVisible(!isModalVisible);
    };

    return (
        <div className="model-menu">
            <button onClick={toggleModal}>
                <FontAwesomeIcon icon={faCogs} />
                <span>Change Model (current: {currentModel})</span>
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
                                className={`model-option ${currentModel === "gpt-4.1" ? 'selected' : ''}`}
                                onClick={() => handleModelChange("gpt-4.1")}
                            >
                                <h4>gpt-4.1 (max tokens: 1,000,000)</h4>
                                <p>Our most advanced and expensive model. Knowledge through June 2024.</p>
                            </div>
                            <div
                                className={`model-option ${currentModel === "gpt-4o-mini" ? 'selected' : ''}`}
                                onClick={() => handleModelChange("gpt-4o-mini")}
                            >
                                <h4>gpt-4o-mini (max tokens: 128,000)</h4>
                                <p>Best for most use cases. Our most cost-efficient model, it can analyze images and is smarter than GPT-35-turbo. Knowledge through October 2023.</p>
                            </div>
                            <div
                                className={`model-option ${currentModel === "gpt-4o" ? 'selected' : ''}`}
                                onClick={() => handleModelChange("gpt-4o")}
                            >
                                <h4>gpt-4o (max tokens: 128,000)</h4>
                                <p>Our most advanced and expensive model. Knowledge through October 2023.</p>
                            </div>
                            <div
                                className={`model-option ${currentModel === "o4-mini" ? 'selected' : ''}`}
                                onClick={() => handleModelChange("o4-mini")}
                            >
                                <h4>o4-mini</h4>
                                <p>OpenAI's reasoning model. Knowledge through June 2024.</p>
                            </div>
                        </div>
                        <button onClick={() => setModalVisible(false)} className="close-modal">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModelMenu;