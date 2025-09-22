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
    const [listeners, setListeners] = useState<Listener[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);

        // Step 1: Query for 'active' listener profiles directly from Firestore.
        // This is more efficient and works correctly with security rules.
        const listenersQuery = db.collection('listeners').where('status', '==', 'active');
        
        // This outer listener will react to changes in the active listeners collection.
        const unsubscribeFirestore = listenersQuery.onSnapshot(
            (querySnapshot) => {
                const activeListenersProfiles = querySnapshot.docs.map(transformListenerDoc);
                
                // Step 2: Now that we have the profiles of active listeners, listen for their online status from RTDB.
                const statusRef = rtdb.ref('status');
                
                const onStatusChange = (statusSnapshot: firebase.database.DataSnapshot) => {
                    const onlineStatuses = statusSnapshot.val() || {};
                    
                    // Step 3: Combine profile data with live online status.
                    const combinedListeners = activeListenersProfiles.map(profile => ({
                        ...profile,
                        online: onlineStatuses[profile.id]?.isOnline === true,
                    }));
                    
                    // Step 4: Sort the final, combined list according to business logic.
                    const sorted = [...combinedListeners].sort((a, b) => {
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
                    setLoading(false); // Set loading to false only after all data is combined and sorted.
                };

                // Attach the RTDB listener.
                statusRef.on('value', onStatusChange);

                // Return a cleanup function for the RTDB listener. This will be called when the
                // Firestore data changes, ensuring we re-attach the listener with the new profiles.
                return () => {
                    statusRef.off('value', onStatusChange);
                };
            },
            (error) => {
                console.error("Error fetching listeners from Firestore:", error);
                setLoading(false);
            }
        );

        // This is the main cleanup function for the useEffect hook.
        // It will detach the Firestore listener when the component unmounts.
        // The inner cleanup function handles detaching the RTDB listener.
        return () => {
            unsubscribeFirestore();
        };
    }, [favoriteListenerIds]); // Rerun the entire effect if the user's favorites change.

    // Return a simplified API consistent with what the UI components expect.
    // Pagination is handled by fetching all active listeners at once.
    return { listeners, loading, loadingMore: false, hasMore: false, loadMoreListeners: () => {} };
};
