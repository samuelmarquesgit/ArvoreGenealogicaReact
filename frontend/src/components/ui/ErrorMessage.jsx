import React from 'react';
import './ErrorMessage.css';

export default function ErrorMessage({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="error-panel">
      <h3>Não foi possível carregar</h3>
      <p>{message}</p>
      <button type="button" className="btn btn-secondary" onClick={onClose}>
        Fechar
      </button>
    </div>
  );
}
