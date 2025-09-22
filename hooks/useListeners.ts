import { useState, useEffect, useCallback } from 'react';
import { db } from '../utils/firebase';
import firebase from 'firebase/compat/app';
import type { Listener } from '../types';

const PAGE_SIZE = 10;

/**
 * Transforms a Firestore listener document into the Listener type used by the app.
 * This acts as an adapter between the database schema and the app's data model.
 * @param doc The Firestore document snapshot.
 * @returns A Listener object compatible with the app's components.
 */
const transformListenerDoc = (doc: firebase.firestore.DocumentSnapshot<firebase.firestore.DocumentData>): Listener => {
    const data = doc.data() || {};
    return {
        id: data.id || 0, // Assumes a numeric 'id' field exists on the document.
        name: data.displayName || data.name || 'Unnamed Listener',
        image: data.avatarUrl || data.image || '',
        // The listener is considered online if either 'isOnline' is true or 'appStatus' is "Available".
        online: data.isOnline === true || data.appStatus === "Available",
        rating: data.rating || 0,
        reviewsCount: data.reviewsCount || 0,
        gender: data.gender || 'Female',
        age: data.age || 0,
    };
};


export const useListeners = (favoriteListenerIds: number[] = []) => {
    const [listeners, setListeners] = useState<Listener[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastVisible, setLastVisible] = useState<firebase.firestore.QueryDocumentSnapshot<firebase.firestore.DocumentData> | null>(null);
    const [hasMore, setHasMore] = useState(true);

    const sortListeners = useCallback((list: Listener[]): Listener[] => {
        return [...list].sort((a, b) => {
            const aIsFav = favoriteListenerIds.includes(a.id);
            const bIsFav = favoriteListenerIds.includes(b.id);
            if (aIsFav !== bIsFav) return aIsFav ? -1 : 1; // Favorites first
            // The line that sorted by online status has been removed to mix online/offline listeners.
            return b.rating - a.rating; // Then by rating
        });
    }, [favoriteListenerIds]);
    
    // Effect for the main real-time query on the first page of listeners
    useEffect(() => {
        setLoading(true);

        // FIX: Removed ordering by `isOnline` at the database level. 
        // This was too restrictive as it would exclude listeners marked online via `appStatus`.
        // The client-side `sortListeners` function correctly handles sorting by online status after fetching.
        const query = db.collection('listeners')
            .orderBy('rating', 'desc') // Order by a stable field for consistent pagination
            .limit(PAGE_SIZE);

        const unsubscribe = query.onSnapshot(snapshot => {
            const firstPageListeners = snapshot.docs.map(transformListenerDoc);
            
            setListeners(sortListeners(firstPageListeners));
            
            setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
            setHasMore(firstPageListeners.length === PAGE_SIZE);
            setLoading(false);
        }, error => {
            console.error("Error with real-time listener fetch:", error);
            setLoading(false);
        });

        // Cleanup subscription on unmount or when favorites change (which reruns the effect)
        return () => unsubscribe();

    }, [sortListeners]); // Dependency ensures this re-runs if favorite IDs change

    const loadMoreListeners = useCallback(async () => {
        if (!hasMore || loadingMore || !lastVisible) return;
        
        setLoadingMore(true);

        try {
            // FIX: Removed ordering by `isOnline` for the pagination query as well.
            const query = db.collection('listeners')
                .orderBy('rating', 'desc')
                .startAfter(lastVisible)
                .limit(PAGE_SIZE);
            
            const snapshot = await query.get();
            const newListeners = snapshot.docs.map(transformListenerDoc);

            setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
            setHasMore(newListeners.length === PAGE_SIZE);

            // Append new listeners and re-sort the entire list
            setListeners(prevListeners => {
                const combined = [...prevListeners, ...newListeners];
                const unique = Array.from(new Map<number, Listener>(combined.map(l => [l.id, l])).values());
                return sortListeners(unique);
            });

        } catch (error) {
            console.error("Error loading more listeners:", error);
        } finally {
            setLoadingMore(false);
        }
    }, [hasMore, loadingMore, lastVisible, sortListeners]);

    return { listeners, loading, loadingMore, hasMore, loadMoreListeners };
};