import React, { useEffect } from 'react';
import { rtdb } from '../utils/firebase';
import firebase from 'firebase/compat/app';
import type { User } from '../types';

interface PresenceManagerProps {
    user: User;
}

const PresenceManager: React.FC<PresenceManagerProps> = ({ user }) => {
  useEffect(() => {
    // Wait until we have a logged-in user object.
    if (!user?.uid) {
      return;
    }

    const uid = user.uid;
    // We use '/userStatus/' to keep user presence separate from listener presence.
    const userStatusDatabaseRef = rtdb.ref(`/userStatus/${uid}`);

    // This special path in RTDB reports the connection status.
    const connectedRef = rtdb.ref('.info/connected');

    const isOfflineForDatabase = {
      isOnline: false,
      lastActive: firebase.database.ServerValue.TIMESTAMP,
    };

    const isOnlineForDatabase = {
      isOnline: true,
      lastActive: firebase.database.ServerValue.TIMESTAMP,
    };

    const listener = connectedRef.on('value', (snapshot) => {
      // If the user loses connection, the onDisconnect hook will handle it.
      if (snapshot.val() === false) {
        return;
      }

      // This is the core of the presence system. We tell Firebase to set the user
      // as offline WHEN they disconnect. This is handled by Firebase servers.
      userStatusDatabaseRef.onDisconnect().set(isOfflineForDatabase).then(() => {
        // Once the onDisconnect hook is registered, we can safely set the user as online.
        userStatusDatabaseRef.set(isOnlineForDatabase);
      });
    });

    // Cleanup function when the component unmounts (e.g., user logs out).
    return () => {
      connectedRef.off('value', listener); // Remove the connection listener.
      // Explicitly set the user to offline on a clean exit.
      userStatusDatabaseRef.set(isOfflineForDatabase);
    };
    
    // This effect should re-run if the user object changes (e.g., on login/logout).
  }, [user]);

  // This is a "side-effect" component and does not render any UI.
  return null;
};

export default PresenceManager;
