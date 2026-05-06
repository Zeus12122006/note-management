import axios from 'axios';
import { getSyncQueue, clearSyncQueue, syncServerDataToIDB } from './idbService';

// Cấu hình axios để mang theo cookie Sanctum
axios.defaults.withCredentials = true;

export const performSync = async () => {
    try {
        if (!navigator.onLine) {
            console.log('Currently offline. Sync skipped.');
            return;
        }

        const changes = await getSyncQueue();
        
        // Push các thay đổi lên server
        const response = await axios.post('/api/sync', { changes });

        if (response.data.status === 'success') {
            // Lấy data mới nhất từ server đập vào IndexedDB
            const { notes, labels } = response.data;
            await syncServerDataToIDB(notes, labels);
            
            // Xóa hàng đợi do đã sync xong
            await clearSyncQueue();
            console.log('Sync completed successfully!');
            return { success: true, notes, labels };
        }
    } catch (error) {
        console.error('Sync failed:', error);
        return { success: false, error };
    }
};

// Gọi tự động mỗi khi có mạng lại
window.addEventListener('online', () => {
    console.log('Back online! Triggering background sync...');
    performSync();
});
