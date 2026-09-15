// src/pages/Register.tsx
import React, { useState } from "react";
import {
  IonContent,
  IonPage,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonCard,
  IonCardContent,
  IonSelect,
  IonSelectOption,
  IonToast,
  IonLoading,
} from "@ionic/react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";

const puroks = ["Purok 1", "Purok 2", "Purok 3", "Purok 4", "Purok 5", "Purok 6"];

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    contactNumber: "",
    purok: "",
  });
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);

  const handleRegister = async () => {
    const { fullName, email, password, contactNumber, purok } = form;

    if (!fullName || !email || !password || !contactNumber || !purok) {
      setToastMsg("Please fill in all fields");
      setShowToast(true);
      return;
    }

    if (password.length < 6) {
      setToastMsg("Password must be at least 6 characters");
      setShowToast(true);
      return;
    }

    setLoading(true);
    try {
      await registerUser(email, password, fullName, "resident", purok, contactNumber);
      setToastMsg("Account created!");
      setShowToast(true);

      setTimeout(() => {
        navigate("/tab1", { replace: true });
      }, 1500);
    } catch (error: any) {
      console.error(error);
      setToastMsg("Registration failed: " + (error.message || "Unknown error"));
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <h2 style={{ textAlign: "center", marginTop: "20px" }}>Create Account</h2>

        <IonCard>
          <IonCardContent>
            <IonItem>
              <IonLabel position="stacked">Full Name</IonLabel>
              <IonInput
                value={form.fullName}
                placeholder="Juan Dela Cruz"
                onIonChange={(e) => setForm({ ...form, fullName: e.detail.value! })}
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Email</IonLabel>
              <IonInput
                type="email"
                value={form.email}
                placeholder="you@example.com"
                onIonChange={(e) => setForm({ ...form, email: e.detail.value! })}
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Password</IonLabel>
              <IonInput
                type="password"
                value={form.password}
                placeholder="At least 6 characters"
                onIonChange={(e) => setForm({ ...form, password: e.detail.value! })}
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Contact Number</IonLabel>
              <IonInput
                type="tel"
                value={form.contactNumber}
                placeholder="09171234567"
                onIonChange={(e) => setForm({ ...form, contactNumber: e.detail.value! })}
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Purok</IonLabel>
              <IonSelect
                value={form.purok}
                placeholder="Select purok"
                onIonChange={(e) => setForm({ ...form, purok: e.detail.value })}
              >
                {puroks.map((p) => (
                  <IonSelectOption key={p} value={p}>
                    {p}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>

            <IonButton
              expand="block"
              style={{ marginTop: "20px" }}
              onClick={handleRegister}
            >
              Register
            </IonButton>

            <IonButton expand="block" fill="clear" routerLink="/login">
              Already have an account? Login
            </IonButton>
          </IonCardContent>
        </IonCard>

        <IonLoading isOpen={loading} message="Creating account..." />
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMsg}
          duration={2500}
          color="success"
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default Register;
