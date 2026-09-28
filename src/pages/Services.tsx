import ResidentLogout from '../components/ResidentLogout';
import React, { useEffect, useRef, useState } from "react";
import { IonButton, IonContent, IonHeader, IonInput, IonItem, IonList, IonPage, IonSelect, IonSelectOption, IonTextarea, IonIcon, IonToolbar } from "@ionic/react";
import { collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useLocation, useNavigate } from "react-router-dom";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import type { ServiceRequest } from "../models/serviceRequest";

import BarangayLogo from '../components/BarangayLogo';
import { documentTextOutline, chatbubbleEllipsesOutline, shieldCheckmark, timeOutline } from 'ionicons/icons';
import './Services.css';

const services = ["Barangay Clearance", "Certificate of Indigency", "Certificate of Residency"];
const complaints = ["Noise Complaint", "Waste / Sanitation", "Street Light Repair", "Drainage / Flooding", "Other Complaint"];

const Services: React.FC = () => {
  const { user, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [kind, setKind] = useState("service");
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [purok, setPurok] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [error, setError] = useState("");
  const [ticket, setTicket] = useState("");

  useEffect(() => {
    setName((value) => value || profile?.fullName || "");
    setContact((value) => value || profile?.contactNumber || "");
    setPurok((value) => value || profile?.purok || "");
  }, [profile]);

  useEffect(() => {
    const prefill = sessionStorage.getItem("antonino_prefill_category");
    if (prefill && [...services, ...complaints].includes(prefill)) {
      setKind(services.includes(prefill) ? "service" : "complaint");
      setCategory(prefill);
      setTicket("");
    }
    sessionStorage.removeItem("antonino_prefill_category");
  }, [location.key]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting.current) return;
    setError("");
    setTicket("");
    if (!user) { setError("Please sign in to submit a request."); return; }
    const categories = kind === "service" ? services : complaints;
    if (!categories.includes(category) || ![name, contact, purok, address, description].every((value) => value.trim()) || (kind === "complaint" && !title.trim())) {
      setError("Please complete all required fields."); return;
    }
    if (!/^(09\d{9}|\+639\d{9})$/.test(contact.replace(/[\s-]/g, ""))) {
      setError("Enter a valid Philippine mobile number (09xxxxxxxxx or +639xxxxxxxxx)."); return;
    }
    submitting.current = true;
    setBusy(true);
    try {
      const requestRef = doc(collection(db, "requests"));
      const ticketNo = `BRGY-${new Date().getFullYear()}-${requestRef.id}`;
      const request: ServiceRequest = {
        ticketNo, category, title: kind === "service" ? category : title.trim(),
        description: description.trim(), purok, address: address.trim(),
        priority: "Medium", status: "Pending", submittedByName: name.trim(),
        submittedByUid: user.uid, contactNumber: contact.replace(/[\s-]/g, ""), createdAt: serverTimestamp(),
      };
      await setDoc(requestRef, request);
      setTicket(ticketNo);
      setTitle(""); setDescription(""); setCategory("");
    } catch (err) {
      console.error("Request submission failed", err);
      setError("Unable to submit your request. Your details are still here; please try again.");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  return (
    <IonPage className="services-page">
      <IonHeader className="ion-no-border">
        <IonToolbar className="services-toolbar">
          <div className="services-brand">
            <BarangayLogo size={36} />
            <div><small>Republika ng Pilipinas</small><strong>Barangay Antonino</strong></div>
            <ResidentLogout />
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent className="civic-content ion-padding services-content">
        <div className="services-shell">
          <p className="services-eyebrow">Official Citizen Portal • Services</p>
          <div className="services-hero">
            <span className="services-pill"><IonIcon icon={shieldCheckmark} /> Barangay E-Services</span>
            <h1>How can we help you?</h1>
            <p>Apply for barangay certificates or share a community concern. Your requests, all in one place.</p>
          </div>
          <h2 className="services-section-title">Choose a service</h2>
          <p className="services-hint">Select an option below to get started.</p>
          <div className="services-choices" role="group" aria-label="Request type">
            {[
              { value: "service", label: "Barangay E-Services", hint: "Clearance, indigency & residency", icon: documentTextOutline },
              { value: "complaint", label: "File a Complaint", hint: "Noise, waste & community concerns", icon: chatbubbleEllipsesOutline },
            ].map((option) => (
              <button key={option.value} type="button" className="services-choice" aria-pressed={kind === option.value} disabled={busy}
                onClick={() => { if (kind !== option.value) { setKind(option.value); setCategory(""); setTicket(""); setError(""); } }}>
                <span className={`services-choice-icon ${option.value}`}><IonIcon icon={option.icon} /></span>
                <strong>{option.label}</strong><small>{option.hint}</small>
              </button>
            ))}
          </div>
          {ticket && <div role="status" className="services-success">
            <strong>Submitted successfully!</strong><p>Ticket: {ticket}</p>
            <IonButton onClick={() => navigate("/tab3")}>View My Requests</IonButton>
          </div>}
          <form className="services-form" onSubmit={(event) => void submit(event)}>
            <fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
              <div className="services-form-heading">
                <h2 className="services-section-title">{kind === "service" ? "Request a Certificate" : "Tell Us Your Concern"}</h2>
                <p className="services-hint">{kind === "service" ? "Complete your details and tell us the purpose of your request." : "Provide the location and details so the barangay can review your complaint."} Fields marked * are required.</p>
              </div>
              <IonList>
                <IonItem><IonSelect label={kind === "service" ? "Certificate *" : "Complaint category *"} labelPlacement="stacked" placeholder="Choose a category" value={category} disabled={busy} onIonChange={(event) => setCategory(event.detail.value)}>
                  {(kind === "service" ? services : complaints).map((item) => <IonSelectOption key={item} value={item}>{item}</IonSelectOption>)}
                </IonSelect></IonItem>
                <IonItem><IonInput label="Full name *" labelPlacement="stacked" value={name} disabled={busy} onIonInput={(event) => setName(event.detail.value || "")} /></IonItem>
                <IonItem><IonInput label="Mobile number *" labelPlacement="stacked" type="tel" placeholder="09xxxxxxxxx" value={contact} disabled={busy} onIonInput={(event) => setContact(event.detail.value || "")} /></IonItem>
                <IonItem><IonSelect label="Purok *" labelPlacement="stacked" value={purok} disabled={busy} onIonChange={(event) => setPurok(event.detail.value)}>
                  {[1, 2, 3, 4, 5, 6].map((number) => <IonSelectOption key={number} value={`Purok ${number}`}>Purok {number}</IonSelectOption>)}
                </IonSelect></IonItem>
                <IonItem><IonInput label={kind === "service" ? "Complete address *" : "Incident address / landmark *"} labelPlacement="stacked" value={address} disabled={busy} onIonInput={(event) => setAddress(event.detail.value || "")} /></IonItem>
                {kind === "complaint" && <IonItem><IonInput label="Complaint subject *" labelPlacement="stacked" value={title} maxlength={150} disabled={busy} onIonInput={(event) => setTitle(event.detail.value || "")} /></IonItem>}
                <IonItem><IonTextarea label={kind === "service" ? "Purpose of request *" : "Complaint details *"} labelPlacement="stacked" placeholder={kind === "service" ? "Explain what you need the certificate for." : "Describe what happened, when, and where."} value={description} autoGrow rows={4} disabled={busy} onIonInput={(event) => setDescription(event.detail.value || "")} /></IonItem>
              </IonList>
              {error && <p role="alert" className="services-error">{error}</p>}
              <IonButton type="submit" expand="block" disabled={busy || !user} className="services-submit">{busy ? "Submitting..." : kind === "service" ? "Submit Service Request" : "Submit Complaint"}</IonButton>
            </fieldset>
          </form>
          <div className="services-footer"><IonIcon icon={timeOutline} /> Follow your request status in My Requests</div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Services;
