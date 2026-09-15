// src/App.tsx
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import {
  IonApp,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonSpinner,
  IonTabBar,
  IonTabButton,
  IonTabs,
  setupIonicReact
} from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import {
  addCircle,
  list,
  informationCircle,
  shieldCheckmark,
  documentTextOutline,
  logOut
} from 'ionicons/icons';

// Resident pages (existing)
import Tab1 from './pages/Tab1';
import Tab2 from './pages/Tab2';
import Tab3 from './pages/Tab3';

// Auth pages (new)
import Login from './pages/Login';
import Register from './pages/Register';

// Staff pages (new)
import StaffDashboard from './pages/staff/StaffDashboard';
import ManageRequests from './pages/staff/ManageRequests';

// Auth context & logout
import { useAuth } from './context/AuthContext';
import { logoutUser } from './services/authService';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/palettes/dark.system.css';
import './theme/variables.css';

setupIonicReact();

// ===== RESIDENT TABS =====
const ResidentTabs: React.FC = () => {
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
  <IonTabs>
    <IonRouterOutlet>
      <Routes>
        <Route path="/tab1" element={<Tab1 />} />
        <Route path="/tab2" element={<Tab2 />} />
        <Route path="/tab3" element={<Tab3 />} />
        <Route path="/" element={<Navigate to="/tab1" replace />} />
        <Route path="*" element={<Navigate to="/tab1" replace />} />
      </Routes>
    </IonRouterOutlet>

    <IonTabBar slot="bottom">
      <IonTabButton tab="tab1" href="/tab1">
        <IonIcon icon={addCircle} />
        <IonLabel>Submit</IonLabel>
      </IonTabButton>
      <IonTabButton tab="tab2" href="/tab2">
        <IonIcon icon={list} />
        <IonLabel>Requests</IonLabel>
      </IonTabButton>
      <IonTabButton tab="tab3" href="/tab3">
        <IonIcon icon={informationCircle} />
        <IonLabel>About</IonLabel>
      </IonTabButton>
      <IonTabButton tab="logout" onClick={() => void handleLogout()}>
        <IonIcon icon={logOut} />
        <IonLabel>Logout</IonLabel>
      </IonTabButton>
    </IonTabBar>
  </IonTabs>
);
};

// ===== STAFF TABS =====
const StaffTabs: React.FC = () => {
  const navigate = useNavigate();
  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  return (
  <IonTabs>
    <IonRouterOutlet>
      <Routes>
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
        <Route path="/staff/requests" element={<ManageRequests />} />
        <Route path="/staff" element={<Navigate to="/staff/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/staff/dashboard" replace />} />
      </Routes>
    </IonRouterOutlet>

    <IonTabBar slot="bottom">
      <IonTabButton tab="dashboard" href="/staff/dashboard">
        <IonIcon icon={shieldCheckmark} />
        <IonLabel>Dashboard</IonLabel>
      </IonTabButton>
      <IonTabButton tab="requests" href="/staff/requests">
        <IonIcon icon={documentTextOutline} />
        <IonLabel>Manage</IonLabel>
      </IonTabButton>
      <IonTabButton tab="logout" onClick={() => void handleLogout()}>
        <IonIcon icon={logOut} />
        <IonLabel>Logout</IonLabel>
      </IonTabButton>
    </IonTabBar>
  </IonTabs>
);
};

// ===== MAIN APP =====
const App: React.FC = () => {
  const { user, profile, loading } = useAuth();

  // ⏳ Loading splash while checking auth
  if (loading) {
    return (
      <IonApp>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
          }}
        >
          <IonSpinner name="crescent" />
        </div>
      </IonApp>
    );
  }

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          {!user ? (
            // 🔓 Not logged in → Login/Register only
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          ) : profile?.role === 'admin' ? (
            // 🛡️ Admin → Staff tabs
            <Routes>
              <Route path="/*" element={<StaffTabs />} />
            </Routes>
          ) : (
            // 👤 Resident → Resident tabs
            <Routes>
              <Route path="/*" element={<ResidentTabs />} />
            </Routes>
          )}
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
