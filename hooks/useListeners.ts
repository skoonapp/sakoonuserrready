import { useState, useEffect, useCallback, useRef } from 'react';
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
    const unsubscribesRef = useRef(new Map<number, () => void>());
    const isInitialLoad = useRef(true);
    
    // Sort function that will be used in multiple places
    const sortListeners = useCallback((list: Listener[]): Listener[] => {
        return [...list].sort((a, b) => {
            const aIsFav = favoriteListenerIds.includes(a.id);
            const bIsFav = favoriteListenerIds.includes(b.id);
            if (aIsFav !== bIsFav) return aIsFav ? -1 : 1; // Favorites first
            if (a.online !== b.online) return a.online ? -1 : 1; // Online first
            return b.rating - a.rating; // Then by rating
        });
    }, [favoriteListenerIds]);

    const fetchListeners = useCallback(async (loadMore = false) => {
        if (loadMore && !hasMore) return;
        
        loadMore ? setLoadingMore(true) : setLoading(true);

        // On a fresh fetch (not loading more), clear old state and subscriptions
        if (!loadMore) {
            unsubscribesRef.current.forEach(unsub => unsub());
            unsubscribesRef.current.clear();
        }

        try {
            let query = db.collection('listeners')
                .orderBy('online', 'desc') // Initial sort helps, but we'll re-sort with favorites
                .limit(PAGE_SIZE);

            const startAfterDoc = loadMore ? lastVisible : null;
            if (startAfterDoc) {
                query = query.startAfter(startAfterDoc);
            }

            const snapshots = await query.get();
            const newListeners = snapshots.docs.map(doc => doc.data() as Listener);

            setLastVisible(snapshots.docs[snapshots.docs.length - 1] || null);
            setHasMore(newListeners.length === PAGE_SIZE);

            // Attach real-time listeners for all newly fetched items
            newListeners.forEach(listener => {
                if (unsubscribesRef.current.has(listener.id)) return; // Already subscribed

                const unsub = db.collection('listeners').doc(String(listener.id)).onSnapshot(doc => {
                    if (doc.exists) {
                        const updatedData = doc.data() as Listener;
                        setListeners(currentList => {
                            const listWithUpdate = currentList.map(l => l.id === updatedData.id ? updatedData : l);
                            return sortListeners(listWithUpdate);
                        });
                    }
                });
                unsubscribesRef.current.set(listener.id, unsub);
            });
            
            // Update the main list state, merging old and new listeners if loading more
            setListeners(currentList => {
                const combinedList = loadMore ? [...currentList, ...newListeners] : newListeners;
                // De-duplicate in case of race conditions
                // FIX: Explicitly typed the generic arguments for `new Map()` to ensure TypeScript correctly infers `uniqueListeners` as `Listener[]` instead of `unknown[]`, resolving the type error when passing it to `sortListeners`.
                const uniqueListeners = Array.from(new Map<number, Listener>(combinedList.map(l => [l.id, l])).values());
                return sortListeners(uniqueListeners);
            });

        } catch (error) {
            console.error("Error fetching listeners:", error);
        } finally {
            loadMore ? setLoadingMore(false) : setLoading(false);
        }
    }, [hasMore, lastVisible, sortListeners]);

    // This effect handles the initial fetch and refetches when favorites change
    useEffect(() => {
        // Use a ref to prevent re-fetching on every render, only on actual dependency changes
        if (isInitialLoad.current) {
            isInitialLoad.current = false;
            fetchListeners(false);
        }
    }, [favoriteListenerIds, fetchListeners]);

    // Cleanup all subscriptions on component unmount
    useEffect(() => {
        return () => {
            unsubscribesRef.current.forEach(unsub => unsub());
        }
    }, []);

    return { listeners, loading, loadingMore, hasMore, loadMoreListeners: () => fetchListeners(true) };
};