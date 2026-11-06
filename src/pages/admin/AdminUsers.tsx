import React, { useEffect, useMemo, useState } from 'react';
import {
  IonAlert,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonPage,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/react';
import { closeOutline, peopleOutline, saveOutline, trashOutline } from 'ionicons/icons';
import { useAuth } from '../../context/AuthContext';
import type { UserProfile } from '../../services/authService';
import {
  deleteResidentAccount,
  getAdminUserProfiles,
  updateAdminUserProfile,
} from '../../services/adminUserService';
import BarangayLogo from '../../components/BarangayLogo';
import ResidentLogout from '../../components/ResidentLogout';
import '../Services.css';
import '../Profile.css';
import '../staff/Staff.css';

const puroks = ['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5', 'Purok 6'];

const AdminUsers: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingUid, setRemovingUid] = useState('');
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserProfile | null>(null);
  const [notice, setNotice] = useState('');
  const [draft, setDraft] = useState({ fullName: '', contactNumber: '', purok: '' });

  const loadUsers = async () => {
    setLoading(true);
    setLoadError('');
    try {
      setUsers(await getAdminUserProfiles());
    } catch (error) {
      console.error('Unable to load user profiles', error);
      setLoadError('Unable to load users. Check your connection and administrator permissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users
      .filter((profile) => !term || [
        profile.fullName,
        profile.email,
        profile.contactNumber,
        profile.purok,
        profile.role,
      ].some((value) => value?.toLowerCase().includes(term)))
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [users, search]);

  const openEditor = (profile: UserProfile) => {
    setSelectedUser(profile);
    setDraft({
      fullName: profile.fullName ?? '',
      contactNumber: profile.contactNumber ?? '',
      purok: profile.purok ?? '',
    });
    setFormError('');
  };

  const saveProfile = async () => {
    if (!selectedUser || saving) return;
    const fullName = draft.fullName.trim();
    const contactNumber = draft.contactNumber.trim();
    const purok = draft.purok.trim();
    if (!fullName || fullName.length > 200 || contactNumber.length > 30 || purok.length > 100) {
      setFormError('Enter a name (up to 200 characters), contact number (up to 30), and purok (up to 100).');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      await updateAdminUserProfile(selectedUser.uid, { fullName, contactNumber, purok });
      setUsers((current) => current.map((profile) =>
        profile.uid === selectedUser.uid
          ? { ...profile, fullName, contactNumber, purok }
          : profile
      ));
      setSelectedUser(null);
      setNotice('User profile updated.');
    } catch (error) {
      console.error('Unable to update user profile', error);
      setFormError('Unable to save these changes. Check your connection and administrator permissions.');
    } finally {
      setSaving(false);
    }
  };

  const removeUser = async (profile: UserProfile) => {
    if (removingUid) return;
    setRemovingUid(profile.uid);
    try {
      await deleteResidentAccount(profile.uid);
      setUsers((current) => current.filter((item) => item.uid !== profile.uid));
      setSelectedUser(null);
      setNotice('Resident sign-in account, profile, and chat history removed. Their submitted requests were retained.');
    } catch (error) {
      console.error('Unable to remove resident account', error);
      setNotice(error instanceof Error ? error.message : 'Unable to remove this account. Please try again.');
    } finally {
      setRemovingUid('');
      setDeleteTarget(null);
    }
  };

  return (
    <IonPage className="services-page staff-page">
      <IonHeader className="ion-no-border">
        <IonToolbar className="services-toolbar">
          <div className="services-brand">
            <BarangayLogo size={36} />
            <div><small>Republika ng Pilipinas</small><strong>Barangay Antonino</strong></div>
            <ResidentLogout />
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding services-content">
        <div className="services-shell">
          <p className="services-eyebrow">Admin Portal • Users</p>
          <div className="services-hero">
            <span className="services-pill"><IonIcon icon={peopleOutline} /> User Administration</span>
            <h1>Manage users</h1>
            <p>Search resident and administrator profiles and update contact details. Administrator roles remain managed directly in Firebase.</p>
          </div>

          <IonSearchbar
            aria-label="Search users"
            placeholder="Search name, email, phone, purok, or role"
            value={search}
            onIonChange={(event) => setSearch(event.detail.value ?? '')}
          />

          {loading ? <div role="status"><IonSpinner /><p>Loading user profiles...</p></div>
            : loadError ? <p role="alert" className="services-error">{loadError}</p>
              : filteredUsers.length === 0 ? <div className="staff-note">No users match this search.</div>
                : <IonList lines="none" className="staff-report-list">
                  {filteredUsers.map((profile) => (
                    <IonItem key={profile.uid} className="staff-report-row">
                      <IonLabel>
                        <h2>{profile.fullName || 'Unnamed user'}</h2>
                        <p>{profile.email}</p>
                        <p>{profile.role === 'admin' ? 'Administrator' : 'Resident'} · {profile.purok || 'Purok not provided'}</p>
                      </IonLabel>
                      <IonButton slot="end" fill="clear" onClick={() => openEditor(profile)}>Edit</IonButton>
                    </IonItem>
                  ))}
                </IonList>}

          <IonModal isOpen={Boolean(selectedUser)} onDidDismiss={() => setSelectedUser(null)}>
            <IonHeader>
              <IonToolbar>
                <IonButton slot="start" fill="clear" aria-label="Close user editor" onClick={() => setSelectedUser(null)}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
                <IonTitle>Edit user</IonTitle>
              </IonToolbar>
            </IonHeader>
            <IonContent className="ion-padding">
              {selectedUser && <div className="profile-shell">
                <p className="services-hint">{selectedUser.email} · {selectedUser.role === 'admin' ? 'Administrator' : 'Resident'}</p>
                <IonItem>
                  <IonLabel position="stacked">Full name</IonLabel>
                  <IonInput value={draft.fullName} maxlength={200} onIonInput={(event) => setDraft((current) => ({ ...current, fullName: event.detail.value ?? '' }))} />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Contact number</IonLabel>
                  <IonInput type="tel" value={draft.contactNumber} maxlength={30} onIonInput={(event) => setDraft((current) => ({ ...current, contactNumber: event.detail.value ?? '' }))} />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Purok</IonLabel>
                  <IonSelect
                    value={draft.purok}
                    placeholder="Select a purok"
                    onIonChange={(event) => setDraft((current) => ({ ...current, purok: event.detail.value ?? '' }))}
                  >
                    {puroks.map((purok) => <IonSelectOption key={purok} value={purok}>{purok}</IonSelectOption>)}
                  </IonSelect>
                </IonItem>
                {formError && <p className="services-error" role="alert">{formError}</p>}
                <IonButton expand="block" disabled={saving} onClick={() => void saveProfile()}>
                  {saving ? <IonSpinner name="crescent" /> : <IonIcon icon={saveOutline} slot="start" />}
                  Save changes
                </IonButton>
                {selectedUser.role === 'resident' && selectedUser.uid !== user?.uid && (
                  <IonButton
                    expand="block"
                    color="danger"
                    fill="outline"
                    disabled={Boolean(removingUid)}
                    onClick={() => setDeleteTarget(selectedUser)}
                  >
                    <IonIcon icon={trashOutline} slot="start" /> Remove resident account
                  </IonButton>
                )}
              </div>}
            </IonContent>
          </IonModal>

          <IonAlert
            isOpen={Boolean(deleteTarget)}
            header="Remove resident account?"
            message={`This permanently removes ${deleteTarget?.fullName || 'this resident'}'s Firebase sign-in account, profile, and chat history. Their submitted requests will be retained. This cannot be undone.`}
            onDidDismiss={() => setDeleteTarget(null)}
            buttons={[
              { text: 'Cancel', role: 'cancel' },
              { text: 'Remove account', role: 'destructive', handler: () => { if (deleteTarget) void removeUser(deleteTarget); } },
            ]}
          />
          <IonToast isOpen={Boolean(notice)} message={notice} duration={3500} position="top" onDidDismiss={() => setNotice('')} />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AdminUsers;
