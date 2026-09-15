// src/pages/Tab2.tsx
import React, { useEffect, useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonRefresher,
  IonRefresherContent,
  IonModal,
  IonButton,
  IonText,
  IonToast,
  IonLoading,
  IonAlert,
  IonCard,
  IonCardContent,
} from "@ionic/react";
import {
  collection,
  onSnapshot,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { ServiceRequest } from "../models/serviceRequest";

const statuses = ["All", "Pending", "In Progress", "Resolved"];

const Tab2: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [filtered, setFiltered] = useState<ServiceRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastColor, setToastColor] = useState("success");

  const [showLoading, setShowLoading] = useState(false);

  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [showUpdateAlert, setShowUpdateAlert] = useState(false);
  const [updateData, setUpdateData] = useState<any>(null);

  // 📖 READ — real-time listener
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
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as ServiceRequest[];
      setRequests(data);
    });
    return () => unsubscribe();
  }, [user]);

  // 🔍 Apply search + segment filter
  useEffect(() => {
    const result = requests.filter((r) => {
      const matchSearch =
        !searchTerm ||
        r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.ticketNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.submittedByName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        selectedStatus === "All" || r.status === selectedStatus;

      return matchSearch && matchStatus;
    });
    setFiltered(result);
  }, [requests, searchTerm, selectedStatus]);

  const showToastMsg = (msg: string, color: string) => {
    setToastMsg(msg);
    setToastColor(color);
    setShowToast(true);
  };

  // 🔄 Refresher
  const doRefresh = (event: any) => {
    setTimeout(() => {
      event.detail.complete();
    }, 1000);
  };

  // 👁️ Open modal
  const openDetails = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  // ✏️ UPDATE
  const openUpdate = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setUpdateData({
      title: request.title,
      description: request.description,
      status: request.status,
    });
    setShowUpdateAlert(true);
  };

  const confirmUpdate = async () => {
    if (!selectedRequest?.id || !updateData) return;
    setShowLoading(true);
    try {
      await updateDoc(doc(db, "requests", selectedRequest.id), {
        title: updateData.title,
        description: updateData.description,
        status: updateData.status,
      });
      showToastMsg("Request updated successfully", "success");
    } catch (error) {
      console.error(error);
      showToastMsg("Failed to update request", "danger");
    } finally {
      setShowLoading(false);
      setSelectedRequest(null);
      setUpdateData(null);
    }
  };

  // 🗑️ DELETE
  const confirmDelete = (id: string) => {
    setDeleteId(id);
    setShowDeleteAlert(true);
  };

  const doDelete = async () => {
    if (!deleteId) return;
    setShowLoading(true);
    try {
      await deleteDoc(doc(db, "requests", deleteId));
      showToastMsg("Request deleted", "medium");
    } catch (error) {
      console.error(error);
      showToastMsg("Failed to delete request", "danger");
    } finally {
      setShowLoading(false);
      setDeleteId(null);
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
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>All Requests</IonTitle>
        </IonToolbar>

        {/* 🔍 Searchbar */}
        <IonToolbar>
          <IonSearchbar
            placeholder="Search by ticket, title, or name"
            value={searchTerm}
            onIonChange={(e) => setSearchTerm(e.detail.value!)}
          />
        </IonToolbar>

        {/* 📑 Segment filter */}
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
        {/* 🔄 Refresher */}
        <IonRefresher slot="fixed" onIonRefresh={doRefresh}>
          <IonRefresherContent></IonRefresherContent>
        </IonRefresher>

        <IonList>
          {filtered.map((req) => (
            <IonItemSliding key={req.id}>
              <IonItem button onClick={() => openDetails(req)}>
                <IonLabel>
                  <h2>{req.title}</h2>
                  <p>
                    <strong>{req.ticketNo}</strong> — {req.category}
                  </p>
                  <p>
                    {req.purok} | {req.submittedByName}
                  </p>
                  <IonBadge color={getStatusColor(req.status)}>
                    {req.status}
                  </IonBadge>
                  <IonBadge color="medium" style={{ marginLeft: "6px" }}>
                    {req.priority}
                  </IonBadge>
                </IonLabel>
              </IonItem>

              <IonItemOptions side="end">
                <IonItemOption color="primary" onClick={() => openUpdate(req)}>
                  Update
                </IonItemOption>
                <IonItemOption color="danger" onClick={() => confirmDelete(req.id!)}>
                  Delete
                </IonItemOption>
              </IonItemOptions>
            </IonItemSliding>
          ))}
        </IonList>

        {filtered.length === 0 && (
          <IonText color="medium">
            <p style={{ textAlign: "center", marginTop: "40px" }}>
              No requests found.
            </p>
          </IonText>
        )}

        {/* 👁️ Modal for details */}
        <IonModal isOpen={isModalOpen} onDidDismiss={() => setIsModalOpen(false)}>
          <IonHeader>
            <IonToolbar color="primary">
              <IonTitle>Request Details</IonTitle>
              <IonButton slot="end" fill="clear" color="light" onClick={() => setIsModalOpen(false)}>
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
                  <IonItem>
                    <IonLabel>
                      <h3>Ticket No</h3>
                      <p>{selectedRequest.ticketNo}</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem>
                    <IonLabel>
                      <h3>Category</h3>
                      <p>{selectedRequest.category}</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem>
                    <IonLabel>
                      <h3>Description</h3>
                      <p>{selectedRequest.description}</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem>
                    <IonLabel>
                      <h3>Purok</h3>
                      <p>{selectedRequest.purok}</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem>
                    <IonLabel>
                      <h3>Address</h3>
                      <p>{selectedRequest.address}</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem>
                    <IonLabel>
                      <h3>Submitted By</h3>
                      <p>{selectedRequest.submittedByName}</p>
                    </IonLabel>
                  </IonItem>
                  <IonItem>
                    <IonLabel>
                      <h3>Contact</h3>
                      <p>{selectedRequest.contactNumber}</p>
                    </IonLabel>
                  </IonItem>
                </IonList>
              </>
            )}
          </IonContent>
        </IonModal>

        {/* ✏️ Update Alert with inputs */}
        <IonAlert
          isOpen={showUpdateAlert}
          onDidDismiss={() => setShowUpdateAlert(false)}
          header="Update Request"
          inputs={[
            {
              name: "title",
              type: "text",
              value: updateData?.title || "",
              placeholder: "Title",
            },
            {
              name: "description",
              type: "textarea",
              value: updateData?.description || "",
              placeholder: "Description",
            },
            {
              name: "status",
              type: "text",
              value: updateData?.status || "",
              placeholder: "Status (Pending/In Progress/Resolved)",
            },
          ]}
          buttons={[
            { text: "Cancel", role: "cancel" },
            {
              text: "Update",
              handler: (data) => {
                setUpdateData({
                  title: data.title,
                  description: data.description,
                  status: data.status,
                });
                // Trigger update after alert closes
                setTimeout(() => confirmUpdate(), 100);
                return true;
              },
            },
          ]}
        />

        {/* 🗑️ Delete Alert */}
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
                doDelete();
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
    </IonPage>
  );
};

export default Tab2;
