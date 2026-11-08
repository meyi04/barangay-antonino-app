import { useCallback, useEffect, useMemo, useState } from 'react';
import { IonIcon, IonPopover, IonSpinner } from '@ionic/react';
import { checkmarkOutline, closeOutline, notificationsOutline } from 'ionicons/icons';
import {
  collection,
  limit,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import './NotificationBell.css';

interface AppNotification {
  id: string;
  title: string;
  body: string;
  route: string;
  read: boolean;
  createdAt: number;
}

const formatTimestamp = (timestamp: number) => {
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp);
};

const NotificationBell: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const storageKey = user ? `antonino_notifications_${user.uid}` : '';
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [popoverEvent, setPopoverEvent] = useState<Event>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [storageReady, setStorageReady] = useState(false);
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications],
  );
  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.read),
    [notifications],
  );

  const addNotification = useCallback((notification: AppNotification) => {
    setNotifications((current) => current.some((item) => item.id === notification.id)
      ? current
      : [notification, ...current].slice(0, 100));
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      setStorageReady(false);
      return;
    }

    setNotifications([]);
    setStorageReady(false);
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setNotifications(parsed.filter((item): item is AppNotification =>
            typeof item?.id === 'string' &&
            typeof item?.title === 'string' &&
            typeof item?.body === 'string' &&
            typeof item?.route === 'string' &&
            typeof item?.read === 'boolean' &&
            typeof item?.createdAt === 'number'
          ));
        }
      }
    } catch (storageError) {
      console.error('Unable to load saved notifications', storageError);
      setError('Unable to load saved notifications from this device.');
    }
    setStorageReady(true);
    setLoading(true);
    let requestSnapshotInitialized = false;
    const requestStatuses = new Map<string, string>();
    const requestsQuery = profile?.role === 'admin'
      ? query(collection(db, 'requests'), limit(200))
      : query(collection(db, 'requests'), where('submittedByUid', '==', user.uid), limit(200));

    const stopRequests = onSnapshot(requestsQuery, (snapshot) => {
      if (!requestSnapshotInitialized) {
        snapshot.docs.forEach((request) => requestStatuses.set(request.id, String(request.get('status') ?? '')));
        requestSnapshotInitialized = true;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        const request = change.doc;
        const status = String(request.get('status') ?? '');
        const previousStatus = requestStatuses.get(request.id);
        requestStatuses.set(request.id, status);
        if (profile?.role === 'admin' && change.type === 'added') {
          const ticket = String(request.get('ticketNo') ?? request.id);
          const name = String(request.get('submittedByName') ?? 'A resident');
          addNotification({
            id: `request-new-${request.id}`,
            title: 'New service request',
            body: `${name} submitted request ${ticket}.`,
            route: '/admin/requests',
            read: false,
            createdAt: Date.now(),
          });
        } else if (
          profile?.role === 'resident' &&
          change.type === 'modified' &&
          previousStatus !== undefined &&
          status !== previousStatus
        ) {
          const ticket = String(request.get('ticketNo') ?? request.id);
          addNotification({
            id: `request-status-${request.id}-${status}`,
            title: 'Request status updated',
            body: `Your request ${ticket} is now ${status}.`,
            route: '/tab3',
            read: false,
            createdAt: Date.now(),
          });
        }
      });
    }, (snapshotError) => {
      console.error('Unable to watch request notifications', snapshotError);
      setError('Unable to watch request updates. Check your connection and permissions.');
    });

    let chatSnapshotInitialized = false;
    const lastChatMessages = new Map<string, string>();
    const chatsQuery = profile?.role === 'admin'
      ? query(collection(db, 'chats'), limit(200))
      : query(collection(db, 'chats', user.uid, 'messages'), limit(200));

    const stopChats = onSnapshot(chatsQuery, (snapshot) => {
      if (!chatSnapshotInitialized) {
        if (profile?.role === 'admin') {
          snapshot.docs.forEach((chat) => {
            lastChatMessages.set(chat.id, String(chat.get('updatedAt')?.toMillis?.() ?? ''));
          });
        } else {
          snapshot.docs.forEach((message) => lastChatMessages.set(message.id, String(message.get('senderUid') ?? '')));
        }
        chatSnapshotInitialized = true;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        const chatOrMessage = change.doc;
        if (profile?.role === 'admin') {
          const senderUid = String(chatOrMessage.get('lastSenderUid') ?? '');
          const updatedAt = String(chatOrMessage.get('updatedAt')?.toMillis?.() ?? '');
          const previousUpdate = lastChatMessages.get(chatOrMessage.id);
          lastChatMessages.set(chatOrMessage.id, updatedAt);
          if (change.type === 'modified' && senderUid && senderUid !== user.uid && updatedAt !== previousUpdate) {
            const residentName = String(chatOrMessage.get('residentName') ?? 'Resident');
            const message = String(chatOrMessage.get('lastMessage') ?? 'You have a new message.');
            addNotification({
              id: `message-${chatOrMessage.id}-${updatedAt}`,
              title: `New message from ${residentName}`,
              body: message.slice(0, 120),
              route: '/admin/chat',
              read: false,
              createdAt: Date.now(),
            });
          }
        } else if (change.type === 'added' && chatOrMessage.get('senderUid') !== user.uid) {
          const messageId = chatOrMessage.id;
          if (lastChatMessages.has(messageId)) return;
          lastChatMessages.set(messageId, String(chatOrMessage.get('senderUid') ?? ''));
          addNotification({
            id: `message-${user.uid}-${messageId}`,
            title: `New message from ${String(chatOrMessage.get('senderName') ?? 'Barangay staff')}`,
            body: String(chatOrMessage.get('text') ?? 'You have a new message.').slice(0, 120),
            route: '/chat',
            read: false,
            createdAt: Date.now(),
          });
        } else if (profile?.role === 'resident') {
          lastChatMessages.set(chatOrMessage.id, String(chatOrMessage.get('senderUid') ?? ''));
        }
      });
    }, (snapshotError) => {
      console.error('Unable to watch chat notifications', snapshotError);
      setError('Unable to watch message updates. Check your connection and permissions.');
    });

    setLoading(false);
    return () => {
      stopRequests();
      stopChats();
    };
  }, [addNotification, profile?.role, storageKey, user]);

  useEffect(() => {
    if (!storageReady || !storageKey) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(notifications));
    } catch (storageError) {
      console.error('Unable to save notifications', storageError);
      setError('Unable to save notifications on this device.');
    }
  }, [notifications, storageKey, storageReady]);

  const markAsRead = (notification: AppNotification) => {
    setNotifications((current) => current.map((item) => item.id === notification.id
      ? { ...item, read: true }
      : item));
  };

  const openNotification = (notification: AppNotification) => {
    markAsRead(notification);

    setOpen(false);
    const route = notification.route.startsWith('/') && !notification.route.startsWith('//')
      ? notification.route
      : '/';
    navigate(route);
  };

  return (
    <div className="notification-bell">
      <button
        className="notification-bell-trigger"
        type="button"
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        onClick={(event) => {
          setPopoverEvent(event.nativeEvent);
          setOpen(true);
        }}
      >
        <IonIcon icon={notificationsOutline} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="notification-bell-count">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>
      <IonPopover
        className="notification-popover"
        isOpen={open}
        event={popoverEvent}
        reference="trigger"
        side="bottom"
        alignment="end"
        onDidDismiss={() => setOpen(false)}
      >
        <section className="notification-panel" aria-label="Notifications">
          <div className="notification-panel-heading">
            <h2>Notifications</h2>
            <button type="button" aria-label="Close notifications" onClick={() => setOpen(false)}>
              <IonIcon icon={closeOutline} aria-hidden="true" />
            </button>
          </div>
          {error && <p className="notification-panel-error" role="alert">{error}</p>}
          {loading ? (
            <div className="notification-panel-state"><IonSpinner name="crescent" /> Loading...</div>
          ) : unreadNotifications.length === 0 ? (
            <p className="notification-panel-state">You’re all caught up.</p>
          ) : (
            <ul className="notification-list">
              {unreadNotifications.map((notification) => (
                <li key={notification.id}>
                  <div className="notification-item-row">
                    <button
                      className="notification-item is-unread"
                      type="button"
                      onClick={() => openNotification(notification)}
                    >
                      <span className="notification-item-title">{notification.title}</span>
                      <span className="notification-item-body">{notification.body}</span>
                      <time>{formatTimestamp(notification.createdAt)}</time>
                    </button>
                    <button
                      className="notification-mark-read"
                      type="button"
                      aria-label={`Mark ${notification.title} as read`}
                      title="Mark as read"
                      onClick={() => markAsRead(notification)}
                    >
                      <IonIcon icon={checkmarkOutline} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </IonPopover>
    </div>
  );
};

export default NotificationBell;
