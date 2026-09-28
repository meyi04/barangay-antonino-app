// src/pages/Tab1.tsx - Barangay Antonino Citizen Portal Home
import React, { useEffect, useState } from "react";
import {
  IonContent, IonHeader, IonPage, IonToolbar, IonTitle,
  IonIcon, IonButton,
  IonBadge, IonModal, IonChip,
  IonLabel, IonList, IonItem,
} from "@ionic/react";
import {
  shieldCheckmark, callOutline, documentTextOutline,
  newspaperOutline, timeOutline, chevronForwardOutline,
  locationOutline, calendarOutline, alertCircleOutline,
  medicalOutline, flameOutline, closeOutline,
} from "ionicons/icons";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import BarangayLogo from "../components/BarangayLogo";

type Announcement = {
  id: string;
  tag: string;
  tagColor: string;
  title: string;
  date: string;
  location: string;
  summary: string;
  content: string;
};

const Tab1: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ pending: 0, inProgress: 0, resolved: 0, total: 0 });
  const [selectedAnn, setSelectedAnn] = useState<Announcement | null>(null);
  const [showHotlines, setShowHotlines] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "requests"), where("submittedByUid", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => d.data());
      setStats({
        total: data.length,
        pending: data.filter((r) => r.status === "Pending").length,
        inProgress: data.filter((r) => r.status === "In Progress").length,
        resolved: data.filter((r) => r.status === "Resolved").length,
      });
    });
    return () => unsub();
  }, [user]);

  const announcements = [
    {
      id: "1", tag: "Health & Wellness", tagColor: "success",
      title: "Libreng Bakuna para sa Aso at Pusa (Anti-Rabies Drive)",
      date: "Sabado, 8:00 AM - 12:00 PM", location: "Barangay Antonino Covered Court",
      summary: "Libreng anti-rabies vaccination at deworming para sa mga alagang hayop ng residente.",
      content: "Pinapaalalahanan ang lahat ng may-ari ng alagang aso at pusa na magkakaroon ng libreng Anti-Rabies Vaccination at Deworming katuwang ang Municipal Veterinary Office. Mangyaring dalhin ang inyong mga alaga na nakatali. Bukas para sa lahat ng residente nang walang bayad.",
    },
    {
      id: "2", tag: "Environmental", tagColor: "warning",
      title: "Pinaigting na Tapat Ko Linis Ko at Waste Segregation Ordinance",
      date: "Epektibo Ngayong Linggo", location: "Lahat ng Purok 1-6",
      summary: "Mahigpit na ipatutupad ang tamang paghihiwalay ng nabubulok at di-nabubulok na basura.",
      content: "Mahigpit na ipinagbibilin ang pagsunod sa Waste Segregation. Koleksyon: Nabubulok (Lunes, Miyerkules, Biyernes) | Di-nabubulok (Martes, Huwebes). Ang mga basurang hindi nakahiwalay ay hindi hahakutin.",
    },
    {
      id: "3", tag: "Community Event", tagColor: "primary",
      title: "Barangay General Assembly at Ulat sa Bayan",
      date: "Katapusan ng Buwan, 1:00 PM", location: "Barangay Antonino Multi-Purpose Hall",
      summary: "Taunang pagtitipon para sa ulat sa pananalapi, mga proyekto, at talakayan ng mamamayan.",
      content: "Inaanyayahan ang lahat ng punong-pamilya at mga rehistradong residente. Tatalakayin dito ang mga naisagawang proyekto, ulat sa pondo, at magkakaroon ng Open Forum para sa inyong mga suhestiyon.",
    },
    {
      id: "4", tag: "Social Services", tagColor: "tertiary",
      title: "Mobile Registration: PhilHealth at Senior Citizens ID",
      date: "Miyerkules, 9:00 AM - 3:00 PM", location: "Barangay Hall Ground Floor",
      summary: "Tuloy-tuloy na pagpaparehistro para sa mga bagong Senior Citizens at PhilHealth Konsulta.",
      content: "Magkakaroon ng help desk sa ating Barangay Hall para sa mga nais mag-apply ng Senior Citizen ID, PWD booklet, at PhilHealth Konsulta Registration. Magdala ng 1 valid government ID at 2x2 picture.",
    },
  ];

  const handleServiceClick = (cat: string) => {
    sessionStorage.setItem("antonino_prefill_category", cat);
    navigate("/tab2");
  };

  const dateStr = new Intl.DateTimeFormat("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" }).format(new Date());

  const heroGrad = { background: "linear-gradient(135deg, #0d6840 0%, #115e59 50%, #0f325e 100%)" } as React.CSSProperties;
  const cardStyle = { borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 18px rgba(0,0,0,0.05)", background: "#fff", overflow: "hidden" } as React.CSSProperties;
  const tileStyle = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "14px", cursor: "pointer", transition: "all 0.2s ease" } as React.CSSProperties;

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ background: "linear-gradient(135deg, #0d6840 0%, #0f325e 100%)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <BarangayLogo size={36} />
              <div>
                <div style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.8px", textTransform: "uppercase", color: "rgba(255,255,255,0.85)" }}>Republika ng Pilipinas</div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#fff", letterSpacing: "-0.2px" }}>Barangay Antonino</div>
              </div>
            </div>
            <IonButton fill="clear" color="light" size="small" onClick={() => setShowHotlines(true)}
              style={{ background: "rgba(255,255,255,0.18)", borderRadius: "20px", fontWeight: 600, fontSize: "12px", height: "32px", textTransform: "none" }}>
              <IonIcon icon={callOutline} slot="start" style={{ marginRight: "4px" }} />
              Hotlines
            </IonButton>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent className="civic-content ion-padding">
        <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 500, marginBottom: "8px", paddingLeft: "4px" }}>
          {dateStr} • Official Citizen Portal
        </div>

        {/* Hero Resident Card */}
        <div style={{ ...heroGrad, borderRadius: "20px", marginBottom: "16px", padding: "20px 18px", boxShadow: "0 10px 25px rgba(13,104,64,0.3)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(255,255,255,0.22)", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: 600, marginBottom: "8px", color: "#fff" }}>
                <IonIcon icon={shieldCheckmark} style={{ color: "#fef08a" }} /> Verified Resident
              </span>
              <h1 style={{ fontSize: "22px", fontWeight: 800, margin: "2px 0 4px 0", color: "#fff", letterSpacing: "-0.3px" }}>
                Mabuhay, {profile?.fullName || "Resident"}!
              </h1>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.92)", margin: 0, display: "flex", alignItems: "center", gap: "5px" }}>
                <IonIcon icon={locationOutline} />{profile?.purok || "Barangay Antonino"} • Philippines
              </p>
            </div>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: 800, border: "2px solid rgba(255,255,255,0.4)", color: "#fff" }}>
              {(profile?.fullName || "R").charAt(0).toUpperCase()}
            </div>
          </div>
          <div style={{ marginTop: "18px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.2)", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", textAlign: "center" }}>
            <div><div style={{ fontSize: "18px", fontWeight: 800, color: "#fef08a" }}>{stats.pending}</div><div style={{ fontSize: "11px", color: "rgba(255,255,255,0.85)" }}>Pending</div></div>
            <div style={{ borderLeft: "1px solid rgba(255,255,255,0.15)", borderRight: "1px solid rgba(255,255,255,0.15)" }}>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#93c5fd" }}>{stats.inProgress}</div><div style={{ fontSize: "11px", color: "rgba(255,255,255,0.85)" }}>In Progress</div>
            </div>
            <div><div style={{ fontSize: "18px", fontWeight: 800, color: "#86efac" }}>{stats.resolved}</div><div style={{ fontSize: "11px", color: "rgba(255,255,255,0.85)" }}>Resolved</div></div>
          </div>
        </div>

        {/* Emergency Banner */}
        <div onClick={() => setShowHotlines(true)} style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "14px", padding: "12px 16px", marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "#e11d48", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
              <IonIcon icon={alertCircleOutline} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "13px", color: "#9f1239" }}>Emergency & Tanod Hotlines</div>
              <div style={{ fontSize: "11px", color: "#e11d48" }}>24/7 Patrol, Medical & Police Desk</div>
            </div>
          </div>
          <IonIcon icon={chevronForwardOutline} style={{ color: "#e11d48" }} />
        </div>

        {/* E-Services Section */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", padding: "0 4px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f2942" }}>Barangay E-Services</h3>
            <span style={{ fontSize: "12px", color: "#64748b" }}>Apply for certificates or report community concerns</span>
          </div>
          <IonButton fill="clear" size="small" onClick={() => navigate("/tab2")} style={{ fontWeight: 600, fontSize: "12px", textTransform: "none", color: "#0d6840" }}>All →</IonButton>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "20px" }}>
          {[
            { title: "Barangay Clearance", sub: "For Employment, Postal ID, Business", bg: "#ecfdf5", color: "#0d6840", cat: "Barangay Clearance" },
            { title: "Cert. of Indigency", sub: "Hospital, DSWD, Scholarship Aid", bg: "#fef3c7", color: "#b45309", cat: "Certificate of Indigency" },
            { title: "Cert. of Residency", sub: "Proof of address, school, banking", bg: "#eff6ff", color: "#1d4ed8", cat: "Certificate of Residency" },
            { title: "File a Complaint", sub: "Streetlights, drainage, waste, noise", bg: "#f3e8ff", color: "#7e22ce", cat: "Other Complaint" },
          ].map((s) => (
            <div key={s.cat} style={tileStyle} onClick={() => handleServiceClick(s.cat)}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: s.bg, color: s.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", marginBottom: "10px" }}>
                <IonIcon icon={documentTextOutline} />
              </div>
              <div style={{ fontWeight: 700, fontSize: "13px", color: "#0f172a" }}>{s.title}</div>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Active Requests Banner */}
        {stats.total > 0 && (
          <div onClick={() => navigate("/tab3")} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "14px 16px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 10px rgba(0,0,0,0.03)", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#e0f2fe", color: "#0369a1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                <IonIcon icon={timeOutline} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "13px", color: "#0f172a" }}>Track My Requests ({stats.total})</div>
                <div style={{ fontSize: "11px", color: "#64748b" }}>
                  {stats.pending > 0 ? `${stats.pending} pending for review` : stats.inProgress > 0 ? `${stats.inProgress} in progress` : `All ${stats.resolved} resolved`}
                </div>
              </div>
            </div>
            <IonIcon icon={chevronForwardOutline} style={{ color: "#0d6840" }} />
          </div>
        )}

        {/* Announcements */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", padding: "0 4px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f2942" }}>Barangay Bulletin & Advisories</h3>
          <IonChip color="primary" style={{ fontSize: "11px", height: "24px" }}>
            <IonIcon icon={newspaperOutline} /><IonLabel>Official</IonLabel>
          </IonChip>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
          {announcements.map((ann) => (
            <div key={ann.id} style={{ ...cardStyle, cursor: "pointer" }} onClick={() => setSelectedAnn(ann)}>
              <div style={{ padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <IonBadge color={ann.tagColor} style={{ fontSize: "10px", padding: "4px 8px", borderRadius: "6px" }}>{ann.tag}</IonBadge>
                  <span style={{ fontSize: "11px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                    <IonIcon icon={calendarOutline} />{ann.date}
                  </span>
                </div>
                <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", fontWeight: 700, color: "#0f172a", lineHeight: 1.35 }}>{ann.title}</h4>
                <p style={{ margin: 0, fontSize: "12px", color: "#475569", lineHeight: 1.45 }}>{ann.summary}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: "11px", color: "#0d6840", fontWeight: 600 }}>Read full advisory →</span>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>📍 {ann.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ ...cardStyle, border: "1px dashed #cbd5e1", background: "#f8fafc", marginBottom: "24px" }}>
          <div style={{ padding: "16px", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}><BarangayLogo size={42} /></div>
            <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: 800, color: "#0f2942" }}>Barangay Antonino Hall</h4>
            <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#64748b" }}>Open Monday to Friday: 8:00 AM – 5:00 PM (No Noon Break)</p>
            <p style={{ margin: 0, fontSize: "11px", color: "#0d6840", fontWeight: 600 }}>"Serbisyong Tapat at Dekalidad Para sa Bawat Residente"</p>
          </div>
        </div>

        {/* Announcement Modal */}
        <IonModal isOpen={!!selectedAnn} onDidDismiss={() => setSelectedAnn(null)} breakpoints={[0, 0.7, 0.9]} initialBreakpoint={0.7}>
          <IonHeader><IonToolbar>
            <IonTitle style={{ fontSize: "15px", fontWeight: 700 }}>Barangay Advisory</IonTitle>
            <IonButton slot="end" fill="clear" onClick={() => setSelectedAnn(null)}><IonIcon icon={closeOutline} /></IonButton>
          </IonToolbar></IonHeader>
          <IonContent className="ion-padding">
            {selectedAnn && (
              <div>
                <IonBadge color={selectedAnn.tagColor} style={{ marginBottom: "10px" }}>{selectedAnn.tag}</IonBadge>
                <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 10px 0", color: "#0f2942" }}>{selectedAnn.title}</h2>
                <div style={{ background: "#f1f5f9", padding: "10px 14px", borderRadius: "10px", fontSize: "12px", color: "#475569", marginBottom: "16px" }}>
                  <div><strong>Date:</strong> {selectedAnn.date}</div>
                  <div><strong>Venue:</strong> {selectedAnn.location}</div>
                </div>
                <div style={{ fontSize: "14px", color: "#1e293b", lineHeight: 1.6, whiteSpace: "pre-line" }}>{selectedAnn.content}</div>
                <div style={{ marginTop: "24px" }}>
                  <IonButton expand="block" color="primary" onClick={() => setSelectedAnn(null)}>Naiintindihan (Got it)</IonButton>
                </div>
              </div>
            )}
          </IonContent>
        </IonModal>

        {/* Hotlines Modal */}
        <IonModal isOpen={showHotlines} onDidDismiss={() => setShowHotlines(false)}>
          <IonHeader><IonToolbar color="danger">
            <IonTitle>Emergency Hotlines</IonTitle>
            <IonButton slot="end" fill="clear" color="light" onClick={() => setShowHotlines(false)}>Close</IonButton>
          </IonToolbar></IonHeader>
          <IonContent className="ion-padding">
            <h2 style={{ fontWeight: 800, fontSize: "18px", margin: "4px 0 14px 0" }}>Barangay Antonino 24/7 Response</h2>
            <IonList lines="full" style={{ borderRadius: "14px", overflow: "hidden", border: "1px solid #e2e8f0" }}>
              {[
                { icon: shieldCheckmark, bg: "#ecfdf5", color: "#0d6840", title: "Barangay Tanod Desk", sub: "Patrol & Peace and Order", num: "0917-555-8266", numColor: "#0d6840", tel: "09175558266", btnColor: "primary" },
                { icon: medicalOutline, bg: "#fef2f2", color: "#dc2626", title: "Antonino Health Station", sub: "First Aid & Barangay Ambulance", num: "0928-444-4325", numColor: "#dc2626", tel: "09284444325", btnColor: "danger" },
                { icon: callOutline, bg: "#eff6ff", color: "#2563eb", title: "PNP Police Substation", sub: "Emergency Police Response", num: "0919-333-7671", numColor: "#2563eb", tel: "09193337671", btnColor: "primary" },
                { icon: flameOutline, bg: "#fff7ed", color: "#ea580c", title: "BFP Fire Station", sub: "Bureau of Fire Protection", num: "0920-222-3473", numColor: "#ea580c", tel: "09202223473", btnColor: "warning" },
              ].map((h) => (
                <IonItem key={h.tel}>
                  <div slot="start" style={{ width: "40px", height: "40px", borderRadius: "10px", background: h.bg, color: h.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                    <IonIcon icon={h.icon} />
                  </div>
                  <IonLabel>
                    <h3 style={{ fontWeight: 700 }}>{h.title}</h3>
                    <p>{h.sub}</p>
                    <strong style={{ color: h.numColor }}>{h.num}</strong>
                  </IonLabel>
                  <IonButton slot="end" fill="outline" size="small" color={h.btnColor} href={`tel:${h.tel}`}>Call</IonButton>
                </IonItem>
              ))}
            </IonList>
            <div style={{ marginTop: "24px" }}>
              <IonButton expand="block" fill="clear" onClick={() => setShowHotlines(false)}>Bumalik (Close)</IonButton>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Tab1;