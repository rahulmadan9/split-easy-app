import { useEffect, useState } from "react";
import { doc, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/integrations/firebase/config";
import { useAuth } from "./useAuth";

export interface Profile {
  id: string;
  display_name: string;
  phone_number?: string;
  personal_group_id: string;
  current_group_id: string | null;
  created_at: string;
}

export const useProfiles = () => {
  const { user } = useAuth();
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCurrentProfile(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "users", user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCurrentProfile({
            id: docSnap.id,
            display_name: data.displayName || "",
            phone_number: data.phoneNumber || undefined,
            personal_group_id: data.personalGroupId || "",
            current_group_id: data.currentGroupId || null,
            created_at:
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate().toISOString()
                : new Date().toISOString(),
          });
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching profile", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return { currentProfile, loading };
};
