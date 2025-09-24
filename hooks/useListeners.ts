import { useState, useEffect, useRef, useCallback } from 'react';
import { db, rtdb } from '../utils/firebase';
import firebase from 'firebase/compat/app';
import type { Listener } from '../types';

// This function now transforms Firestore data AND extracts a fallback online status.
const transformListenerDoc = (doc: firebase.firestore.DocumentSnapshot<firebase.firestore.DocumentData>): Omit<Listener, 'online'> & { firestoreOnlineStatus: boolean } => {
    const data = doc.data() || {};
    // A listener is considered online via Firestore if their appStatus is "Available" OR they have the isOnline flag set to true.
    const isFirestoreOnline = data.appStatus === 'Available' || data.isOnline === true;
    return {
        id: doc.id,
        name: data.displayName || data.name || 'Unnamed Listener',
        image: data.avatarUrl || data.image || '',
        rating: data.rating || 0,
        reviewsCount: data.reviewsCount || 0,
        gender: data.gender || 'Female',
        age: data.age || 0,
        languages: data.languages || [],
        firestoreOnlineStatus: isFirestoreOnline,
    };
};

/**
 * An optimized and robust hook to fetch listeners with real-time online status.
 * It correctly combines data from Firestore (profiles) and Realtime Database (statuses)
 * and sorts them to prioritize online and favorite listeners.
 */
export const useListeners = (favoriteListenerIds: string[] = []) => {
    const [listeners, setListeners] = useState<Listener[]>([]);
    const [loading, setLoading] = useState(true);

    // Use refs to store the latest raw data from each source without causing extra re-renders.
    const profilesRef = useRef<(Omit<Listener, 'online'> & { firestoreOnlineStatus: boolean })[]>([]);
    const statusesRef = useRef<Record<string, any>>({});
    // Keep a ref to favorites to avoid re-running effects if only the parent component re-renders.
    const favoritesRef = useRef(favoriteListenerIds);
    useEffect(() => {
        favoritesRef.current = favoriteListenerIds;
    }, [favoriteListenerIds]);

    // A single, memoized function to combine, sort, and update the final state.
    const combineAndSetState = useCallback(() => {
        const profiles = profilesRef.current;
        const statuses = statusesRef.current;
        const favorites = favoritesRef.current;

        const combinedListeners = profiles.map(profile => {
            const statusEntry = statuses[profile.id];
            let isRtdbOnline = false;
            if (statusEntry) {
                // Robustly check for various common presence data structures.
                if (typeof statusEntry === 'object' && statusEntry !== null) {
                    isRtdbOnline = statusEntry.isOnline === true || statusEntry.online === true || statusEntry.state === 'online';
                } else if (statusEntry === true || statusEntry === 'online') {
                    isRtdbOnline = true;
                }
            }
            
            // A listener is considered online if EITHER the fast, real-time RTDB presence says so,
            // OR the more persistent Firestore document status says so. This provides a robust fallback.
            const finalOnlineStatus = isRtdbOnline || profile.firestoreOnlineStatus;

            // Destructure to remove the temporary firestoreOnlineStatus field from the final object.
            const { firestoreOnlineStatus, ...restOfProfile } = profile;

            return {
                ...restOfProfile,
                online: finalOnlineStatus,
            };
        });

        const sortedListeners = [...combinedListeners].sort((a, b) => {
            // Priority 1: Online status (online users always come first).
            if (a.online !== b.online) return a.online ? -1 : 1;
            
            // Priority 2: Favorites (favorited users are grouped after online status).
            const aIsFav = favorites.includes(a.id);
            const bIsFav = favorites.includes(b.id);
            if (aIsFav !== bIsFav) return aIsFav ? -1 : 1;

            // Priority 3: Rating (higher rated users come next).
            return b.rating - a.rating;
        });
        
        setListeners(sortedListeners);

        // Only set loading to false once we have attempted to combine.
        if (loading) {
            setLoading(false);
        }
    }, [loading]);

    // Effect 1: Set up the listener for Firestore profiles.
    useEffect(() => {
        const query = db.collection('listeners').where('status', '==', 'active');
        const unsubscribe = query.onSnapshot(
            (snapshot) => {
                profilesRef.current = snapshot.docs.map(transformListenerDoc);
                combineAndSetState(); // Re-combine data when profiles update.
            },
            (error) => {
                console.error("Error fetching listener profiles:", error);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [combineAndSetState]);

    // Effect 2: Set up the listener for RTDB statuses.
    useEffect(() => {
        const statusRef = rtdb.ref('status');
        const onStatusChange = (snapshot: firebase.database.DataSnapshot) => {
            statusesRef.current = snapshot.val() || {};
            combineAndSetState(); // Re-combine data when statuses update.
        };
        statusRef.on('value', onStatusChange);
        return () => statusRef.off('value', onStatusChange);
    }, [combineAndSetState]);
    
    // The hook fetches all active listeners at once, so pagination is not currently implemented.
    // This signature is maintained for compatibility with components.
    return { 
        listeners, 
        loading, 
        loadingMore: false, 
        hasMore: false, 
        loadMoreListeners: () => {} 
    };
};