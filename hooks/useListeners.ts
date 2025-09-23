import { useState, useEffect } from 'react';
import { db, rtdb } from '../utils/firebase';
import firebase from 'firebase/compat/app';
import type { Listener } from '../types';

// This function transforms Firestore data, excluding the online status which comes from RTDB.
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

/**
 * An optimized hook to fetch and manage the list of listeners with real-time online status.
 * This version uses separate effects for fetching profiles and statuses to improve performance
 * and prevent the app from hanging or becoming unresponsive.
 */
export const useListeners = (favoriteListenerIds: string[] = []) => {
    const [profiles, setProfiles] = useState<Omit<Listener, 'online'>[]>([]);
    const [onlineStatuses, setOnlineStatuses] = useState<Record<string, { isOnline: boolean }>>({});
    const [listeners, setListeners] = useState<Listener[]>([]);
    const [loading, setLoading] = useState(true);

    // Effect 1: Fetch listener profiles from Firestore once.
    useEffect(() => {
        setLoading(true);
        const query = db.collection('listeners').where('status', '==', 'active');
        const unsubscribe = query.onSnapshot(
            (snapshot) => {
                const fetchedProfiles = snapshot.docs.map(transformListenerDoc);
                setProfiles(fetchedProfiles);
                // Loading is set to false in the combiner effect.
            },
            (error) => {
                console.error("Error fetching listener profiles:", error);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, []);

    // Effect 2: Listen for all online statuses from RTDB once.
    useEffect(() => {
        const statusRef = rtdb.ref('status');
        const onStatusChange = (snapshot: firebase.database.DataSnapshot) => {
            setOnlineStatuses(snapshot.val() || {});
        };
        statusRef.on('value', onStatusChange);
        return () => statusRef.off('value', onStatusChange);
    }, []);

    // Effect 3: Combine and sort data whenever profiles, statuses, or favorites change.
    useEffect(() => {
        // Only process if profiles have been loaded to prevent flashing an empty list.
        if (profiles.length > 0 || !loading) {
            const combined = profiles.map(profile => ({
                ...profile,
                online: onlineStatuses[profile.id]?.isOnline === true,
            }));

            const sorted = [...combined].sort((a, b) => {
                // Priority 1: Online status (online users come first)
                if (a.online !== b.online) return a.online ? -1 : 1;
                
                // Priority 2: Favorites (favorited users come next)
                const aIsFav = favoriteListenerIds.includes(a.id);
                const bIsFav = favoriteListenerIds.includes(b.id);
                if (aIsFav !== bIsFav) return aIsFav ? -1 : 1;

                // Priority 3: Rating (higher rated users come next)
                return b.rating - a.rating;
            });
            
            setListeners(sorted);
            // We can now safely say we are done loading.
            if (loading) setLoading(false);
        }
    }, [profiles, onlineStatuses, favoriteListenerIds, loading]);

    // The UI expects this API, pagination is handled by fetching all active listeners.
    return { 
        listeners, 
        loading, 
        loadingMore: false, 
        hasMore: false, 
        loadMoreListeners: () => {} 
    };
};