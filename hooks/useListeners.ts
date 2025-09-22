import { useState, useEffect, useCallback } from 'react';
import { db, rtdb } from '../utils/firebase';
import firebase from 'firebase/compat/app';
import type { Listener } from '../types';

const PAGE_SIZE = 10;

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
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastVisible, setLastVisible] = useState<firebase.firestore.QueryDocumentSnapshot<firebase.firestore.DocumentData> | null>(null);
    const [hasMore, setHasMore] = useState(true);

    const sortListeners = useCallback((list: Listener[]): Listener[] => {
        return [...list].sort((a, b) => {
            const aIsFav = favoriteListenerIds.includes(a.id);
            const bIsFav = favoriteListenerIds.includes(b.id);
            if (aIsFav !== bIsFav) return aIsFav ? -1 : 1; // Favorites first
            return b.rating - a.rating; // Then by rating
        });
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
        };
        statusRef.on('value', onStatusChange);
        return () => statusRef.off('value', onStatusChange);
    }, []);

    // Effect for the initial Firestore query
    useEffect(() => {
        setLoading(true);
        const query = db.collection('listeners').orderBy('rating', 'desc').limit(PAGE_SIZE);

        const unsubscribe = query.onSnapshot(snapshot => {
            const firstPageListeners = snapshot.docs.map(transformListenerDoc);
            setFirestoreListeners(firstPageListeners);
            setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
            setHasMore(firstPageListeners.length === PAGE_SIZE);
            setLoading(false);
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
        setListeners(sortListeners(combined));
    }, [firestoreListeners, onlineStatuses, sortListeners]);

    // --- PAGINATION ---

    const loadMoreListeners = useCallback(async () => {
        if (!hasMore || loadingMore || !lastVisible) return;
        setLoadingMore(true);

        try {
            const query = db.collection('listeners').orderBy('rating', 'desc').startAfter(lastVisible).limit(PAGE_SIZE);
            const snapshot = await query.get();
            const newListeners = snapshot.docs.map(transformListenerDoc);

            setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
            setHasMore(newListeners.length === PAGE_SIZE);
            
            // Append new listeners to the existing Firestore data
            setFirestoreListeners(prevListeners => {
                const combined = [...prevListeners, ...newListeners];
                // Ensure uniqueness in case of overlaps
                return Array.from(new Map(combined.map(l => [l.id, l])).values());
            });

        } catch (error) {
            console.error("Error loading more listeners:", error);
        } finally {
            setLoadingMore(false);
        }
    }, [hasMore, loadingMore, lastVisible]);

    return { listeners, loading, loadingMore, hasMore, loadMoreListeners };
};