import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ setDoc: vi.fn(), deleteObject: vi.fn(), upload: vi.fn() }));
vi.mock('../firebase/config', () => ({ db: {}, storage: {} }));
vi.mock('firebase/firestore', () => ({ collection: vi.fn(), doc: () => ({ id: 'post-1' }), serverTimestamp: () => 'timestamp', setDoc: mocks.setDoc }));
vi.mock('firebase/storage', () => ({ ref: (_storage: unknown, path: string) => path, uploadBytesResumable: mocks.upload, deleteObject: mocks.deleteObject }));
import { publishBoardPost, uploadErrorMessage, validateAttachment } from './transparencyService';
const data = { title: 'Budget', category: 'Budget & Finances', description: 'Annual budget', publishedBy: 'Staff', publishedByUid: 'staff-1' };
const pdf = new File(['document'], 'budget.pdf', { type: 'application/pdf' });
beforeEach(() => { vi.resetAllMocks(); mocks.setDoc.mockResolvedValue(undefined); mocks.deleteObject.mockResolvedValue(undefined); });
describe('staff publications', () => {
  it('publishes text without calling storage', async () => {
    await publishBoardPost(data, null, vi.fn(), vi.fn());
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.setDoc).toHaveBeenCalledWith({ id: 'post-1' }, expect.objectContaining({ attachmentPath: '', ...data }));
  });
  it('reports progress and publishes only after upload completes', async () => {
    mocks.upload.mockReturnValue({ on: (_event: string, progress: (s: unknown) => void, _error: unknown, complete: () => void) => { expect(mocks.setDoc).not.toHaveBeenCalled(); progress({ bytesTransferred: 5, totalBytes: 10 }); complete(); } });
    const progress = vi.fn();
    await publishBoardPost(data, pdf, progress, vi.fn());
    expect(progress).toHaveBeenCalledWith(50);
    expect(mocks.setDoc).toHaveBeenCalledWith({ id: 'post-1' }, expect.objectContaining({ attachmentPath: 'transparency/post-1/attachment', attachmentName: 'budget.pdf' }));
  });
  it('does not publish when upload is canceled', async () => {
    mocks.upload.mockReturnValue({ on: (_event: string, _progress: unknown, reject: (e: unknown) => void) => reject({ code: 'storage/canceled' }) });
    await expect(publishBoardPost(data, pdf, vi.fn(), vi.fn())).rejects.toEqual({ code: 'storage/canceled' });
    expect(mocks.setDoc).not.toHaveBeenCalled();
  });
  it('cleans up the attachment if publishing is denied', async () => {
    mocks.upload.mockReturnValue({ on: (_event: string, _progress: unknown, _error: unknown, complete: () => void) => complete() });
    mocks.setDoc.mockRejectedValue({ code: 'permission-denied' });
    await expect(publishBoardPost(data, pdf, vi.fn(), vi.fn())).rejects.toEqual({ code: 'permission-denied' });
    expect(mocks.deleteObject).toHaveBeenCalledWith('transparency/post-1/attachment');
  });
  it('rejects empty, unsupported and oversized attachments', () => {
    expect(validateAttachment(new File([], 'empty.pdf', { type: 'application/pdf' }))).toMatch(/empty/);
    expect(validateAttachment(new File(['x'], 'x.html', { type: 'text/html' }))).toMatch(/PDF/);
    const large = new File(['x'], 'large.pdf', { type: 'application/pdf' });
    Object.defineProperty(large, 'size', { value: 10 * 1024 * 1024 + 1 });
    expect(validateAttachment(large)).toMatch(/10 MB/);
    expect(validateAttachment(pdf)).toBeNull();
  });
  it('distinguishes storage permission and configuration failures', () => {
    expect(uploadErrorMessage({ code: 'storage/unauthorized' })).toMatch(/Storage rules/);
    expect(uploadErrorMessage({ code: 'storage/bucket-not-found' })).toMatch(/not configured/);
  });
});

describe('direct Firestore images', () => {
  it('stores image data in the document without calling Storage', async () => {
    const file = new File(['image content'], 'photo.png', { type: 'image/png' });
    await publishBoardPost(data, file, vi.fn(), vi.fn());
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.setDoc).toHaveBeenCalledWith({ id: 'post-1' }, expect.objectContaining({ imageData: 'data:image/png;base64,aW1hZ2UgY29udGVudA==', attachmentPath: '', attachmentName: 'photo.png' }));
  });
  it('rejects images above the Firestore image limit before writing', async () => {
    const file = new File(['image'], 'photo.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 600 * 1024 + 1 });
    await expect(publishBoardPost(data, file, vi.fn(), vi.fn())).rejects.toThrow(/600 KB/);
    expect(mocks.setDoc).not.toHaveBeenCalled();
    expect(mocks.upload).not.toHaveBeenCalled();
  });
  it('does not attempt Storage cleanup when a Firestore image write fails', async () => {
    mocks.setDoc.mockRejectedValue({ code: 'permission-denied' });
    const file = new File(['image'], 'photo.jpg', { type: 'image/jpeg' });
    await expect(publishBoardPost(data, file, vi.fn(), vi.fn())).rejects.toEqual({ code: 'permission-denied' });
    expect(mocks.deleteObject).not.toHaveBeenCalled();
  });
});
