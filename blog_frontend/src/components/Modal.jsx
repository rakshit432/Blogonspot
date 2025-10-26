import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

export const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) {
    return null;
  }

  const backdropStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(3px)',
    cursor: 'pointer',
  };

  const modalStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: '2rem',
    borderRadius: '12px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflowY: 'auto',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
    position: 'relative',
    lineHeight: 1.7,
    color: '#333',
    cursor: 'auto',
    transition: 'transform 0.2s ease-in-out',
  };

  const modalHoverStyle = {
    transform: 'translateY(-2px)',
  };

  const titleStyle = {
    marginTop: 0,
    marginBottom: '1.5rem',
    color: '#2d3748',
    fontSize: '1.5rem',
    fontWeight: '600',
  };

  const contentStyle = {
    color: '#4a5568',
    fontSize: '1.1rem',
    lineHeight: '1.8',
  };

  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      style={backdropStyle} 
      onClick={onClose}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        style={{
          ...modalStyle,
          ...(isHovered ? modalHoverStyle : {}),
        }} 
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <h3 style={titleStyle}>{title}</h3>
        <div style={contentStyle}>
          {children}
        </div>
      </div>
    </div>
  );
};