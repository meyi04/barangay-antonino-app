import ResidentLogout from '../components/ResidentLogout';
import React, { useEffect, useMemo, useState } from "react";
import {
  IonAlert,
  IonBadge,
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonLoading,
  IonModal,
  IonPage,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToast,
  IonToolbar,
} from "@ionic/react";
import {
  closeOutline,
  createOutline,
  documentTextOutline,
  downloadOutline,
  filterOutline,
  trashOutline,
  warningOutline,
} from "ionicons/icons";
import { collection, doc, onSnapshot, query, runTransaction, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import type { ServiceRequest } from "../models/serviceRequest";

import BarangayLogo from '../components/BarangayLogo';
import { useNavigate } from 'react-router-dom';
import './Tab2.css';

const statuses = ["All", "Pending", "In Progress", "Resolved"];

const Tab2: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastColor, setToastColor] = useState("success");
  const [showLoading, setShowLoading] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showUpdateAlert, setShowUpdateAlert] = useState(false);
  const [updateData, setUpdateData] = useState<{ title: string; description: string } | null>(null);

  useEffect(() => {
    if (!user) {
      setRequests([]);
      return;
    }

    const residentRequests = query(
      collection(db, "requests"),
      where("submittedByUid", "==", user.uid)
    );

    const unsubscribe = onSnapshot(residentRequests, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as ServiceRequest[];
      setRequests(data);
    });

    return () => unsubscribe();
  }, [user]);

  const filtered = useMemo(() => {
    return requests.filter((request) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        request.title?.toLowerCase().includes(term) ||
        request.ticketNo?.toLowerCase().includes(term) ||
        request.submittedByName?.toLowerCase().includes(term) ||
        request.category?.toLowerCase().includes(term);

      const matchesStatus = selectedStatus === "All" || request.status === selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }, [requests, searchTerm, selectedStatus]);

  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((item) => item.status === "Pending").length,
      inProgress: requests.filter((item) => item.status === "In Progress").length,
      resolved: requests.filter((item) => item.status === "Resolved").length,
    };
  }, [requests]);

  const availableReceipts = useMemo(
    () => requests.filter((request) => request.status !== "Resolved" && request.receiptPdfData),
    [requests],
  );

  const showToastMsg = (message: string, color: string) => {
    setToastMsg(message);
    setToastColor(color);
    setShowToast(true);
  };

  const downloadReceipt = async (request: ServiceRequest) => {
    if (!request.receiptPdfData || request.status === "Resolved") return;
    try {
      const [metadata, base64] = request.receiptPdfData.split(",", 2);
      if (metadata !== "data:application/pdf;base64" || !base64) {
        throw new Error("Invalid receipt PDF data.");
      }
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${request.ticketNo || request.id}-receipt.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error(error);
      showToastMsg("Unable to download this receipt. Check your connection and try again.", "danger");
    }
  };

  const openDetails = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const openUpdate = (request: ServiceRequest) => {
    if (request.status !== "Pending") {
      showToastMsg("Only pending requests can be edited.", "warning");
      return;
    }

    setSelectedRequest(request);
    setUpdateData({
      title: request.title,
      description: request.description,
    });
    setShowUpdateAlert(true);
  };

  const confirmUpdate = async (data: { title: string; description: string }) => {
    if (!selectedRequest?.id || selectedRequest.status !== "Pending") {
      showToastMsg("Only pending requests can be edited.", "warning");
      return;
    }

    setShowLoading(true);

    try {
      const requestRef = doc(db, "requests", selectedRequest.id);
      await runTransaction(db, async (transaction) => {
        const requestSnapshot = await transaction.get(requestRef);
        if (!requestSnapshot.exists() || requestSnapshot.data().status !== "Pending") {
          throw new Error("This request is no longer pending");
        }

        transaction.update(requestRef, {
          title: data.title,
          description: data.description,
        });
      });

      showToastMsg("Request updated successfully.", "success");
    } catch (error) {
      console.error(error);
      showToastMsg("Failed to update request.", "danger");
    } finally {
      setShowLoading(false);
      setSelectedRequest(null);
      setUpdateData(null);
      setShowUpdateAlert(false);
    }
  };

  const confirmDelete = (id: string) => {
    const request = requests.find((item) => item.id === id);
    if (!request || request.status !== "Pending") {
      showToastMsg("Only pending requests can be deleted.", "warning");
      return;
    }

    setDeleteId(id);
    setShowDeleteAlert(true);
  };

  const doDelete = async () => {
    if (!deleteId) return;

    setShowLoading(true);

    try {
      const requestRef = doc(db, "requests", deleteId);
      await runTransaction(db, async (transaction) => {
        const requestSnapshot = await transaction.get(requestRef);
        if (!requestSnapshot.exists() || requestSnapshot.data().status !== "Pending") {
          throw new Error("This request is no longer pending");
        }

        transaction.delete(requestRef);
      });

      showToastMsg("Request deleted.", "medium");
    } catch (error) {
      console.error(error);
      showToastMsg("Failed to delete request.", "danger");
    } finally {
      setShowLoading(false);
      setDeleteId(null);
      setShowDeleteAlert(false);
    }
  };

  const getStatusColor = (status: string): string => {
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
    <IonPage className="requests-page">
      <IonHeader className="ion-no-border">
        <IonToolbar className="requests-toolbar">
          <div className="requests-brand">
            <BarangayLogo size={36} />
            <div><small>Republika ng Pilipinas</small><strong>Barangay Antonino</strong></div>
            <ResidentLogout />
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent className="civic-content ion-padding requests-content">
        <div className="requests-shell">
          <p className="requests-eyebrow">Official Citizen Portal • My Requests</p>
          <div className="requests-hero">
            <span className="requests-pill"><IonIcon icon={documentTextOutline} /> {stats.total} Total Requests</span>
            <h1>My Requests</h1>
            <p>Keep track of your certificates and community concerns, from submission to resolution.</p>
          </div>
          {availableReceipts.length > 0 && (
            <section aria-label="Available request receipts" style={{ background: "#fff", border: "1px solid #dce7df", borderRadius: "12px", padding: "12px", marginBottom: "14px" }}>
              <h2 style={{ margin: "0 0 8px", color: "#0f2942", fontSize: "14px", fontWeight: 800 }}>Available Receipts</h2>
              {availableReceipts.map((request) => (
                <div key={request.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", borderTop: "1px solid #e2e8f0", paddingTop: "8px", marginTop: "8px" }}>
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ display: "block", color: "#0f172a", fontSize: "12px" }}>{request.ticketNo || request.title}</strong>
                    <span style={{ color: "#64748b", fontSize: "11px" }}>PHP {(request.receiptFeeAmount || 0).toFixed(2)}</span>
                  </div>
                  <IonButton fill="outline" size="small" onClick={() => void downloadReceipt(request)}>
                    <IonIcon icon={downloadOutline} slot="start" /> PDF
                  </IonButton>
                </div>
              ))}
            </section>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px", marginBottom: "16px" }}>
            {[{ label: "Pending", value: stats.pending, color: "#f59e0b" }, { label: "In Progress", value: stats.inProgress, color: "#2563eb" }, { label: "Resolved", value: stats.resolved, color: "#16a34a" }].map((item) => (
              <div key={item.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px", boxShadow: "0 4px 18px rgba(0,0,0,0.04)", padding: "12px 10px", textAlign: "center" }}>
                <div style={{ fontSize: "18px", fontWeight: 800, color: item.color }}>{item.value}</div>
                <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>{item.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "8px 12px", boxShadow: "0 4px 18px rgba(0,0,0,0.04)", marginBottom: "12px" }}>
            <IonSearchbar
              placeholder="Search ticket or title"
              value={searchTerm}
              onIonChange={(event) => setSearchTerm(event.detail.value ?? "")}
              style={{ padding: 0 }}
            />
          </div>

          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "4px", marginBottom: "14px", boxShadow: "0 4px 18px rgba(0,0,0,0.04)" }}>
            <IonSegment value={selectedStatus} onIonChange={(e) => setSelectedStatus(e.detail.value as string)}>
              {statuses.map((status) => (
                <IonSegmentButton key={status} value={status}>
                  <IonLabel>{status}</IonLabel>
                </IonSegmentButton>
              ))}
            </IonSegment>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", paddingLeft: "4px" }}>
            <IonIcon icon={filterOutline} style={{ color: "#0d6840", fontSize: "18px" }} />
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#0f2942" }}>Your Requests ({filtered.length})</span>
          </div>

          {filtered.length === 0 ? (
            <div style={{ background: "#fff", border: "1px dashed #cbd5e1", borderRadius: "16px", padding: "32px 20px", textAlign: "center" }}>
              <IonIcon icon={warningOutline} style={{ fontSize: "28px", color: "#94a3b8" }} />
              <div style={{ marginTop: "8px", fontWeight: 700, color: "#475569" }}>{requests.length === 0 ? "No requests yet" : "No matching requests"}</div>
              <p className="requests-empty-hint">{requests.length === 0 ? "Apply for a certificate or submit a complaint to get started." : "Try a different search or status filter."}</p>
              {requests.length === 0 ? <IonButton onClick={() => navigate("/tab2")}>Browse Services</IonButton> : <IonButton fill="outline" onClick={() => { setSearchTerm(""); setSelectedStatus("All"); }}>Clear Filters</IonButton>}
            </div>
          ) : (
            <IonList className="requests-list" lines="none" style={{ background: "transparent", padding: 0 }}>
              {filtered.map((request) => (
                <IonItem key={request.id} button onClick={() => openDetails(request)} style={{ "--background": "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", marginBottom: "10px", overflow: "hidden" }}>
                  <div slot="start" style={{ width: "46px", height: "46px", borderRadius: "12px", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <IonIcon icon={documentTextOutline} style={{ color: "#0d6840", fontSize: "22px" }} />
                  </div>
                  <IonLabel>
                    <h2 style={{ fontWeight: 800, color: "#0f172a" }}>{request.title}</h2>
                    <p style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
                      <strong>{request.ticketNo}</strong> • {request.category}
                    </p>
                    <p style={{ fontSize: "11px", color: "#64748b" }}>{request.purok} • {request.submittedByName}</p>
                    <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                      <IonBadge color={getStatusColor(request.status)}>{request.status}</IonBadge>
                      <IonBadge color="medium">{request.priority}</IonBadge>
                    </div>
                  </IonLabel>
                  {request.status === "Pending" && (
                    <div slot="end" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <IonButton fill="clear" size="small" color="primary" aria-label="Edit request" onClick={(event) => { event.stopPropagation(); openUpdate(request); }}>
                        <IonIcon icon={createOutline} slot="icon-only" />
                      </IonButton>
                      <IonButton fill="clear" size="small" color="danger" aria-label="Delete request" onClick={(event) => { event.stopPropagation(); confirmDelete(request.id!); }}>
                        <IonIcon icon={trashOutline} slot="icon-only" />
                      </IonButton>
                    </div>
                  )}
                </IonItem>
              ))}
            </IonList>
          )}

        </div>
        <IonModal className="requests-details" isOpen={isModalOpen} onDidDismiss={() => setIsModalOpen(false)} breakpoints={[0, 0.75, 0.95]} initialBreakpoint={0.75}>
          <IonHeader>
            <IonToolbar className="requests-toolbar">
              <IonTitle style={{ fontSize: "15px", fontWeight: 700 }}>Request Details</IonTitle>
              <IonButton aria-label="Close request details" slot="end" fill="clear" color="light" onClick={() => setIsModalOpen(false)}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {selectedRequest && (
              <>
                <IonCard style={{ borderRadius: "16px", boxShadow: "0 4px 18px rgba(0,0,0,0.04)" }}>
                  <IonCardContent>
                    <div style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "8px" }}>Ticket</div>
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
                  <IonItem><IonLabel><h3>Submitted By</h3><p>{selectedRequest.submittedByName}</p></IonLabel></IonItem>
                  <IonItem><IonLabel><h3>Contact</h3><p>{selectedRequest.contactNumber}</p></IonLabel></IonItem>
                </IonList>

                {selectedRequest.status === "Pending" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "16px" }}>
                    <IonButton expand="block" onClick={() => { setIsModalOpen(false); openUpdate(selectedRequest); }}>Edit</IonButton>
                    <IonButton expand="block" color="danger" onClick={() => confirmDelete(selectedRequest.id!)}>Delete</IonButton>
                  </div>
                )}
              </>
            )}
          </IonContent>
        </IonModal>

        <IonAlert
          isOpen={showUpdateAlert}
          onDidDismiss={() => setShowUpdateAlert(false)}
          header="Update Request"
          inputs={[
            { name: "title", type: "text", value: updateData?.title || "", placeholder: "Title" },
            { name: "description", type: "textarea", value: updateData?.description || "", placeholder: "Description" },
          ]}
          buttons={[
            { text: "Cancel", role: "cancel" },
            {
              text: "Update",
              handler: (data) => {
                if (data.title && data.description) {
                  void confirmUpdate({ title: data.title, description: data.description });
                  return true;
                }
                showToastMsg("Please complete all fields.", "warning");
                return false;
              },
            },
          ]}
        />

        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Confirm Delete"
          message="Are you sure you want to delete this request?"
          buttons={[
            { text: "Cancel", role: "cancel" },
            {
              text: "Delete",
              role: "destructive",
              handler: () => {
                void doDelete();
              },
            },
          ]}
        />

        <IonLoading isOpen={showLoading} message="Please wait..." />

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

export default Tab2;
