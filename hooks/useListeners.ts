import { useState, useEffect, useCallback } from 'react';
import { db } from '../utils/firebase';
import firebase from 'firebase/compat/app';
import type { Listener } from '../types';

const PAGE_SIZE = 10;

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
            if (a.online !== b.online) return a.online ? -1 : 1; // Online first
            return b.rating - a.rating; // Then by rating
        });
    }, [favoriteListenerIds]);
    
    // Effect for the main real-time query on the first page of listeners
    useEffect(() => {
        setLoading(true);

        const query = db.collection('listeners')
            .orderBy('online', 'desc')
            .orderBy('rating', 'desc') // Secondary sort for stable ordering
            .limit(PAGE_SIZE);

        const unsubscribe = query.onSnapshot(snapshot => {
            const firstPageListeners = snapshot.docs.map(doc => doc.data() as Listener);
            
            // This real-time listener provides the most current first page.
            // We replace our current list with this, and then sort it
            // to bring favorites to the top.
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
            const query = db.collection('listeners')
                .orderBy('online', 'desc')
                .orderBy('rating', 'desc')
                .startAfter(lastVisible)
                .limit(PAGE_SIZE);
            
            const snapshot = await query.get();
            const newListeners = snapshot.docs.map(doc => doc.data() as Listener);

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
