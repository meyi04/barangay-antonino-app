// src/pages/Login.tsx
import React, { useState } from "react";
import {
  IonContent, IonPage, IonItem, IonLabel, IonInput,
  IonButton, IonCard, IonCardContent, IonToast, IonLoading, IonIcon,
} from "@ionic/react";
import { useNavigate } from "react-router-dom";
import { mailOutline, lockClosedOutline, logInOutline, personAddOutline, shieldCheckmarkOutline } from "ionicons/icons";
import { loginUser } from "../services/authService";
import BarangayLogo from "../components/BarangayLogo";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setToastMsg("Pakilagay ang email at password.");
      setShowToast(true);
      return;
    }
    setLoading(true);
    try {
      await loginUser(email, password);
      navigate("/", { replace: true });
    } catch (error: unknown) {
      const authError = error as { code?: string; message?: string };
      let errorMsg = "Login failed. Please check your credentials.";
      if (
        authError.code === "auth/invalid-credential" ||
        authError.code === "auth/user-not-found" ||
        authError.code === "auth/wrong-password"
      ) {
        errorMsg = "Maling email o password. Pakisuri muli.";
      } else if (authError.code === "auth/invalid-email") {
        errorMsg = "Hindi wastong format ng email.";
      }
      setToastMsg(errorMsg);
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen className="civic-content ion-padding">
        <div style={{ maxWidth: "440px", margin: "0 auto", paddingTop: "40px" }}>
          {/* Logo & Branding */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div style={{ display: "inline-flex", justifyContent: "center", marginBottom: "12px" }}>
              <BarangayLogo size={80} />
            </div>
            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: "#0d6840" }}>
              Republika ng Pilipinas
            </div>
            <h1 style={{ margin: "4px 0", fontSize: "24px", fontWeight: 900, color: "#0f2942", letterSpacing: "-0.5px" }}>
              Barangay Antonino
            </h1>
            <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 500 }}>
              Portal ng Mamamayan • Official Citizen System
            </div>
          </div>

          {/* Login Card */}
          <IonCard style={{ borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 18px rgba(0,0,0,0.05)", margin: "0 0 20px 0" }}>
            <IonCardContent style={{ padding: "24px 20px" }}>
              <div style={{ marginBottom: "18px" }}>
                <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>Mag-login sa Iyong Account</h3>
                <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>Residents and staff sign in here. Your account opens the appropriate portal.</p>
              </div>

              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", marginBottom: "14px", overflow: "hidden" }}>
                <IonItem style={{ "--background": "transparent", "--border-width": "0", "--padding-start": "14px" }}>
                  <IonIcon icon={mailOutline} slot="start" style={{ color: "#0d6840", fontSize: "18px" }} />
                  <IonLabel position="stacked" style={{ fontWeight: 600 }}>Email Address</IonLabel>
                  <IonInput type="email" value={email} placeholder="halimbawa@email.com"
                    onIonChange={(e) => setEmail(e.detail.value!)} />
                </IonItem>
              </div>

              <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", marginBottom: "14px", overflow: "hidden" }}>
                <IonItem style={{ "--background": "transparent", "--border-width": "0", "--padding-start": "14px" }}>
                  <IonIcon icon={lockClosedOutline} slot="start" style={{ color: "#0d6840", fontSize: "18px" }} />
                  <IonLabel position="stacked" style={{ fontWeight: 600 }}>Password</IonLabel>
                  <IonInput type="password" value={password} placeholder="••••••••"
                    onIonChange={(e) => setPassword(e.detail.value!)} />
                </IonItem>
              </div>

              <IonButton expand="block" color="primary" onClick={handleLogin}
                style={{ marginTop: "20px", height: "46px", borderRadius: "12px", fontWeight: 700, fontSize: "14px" }}>
                <IonIcon icon={logInOutline} slot="start" />
                Mag-Login (Sign In)
              </IonButton>

              <IonButton expand="block" fill="clear" routerLink="/register"
                style={{ textTransform: "none", fontSize: "13px", fontWeight: 600, color: "#0d6840", marginTop: "10px" }}>
                <IonIcon icon={personAddOutline} slot="start" />
                Wala pang account? Mag-rehistro rito
              </IonButton>
            </IonCardContent>
          </IonCard>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "11px", color: "#64748b" }}>
            <IonIcon icon={shieldCheckmarkOutline} style={{ color: "#0d6840" }} />
            <span>Secure Barangay Local Government Portal</span>
          </div>
        </div>

        <IonLoading isOpen={loading} message="Kinukumpirma ang inyong account..." />
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)}
          message={toastMsg} duration={3000} color="danger" position="top" />
      </IonContent>
    </IonPage>
  );
};

export default Login;