import React from "react";
import {
  IonCard,
  IonCardContent,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonToolbar,
} from "@ionic/react";
import {
  callOutline,
  codeSlashOutline,
  informationCircleOutline,
  layersOutline,
  locationOutline,
  mailOutline,
  peopleOutline,
} from "ionicons/icons";

const Tab3: React.FC = () => {
  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ background: "linear-gradient(135deg, #0d6840 0%, #0f325e 100%)" }}>
          <div style={{ padding: "12px 16px", color: "#fff" }}>
            <div style={{ fontSize: "10px", letterSpacing: "0.8px", textTransform: "uppercase", opacity: 0.8 }}>About</div>
            <div style={{ fontSize: "18px", fontWeight: 800 }}>Barangay Antonino</div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonCard style={{ borderRadius: "18px", border: "1px solid #e2e8f0", boxShadow: "0 4px 18px rgba(0,0,0,0.04)" }}>
          <IonCardContent>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IonIcon icon={informationCircleOutline} style={{ fontSize: "24px", color: "#0d6840" }} />
              </div>
              <div>
                <div style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.7px" }}>System</div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a" }}>eBarangay Antonino</div>
              </div>
            </div>

            <p style={{ margin: "0", color: "#475569", lineHeight: 1.6 }}>
              A digital service request platform for faster barangay communication, transparent request tracking, and community support.
            </p>
          </IonCardContent>
        </IonCard>

        <IonCard style={{ borderRadius: "18px", border: "1px solid #e2e8f0", boxShadow: "0 4px 18px rgba(0,0,0,0.04)", marginTop: "16px" }}>
          <IonCardContent>
            <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f2942", marginBottom: "10px" }}>Key Features</div>
            <IonList lines="none" style={{ background: "transparent", padding: 0 }}>
              <IonItem style={{ "--background": "transparent", "--padding-start": "0px", "--inner-padding-end": "0px" }}>
                <IonLabel>
                  <h3>📝 Submit Requests</h3>
                  <p>File complaints and service requests for barangay assistance.</p>
                </IonLabel>
              </IonItem>
              <IonItem style={{ "--background": "transparent", "--padding-start": "0px", "--inner-padding-end": "0px" }}>
                <IonLabel>
                  <h3>📊 Track Status</h3>
                  <p>Monitor updates from pending to resolved in real time.</p>
                </IonLabel>
              </IonItem>
              <IonItem style={{ "--background": "transparent", "--padding-start": "0px", "--inner-padding-end": "0px" }}>
                <IonLabel>
                  <h3>🔔 Community Updates</h3>
                  <p>Stay informed through official announcements and advisories.</p>
                </IonLabel>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        <IonCard style={{ borderRadius: "18px", border: "1px solid #e2e8f0", boxShadow: "0 4px 18px rgba(0,0,0,0.04)", marginTop: "16px" }}>
          <IonCardContent>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <IonIcon icon={codeSlashOutline} style={{ color: "#2563eb", fontSize: "18px" }} />
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f2942" }}>Technology Stack</div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <IonChip color="primary"><IonLabel>Ionic React</IonLabel></IonChip>
              <IonChip color="warning"><IonLabel>Firebase</IonLabel></IonChip>
              <IonChip color="success"><IonLabel>Firestore</IonLabel></IonChip>
              <IonChip color="tertiary"><IonLabel>TypeScript</IonLabel></IonChip>
            </div>

            <IonList lines="none" style={{ background: "transparent", padding: 0, marginTop: "8px" }}>
              <IonItem style={{ "--background": "transparent", "--padding-start": "0px", "--inner-padding-end": "0px" }}>
                <IonIcon icon={layersOutline} slot="start" color="primary" />
                <IonLabel><h3>Frontend</h3><p>Ionic React + TypeScript</p></IonLabel>
              </IonItem>
              <IonItem style={{ "--background": "transparent", "--padding-start": "0px", "--inner-padding-end": "0px" }}>
                <IonIcon icon={layersOutline} slot="start" color="warning" />
                <IonLabel><h3>Backend</h3><p>Firebase Firestore</p></IonLabel>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        <IonCard style={{ borderRadius: "18px", border: "1px solid #e2e8f0", boxShadow: "0 4px 18px rgba(0,0,0,0.04)", marginTop: "16px" }}>
          <IonCardContent>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <IonIcon icon={peopleOutline} style={{ color: "#7c3aed", fontSize: "18px" }} />
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f2942" }}>Developer</div>
            </div>
            <IonList lines="none" style={{ background: "transparent", padding: 0 }}>
              <IonItem style={{ "--background": "transparent", "--padding-start": "0px", "--inner-padding-end": "0px" }}>
                <IonLabel><h3>Trecia Mae M. Gandia</h3><p>Student Developer</p></IonLabel>
              </IonItem>
              <IonItem style={{ "--background": "transparent", "--padding-start": "0px", "--inner-padding-end": "0px" }}>
                <IonLabel><h3>ITE 413</h3><p>Integrative Programming and Technologies 2</p></IonLabel>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        <IonCard style={{ borderRadius: "18px", border: "1px solid #e2e8f0", boxShadow: "0 4px 18px rgba(0,0,0,0.04)", marginTop: "16px" }}>
          <IonCardContent>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <IonIcon icon={callOutline} style={{ color: "#0d6840", fontSize: "18px" }} />
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f2942" }}>Contact Barangay</div>
            </div>
            <IonList lines="none" style={{ background: "transparent", padding: 0 }}>
              <IonItem style={{ "--background": "transparent", "--padding-start": "0px", "--inner-padding-end": "0px" }}>
                <IonIcon icon={locationOutline} slot="start" color="primary" />
                <IonLabel><h3>Address</h3><p>Barangay Antonino, Philippines</p></IonLabel>
              </IonItem>
              <IonItem style={{ "--background": "transparent", "--padding-start": "0px", "--inner-padding-end": "0px" }}>
                <IonIcon icon={callOutline} slot="start" color="success" />
                <IonLabel><h3>Hotline</h3><p>(000) 000-0000</p></IonLabel>
              </IonItem>
              <IonItem style={{ "--background": "transparent", "--padding-start": "0px", "--inner-padding-end": "0px" }}>
                <IonIcon icon={mailOutline} slot="start" color="warning" />
                <IonLabel><h3>Email</h3><p>barangay.antonino@example.com</p></IonLabel>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        <div style={{ textAlign: "center", marginTop: "16px", marginBottom: "24px" }}>
          <IonNote color="medium">
            <p>© {new Date().getFullYear()} eBarangay Antonino</p>
          </IonNote>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Tab3;