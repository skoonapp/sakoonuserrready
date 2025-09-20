
import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '../utils/firebase';
import firebase from 'firebase/compat/app';
import type { Listener } from '../types';

const PAGE_SIZE = 10;

const areArraysEqual = (a: number[], b: number[]) => {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((value, index) => value === sortedB[index]);
};

export const useListeners = (favoriteListenerIds: number[] = []) => {
    const [listeners, setListeners] = useState<Listener[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastVisible, setLastVisible] = useState<firebase.firestore.QueryDocumentSnapshot<firebase.firestore.DocumentData> | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const prevFavoritesRef = useRef<number[]>([]);
    const unsubscribesRef = useRef(new Map<number, () => void>());

    const sortListeners = useCallback((list: Listener[]) => {
        // Create a mutable copy to sort
        const sortedList = [...list];
        sortedList.sort((a, b) => {
            const aIsFav = favoriteListenerIds.includes(a.id);
            const bIsFav = favoriteListenerIds.includes(b.id);
            if (aIsFav !== bIsFav) return aIsFav ? -1 : 1;
            if (a.online !== b.online) return a.online ? -1 : 1;
            return b.rating - a.rating;
        });
        return sortedList;
    }, [favoriteListenerIds]);

    const fetchAndSortListeners = useCallback(async (loadMore = false) => {
        if (!hasMore && loadMore) return;

        if (loadMore) {
            setLoadingMore(true);
        } else {
            setLoading(true);
        }

        try {
            let query = db.collection('listeners')
                .orderBy('online', 'desc')
                .limit(PAGE_SIZE);

            if (loadMore && lastVisible) {
                query = query.startAfter(lastVisible);
            }

            const documentSnapshots = await query.get();
            const newListeners = documentSnapshots.docs.map(doc => doc.data() as Listener);

            setLastVisible(documentSnapshots.docs[documentSnapshots.docs.length - 1] || null);
            setHasMore(newListeners.length === PAGE_SIZE);

            setListeners(prevListeners => {
                const combinedListeners = loadMore ? [...prevListeners, ...newListeners] : newListeners;
                const uniqueListenersMap = new Map<number, Listener>();
                combinedListeners.forEach(l => uniqueListenersMap.set(l.id, l));
                
                return sortListeners(Array.from(uniqueListenersMap.values()));
            });

        } catch (error) {
            console.error("Error fetching listeners:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [hasMore, lastVisible, sortListeners]);

    // Effect for initial fetch and refetching when favorites change
    useEffect(() => {
        if (!areArraysEqual(favoriteListenerIds, prevFavoritesRef.current)) {
            prevFavoritesRef.current = favoriteListenerIds;
            setListeners([]);
            setLastVisible(null);
            setHasMore(true);
            fetchAndSortListeners(false);
        }
    }, [favoriteListenerIds, fetchAndSortListeners]);
    
    // Effect to attach real-time listeners to currently loaded listeners
    useEffect(() => {
        if(listeners.length === 0) return;
        
        const currentIds = new Set(listeners.map(l => l.id));
        const subscribedIds = new Set(unsubscribesRef.current.keys());

        // Subscribe to new listeners that have been loaded
        listeners.forEach(listener => {
            if (!subscribedIds.has(listener.id)) {
                // Assuming document ID in 'listeners' collection is the string version of the listener's numeric ID
                const unsub = db.collection('listeners').doc(String(listener.id)).onSnapshot(doc => {
                    if (doc.exists) {
                        const updatedData = doc.data() as Listener;
                        setListeners(currentListeners => {
                            const listenerExists = currentListeners.some(l => l.id === updatedData.id);
                            // Only update if the listener is still in the list
                            if (listenerExists) {
                                const newArr = currentListeners.map(l => l.id === updatedData.id ? updatedData : l);
                                return sortListeners(newArr);
                            }
                            return currentListeners;
                        });
                    }
                }, error => {
                    console.error(`Error listening to listener ${listener.id}:`, error);
                });
                unsubscribesRef.current.set(listener.id, unsub);
            }
        });

    }, [listeners, sortListeners]);

    // Effect for cleaning up all listeners on unmount
    useEffect(() => {
        return () => {
            unsubscribesRef.current.forEach(unsub => unsub());
        }
    }, []);


    const loadMoreListeners = () => {
        if (!loadingMore && hasMore) {
            fetchAndSortListeners(true);
        }
    };

    return { listeners, loading, loadingMore, hasMore, loadMoreListeners };
};
