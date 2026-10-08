import ResidentLogout from '../components/ResidentLogout';
import React, { useEffect, useRef, useState } from 'react';
import { IonAlert, IonBadge, IonButton, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonList, IonPage, IonProgressBar, IonSearchbar, IonSelect, IonSelectOption, IonSpinner, IonTextarea, IonToolbar } from '@ionic/react';
import { documentTextOutline, shieldCheckmark } from 'ionicons/icons';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, type Timestamp } from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, type UploadTask } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import BarangayLogo from '../components/BarangayLogo';
import './Services.css';
import './TransparencyBoard.css';

const categories = ['Budget & Finances', 'Projects', 'Procurement', 'Reports', 'Other'];
type BoardPost = { id: string; title: string; category: string; description: string; publishedBy: string; publishedByUid: string; createdAt: Timestamp | null; attachmentName: string; attachmentPath: string; imageData?: string };
import { publishBoardPost, uploadErrorMessage, validateAttachment } from '../services/transparencyService';

const TransparencyBoard: React.FC = () => {
  const { user, profile } = useAuth();
  const isStaff = profile?.role === 'admin';
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const working = useRef(false);
  const uploadTask = useRef<UploadTask | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState('');
  useEffect(() => () => { uploadTask.current?.cancel(); }, []);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<BoardPost | null>(null);
  const [opening, setOpening] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(query(collection(db, 'transparencyPosts'), orderBy('createdAt', 'desc')), (snapshot) => {
      setPosts(snapshot.docs.map((item) => ({ ...item.data(), id: item.id } as BoardPost)));
      setLoading(false); setLoadError('');
    }, (err) => { setLoading(false); setLoadError(uploadErrorMessage(err)); });
  }, [user]);

  const publish = async (event: React.FormEvent) => {
    event.preventDefault();
    if (working.current || !user || !isStaff) return;
    setError(''); setMessage('');
    if (!title.trim() || !description.trim() || !categories.includes(category)) { setError('Please enter a title, category, and details.'); return; }
    if (title.trim().length > 150 || description.trim().length > 10000) { setError('Use a title up to 150 characters and details up to 10,000 characters.'); return; }
    if (file) { const validation = validateAttachment(file); if (validation) { setFileError(validation); return; } }
    working.current = true; setBusy(true); setProgress(0);
    try {
      await publishBoardPost({ title: title.trim(), category, description: description.trim(), publishedBy: profile?.fullName || 'Barangay Staff', publishedByUid: user.uid }, file, setProgress, (task) => { uploadTask.current = task; setUploading(!!task); });
      setTitle(''); setDescription(''); setFile(null);
      if (fileInput.current) fileInput.current.value = '';
      setMessage('Post published. Residents can now view it on the Transparency Board.');
    } catch (err) {
      console.error('Unable to publish board post', err);
      setError(uploadErrorMessage(err));
    } finally { working.current = false; setBusy(false); }
  };

  const remove = async (post: BoardPost) => {
    if (!isStaff || working.current) return;
    working.current = true; setBusy(true); setError(''); setMessage('');
    try {
      await deleteDoc(doc(db, 'transparencyPosts', post.id));
      if (post.attachmentPath) {
        try { await deleteObject(ref(storage, post.attachmentPath)); }
        catch (err) { console.error('Attachment cleanup failed', err); setError('Post removed, but its attachment could not be deleted from storage. Ask an administrator to remove the stored file.'); }
      }
      setMessage('Post removed from the board.');
    } catch (err) { console.error(err); setError('Unable to remove this post. Please try again.'); }
    finally { working.current = false; setBusy(false); }
  };

  const openAttachment = async (post: BoardPost) => {
    setOpening(post.id); setError('');
    // Open immediately so browsers do not block the tab after the async URL lookup.
    const tab = window.open('about:blank', '_blank');
    if (tab) tab.opener = null;
    try {
      const url = await getDownloadURL(ref(storage, post.attachmentPath));
      if (tab) tab.location.href = url;
      else window.location.assign(url);
    } catch (err) { tab?.close(); console.error(err); setError('Unable to open the attachment. Please try again.'); }
    finally { setOpening(null); }
  };

  const visible = posts.filter((post) => (filter === 'All' || post.category === filter) && `${post.title} ${post.description}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <IonPage className="services-page board-page">
      <IonHeader className="ion-no-border"><IonToolbar className="services-toolbar"><div className="services-brand"><BarangayLogo size={36} /><div><small>Republika ng Pilipinas</small><strong>Barangay Antonino</strong></div><ResidentLogout /></div></IonToolbar></IonHeader>
      <IonContent className="ion-padding services-content">
        <div className="services-shell">
          <p className="services-eyebrow">Official Citizen Portal • Transparency</p>
          <div className="services-hero"><span className="services-pill"><IonIcon icon={shieldCheckmark} /> Public Accountability</span><h1>Transparency Board</h1><p>Stay informed about barangay funds, projects, and official reports published by barangay staff.</p></div>
          {error && <p role="alert" className="services-error">{error}</p>}
          {message && <p role="status" className="services-success">{message}</p>}
          {isStaff && <form className="services-form board-composer" onSubmit={(event) => void publish(event)}>
            <div className="services-form-heading"><h2 className="services-section-title">Publish to the Board</h2><p className="services-hint">Posts are visible to all signed-in residents immediately after publishing.</p></div>
            <IonList>
              <IonItem><IonInput label="Title *" labelPlacement="stacked" maxlength={150} value={title} disabled={busy} onIonInput={(event) => setTitle(event.detail.value || '')} /></IonItem>
              <IonItem><IonSelect label="Category *" labelPlacement="stacked" value={category} disabled={busy} onIonChange={(event) => setCategory(event.detail.value)}>{categories.map((item) => <IonSelectOption key={item} value={item}>{item}</IonSelectOption>)}</IonSelect></IonItem>
              <IonItem><IonTextarea label="Details *" labelPlacement="stacked" rows={4} autoGrow maxlength={10000} value={description} disabled={busy} onIonInput={(event) => setDescription(event.detail.value || '')} /></IonItem>
            </IonList>
            <div className="board-file"><label htmlFor="board-attachment">Attachment (optional)</label><p className="services-hint">JPG/PNG: up to 600 KB. PDF: up to 10 MB.</p><input id="board-attachment" ref={fileInput} type="file" accept="application/pdf,image/jpeg,image/png" disabled={busy} onChange={(event) => { const selected = event.target.files?.[0] || null; setFile(selected); setFileError(selected ? validateAttachment(selected) || '' : ''); }} /></div>
            {fileError && <p className="services-error" role="alert">{fileError}</p>}
            {file && <div className="board-file"><p>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p><IonButton fill="clear" disabled={busy} onClick={() => { setFile(null); setFileError(''); if (fileInput.current) fileInput.current.value = ''; }}>Remove Attachment</IonButton></div>}
            {busy && <div className="board-file" role="status"><p>{uploading ? `Uploading attachment: ${progress}%` : 'Saving publication...'}</p><IonProgressBar type={uploading ? 'determinate' : 'indeterminate'} value={progress / 100} />{uploading && <IonButton fill="clear" color="danger" onClick={() => uploadTask.current?.cancel()}>Cancel Upload</IonButton>}</div>}
            <IonButton className="services-submit" type="submit" expand="block" disabled={busy || !!fileError}>{busy ? 'Please wait...' : 'Publish Post'}</IonButton>
          </form>}
          <h2 className="services-section-title">Official Publications</h2>
          <div className="board-filters"><IonSearchbar aria-label="Search publications" placeholder="Search publications" value={search} onIonInput={(event) => setSearch(event.detail.value || '')} /><IonSelect aria-label="Filter by category" label="Category" value={filter} onIonChange={(event) => setFilter(event.detail.value)}><IonSelectOption value="All">All categories</IonSelectOption>{categories.map((item) => <IonSelectOption key={item} value={item}>{item}</IonSelectOption>)}</IonSelect></div>
          {loading ? <div className="board-empty" role="status"><IonSpinner /><p>Loading publications...</p></div> : loadError ? <p role="alert" className="services-error">{loadError}</p> : visible.length === 0 ? <div className="board-empty"><IonIcon icon={documentTextOutline} /><h3>{posts.length === 0 ? 'No publications yet' : 'No matching publications'}</h3><p>{posts.length === 0 ? 'Staff publications will appear here once posted.' : 'Try a different search or category.'}</p></div> : visible.map((post) => (
            <article className="board-post" key={post.id}>
              <div className="board-post-top"><IonBadge color="success">{post.category}</IonBadge><span>{post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Just published'}</span></div>
              <h2>{post.title}</h2><p className="board-description">{post.description}</p>
              {post.imageData && /^data:image\/(jpeg|png);base64,/.test(post.imageData) && <img src={post.imageData} alt={post.title} loading="lazy" className="board-image" />}
              {post.attachmentPath && <IonButton fill="outline" disabled={opening !== null} onClick={() => void openAttachment(post)}><IonIcon icon={documentTextOutline} slot="start" />{opening === post.id ? 'Opening...' : 'View Attachment'}</IonButton>}
              {post.attachmentName && <p className="services-hint">{post.attachmentName}</p>}
              <div className="board-post-footer"><span>Published by {post.publishedBy}</span>{isStaff && <IonButton size="small" fill="clear" color="danger" disabled={busy} onClick={() => setDeleteTarget(post)}>Remove</IonButton>}</div>
            </article>
          ))}
        </div>
        <IonAlert isOpen={!!deleteTarget} header="Remove publication?" message="This post will be removed from the residents' Transparency Board." onDidDismiss={() => setDeleteTarget(null)} buttons={[{ text: 'Cancel', role: 'cancel' }, { text: 'Remove', role: 'destructive', handler: () => { if (deleteTarget) void remove(deleteTarget); } }]} />
      </IonContent>
    </IonPage>
  );
};
export default TransparencyBoard;
