import React, { useEffect, useState } from 'react';
import { IonContent, IonHeader, IonIcon, IonPage, IonSpinner, IonToolbar } from '@ionic/react';
import { checkmarkDoneOutline, constructOutline, documentTextOutline, timeOutline, shieldCheckmark, newspaperOutline, cashOutline } from 'ionicons/icons';
import { collection, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import BarangayLogo from '../../components/BarangayLogo';
import ResidentLogout from '../../components/ResidentLogout';
import type { ServiceRequest } from '../../models/serviceRequest';
import { sumCollectedAmount } from '../../services/collectionReportService';
import '../Services.css';
import './Staff.css';

const StaffDashboard: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0, collected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => onSnapshot(collection(db, 'requests'), (snap) => {
    const data = snap.docs.map((item) => item.data() as ServiceRequest);
    setStats({
      total: data.length,
      pending: data.filter((item) => item.status === 'Pending').length,
      inProgress: data.filter((item) => item.status === 'In Progress').length,
      resolved: data.filter((item) => item.status === 'Resolved').length,
      collected: sumCollectedAmount(data),
    });
    setLoading(false); setError('');
  }, () => { setLoading(false); setError('Unable to load requests. Check your connection and staff permissions.'); }), []);
  const money = (amount: number) => `PHP ${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const cards = [
    { label: 'Total Requests', value: stats.total, color: '#0d6840', bg: '#ecfdf5', icon: documentTextOutline },
    { label: 'Pending', value: stats.pending, color: '#b45309', bg: '#fef3c7', icon: timeOutline },
    { label: 'In Progress', value: stats.inProgress, color: '#2563eb', bg: '#dbeafe', icon: constructOutline },
    { label: 'Resolved', value: stats.resolved, color: '#166534', bg: '#dcfce7', icon: checkmarkDoneOutline },
    { label: 'Money Collected', value: money(stats.collected), color: '#0d6840', bg: '#ecfdf5', icon: cashOutline },
  ];
  return (
    <IonPage className="services-page staff-page">
      <IonHeader className="ion-no-border"><IonToolbar className="services-toolbar"><div className="services-brand"><BarangayLogo size={36} /><div><small>Republika ng Pilipinas</small><strong>Barangay Antonino</strong></div><ResidentLogout /></div></IonToolbar></IonHeader>
      <IonContent className="ion-padding services-content"><div className="services-shell">
        <p className="services-eyebrow">Staff Portal • Dashboard</p>
        <div className="services-hero"><span className="services-pill"><IonIcon icon={shieldCheckmark} /> Barangay Staff</span><h1>Mabuhay, {profile?.fullName || 'Staff'}!</h1><p>Review resident requests, respond to community concerns, and keep the barangay informed.</p></div>
        <h2 className="services-section-title">Request Overview</h2><p className="services-hint">Live updates from all resident submissions.</p>
        {loading ? <div role="status"><IonSpinner /><p>Loading request summary...</p></div> : error ? <p role="alert" className="services-error">{error}</p> : <div className="staff-stats">{cards.map((card) => <div className="staff-stat" key={card.label}><span className="staff-stat-icon" style={{ background: card.bg, color: card.color }}><IonIcon icon={card.icon} /></span><strong>{card.value}</strong><span>{card.label}</span></div>)}</div>}
        <h2 className="services-section-title">Staff Workspace</h2><p className="services-hint">Choose an area to manage.</p>
        <div className="services-choices">
          <button className="services-choice" type="button" onClick={() => navigate('/staff/requests')}><span className="services-choice-icon"><IonIcon icon={documentTextOutline} /></span><strong>Manage Requests</strong><small>Review certificates and complaints. Update their progress.</small></button>
          <button className="services-choice" type="button" onClick={() => navigate('/staff/transparency')}><span className="services-choice-icon complaint"><IonIcon icon={newspaperOutline} /></span><strong>Transparency Board</strong><small>Publish budgets, project updates, reports, and attachments.</small></button>
          <button className="services-choice" type="button" onClick={() => navigate('/staff/reports')}><span className="services-choice-icon"><IonIcon icon={cashOutline} /></span><strong>Collections Reports</strong><small>Filter collected request fees and download a financial report.</small></button>
        </div>
        <div className="staff-note"><IonIcon icon={shieldCheckmark} /><p>Request status updates and published board posts are visible to residents.</p></div>
      </div></IonContent>
    </IonPage>
  );
};
export default StaffDashboard;
