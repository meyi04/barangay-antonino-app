import React, { useEffect, useMemo, useState } from "react";
import {
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonSearchbar,
  IonSpinner,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToast,
  IonToolbar,
} from "@ionic/react";
import { closeOutline, documentTextOutline, filterOutline, warningOutline } from "ionicons/icons";
import { collection, doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import type { ServiceRequest } from "../../models/serviceRequest";
import type * as RequestReceiptService from "../../services/requestReceiptService";

import BarangayLogo from '../../components/BarangayLogo';
import ResidentLogout from '../../components/ResidentLogout';
import '../Services.css';
import '../Tab2.css';
import './Staff.css';

const statuses = ["All", "Pending", "In Progress", "Resolved"];

const ManageRequests: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [toastColor, setToastColor] = useState('success');
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusDraft, setStatusDraft] = useState("Pending");
  const [feeAmount, setFeeAmount] = useState("");
  const [collectedAmount, setCollectedAmount] = useState("");
  const [feeDescription, setFeeDescription] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "requests"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ServiceRequest[];
      setRequests(data);
      setLoading(false);
      setLoadError('');
    }, () => { setLoading(false); setLoadError('Unable to load requests. Check your connection and staff permissions.'); });

    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    return requests.filter((request) => {
      const term = search.toLowerCase();
      const matchesSearch =
        !term ||
        request.title?.toLowerCase().includes(term) ||
        request.ticketNo?.toLowerCase().includes(term) ||
        request.submittedByName?.toLowerCase().includes(term) ||
        request.category?.toLowerCase().includes(term);

      const matchesStatus = selectedStatus === "All" || request.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [requests, search, selectedStatus]);

  const updateStatus = async () => {
    if (!selectedRequest?.id || saving || !statuses.slice(1).includes(statusDraft)) return;
    const resolved = statusDraft === "Resolved";
    const amount = feeAmount.trim() === "" ? 0 : Number(feeAmount);
    if (!resolved && (!Number.isFinite(amount) || amount < 0)) {
      setToastColor('warning');
      setToastMsg("Enter a valid non-negative fee amount.");
      setShowToast(true);
      return;
    }
    const collected = collectedAmount.trim() === "" ? 0 : Number(collectedAmount);
    if (statusDraft === "Resolved" && (!collectedAmount.trim() || !Number.isFinite(collected) || collected < 0)) {
      setToastColor('warning');
      setToastMsg("Enter the amount collected, or enter 0 if no payment was received.");
      setShowToast(true);
      return;
    }

    setSaving(true);
    let receiptService: typeof RequestReceiptService | null = null;
    try {
      receiptService = await import("../../services/requestReceiptService");
      receiptService = await import("../../services/requestReceiptService");
      const receiptPdfData = resolved
        ? ""
        : receiptService.createRequestReceipt(selectedRequest, amount, feeDescription.trim(), new Date());

      await updateDoc(doc(db, "requests", selectedRequest.id), {
        status: statusDraft,
        receiptPdfData,
        receiptFeeAmount: resolved ? 0 : amount,
        receiptFeeDescription: resolved ? "" : feeDescription.trim(),
        receiptIssuedAt: resolved ? null : serverTimestamp(),
        ...(resolved ? { collectedAmount: collected, collectedAt: serverTimestamp() } : {}),
      });

      setToastColor('success');
      setToastMsg(resolved
        ? `Request resolved. PHP ${collected.toFixed(2)} recorded as collected.`
        : `Status updated to "${statusDraft}". Receipt issued.`);
      setShowToast(true);
      setShowStatusModal(false);
      setShowModal(false);
    } catch (error) {
      console.error(error);
      setToastColor('danger');
      setToastMsg(error instanceof Error ? error.message : "Failed to update status or save the receipt. Check Firestore permissions and try again.");
      setShowToast(true);
    } finally { setSaving(false); }
  };

  const openStatusModal = () => {
    if (!selectedRequest) return;
    setStatusDraft(selectedRequest.status);
    setFeeAmount(selectedRequest.receiptFeeAmount ? String(selectedRequest.receiptFeeAmount) : "");
    setCollectedAmount(selectedRequest.collectedAmount !== undefined ? String(selectedRequest.collectedAmount) : "");
    setFeeDescription(selectedRequest.receiptFeeDescription || "");
    setShowStatusModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "warning";
      case "In Progress":
        return "primary";
      case "Resolved":
        return "success";
      default:
        return "medium";
    }
  };

  return (
    <IonPage className="services-page requests-page staff-page">
      <IonHeader className="ion-no-border"><IonToolbar className="services-toolbar"><div className="services-brand"><BarangayLogo size={36} /><div><small>Republika ng Pilipinas</small><strong>Barangay Antonino</strong></div><ResidentLogout /></div></IonToolbar></IonHeader>
      <IonContent className="ion-padding services-content">
        <div className="services-shell">
          <p className="services-eyebrow">Staff Portal • Manage Requests</p>
          <div className="services-hero"><span className="services-pill"><IonIcon icon={documentTextOutline} /> Resident Services</span><h1>Manage Requests</h1><p>Review certificate applications and community complaints. Keep residents informed by updating each request's status.</p></div>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "8px 12px", marginBottom: "12px", boxShadow: "0 4px 18px rgba(0,0,0,0.04)" }}>
            <IonSearchbar
              placeholder="Search ticket or resident"
              value={search}
              onIonChange={(event) => setSearch(event.detail.value ?? "")}
              style={{ padding: 0 }}
            />
          </div>

          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "4px", marginBottom: "14px", boxShadow: "0 4px 18px rgba(0,0,0,0.04)" }}>
            <IonSegment value={selectedStatus} onIonChange={(event) => setSelectedStatus(event.detail.value as string)}>
              {statuses.map((status) => (
                <IonSegmentButton key={status} value={status}>
                  <IonLabel>{status}</IonLabel>
                </IonSegmentButton>
              ))}
            </IonSegment>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", paddingLeft: "4px" }}>
            <IonIcon icon={filterOutline} style={{ color: "#0d6840", fontSize: "18px" }} />
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#0f2942" }}>Request Queue</span>
          </div>

          {loading ? <div role="status"><IonSpinner /><p>Loading requests...</p></div> : loadError ? <p role="alert" className="services-error">{loadError}</p> : filtered.length === 0 ? (
            <div style={{ background: "#fff", border: "1px dashed #cbd5e1", borderRadius: "16px", padding: "32px 20px", textAlign: "center" }}>
              <IonIcon icon={warningOutline} style={{ fontSize: "28px", color: "#94a3b8" }} />
              <div style={{ marginTop: "8px", fontWeight: 700, color: "#475569" }}>No matching requests found.</div>
            </div>
          ) : (
            <IonList className="requests-list" lines="none" style={{ background: "transparent", padding: 0 }}>
              {filtered.map((request) => (
                <IonItem key={request.id} button onClick={() => { setSelectedRequest(request); setShowModal(true); }} style={{ "--background": "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", marginBottom: "10px", overflow: "hidden" }}>
                  <div slot="start" style={{ width: "46px", height: "46px", borderRadius: "12px", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <IonIcon icon={documentTextOutline} style={{ color: "#0d6840", fontSize: "22px" }} />
                  </div>
                  <IonLabel>
                    <h2 style={{ fontWeight: 800, color: "#0f172a" }}>{request.title}</h2>
                    <p style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                      <strong>{request.ticketNo}</strong> • {request.category}
                    </p>
                    <p style={{ fontSize: "11px", color: "#64748b" }}>{request.submittedByName} • {request.purok}</p>
                    <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                      <IonBadge color={getStatusColor(request.status)}>{request.status}</IonBadge>
                      <IonBadge color="medium">{request.priority}</IonBadge>
                    </div>
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
          )}

        </div>
        <IonModal className="requests-details" isOpen={showModal} onDidDismiss={() => setShowModal(false)} breakpoints={[0, 0.75, 0.95]} initialBreakpoint={0.75}>
          <IonHeader>
            <IonToolbar className="services-toolbar">
              <IonTitle style={{ fontSize: "15px", fontWeight: 700 }}>Request Overview</IonTitle>
              <IonButton aria-label="Close request details" slot="end" fill="clear" color="light" onClick={() => setShowModal(false)}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {selectedRequest && (
              <>
                <IonCard style={{ borderRadius: "16px", boxShadow: "0 4px 18px rgba(0,0,0,0.04)" }}>
                  <IonCardContent>
                    <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "8px" }}>Request</div>
                    <h2 style={{ margin: "0 0 10px 0", fontWeight: 800, color: "#0f172a" }}>{selectedRequest.title}</h2>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <IonBadge color={getStatusColor(selectedRequest.status)}>{selectedRequest.status}</IonBadge>
                      <IonBadge color="medium">{selectedRequest.priority}</IonBadge>
                    </div>
                  </IonCardContent>
                </IonCard>

                <IonList lines="full">
                  <IonItem><IonLabel><h3>Ticket No</h3><p>{selectedRequest.ticketNo}</p></IonLabel></IonItem>
                  <IonItem><IonLabel><h3>Category</h3><p>{selectedRequest.category}</p></IonLabel></IonItem>
                  <IonItem><IonLabel><h3>Description</h3><p>{selectedRequest.description}</p></IonLabel></IonItem>
                  <IonItem><IonLabel><h3>Purok</h3><p>{selectedRequest.purok}</p></IonLabel></IonItem>
                  <IonItem><IonLabel><h3>Address</h3><p>{selectedRequest.address}</p></IonLabel></IonItem>
                  <IonItem><IonLabel><h3>Resident</h3><p>{selectedRequest.submittedByName}</p></IonLabel></IonItem>
                  <IonItem><IonLabel><h3>Contact</h3><p>{selectedRequest.contactNumber}</p></IonLabel></IonItem>
                </IonList>

                <IonButton expand="block" color="primary" disabled={saving} style={{ marginTop: "16px" }} onClick={openStatusModal}>
                  {saving ? "Saving..." : "Change Status"}
                </IonButton>
              </>
            )}
          </IonContent>
        </IonModal>

        <IonModal isOpen={showStatusModal} onDidDismiss={() => setShowStatusModal(false)}>
          <IonHeader>
            <IonToolbar className="services-toolbar">
              <IonTitle style={{ fontSize: "15px", fontWeight: 700 }}>Update Progress & Collection</IonTitle>
              <IonButton aria-label="Close status editor" slot="end" fill="clear" color="light" onClick={() => setShowStatusModal(false)}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonList lines="full">
              <IonItem>
                <IonLabel position="stacked">Request status</IonLabel>
                <IonSelect value={statusDraft} onIonChange={(event) => setStatusDraft(event.detail.value)} interface="popover">
                  {statuses.slice(1).map((status) => <IonSelectOption key={status} value={status}>{status}</IonSelectOption>)}
                </IonSelect>
              </IonItem>
              {statusDraft === "Resolved" ? (
                <IonItem>
                  <IonLabel position="stacked">Amount actually collected (PHP)</IonLabel>
                  <IonInput type="number" min="0" step="0.01" inputMode="decimal" value={collectedAmount} onIonInput={(event) => setCollectedAmount(event.detail.value ?? "")} placeholder="0.00" />
                </IonItem>
              ) : (
                <>
                  <IonItem>
                    <IonLabel position="stacked">Service fee (PHP, optional)</IonLabel>
                    <IonInput type="number" min="0" step="0.01" inputMode="decimal" value={feeAmount} onIonInput={(event) => setFeeAmount(event.detail.value ?? "")} placeholder="0.00" />
                  </IonItem>
                  <IonItem>
                    <IonLabel position="stacked">Fee details (optional)</IonLabel>
                    <IonInput value={feeDescription} onIonInput={(event) => setFeeDescription(event.detail.value ?? "")} placeholder="Reason or service covered" />
                  </IonItem>
                </>
              )}
            </IonList>
            <p style={{ color: "#64748b", fontSize: "12px", lineHeight: 1.5 }}>
              {statusDraft === "Resolved"
                ? "Enter the amount received for this request. Enter 0.00 if no payment was collected."
                : "A branded PDF receipt records the assessed service fee and does not confirm payment."}
            </p>
            <IonButton expand="block" disabled={saving} onClick={() => void updateStatus()}>
              {saving ? "Saving..." : "Save Status"}
            </IonButton>
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMsg}
          duration={2000}
          color={toastColor}
          position="top"
        />
      </IonContent>
    </IonPage >
  );
};

export default ManageRequests;