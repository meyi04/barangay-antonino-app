// src/pages/staff/StaffDashboard.tsx
import React, { useEffect, useState } from "react";
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonIcon,
} from "@ionic/react";
import {
  timeOutline,
  constructOutline,
  checkmarkDoneOutline,
  documentTextOutline,
} from "ionicons/icons";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";

const StaffDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "requests"), (snap) => {
      const data = snap.docs.map((d) => d.data());
      setStats({
        total: data.length,
        pending: data.filter((r) => r.status === "Pending").length,
        inProgress: data.filter((r) => r.status === "In Progress").length,
        resolved: data.filter((r) => r.status === "Resolved").length,
      });
    });
    return () => unsub();
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="success">
          <IonTitle>Staff Dashboard</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonText>
          <h2>Overview</h2>
        </IonText>

        <IonCard color="success">
          <IonCardContent style={{ textAlign: "center" }}>
            <IonIcon
              icon={documentTextOutline}
              style={{ fontSize: "40px", color: "white" }}
            />
            <h1 style={{ fontSize: "48px", margin: "6px 0", color: "white" }}>
              {stats.total}
            </h1>
            <IonText color="light">
              <p style={{ margin: 0 }}>Total Requests</p>
            </IonText>
          </IonCardContent>
        </IonCard>

        <IonGrid>
          <IonRow>
            <IonCol>
              <IonCard color="warning">
                <IonCardContent style={{ textAlign: "center" }}>
                  <IonIcon icon={timeOutline} style={{ fontSize: "28px" }} />
                  <h2 style={{ margin: "6px 0" }}>{stats.pending}</h2>
                  <IonText color="dark">
                    <p style={{ fontSize: "12px", margin: 0 }}>Pending</p>
                  </IonText>
                </IonCardContent>
              </IonCard>
            </IonCol>
            <IonCol>
              <IonCard color="tertiary">
                <IonCardContent style={{ textAlign: "center" }}>
                  <IonIcon icon={constructOutline} style={{ fontSize: "28px" }} />
                  <h2 style={{ margin: "6px 0" }}>{stats.inProgress}</h2>
                  <IonText color="dark">
                    <p style={{ fontSize: "12px", margin: 0 }}>In Progress</p>
                  </IonText>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
          <IonRow>
            <IonCol>
              <IonCard color="success">
                <IonCardContent style={{ textAlign: "center" }}>
                  <IonIcon
                    icon={checkmarkDoneOutline}
                    style={{ fontSize: "28px" }}
                  />
                  <h2 style={{ margin: "6px 0" }}>{stats.resolved}</h2>
                  <IonText color="dark">
                    <p style={{ fontSize: "12px", margin: 0 }}>Resolved</p>
                  </IonText>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonText color="medium">
          <p style={{ textAlign: "center", marginTop: "20px" }}>
            Real-time stats update as residents submit requests.
          </p>
        </IonText>
      </IonContent>
    </IonPage>
  );
};

export default StaffDashboard;