import React, { useRef, useState } from 'react';
import { IonButton, IonIcon, IonToast } from '@ionic/react';
import { logOutOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../services/authService';

const ResidentLogout: React.FC = () => {
  const navigate = useNavigate();
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const logout = async () => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    try {
      await logoutUser();
      sessionStorage.removeItem('antonino_prefill_category');
      navigate('/login', { replace: true });
    } catch {
      setError(true);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  return (
    <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
      <IonButton aria-label="Log out" fill="clear" color="light" size="small" disabled={busy} onClick={() => void logout()}
        style={{ background: 'rgba(255,255,255,0.18)', borderRadius: '20px', fontSize: '12px', fontWeight: 600, textTransform: 'none', margin: 0 }}>
        <IonIcon icon={logOutOutline} slot="start" />{busy ? 'Logging out...' : 'Logout'}
      </IonButton>
      <IonToast isOpen={error} onDidDismiss={() => setError(false)} message="Unable to log out. Please try again." color="danger" duration={3000} position="top" />
    </div>
  );
};
export default ResidentLogout;
