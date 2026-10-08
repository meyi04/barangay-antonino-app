// src/App.tsx
import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
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
  homeOutline,
  documentTextOutline,
  receiptOutline,
  shieldCheckmark,
  newspaperOutline
} from 'ionicons/icons';

import Tab1 from './pages/Tab1';
import Tab2 from './pages/Tab2';
import Services from './pages/Services';
import TransparencyBoard from './pages/TransparencyBoard';
import Login from './pages/Login';
import Register from './pages/Register';
import StaffDashboard from './pages/staff/StaffDashboard';
import ManageRequests from './pages/staff/ManageRequests';
import Reports from './pages/staff/Reports';
import { useAuth } from './context/AuthContext';

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

const ResidentTabs: React.FC = () => {
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Routes>
          <Route path="/tab1" element={<Tab1 />} />
          <Route path="/tab2" element={<Services />} />
          <Route path="/tab3" element={<Tab2 />} /><Route path="/transparency" element={<TransparencyBoard />} />
          <Route path="/" element={<Navigate to="/tab1" replace />} />
          <Route path="*" element={<Navigate to="/tab1" replace />} />
        </Routes>
      </IonRouterOutlet>
      <IonTabBar slot="bottom">
        <IonTabButton tab="tab1" href="/tab1">
          <IonIcon icon={homeOutline} />
          <IonLabel>Home</IonLabel>
        </IonTabButton>
        <IonTabButton tab="tab2" href="/tab2">
          <IonIcon icon={documentTextOutline} />
          <IonLabel>Services</IonLabel>
        </IonTabButton>
        <IonTabButton tab="tab3" href="/tab3">
          <IonIcon icon={receiptOutline} />
          <IonLabel>My Requests</IonLabel>
        </IonTabButton>
        <IonTabButton tab="transparency" href="/transparency"><IonIcon icon={documentTextOutline} /><IonLabel>Transparency</IonLabel></IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

const StaffTabs: React.FC = () => {
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Routes>
          <Route path="/staff/dashboard" element={<StaffDashboard />} />
          <Route path="/staff/requests" element={<ManageRequests />} />
          <Route path="/staff/transparency" element={<TransparencyBoard />} />
          <Route path="/staff/reports" element={<Reports />} />
          <Route path="/staff" element={<Navigate to="/staff/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/staff/dashboard" replace />} />
        </Routes>
      </IonRouterOutlet>
      <IonTabBar className="staff-tab-bar" slot="bottom">
        <IonTabButton tab="dashboard" href="/staff/dashboard">
          <IonIcon icon={shieldCheckmark} />
          <IonLabel>Dashboard</IonLabel>
        </IonTabButton>
        <IonTabButton tab="requests" href="/staff/requests">
          <IonIcon icon={documentTextOutline} />
          <IonLabel>Manage</IonLabel>
        </IonTabButton>
        <IonTabButton tab="transparency" href="/staff/transparency"><IonIcon icon={documentTextOutline} /><IonLabel>Transparency</IonLabel></IonTabButton>
        <IonTabButton tab="reports" href="/staff/reports">
          <IonIcon icon={newspaperOutline} />
          <IonLabel>Reports</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
};

const App: React.FC = () => {
  const { user, profile, loading } = useAuth();
  if (loading) {
    return (
      <IonApp>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '16px', backgroundColor: '#f8fafc' }}>
          <IonSpinner name="crescent" color="primary" />
          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>Loading Barangay Antonino Portal...</div>
        </div>
      </IonApp>
    );
  }
  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          {!user ? (
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          ) : profile?.role === 'admin' ? (
            <Routes><Route path="/*" element={<StaffTabs />} /></Routes>
          ) : (
            <Routes><Route path="/*" element={<ResidentTabs />} /></Routes>
          )}
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;