import React, { useEffect, useRef, useState } from 'react';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonPage,
  IonSpinner,
  IonToolbar,
} from '@ionic/react';
import { arrowBackOutline, chatbubbleEllipsesOutline, sendOutline } from 'ionicons/icons';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
  type Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import BarangayLogo from '../components/BarangayLogo';
import ResidentLogout from '../components/ResidentLogout';
import './Chat.css';

interface Conversation {
  residentUid: string;
  residentName: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  lastMessage: string;
  lastSenderUid: string;
}

interface ChatMessage {
  id: string;
  senderUid: string;
  senderName: string;
  text: string;
  createdAt?: Timestamp;
}

const formatTime = (timestamp?: Timestamp) => {
  if (!timestamp) return '';
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp.toDate());
};

const Chat: React.FC = () => {
  const { user, profile } = useAuth();
  const isStaff = profile?.role === 'admin';
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !profile) return;

    if (profile.role === 'admin') {
      const conversationsQuery = query(
        collection(db, 'chats'),
        orderBy('updatedAt', 'desc')
      );
      return onSnapshot(
        conversationsQuery,
        (snapshot) => {
          const nextConversations = snapshot.docs.map(
            (chat) => chat.data() as Conversation
          );
          setConversations(nextConversations);
          setSelectedConversation((current) =>
            nextConversations.find((conversation) =>
              conversation.residentUid === current?.residentUid
            ) ?? nextConversations[0] ?? null
          );
          setLoadingConversations(false);
          setError('');
        },
        (snapshotError) => {
          console.error('Unable to load chat conversations', snapshotError);
          setLoadingConversations(false);
          setError('Unable to load resident conversations. Check your connection and staff permissions.');
        }
      );
    }

    let active = true;
    let unsubscribe: (() => void) | undefined;
    const conversationRef = doc(db, 'chats', user.uid);

    const startConversation = async () => {
      try {
        const existingConversation = await getDoc(conversationRef);
        if (!existingConversation.exists()) {
          await setDoc(conversationRef, {
            residentUid: user.uid,
            residentName: profile.fullName || 'Resident',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastMessage: '',
            lastSenderUid: '',
          });
        }
        if (!active) return;
        unsubscribe = onSnapshot(
          conversationRef,
          (snapshot) => {
            if (snapshot.exists()) {
              setSelectedConversation(snapshot.data() as Conversation);
            }
            setLoadingConversations(false);
            setError('');
          },
          (snapshotError) => {
            console.error('Unable to load resident chat', snapshotError);
            setLoadingConversations(false);
            setError('Unable to open chat. Check your connection and try again.');
          }
        );
      } catch (conversationError) {
        console.error('Unable to create resident chat', conversationError);
        if (active) {
          setLoadingConversations(false);
          setError('Unable to open chat. Check your connection and try again.');
        }
      }
    };

    void startConversation();
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [profile, user]);

  const selectedConversationId = selectedConversation?.residentUid;

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    setLoadingMessages(true);
    const messagesQuery = query(
      collection(db, 'chats', selectedConversationId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(
      messagesQuery,
      (snapshot) => {
        setMessages(snapshot.docs.map((message) => ({
          id: message.id,
          ...message.data(),
        } as ChatMessage)));
        setLoadingMessages(false);
        setError('');
      },
      (snapshotError) => {
        console.error('Unable to load chat messages', snapshotError);
        setLoadingMessages(false);
        setError('Unable to load messages. Check your connection and try again.');
      }
    );
  }, [selectedConversationId]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || text.length > 2000 || !user || !profile || !selectedConversation || sending) return;

    setSending(true);
    setError('');
    const conversationRef = doc(db, 'chats', selectedConversation.residentUid);
    const messageRef = doc(collection(conversationRef, 'messages'));
    const batch = writeBatch(db);
    batch.set(messageRef, {
      senderUid: user.uid,
      senderName: profile.fullName || (isStaff ? 'Barangay Staff' : 'Resident'),
      text,
      createdAt: serverTimestamp(),
    });
    batch.update(conversationRef, {
      lastMessage: text,
      lastSenderUid: user.uid,
      updatedAt: serverTimestamp(),
    });

    try {
      await batch.commit();
      setDraft('');
    } catch (sendError) {
      console.error('Unable to send chat message', sendError);
      setError('Message could not be sent. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const title = isStaff ? 'Resident messages' : 'Chat with barangay staff';

  return (
    <IonPage className="chat-page">
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
        <div className={`chat-shell${isStaff ? ' chat-shell-staff' : ''}`}>
          <div className="chat-heading">
            <span className="services-pill"><IonIcon icon={chatbubbleEllipsesOutline} /> Secure messages</span>
            <h1>{title}</h1>
            <p>{isStaff
              ? 'Reply to residents and follow conversations in real time.'
              : 'Send a message to the barangay staff. Replies will appear here.'}</p>
          </div>

          {error && <p className="services-error chat-error" role="alert">{error}</p>}

          <div className={`chat-layout${isStaff ? ' is-staff' : ''}${isStaff && selectedConversation ? ' has-selection' : ''}`}>
            {isStaff && (
              <aside className={`chat-inbox${selectedConversation ? ' is-hidden-mobile' : ''}`} aria-label="Resident conversations">
                <h2>Conversations</h2>
                {loadingConversations ? (
                  <div className="chat-loading"><IonSpinner /><span>Loading conversations...</span></div>
                ) : conversations.length === 0 ? (
                  <p className="chat-empty-inbox">No resident conversations yet.</p>
                ) : conversations.map((conversation) => (
                  <button
                    className={`chat-conversation${selectedConversation?.residentUid === conversation.residentUid ? ' is-selected' : ''}`}
                    key={conversation.residentUid}
                    type="button"
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <span className="chat-avatar">{conversation.residentName.charAt(0).toUpperCase()}</span>
                    <span className="chat-conversation-copy">
                      <strong>{conversation.residentName}</strong>
                      <small>{conversation.lastMessage || 'Start a conversation'}</small>
                    </span>
                    <time>{formatTime(conversation.updatedAt)}</time>
                  </button>
                ))}
              </aside>
            )}

            <section className={`chat-thread${isStaff && !selectedConversation ? ' is-hidden-mobile' : ''}`} aria-label="Chat messages">
              {isStaff && selectedConversation && (
                <div className="chat-thread-heading">
                  <button className="chat-back" type="button" onClick={() => setSelectedConversation(null)}>
                    <IonIcon icon={arrowBackOutline} /><span>Conversations</span>
                  </button>
                  <div className="chat-avatar">{selectedConversation.residentName.charAt(0).toUpperCase()}</div>
                  <strong>{selectedConversation.residentName}</strong>
                </div>
              )}
              {(!isStaff || selectedConversation) ? (
                <>
                  <div className="chat-messages" aria-live="polite">
                    {loadingMessages ? (
                      <div className="chat-loading"><IonSpinner /><span>Loading messages...</span></div>
                    ) : messages.length === 0 ? (
                      <div className="chat-message-empty">
                        <IonIcon icon={chatbubbleEllipsesOutline} />
                        <strong>No messages yet</strong>
                        <span>Send a message to start the conversation.</span>
                      </div>
                    ) : messages.map((message) => {
                      const ownMessage = message.senderUid === user?.uid;
                      return (
                        <div className={`chat-message-row${ownMessage ? ' is-own' : ''}`} key={message.id}>
                          <div className="chat-message-bubble">
                            <span>{ownMessage ? 'You' : message.senderName}</span>
                            <p>{message.text}</p>
                            <time>{formatTime(message.createdAt)}</time>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messageEndRef} />
                  </div>
                  <form className="chat-compose" onSubmit={(event) => void sendMessage(event)}>
                    <IonInput
                      aria-label="Message"
                      placeholder="Write a message..."
                      value={draft}
                      maxlength={2000}
                      onIonInput={(event) => setDraft(event.detail.value ?? '')}
                    />
                    <IonButton
                      aria-label="Send message"
                      type="submit"
                      disabled={!draft.trim() || draft.trim().length > 2000 || sending}
                    >
                      {sending ? <IonSpinner name="crescent" /> : <IonIcon icon={sendOutline} />}
                    </IonButton>
                  </form>
                </>
              ) : (
                <div className="chat-select-prompt">
                  <IonIcon icon={chatbubbleEllipsesOutline} />
                  <strong>Select a conversation</strong>
                  <span>Choose a resident to view and reply to their messages.</span>
                </div>
              )}
            </section>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Chat;
