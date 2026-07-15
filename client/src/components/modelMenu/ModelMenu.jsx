import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCogs } from '@fortawesome/free-solid-svg-icons';
import './modelMenu.css';
import { useModel } from '../../context/ModelContext';

const API_URL = import.meta.env.VITE_API_URL || "";

const ModelMenu = () => {
    const { currentModel, setCurrentModel, setModels } = useModel();
    const [isModalVisible, setModalVisible] = useState(false);
    const [models, setLocalModels] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch models when modal opens (cached after first load)
    useEffect(() => {
        if (isModalVisible && models.length === 0) {
            setLoading(true);
            fetch(`${API_URL}/api/models`, { credentials: 'include' })
                .then(res => res.json())
                .then(data => {
                    const list = data.models || [];
                    setLocalModels(list);
                    setModels(list); // Store in context for other components
                })
                .catch(err => {
                    console.error('Failed to fetch models:', err);
                    // Fallback to hardcoded list
                    const fallback = [
                        { id: "gpt-4.1-mini" },
                        { id: "gpt-4o-mini" },
                        { id: "gpt-4o" },
                        { id: "gpt-4.1" },
                        { id: "o4-mini" },
                    ];
                    setLocalModels(fallback);
                    setModels(fallback);
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
                            {loading && <p className="loading-text">Loading models...</p>}
                            {!loading && models.map((model) => {
                                const id = model.id;
                                const displayName = model.displayName || id;
                                const description = model.description || "";
                                const maxTokens = model.maxTokens || "";
                                return (
                                    <div
                                        key={id}
                                        className={`model-option ${currentModel === id ? 'selected' : ''}`}
                                        onClick={() => handleModelChange(id)}
                                    >
                                        <h4>{displayName}{maxTokens && ` (${maxTokens} tokens)`}</h4>
                                        {description && <p>{description}</p>}
                                    </div>
                                );
                            })}
                        </div>
                        <button onClick={() => setModalVisible(false)} className="close-modal">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModelMenu;
