import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ProfileShortcut.css';

interface ProfileShortcutProps {
  variant?: 'header' | 'hero';
}

const ProfileShortcut: React.FC<ProfileShortcutProps> = ({ variant = 'header' }) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const route = profile?.role === 'admin' ? '/staff/profile' : '/profile';

  return (
    <button
      className={`profile-shortcut profile-shortcut-${variant}`}
      type="button"
      aria-label="View profile"
      onClick={() => navigate(route)}
    >
      {profile?.profilePhoto ? (
        <img src={profile.profilePhoto} alt="" />
      ) : (
        <span>{(profile?.fullName || 'U').charAt(0).toUpperCase()}</span>
      )}
    </button>
  );
};

export default ProfileShortcut;
