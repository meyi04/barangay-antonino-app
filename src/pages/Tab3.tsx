import React from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonText,
  IonChip,
  IonNote,
} from "@ionic/react";
import {
  informationCircleOutline,
  businessOutline,
  codeSlashOutline,
  layersOutline,
  peopleOutline,
  callOutline,
  locationOutline,
  mailOutline,
} from "ionicons/icons";

const Tab3: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>About</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        {/* App Info Card */}
        <IonCard>
          <IonCardHeader>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <IonIcon
                icon={businessOutline}
                style={{ fontSize: "32px", color: "var(--ion-color-primary)" }}
              />
              <div>
                <IonCardTitle>eBarangay Antonino</IonCardTitle>
                <IonCardSubtitle>Version 1.0.0</IonCardSubtitle>
              </div>
            </div>
          </IonCardHeader>
          <IonCardContent>
            A mobile-based service request and complaint tracking system for
            Barangay Antonino. Residents can submit requests, track their status
            in real-time, and communicate with barangay staff.
          </IonCardContent>
        </IonCard>

        {/* About the System */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={informationCircleOutline} /> About the System
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonText>
              <p>
                <strong>eBarangay Antonino</strong> is a final project developed
                for the subject <em>ITE 413 – Integrative Programming and
                Technologies 2</em>. It aims to digitize the process of filing
                complaints and service requests in the barangay, making it
                faster, more transparent, and easier to monitor.
              </p>
            </IonText>

            <IonText color="medium">
              <p style={{ fontSize: "14px" }}>
                <strong>Key Features:</strong>
              </p>
            </IonText>

            <IonList lines="none">
              <IonItem>
                <IonLabel>
                  <h3>📝 Submit Requests</h3>
                  <p>File complaints and service requests with photos and location</p>
                </IonLabel>
              </IonItem>
              <IonItem>
                <IonLabel>
                  <h3>📊 Track Status</h3>
                  <p>Monitor real-time updates from Pending to Resolved</p>
                </IonLabel>
              </IonItem>
              <IonItem>
                <IonLabel>
                  <h3>🔔 Get Notified</h3>
                  <p>Receive instant notifications on status changes</p>
                </IonLabel>
              </IonItem>
              <IonItem>
                <IonLabel>
                  <h3>💬 Live Chat</h3>
                  <p>Communicate directly with barangay staff</p>
                </IonLabel>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* Tech Stack */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={codeSlashOutline} /> Technology Stack
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <IonChip color="primary">
                <IonLabel>Ionic React</IonLabel>
              </IonChip>
              <IonChip color="warning">
                <IonLabel>Firebase</IonLabel>
              </IonChip>
              <IonChip color="success">
                <IonLabel>Firestore</IonLabel>
              </IonChip>
              <IonChip color="tertiary">
                <IonLabel>TypeScript</IonLabel>
              </IonChip>
              <IonChip color="secondary">
                <IonLabel>Vite</IonLabel>
              </IonChip>
            </div>

            <IonList lines="none" style={{ marginTop: "8px" }}>
              <IonItem>
                <IonIcon icon={layersOutline} slot="start" color="primary" />
                <IonLabel>
                  <h3>Frontend</h3>
                  <p>Ionic React + TypeScript</p>
                </IonLabel>
              </IonItem>
              <IonItem>
                <IonIcon icon={layersOutline} slot="start" color="warning" />
                <IonLabel>
                  <h3>Backend / Database</h3>
                  <p>Firebase Firestore (NoSQL)</p>
                </IonLabel>
              </IonItem>
              <IonItem>
                <IonIcon icon={layersOutline} slot="start" color="success" />
                <IonLabel>
                  <h3>Real-time Sync</h3>
                  <p>Firestore onSnapshot listeners</p>
                </IonLabel>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* Developer */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={peopleOutline} /> Developer
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList lines="none">
              <IonItem>
                <IonLabel>
                  <h3>Trecia Mae M. Gandia</h3>
                  <p>Student Developer</p>
                </IonLabel>
              </IonItem>
              <IonItem>
                <IonLabel>
                  <h3>ITE 413 – Integrative Programming and Technologies 2</h3>
                  <p>Final Project</p>
                </IonLabel>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* Contact Barangay */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <IonIcon icon={callOutline} /> Contact Barangay Antonino
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList lines="none">
              <IonItem>
                <IonIcon icon={locationOutline} slot="start" color="primary" />
                <IonLabel>
                  <h3>Address</h3>
                  <p>Barangay Antonino, Philippines</p>
                </IonLabel>
              </IonItem>
              <IonItem>
                <IonIcon icon={callOutline} slot="start" color="success" />
                <IonLabel>
                  <h3>Hotline</h3>
                  <p>(000) 000-0000</p>
                </IonLabel>
              </IonItem>
              <IonItem>
                <IonIcon icon={mailOutline} slot="start" color="warning" />
                <IonLabel>
                  <h3>Email</h3>
                  <p>barangay.antonino@example.com</p>
                </IonLabel>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: "16px", marginBottom: "32px" }}>
          <IonNote color="medium">
            <p>© {new Date().getFullYear()} eBarangay Antonino</p>
            <p style={{ fontSize: "12px" }}>
              Developed for academic purposes only.
            </p>
          </IonNote>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Tab3;