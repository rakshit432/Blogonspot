import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { summarize } from '../api/axios';
import { Modal } from './Modal';
import { FaSpinner } from 'react-icons/fa';

const SummarizeButton = ({ content }) => {
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [summary, setSummary] = useState('');

    const handleClick = async (e) => {
        e.stopPropagation();
        setLoading(true);
        try {
            console.log("Sending summarize request with content:", content);
            const response = await summarize(content);
            
            if (response.data?.summary) {
                console.log("Summary received:", response.data.summary);
                setSummary(response.data.summary);
                setShowModal(true);
            } else {
                throw new Error('No summary returned from API');
            }
        } catch (error) {
            console.error("Summarization request failed:", error);
            toast.error(error?.response?.data?.error || "Could not generate summary.");
        } finally {
            setLoading(false);
        }
    };

    const buttonStyle = {
        backgroundColor: 'var(--brand-light)',
        color: 'var(--brand)',
        border: '1px solid var(--border)',
        borderRadius: '999px',
        padding: '0.5rem 1rem',
        fontSize: '0.8rem',
        marginTop: '0.5rem',
        fontWeight: '500',
        opacity: loading ? 0.8 : 1,
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        transition: 'all 0.3s ease-in-out',
        minWidth: '120px',
        height: '36px',
    };
    
    const [animations, setAnimations] = useState({
        spin: `spin-${Math.random().toString(36).substr(2, 9)}`,
        fadeIn: `fadeIn-${Math.random().toString(36).substr(2, 9)}`,
        fadeOut: `fadeOut-${Math.random().toString(36).substr(2, 9)}`
    });

    const spinnerStyle = {
        animation: `${animations.spin} 1s linear infinite`,
    };
    
    const contentStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        transition: 'opacity 0.3s ease-in-out',
        opacity: loading ? 0 : 1,
    };
    
    const loadingStyle = {
        position: 'absolute',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        opacity: loading ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
    };

    return (
        <>
            <button 
                onClick={handleClick} 
                disabled={loading} 
                style={{
                    ...buttonStyle,
                    position: 'relative',
                }}
            >
                <div style={contentStyle}>
                    <span>Summarize</span>
                </div>
                <div style={loadingStyle}>
                    <FaSpinner style={spinnerStyle} className={animations.spin} />
                    <span>Summarizing...</span>
                </div>
            </button>
            
            <Modal 
                isOpen={showModal} 
                onClose={() => setShowModal(false)}
                title="Summary"
                style={{
                    transition: 'all 0.3s ease-in-out',
                    animation: showModal ? `${animations.fadeIn} 0.3s ease-in-out` : `${animations.fadeOut} 0.3s ease-in-out`
                }}
            >
                <div style={{
                    opacity: showModal ? 1 : 0,
                    transition: 'opacity 0.3s ease-in-out',
                }}>
                    {summary}
                </div>
            </Modal>
            
            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes ${animations.spin} {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    @keyframes ${animations.fadeIn} {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes ${animations.fadeOut} {
                        from { opacity: 1; transform: translateY(0); }
                        to { opacity: 0; transform: translateY(10px); }
                    }
                `
            }} />
        </>
    );
};

export default SummarizeButton;