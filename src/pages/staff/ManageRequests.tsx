// src/pages/staff/ManageRequests.tsx
import React, { useEffect, useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonBadge,
  IonCard,
  IonCardContent,
  IonText,
  IonButton,
  IonToast,
  IonModal,
  IonAlert,
} from "@ionic/react";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/config";
import { ServiceRequest } from "../../models/serviceRequest";

const statuses = ["All", "Pending", "In Progress", "Resolved"];

const ManageRequests: React.FC = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [filtered, setFiltered] = useState<ServiceRequest[]>([]);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showStatusAlert, setShowStatusAlert] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "requests"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ServiceRequest[];
      setRequests(data);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const result = requests.filter((r) => {
      const matchSearch =
        !search ||
        r.title?.toLowerCase().includes(search.toLowerCase()) ||
        r.ticketNo?.toLowerCase().includes(search.toLowerCase()) ||
        r.submittedByName?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = selectedStatus === "All" || r.status === selectedStatus;
      return matchSearch && matchStatus;
    });
    setFiltered(result);
  }, [requests, search, selectedStatus]);

  const updateStatus = async (newStatus: string) => {
    if (!selectedRequest?.id) return;
    try {
      await updateDoc(doc(db, "requests", selectedRequest.id), {
        status: newStatus,
      });
      setToastMsg(`Status updated to "${newStatus}"`);
      setShowToast(true);
      setShowModal(false);
    } catch (error) {
      console.error(error);
      setToastMsg("Failed to update status");
      setShowToast(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending": return "warning";
      case "In Progress": return "primary";
      case "Resolved": return "success";
      default: return "medium";
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="success">
          <IonTitle>Manage Requests</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar
            placeholder="Search ticket, title, or name"
            value={search}
            onIonChange={(e) => setSearch(e.detail.value!)}
          />
        </IonToolbar>
        <IonToolbar>
          <IonSegment
            value={selectedStatus}
            onIonChange={(e) => setSelectedStatus(e.detail.value as string)}
          >
            {statuses.map((s) => (
              <IonSegmentButton key={s} value={s}>
                <IonLabel>{s}</IonLabel>
              </IonSegmentButton>
            ))}
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {filtered.length === 0 ? (
          <IonText color="medium">
            <p style={{ textAlign: "center", marginTop: "40px" }}>
              No requests found.
            </p>
          </IonText>
        ) : (
          <IonList>
            {filtered.map((req) => (
              <IonItem
                key={req.id}
                button
                onClick={() => {
                  setSelectedRequest(req);
                  setShowModal(true);
                }}
              >
                <IonLabel>
                  <h2>{req.title}</h2>
                  <p>
                    <strong>{req.ticketNo}</strong> — {req.category}
                  </p>
                  <p>
                    {req.purok} | {req.submittedByName} | {req.contactNumber}
                  </p>
                  <IonBadge color={getStatusColor(req.status)}>
                    {req.status}
                  </IonBadge>
                  <IonBadge color="medium" style={{ marginLeft: "6px" }}>
                    {req.priority}
                  </IonBadge>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        )}

        <IonModal isOpen={showModal} onDidDismiss={() => setShowModal(false)}>
          <IonHeader>
            <IonToolbar color="success">
              <IonTitle>Request Details</IonTitle>
              <IonButton
                slot="end"
                fill="clear"
                color="light"
                onClick={() => setShowModal(false)}
              >
                Close
              </IonButton>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {selectedRequest && (
              <>
                <IonCard>
                  <IonCardContent>
                    <h2>{selectedRequest.title}</h2>
                    <IonBadge color={getStatusColor(selectedRequest.status)}>
                      {selectedRequest.status}
                    </IonBadge>
                    <IonBadge color="medium" style={{ marginLeft: "6px" }}>
                      {selectedRequest.priority}
                    </IonBadge>
                  </IonCardContent>
                </IonCard>

                <IonList>
                  <IonItem><IonLabel><h3>Ticket</h3><p>{selectedRequest.ticketNo}</p></IonLabel></IonItem>
                  <IonItem><IonLabel><h3>Category</h3><p>{selectedRequest.category}</p></IonLabel></IonItem>
                  <IonItem><IonLabel><h3>Description</h3><p>{selectedRequest.description}</p></IonLabel></IonItem>
                  <IonItem><IonLabel><h3>Purok</h3><p>{selectedRequest.purok}</p></IonLabel></IonItem>
                  <IonItem><IonLabel><h3>Address</h3><p>{selectedRequest.address}</p></IonLabel></IonItem>
                  <IonItem><IonLabel><h3>Resident</h3><p>{selectedRequest.submittedByName}</p></IonLabel></IonItem>
                  <IonItem><IonLabel><h3>Contact</h3><p>{selectedRequest.contactNumber}</p></IonLabel></IonItem>
                </IonList>

                <IonText><h3>Actions</h3></IonText>
                <IonButton
                  expand="block"
                  color="warning"
                  onClick={() => setShowStatusAlert(true)}
                >
                  Change Status
                </IonButton>
              </>
            )}
          </IonContent>
        </IonModal>

        <IonAlert
          isOpen={showStatusAlert}
          onDidDismiss={() => setShowStatusAlert(false)}
          header="Update Status"
          inputs={[
            { label: "Pending", type: "radio", value: "Pending", checked: selectedRequest?.status === "Pending" },
            { label: "In Progress", type: "radio", value: "In Progress", checked: selectedRequest?.status === "In Progress" },
            { label: "Resolved", type: "radio", value: "Resolved", checked: selectedRequest?.status === "Resolved" },
          ]}
          buttons={[
            { text: "Cancel", role: "cancel" },
            {
              text: "Save",
              handler: (value) => {
                if (value) updateStatus(value);
              },
            },
          ]}
        />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMsg}
          duration={2000}
          color="success"
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default ManageRequests;