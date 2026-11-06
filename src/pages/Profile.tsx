import React, { useEffect, useRef, useState } from 'react';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonToast,
  IonToolbar,
} from '@ionic/react';
import {
  arrowBackOutline,
  cameraOutline,
  personCircleOutline,
  saveOutline,
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserProfile } from '../services/authService';
import {
  getResidentProfiles,
  updateUserProfile,
  updateUserProfilePhoto,
  uploadUserProfilePhoto,
} from '../services/authService';
import BarangayLogo from '../components/BarangayLogo';
import ResidentLogout from '../components/ResidentLogout';
import './Profile.css';

const puroks = ['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5', 'Purok 6'];
const allowedPhotoTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxPhotoSize = 5 * 1024 * 1024;

const ProfilePhoto: React.FC<{ profilePhoto?: string; name: string; size?: 'large' | 'small' }> = ({
  profilePhoto,
  name,
  size = 'large',
}) => (
  <div className={`profile-photo profile-photo-${size}`}>
      {profilePhoto ? <img src={profilePhoto} alt={`${name} profile`} /> : (
        <IonIcon icon={personCircleOutline} aria-hidden="true" />
      )}
  </div>
);

const Profile: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const isStaff = profile?.role === 'admin';
  const [fullName, setFullName] = useState(profile?.fullName ?? '');
  const [contactNumber, setContactNumber] = useState(profile?.contactNumber ?? '');
  const [purok, setPurok] = useState(profile?.purok ?? 'Purok 1');
  const [residents, setResidents] = useState<UserProfile[]>([]);
  const [selectedResident, setSelectedResident] = useState<UserProfile | null>(null);
  const [loadingResidents, setLoadingResidents] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const photoInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFullName(profile?.fullName ?? '');
    setContactNumber(profile?.contactNumber ?? '');
    setPurok(profile?.purok ?? 'Purok 1');
  }, [profile?.fullName, profile?.contactNumber, profile?.purok]);

  useEffect(() => {
    if (!isStaff) return;
    let active = true;
    setLoadingResidents(true);
    void getResidentProfiles()
      .then((profiles) => {
        if (active) setResidents(profiles.sort((a, b) => a.fullName.localeCompare(b.fullName)));
      })
      .catch((loadError: unknown) => {
        console.error('Unable to load resident profiles', loadError);
        if (active) setError('Unable to load resident profiles. Check your connection and administrator permissions.');
      })
      .finally(() => {
        if (active) setLoadingResidents(false);
      });
    return () => { active = false; };
  }, [isStaff]);

  const saveProfile = async () => {
    if (!user || !profile) return;
    const name = fullName.trim();
    const phone = contactNumber.trim();
    if (!name || name.length > 200 || phone.length > 30) {
      setError('Enter a name (up to 200 characters) and a phone number no longer than 30 characters.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await updateUserProfile(user.uid, {
        fullName: name,
        contactNumber: phone,
        ...(isStaff ? {} : { purok }),
      });
      await refreshProfile();
      setToast('Profile details saved.');
    } catch (saveError) {
      console.error('Unable to save profile details', saveError);
      setError('Unable to save profile details. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !user || !profile) return;
    if (!allowedPhotoTypes.includes(file.type) || file.size > maxPhotoSize) {
      setError('Choose a JPG, PNG, or WebP image smaller than 5 MB.');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const profilePhoto = await uploadUserProfilePhoto(file);
      await updateUserProfilePhoto(user.uid, profilePhoto);
      await refreshProfile();
      setToast('Profile photo updated.');
    } catch (uploadError) {
      console.error('Unable to update profile photo', uploadError);
      setError(uploadError instanceof Error
        ? uploadError.message
        : 'Unable to update profile photo. Please check your connection and try again.');
    } finally {
      setUploading(false);
    }
  };

  const backRoute = isStaff ? '/admin/dashboard' : '/tab1';

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
      <IonContent className="services-content ion-padding">
        <div className={`profile-shell${isStaff ? ' profile-shell-staff' : ''}`}>
          <IonButton className="profile-back" fill="clear" onClick={() => navigate(backRoute)}>
            <IonIcon icon={arrowBackOutline} slot="start" /> Back
          </IonButton>
          <div className="profile-heading">
            <span className="services-pill"><IonIcon icon={personCircleOutline} /> {isStaff ? 'Admin profile' : 'Resident profile'}</span>
            <h1>My profile</h1>
            <p>Manage your photo and contact information.</p>
          </div>

          <section className="profile-card" aria-label="Your profile">
            <div className="profile-card-top">
              <ProfilePhoto profilePhoto={profile?.profilePhoto} name={profile?.fullName || 'Profile'} />
              <div className="profile-card-identity">
                <strong>{profile?.fullName || 'Your profile'}</strong>
                <span>{isStaff ? 'Barangay Administrator' : 'Resident'}</span>
              </div>
              <input
                ref={photoInput}
                className="profile-file-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label="Choose profile photo"
                onChange={(event) => void uploadPhoto(event)}
              />
              <IonButton
                className="profile-photo-button"
                fill="outline"
                disabled={uploading}
                onClick={() => photoInput.current?.click()}
              >
                {uploading ? <IonSpinner name="crescent" /> : <IonIcon icon={cameraOutline} slot="start" />}
                {uploading ? 'Uploading' : 'Change photo'}
              </IonButton>
            </div>

            <div className="profile-fields">
              <IonItem>
                <IonLabel position="stacked">Full name</IonLabel>
                <IonInput value={fullName} maxlength={200} onIonInput={(event) => setFullName(event.detail.value ?? '')} />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Email address</IonLabel>
                <IonInput value={profile?.email ?? ''} readonly />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Contact number</IonLabel>
                <IonInput
                  type="tel"
                  value={contactNumber}
                  maxlength={30}
                  onIonInput={(event) => setContactNumber(event.detail.value ?? '')}
                />
              </IonItem>
              {!isStaff && (
                <IonItem>
                  <IonLabel position="stacked">Purok</IonLabel>
                  <IonSelect value={purok} onIonChange={(event) => setPurok(event.detail.value)}>
                    {puroks.map((item) => <IonSelectOption key={item} value={item}>{item}</IonSelectOption>)}
                  </IonSelect>
                </IonItem>
              )}
            </div>
            <IonButton className="profile-save" expand="block" disabled={saving} onClick={() => void saveProfile()}>
              {saving ? <IonSpinner name="crescent" /> : <IonIcon icon={saveOutline} slot="start" />}
              Save profile
            </IonButton>
          </section>

          {isStaff && (
            <section className="resident-directory" aria-label="Resident profiles">
              <div className="resident-directory-heading">
                <h2>Resident profiles</h2>
                <p>Resident contact details are visible to authorized administrators only.</p>
              </div>
              {loadingResidents ? (
                <div className="profile-loading"><IonSpinner /><span>Loading resident profiles...</span></div>
              ) : residents.length === 0 ? (
                <p className="profile-empty">No resident profiles found.</p>
              ) : (
                <div className="resident-directory-list">
                  {residents.map((resident) => (
                    <button
                      className={`resident-directory-row${selectedResident?.uid === resident.uid ? ' is-selected' : ''}`}
                      key={resident.uid}
                      type="button"
                      onClick={() => setSelectedResident(resident)}
                    >
                      <ProfilePhoto profilePhoto={resident.profilePhoto} name={resident.fullName} size="small" />
                      <span><strong>{resident.fullName}</strong><small>{resident.purok || 'Purok not provided'}</small></span>
                    </button>
                  ))}
                </div>
              )}
              {selectedResident && (
                <div className="resident-details">
                  <ProfilePhoto profilePhoto={selectedResident.profilePhoto} name={selectedResident.fullName} />
                  <div>
                    <h3>{selectedResident.fullName}</h3>
                    <p><strong>Email:</strong> {selectedResident.email}</p>
                    <p><strong>Contact:</strong> {selectedResident.contactNumber || 'Not provided'}</p>
                    <p><strong>Purok:</strong> {selectedResident.purok || 'Not provided'}</p>
                  </div>
                </div>
              )}
            </section>
          )}

          {error && <p className="services-error profile-error" role="alert">{error}</p>}
        </div>
        <IonToast isOpen={!!toast} message={toast} duration={2500} position="top" onDidDismiss={() => setToast('')} />
      </IonContent>
    </IonPage>
  );
};

export default Profile;
