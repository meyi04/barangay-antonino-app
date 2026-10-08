import React, { useEffect, useMemo, useState } from 'react';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonToolbar,
} from '@ionic/react';
import { downloadOutline, filterOutline } from 'ionicons/icons';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import type { ServiceRequest } from '../../models/serviceRequest';
import {
  downloadCollectionsReport,
  filterCollectedRequests,
  getCollectionDate,
  sumCollectedAmount,
  type CollectionReportFilters,
} from '../../services/collectionReportService';
import BarangayLogo from '../../components/BarangayLogo';
import ResidentLogout from '../../components/ResidentLogout';
import '../Services.css';
import './Staff.css';

const money = (amount: number) => `PHP ${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Reports: React.FC = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reportError, setReportError] = useState('');
  const [filters, setFilters] = useState<CollectionReportFilters>({
    fromDate: '',
    toDate: '',
    category: 'All',
    search: '',
  });

  useEffect(() => onSnapshot(collection(db, 'requests'), (snapshot) => {
    setRequests(snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as ServiceRequest));
    setLoading(false);
    setLoadError('');
  }, () => {
    setLoading(false);
    setLoadError('Unable to load collection records. Check your connection and staff permissions.');
  }), []);

  const categories = useMemo(
    () => [...new Set(requests.filter((request) => request.status === 'Resolved').map((request) => request.category).filter(Boolean))].sort(),
    [requests],
  );
  const filteredRequests = useMemo(() => filterCollectedRequests(requests, filters), [requests, filters]);
  const total = useMemo(() => sumCollectedAmount(filteredRequests), [filteredRequests]);
  const invalidRange = Boolean(filters.fromDate && filters.toDate && filters.fromDate > filters.toDate);

  const updateFilter = (key: keyof CollectionReportFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };
  const generateReport = () => {
    setReportError('');
    if (invalidRange) {
      setReportError('The start date must be on or before the end date.');
      return;
    }
    try {
      downloadCollectionsReport(requests, filters);
    } catch (error) {
      console.error('Unable to generate collections report', error);
      setReportError(error instanceof Error ? error.message : 'Unable to generate the PDF report. Please try again.');
    }
  };

  return (
    <IonPage className="services-page staff-page">
      <IonHeader className="ion-no-border">
        <IonToolbar className="services-toolbar">
          <div className="services-brand">
            <BarangayLogo size={36} />
            <div><small>Republika ng Pilipinas</small><strong>Barangay Antonino</strong></div>
            <ResidentLogout />
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding services-content">
        <div className="services-shell">
          <p className="services-eyebrow">Staff Portal • Reports</p>
          <div className="services-hero">
            <span className="services-pill"><IonIcon icon={downloadOutline} /> Financial Report</span>
            <h1>Collections Report</h1>
            <p>Review money recorded as collected when requests are resolved, filter the records, and download a PDF report.</p>
          </div>

          <section className="staff-report-total" aria-live="polite">
            <span>Collected for selected filters</span>
            <strong>{loading ? 'Loading...' : loadError ? 'Unavailable' : money(total)}</strong>
            <small>{filteredRequests.length} resolved request{filteredRequests.length === 1 ? '' : 's'}</small>
          </section>

          <section className="staff-report-filters" aria-label="Filter collections">
            <div className="staff-report-filter-heading"><IonIcon icon={filterOutline} /><strong>Filter records</strong></div>
            <div className="staff-report-date-filters">
              <label>From date<input aria-label="From date" type="date" value={filters.fromDate} onChange={(event) => updateFilter('fromDate', event.target.value)} /></label>
              <label>To date<input aria-label="To date" type="date" value={filters.toDate} onChange={(event) => updateFilter('toDate', event.target.value)} /></label>
            </div>
            <IonItem lines="none">
              <IonLabel position="stacked">Request category</IonLabel>
              <IonSelect value={filters.category} onIonChange={(event) => updateFilter('category', event.detail.value)} interface="popover">
                <IonSelectOption value="All">All categories</IonSelectOption>
                {categories.map((category) => <IonSelectOption key={category} value={category}>{category}</IonSelectOption>)}
              </IonSelect>
            </IonItem>
            <IonSearchbar
              aria-label="Search collected requests"
              placeholder="Search ticket, request, or resident"
              value={filters.search}
              onIonChange={(event) => updateFilter('search', event.detail.value ?? '')}
            />
            {invalidRange && <p className="services-error" role="alert">The start date must be on or before the end date.</p>}
            <IonButton expand="block" disabled={loading || Boolean(loadError) || invalidRange} onClick={generateReport}>
              <IonIcon icon={downloadOutline} slot="start" /> Generate PDF Report
            </IonButton>
            {reportError && <p className="services-error" role="alert">{reportError}</p>}
          </section>

          <h2 className="services-section-title">Resolved request collections</h2>
          <p className="services-hint">Collections are dated when staff record the payment while resolving a request.</p>
          {loading ? <div role="status"><IonSpinner /><p>Loading collection records...</p></div>
            : loadError ? <p role="alert" className="services-error">{loadError}</p>
              : filteredRequests.length === 0 ? <div className="staff-note">No collected requests match these filters.</div>
                : <IonList lines="none" className="staff-report-list">
                  {filteredRequests.map((request) => {
                    const collectedAt = getCollectionDate(request);
                    return (
                      <IonItem key={request.id || request.ticketNo} className="staff-report-row">
                        <IonLabel>
                          <h2>{request.title}</h2>
                          <p>{request.ticketNo || 'No ticket'} · {request.category} · {request.submittedByName}</p>
                          <p>{collectedAt?.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                        </IonLabel>
                        <strong slot="end">{money(request.collectedAmount || 0)}</strong>
                      </IonItem>
                    );
                  })}
                </IonList>}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Reports;
