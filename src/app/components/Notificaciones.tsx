import React from 'react';
import { Notification } from '../../lib/notificationService';

interface NotificacionesProps {
  notifications: Notification[];
}

const Notificaciones: React.FC<NotificacionesProps> = ({ notifications }) => {
  if (notifications.length === 0) {
    return null; // No mostrar nada si no hay notificaciones
  }

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'alert':
        return '⚠️';
      case 'success':
        return '🎉';
      case 'info':
        return 'ℹ️';
      default:
        return '';
    }
  };

  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg shadow-lg mb-6">
      <h2 className="text-xl font-bold mb-3">Notificaciones</h2>
      <ul>
        {notifications.map((notification) => (
          <li key={notification.id} className="flex items-center mb-2">
            <span className="text-2xl mr-3">{getIcon(notification.type)}</span>
            <span>{notification.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Notificaciones;