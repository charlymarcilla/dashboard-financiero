'use client';

import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg relative animate-fade-in-up">
        <header className="flex justify-between items-center p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Cerrar modal"
          >
            <X size={24} />
          </button>
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Modal;
