// src/pages/Register.tsx
import React, { useState } from "react";
import {
  IonContent, IonPage, IonItem, IonLabel, IonInput,
  IonButton, IonCard, IonCardContent, IonSelect, IonSelectOption,
  IonToast, IonLoading, IonIcon,
} from "@ionic/react";
import { useNavigate } from "react-router-dom";
import { personOutline, mailOutline, lockClosedOutline, callOutline, locationOutline, personAddOutline, arrowBackOutline, shieldCheckmarkOutline } from "ionicons/icons";
import { registerUser } from "../services/authService";
import BarangayLogo from "../components/BarangayLogo";

const puroks = ["Purok 1", "Purok 2", "Purok 3", "Purok 4", "Purok 5", "Purok 6"];

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", contactNumber: "", purok: "Purok 1" });
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastColor, setToastColor] = useState("success");
  const [showToast, setShowToast] = useState(false);

  const showToastNotice = (msg: string, color = "warning") => {
    setToastMsg(msg); setToastColor(color); setShowToast(true);
  };

  const handleRegister = async () => {
    const { fullName, email, password, contactNumber, purok } = form;
    if (!fullName || !email || !password || !contactNumber || !purok) {
      showToastNotice("Paki-puno ang lahat ng kinakailangang impormasyon."); return;
    }
    if (password.length < 6) {
      showToastNotice("Ang password ay dapat hindi bababa sa 6 na karakter."); return;
    }
    setLoading(true);
    try {
      await registerUser(email, password, fullName, purok, contactNumber);
      showToastNotice("Matagumpay na narehistro ang account!", "success");
      setTimeout(() => navigate("/tab1", { replace: true }), 1200);
    } catch (error: unknown) {
      const authError = error as { code?: string; message?: string };
      let errMsg = "Registration failed: " + (authError.message || "Unknown error");
      if (authError.code === "auth/email-already-in-use") errMsg = "Ang email na ito ay mayroon nang umiiral na account.";
      else if (authError.code === "auth/weak-password") errMsg = "Mahina ang password. Gumamit ng mas matibay na kumbinasyon.";
      showToastNotice(errMsg, "danger");
    } finally { setLoading(false); }
  };

  const inputStyle = { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", marginBottom: "14px", overflow: "hidden" };
  const itemStyle = { "--background": "transparent", "--border-width": "0", "--padding-start": "14px" };

  return (
    <IonPage>
      <IonContent fullscreen className="civic-content ion-padding">
        <div style={{ maxWidth: "440px", margin: "0 auto", paddingTop: "24px", paddingBottom: "32px" }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div style={{ display: "inline-flex", justifyContent: "center", marginBottom: "8px" }}>
              <BarangayLogo size={68} />
            </div>
            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "#0d6840" }}>Barangay Antonino</div>
            <h1 style={{ margin: "4px 0", fontSize: "22px", fontWeight: 900, color: "#0f2942", letterSpacing: "-0.5px" }}>Rehistro ng Residente</h1>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>Gumawa ng opisyal na account upang ma-access ang mga serbisyo</p>
          </div>

          <IonCard style={{ borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 18px rgba(0,0,0,0.05)", margin: "0 0 16px 0" }}>
            <IonCardContent style={{ padding: "20px 18px" }}>
              <div style={inputStyle}>
                <IonItem style={itemStyle}>
                  <IonIcon icon={personOutline} slot="start" style={{ color: "#0d6840", fontSize: "18px" }} />
                  <IonLabel position="stacked" style={{ fontWeight: 600 }}>Buong Pangalan (Full Name) *</IonLabel>
                  <IonInput value={form.fullName} placeholder="hal. Juan M. Dela Cruz"
                    onIonChange={(e) => setForm({ ...form, fullName: e.detail.value! })} />
                </IonItem>
              </div>

              <div style={inputStyle}>
                <IonItem style={itemStyle}>
                  <IonIcon icon={locationOutline} slot="start" style={{ color: "#0d6840", fontSize: "18px" }} />
                  <IonLabel position="stacked" style={{ fontWeight: 600 }}>Purok sa Barangay Antonino *</IonLabel>
                  <IonSelect value={form.purok} onIonChange={(e) => setForm({ ...form, purok: e.detail.value })}>
                    {puroks.map((p) => <IonSelectOption key={p} value={p}>{p}</IonSelectOption>)}
                  </IonSelect>
                </IonItem>
              </div>

              <div style={inputStyle}>
                <IonItem style={itemStyle}>
                  <IonIcon icon={callOutline} slot="start" style={{ color: "#0d6840", fontSize: "18px" }} />
                  <IonLabel position="stacked" style={{ fontWeight: 600 }}>Numero ng Telepono *</IonLabel>
                  <IonInput type="tel" value={form.contactNumber} placeholder="0917 123 4567"
                    onIonChange={(e) => setForm({ ...form, contactNumber: e.detail.value! })} />
                </IonItem>
              </div>

              <div style={inputStyle}>
                <IonItem style={itemStyle}>
                  <IonIcon icon={mailOutline} slot="start" style={{ color: "#0d6840", fontSize: "18px" }} />
                  <IonLabel position="stacked" style={{ fontWeight: 600 }}>Email Address *</IonLabel>
                  <IonInput type="email" value={form.email} placeholder="halimbawa@email.com"
                    onIonChange={(e) => setForm({ ...form, email: e.detail.value! })} />
                </IonItem>
              </div>

              <div style={inputStyle}>
                <IonItem style={itemStyle}>
                  <IonIcon icon={lockClosedOutline} slot="start" style={{ color: "#0d6840", fontSize: "18px" }} />
                  <IonLabel position="stacked" style={{ fontWeight: 600 }}>Password (Hindi bababa sa 6 na titik) *</IonLabel>
                  <IonInput type="password" value={form.password} placeholder="••••••••"
                    onIonChange={(e) => setForm({ ...form, password: e.detail.value! })} />
                </IonItem>
              </div>

              <IonButton expand="block" color="primary" onClick={handleRegister}
                style={{ marginTop: "20px", height: "46px", borderRadius: "12px", fontWeight: 700, fontSize: "14px" }}>
                <IonIcon icon={personAddOutline} slot="start" />
                Magpatala (Register Account)
              </IonButton>

              <IonButton expand="block" fill="clear" routerLink="/login"
                style={{ textTransform: "none", fontSize: "13px", fontWeight: 600, color: "#0d6840", marginTop: "10px" }}>
                <IonIcon icon={arrowBackOutline} slot="start" />
                May account na? Bumalik sa Login
              </IonButton>
            </IonCardContent>
          </IonCard>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "11px", color: "#64748b" }}>
            <IonIcon icon={shieldCheckmarkOutline} style={{ color: "#0d6840" }} />
            <span>Ang impormasyon ay protektado alinsunod sa Data Privacy Act</span>
          </div>
        </div>

        <IonLoading isOpen={loading} message="Inihahanda ang inyong resident account..." />
        <IonToast isOpen={showToast} onDidDismiss={() => setShowToast(false)}
          message={toastMsg} duration={3000} color={toastColor} position="top" />
      </IonContent>
    </IonPage>
  );
};

export default Register;