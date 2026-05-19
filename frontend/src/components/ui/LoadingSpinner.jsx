import React from 'react';
import './LoadingSpinner.css';

export default function LoadingSpinner({ message = 'Carregando dados…' }) {
  return (
    <div className="loader-overlay">
      <div className="spinner" />
      <p className="loader-msg">{message}</p>
    </div>
  );
}
