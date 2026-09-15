// src/pages/Login.tsx
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
  IonCardTitle,
  IonText,
  IonToast,
  IonLoading,
  IonIcon,
} from "@ionic/react";
import { useNavigate } from "react-router-dom";
import { businessOutline } from "ionicons/icons";
import { loginUser } from "../services/authService";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setToastMsg("Please enter email and password");
      setShowToast(true);
      return;
    }

    setLoading(true);
    try {
      await loginUser(email, password);
      navigate("/tab1", { replace: true });
    } catch (error: any) {
      console.error(error);
      setToastMsg("Login failed: " + (error.message || "Unknown error"));
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="ion-padding">
        <div style={{ textAlign: "center", marginTop: "60px", marginBottom: "20px" }}>
          <IonIcon
            icon={businessOutline}
            style={{ fontSize: "56px", color: "var(--ion-color-primary)" }}
          />
          <h1 style={{ margin: "8px 0" }}>eBarangay Antonino</h1>
          <IonText color="medium">
            <p>Sign in to continue</p>
          </IonText>
        </div>

        <IonCard>
          <IonCardContent>
            <IonItem>
              <IonLabel position="stacked">Email</IonLabel>
              <IonInput
                type="email"
                value={email}
                placeholder="you@example.com"
                onIonChange={(e) => setEmail(e.detail.value!)}
              />
            </IonItem>

            <IonItem>
              <IonLabel position="stacked">Password</IonLabel>
              <IonInput
                type="password"
                value={password}
                placeholder="••••••"
                onIonChange={(e) => setPassword(e.detail.value!)}
              />
            </IonItem>

            <IonButton
              expand="block"
              style={{ marginTop: "20px" }}
              onClick={handleLogin}
            >
              Login
            </IonButton>

            <IonButton expand="block" fill="clear" routerLink="/register">
              Don't have an account? Register
            </IonButton>
          </IonCardContent>
        </IonCard>

        <IonLoading isOpen={loading} message="Signing in..." />
        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMsg}
          duration={2500}
          color="danger"
          position="top"
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;
