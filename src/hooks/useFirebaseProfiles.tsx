import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/integrations/firebase/config";
import { useFirebaseAuth } from "./useFirebaseAuth";
import { logger } from "@/lib/logger";

// Profile interface matching Supabase structure for compatibility
export interface Profile {
  id: string;
  user_id: string; // Same as id for Firebase (Auth UID)
  display_name: string;
  created_at: string;
}

/**
 * Custom hook for managing user profiles from Firestore
 * Provides real-time updates for all user profiles
 */
export const useFirebaseProfiles = () => {
  const { user } = useFirebaseAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [roommate, setRoommate] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfiles([]);
      setCurrentProfile(null);
      setRoommate(null);
      setLoading(false);
      return;
    }

    // Create query for users collection, ordered by creation date
    const usersQuery = query(
      collection(db, "users"),
      orderBy("createdAt", "asc")
    );

    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const profilesData: Profile[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            user_id: doc.id, // In Firebase, the doc ID is the Auth UID
            display_name: data.displayName || "",
            created_at:
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate().toISOString()
                : new Date().toISOString(),
          };
        });

        setProfiles(profilesData);

        // Find current user's profile
        const current = profilesData.find((p) => p.id === user.uid) || null;
        setCurrentProfile(current);

        // Find roommate (first other user)
        const mate = profilesData.find((p) => p.id !== user.uid) || null;
        setRoommate(mate);

        setLoading(false);
      },
      (error) => {
        logger.error("Error fetching profiles", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { profiles, currentProfile, roommate, loading };
};
