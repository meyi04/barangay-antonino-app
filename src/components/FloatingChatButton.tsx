import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { chatbubbleEllipsesOutline } from 'ionicons/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './FloatingChatButton.css';

const FloatingChatButton: React.FC = () => {
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user || !profile || location.pathname === '/chat' || location.pathname === '/staff/chat') {
    return null;
  }

  const isStaff = profile.role === 'admin';

  return (
    <IonButton
      className="floating-chat-button"
      aria-label={isStaff ? 'Open resident chat' : 'Chat with barangay staff'}
      onClick={() => navigate(isStaff ? '/staff/chat' : '/chat')}
    >
      <IonIcon icon={chatbubbleEllipsesOutline} slot="start" />
      Chat
    </IonButton>
  );
};

export default FloatingChatButton;
