import { useState, useEffect, useCallback } from 'react';
import { db, rtdb } from '../utils/firebase';
import firebase from 'firebase/compat/app';
import type { Listener } from '../types';

// This function now only transforms Firestore data, excluding the online status which comes from RTDB.
const transformListenerDoc = (doc: firebase.firestore.DocumentSnapshot<firebase.firestore.DocumentData>): Omit<Listener, 'online'> => {
    const data = doc.data() || {};
    return {
        id: doc.id,
        name: data.displayName || data.name || 'Unnamed Listener',
        image: data.avatarUrl || data.image || '',
        rating: data.rating || 0,
        reviewsCount: data.reviewsCount || 0,
        gender: data.gender || 'Female',
        age: data.age || 0,
    };
};

export const useListeners = (favoriteListenerIds: string[] = []) => {
    // State for the final, combined listener list
    const [listeners, setListeners] = useState<Listener[]>([]);
    
    // State for data fetched from Firestore
    const [firestoreListeners, setFirestoreListeners] = useState<Omit<Listener, 'online'>[]>([]);
    
    // State for online statuses from Realtime Database
    const [onlineStatuses, setOnlineStatuses] = useState<{ [key: string]: boolean }>({});

    // Loading and pagination state
    const [loading, setLoading] = useState(true);
    
    const sortAndSetListeners = useCallback((list: Listener[]): void => {
        const sorted = [...list].sort((a, b) => {
            // 1. Online status (true comes first)
            if (a.online !== b.online) return a.online ? -1 : 1;
            
            // 2. Favorites (true comes first)
            const aIsFav = favoriteListenerIds.includes(a.id);
            const bIsFav = favoriteListenerIds.includes(b.id);
            if (aIsFav !== bIsFav) return aIsFav ? -1 : 1;

            // 3. Rating (higher comes first)
            return b.rating - a.rating;
        });
        setListeners(sorted);
    }, [favoriteListenerIds]);
    
    // --- DATA FETCHING EFFECTS ---

    // Effect for fetching online statuses from Realtime Database
    useEffect(() => {
        const statusRef = rtdb.ref('status');
        const onStatusChange = (snapshot: firebase.database.DataSnapshot) => {
            const statuses = snapshot.val() || {};
            const newOnlineStatuses: { [key: string]: boolean } = {};
            Object.keys(statuses).forEach(uid => {
                newOnlineStatuses[uid] = statuses[uid]?.isOnline === true;
            });
            setOnlineStatuses(newOnlineStatuses);
            setLoading(false); // Assume loading is done after first status check
        };
        statusRef.on('value', onStatusChange);
        return () => statusRef.off('value', onStatusChange);
    }, []);

    // Effect for the initial Firestore query to get ALL active listeners
    useEffect(() => {
        setLoading(true);
        // FIX: Removed the .where() clause to avoid potential missing index errors.
        // We will fetch all listeners and filter for 'active' status on the client.
        const query = db.collection('listeners');

        const unsubscribe = query.onSnapshot(snapshot => {
            // FIX: Filter for active listeners on the client side to bypass index requirements.
            const activeDocs = snapshot.docs.filter(doc => doc.data()?.status === 'active');
            const allListeners = activeDocs.map(transformListenerDoc);
            
            setFirestoreListeners(allListeners);
        }, error => {
            console.error("Error with real-time listener fetch:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []); // Only runs once on mount

    // --- DATA COMBINING EFFECT ---

    // Effect to combine Firestore data and RTDB statuses into the final list
    useEffect(() => {
        const combined = firestoreListeners.map(l => ({
            ...l,
            online: onlineStatuses[l.id] || false,
        }));
        sortAndSetListeners(combined);
    }, [firestoreListeners, onlineStatuses, sortAndSetListeners]);


    return { listeners, loading, loadingMore: false, hasMore: false, loadMoreListeners: () => {} };
};