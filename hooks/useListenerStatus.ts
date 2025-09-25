import { useState, useEffect } from 'react';
import { db, rtdb } from '../utils/firebase';
import type { Listener } from '../types';
import type firebase from 'firebase/compat/app';

// This is a partial type representing the data from Firestore
type ListenerProfileData = Omit<Listener, 'online'> & { firestoreOnlineStatus: boolean };

/**
 * A real-time hook to get the combined profile (from Firestore) and
 * live online status (from Realtime Database) for a single listener.
 * This provides the most up-to-date status for an individual.
 * 
 * @param listenerId The UID of the listener to track.
 * @returns An object containing the listener data and loading state.
 */
export const useListenerStatus = (listenerId: string) => {
  const [listener, setListener] = useState<Listener | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!listenerId) {
      setListener(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    let profileData: ListenerProfileData | null = null;
    let rtdbOnlineStatus = false;

    // --- Function to combine and set final state ---
    const combineAndSetState = () => {
      if (profileData) {
        // A listener is considered online if EITHER the fast, real-time RTDB presence says so,
        // OR the more persistent Firestore document status says so.
        const finalOnlineStatus = rtdbOnlineStatus || profileData.firestoreOnlineStatus;

        // Destructure to remove the temporary firestoreOnlineStatus field
        const { firestoreOnlineStatus, ...restOfProfile } = profileData;

        setListener({
          ...restOfProfile,
          online: finalOnlineStatus,
        });
        if(loading) setLoading(false);
      }
    };

    // --- Firestore Listener for Profile Data ---
    const firestoreUnsubscribe = db.collection('listeners').doc(listenerId).onSnapshot(
      (doc) => {
        if (doc.exists) {
          const data = doc.data() as any;
          // A listener is considered online via Firestore if their manual appStatus is "Available"
          // OR if the older 'isOnline' flag is true (for compatibility).
          const isFirestoreOnline = data.appStatus === 'Available' || data.isOnline === true;
          
          profileData = {
            id: doc.id,
            name: data.displayName || 'Listener',
            image: data.avatarUrl || '',
            rating: data.rating || 0,
            reviewsCount: data.reviewsCount || 0,
            gender: data.gender || 'Female',
            age: data.age || 0,
            languages: data.languages || [],
            firestoreOnlineStatus: isFirestoreOnline,
          };
        } else {
          profileData = null;
          setListener(null); // Listener not found
        }
        combineAndSetState();
      },
      (error) => {
        console.error(`Error fetching listener profile (${listenerId}):`, error);
        setLoading(false);
      }
    );

    // --- Realtime Database Listener for Live Status ---
    const statusRef = rtdb.ref(`status/${listenerId}`);
    const onStatusChange = (snapshot: firebase.database.DataSnapshot) => {
      const data = snapshot.val();
      // Check for various common presence data structures for robustness
      rtdbOnlineStatus = data?.isOnline === true || data?.online === true || data?.state === 'online';
      combineAndSetState();
    };

    statusRef.on('value', onStatusChange);

    // --- Cleanup ---
    return () => {
      firestoreUnsubscribe();
      statusRef.off('value', onStatusChange);
    };
  }, [listenerId]); // Re-run effect if listenerId changes

  return { listener, loading };
};
