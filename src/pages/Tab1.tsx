// src/pages/Tab1.tsx
import React, { useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonCard,
  IonCardContent,
  IonText,
  IonToast,
  IonLoading,
} from "@ionic/react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { ServiceRequest } from "../models/serviceRequest";

const categories = [
  "Street Light Repair",
  "Garbage Collection",
  "Road/Pothole Repair",
  "Water Leak",
  "Drainage/Flooding",
  "Noise Complaint",
  "Stray Animals",
  "Peace & Order Concern",
  "Document Request",
  "Others",
];

const puroks = ["Purok 1", "Purok 2", "Purok 3", "Purok 4", "Purok 5", "Purok 6"];

const Tab1: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastColor, setToastColor] = useState("success");
  const [showToast, setShowToast] = useState(false);

  const [newRequest, setNewRequest] = useState<ServiceRequest>({
    category: "",
    title: "",
    description: "",
    purok: "",
    address: "",
    priority: "Medium",
    status: "Pending",
    submittedByName: "",
    contactNumber: "",
  });

  const handleChange = (field: keyof ServiceRequest, value: any) => {
    setNewRequest((prev) => ({ ...prev, [field]: value }));
  };

  const generateTicketNo = (): string => {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `BRGY-${year}-${random}`;
  };

  const showToastMsg = (msg: string, color: string) => {
    setToastMsg(msg);
    setToastColor(color);
    setShowToast(true);
  };

  const addRequest = async () => {
    if (!user) {
      showToastMsg("Please log in before submitting a request", "warning");
      return;
    }

    // Validation
    if (
      !newRequest.category ||
      !newRequest.title ||
      !newRequest.description ||
      !newRequest.purok ||
      !newRequest.submittedByName ||
      !newRequest.contactNumber
    ) {
      showToastMsg("Please fill in all required fields", "warning");
      return;
    }

    setLoading(true);
    try {
      const ticketNo = generateTicketNo();

      await addDoc(collection(db, "requests"), {
        ...newRequest,
        submittedByUid: user.uid,
        ticketNo,
        status: "Pending",
        createdAt: serverTimestamp(),
      });

      showToastMsg(`Request submitted! Ticket: ${ticketNo}`, "success");

      // Reset form
      setNewRequest({
        category: "",
        title: "",
        description: "",
        purok: "",
        address: "",
        priority: "Medium",
        status: "Pending",
        submittedByName: "",
        contactNumber: "",
      });
    } catch (error) {
      console.error(error);
      showToastMsg("Failed to submit request", "danger");
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Submit Request</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonCard>
          <IonCardContent>
            <IonText color="medium">
              <p style={{ fontSize: "13px", margin: 0 }}>
                Fill out the form to submit a service request or complaint to
                Barangay Antonino.
              </p>
            </IonText>
          </IonCardContent>
        </IonCard>

        {/* Category */}
        <IonItem>
          <IonLabel position="stacked">Category *</IonLabel>
          <IonSelect
            value={newRequest.category}
            placeholder="Select category"
            onIonChange={(e) => handleChange("category", e.detail.value)}
          >
            {categories.map((cat) => (
              <IonSelectOption key={cat} value={cat}>
                {cat}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>

        {/* Title */}
        <IonItem>
          <IonLabel position="stacked">Title / Subject *</IonLabel>
          <IonInput
            value={newRequest.title}
            placeholder="e.g., Sirang ilaw sa kanto"
            onIonChange={(e) => handleChange("title", e.detail.value)}
          />
        </IonItem>

        {/* Description */}
        <IonItem>
          <IonLabel position="stacked">Description *</IonLabel>
          <IonTextarea
            value={newRequest.description}
            placeholder="Describe the issue..."
            rows={4}
            onIonChange={(e) => handleChange("description", e.detail.value)}
          />
        </IonItem>

        {/* Purok */}
        <IonItem>
          <IonLabel position="stacked">Purok *</IonLabel>
          <IonSelect
            value={newRequest.purok}
            placeholder="Select purok"
            onIonChange={(e) => handleChange("purok", e.detail.value)}
          >
            {puroks.map((p) => (
              <IonSelectOption key={p} value={p}>
                {p}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>

        {/* Address */}
        <IonItem>
          <IonLabel position="stacked">Address / Landmark *</IonLabel>
          <IonInput
            value={newRequest.address}
            placeholder="e.g., 123 Mabini St., near covered court"
            onIonChange={(e) => handleChange("address", e.detail.value)}
          />
        </IonItem>

        {/* Priority */}
        <IonItem>
          <IonLabel position="stacked">Priority</IonLabel>
          <IonSelect
            value={newRequest.priority}
            onIonChange={(e) => handleChange("priority", e.detail.value)}
          >
            <IonSelectOption value="Low">Low</IonSelectOption>
            <IonSelectOption value="Medium">Medium</IonSelectOption>
            <IonSelectOption value="High">High</IonSelectOption>
            <IonSelectOption value="Urgent">Urgent</IonSelectOption>
          </IonSelect>
        </IonItem>

        {/* Name */}
        <IonItem>
          <IonLabel position="stacked">Your Full Name *</IonLabel>
          <IonInput
            value={newRequest.submittedByName}
            placeholder="Juan Dela Cruz"
            onIonChange={(e) =>
              handleChange("submittedByName", e.detail.value)
            }
          />
        </IonItem>

        {/* Contact */}
        <IonItem>
          <IonLabel position="stacked">Contact Number *</IonLabel>
          <IonInput
            type="tel"
            value={newRequest.contactNumber}
            placeholder="09171234567"
            onIonChange={(e) => handleChange("contactNumber", e.detail.value)}
          />
        </IonItem>

        <IonButton
          expand="block"
          color="primary"
          onClick={addRequest}
          style={{ marginTop: "24px", marginBottom: "32px" }}
        >
          Submit Request
        </IonButton>

        <IonLoading isOpen={loading} message="Submitting request..." />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMsg}
          duration={2500}
          color={toastColor}
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default Tab1;
