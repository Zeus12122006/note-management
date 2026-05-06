import { openDB } from 'idb';

const DB_NAME = 'note_management_db';
const DB_VERSION = 1;

export const initDB = async () => {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('notes')) {
                db.createObjectStore('notes', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('labels')) {
                db.createObjectStore('labels', { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains('sync_queue')) {
                db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
            }
        },
    });
};

// Notes operations
export const getNotes = async () => {
    const db = await initDB();
    const notes = await db.getAll('notes');
    return notes.filter(n => !n.deleted_at);
};

export const saveNoteOffline = async (note) => {
    const db = await initDB();
    await db.put('notes', note);
    await addToSyncQueue('note', 'UPDATE', note); // CREATE or UPDATE
};

export const deleteNoteOffline = async (noteId) => {
    const db = await initDB();
    const note = await db.get('notes', noteId);
    if (note) {
        const now = new Date().toISOString();
        note.deleted_at = now;
        note.updated_at = now; // Cập nhật updated_at để server chấp nhận action theo LWW
        await db.put('notes', note);
        await addToSyncQueue('note', 'DELETE', note);
    }
};

// Labels operations
export const getLabels = async () => {
    const db = await initDB();
    const labels = await db.getAll('labels');
    return labels.filter(l => !l.deleted_at);
};

export const saveLabelOffline = async (label) => {
    const db = await initDB();
    await db.put('labels', label);
    await addToSyncQueue('label', 'UPDATE', label);
};

export const deleteLabelOffline = async (labelId) => {
    const db = await initDB();
    await db.delete('labels', labelId);
    await addToSyncQueue('label', 'DELETE', { id: labelId, updated_at: new Date().toISOString() });
};

// Sync Queue operations
export const addToSyncQueue = async (entity, action, data) => {
    const db = await initDB();
    await db.put('sync_queue', {
        entity,
        action,
        data,
        timestamp: new Date().toISOString()
    });
};

export const getSyncQueue = async () => {
    const db = await initDB();
    return await db.getAll('sync_queue');
};

export const clearSyncQueue = async () => {
    const db = await initDB();
    await db.clear('sync_queue');
};

export const syncServerDataToIDB = async (notes, labels) => {
    const db = await initDB();
    const tx = db.transaction(['notes', 'labels'], 'readwrite');
    const notesStore = tx.objectStore('notes');
    const labelsStore = tx.objectStore('labels');

    await notesStore.clear();
    await labelsStore.clear();

    for (const note of notes) {
        await notesStore.put(note);
    }
    for (const label of labels) {
        await labelsStore.put(label);
    }
    await tx.done;
};

export const clearAllOfflineData = async () => {
    const db = await initDB();
    const tx = db.transaction(['notes', 'labels', 'sync_queue'], 'readwrite');
    await tx.objectStore('notes').clear();
    await tx.objectStore('labels').clear();
    await tx.objectStore('sync_queue').clear();
    await tx.done;
};
