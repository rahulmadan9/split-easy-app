import { useEffect, useState, useCallback } from "react";
import { updateProfile } from "firebase/auth";
import { doc, onSnapshot, Timestamp, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/integrations/firebase/config";
import { validateDisplayName } from "@/lib/validation";
import { useAuth } from "./useAuth";

export interface Profile {
  id: string;
  display_name: string;
  phone_number?: string;
  personal_group_id: string;
  current_group_id: string | null;
  group_ids: string[];
  created_at: string;
}

export const useProfiles = () => {
  const { user } = useAuth();
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingDisplayName, setUpdatingDisplayName] = useState(false);

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
            group_ids: Array.isArray(data.groupIds) ? data.groupIds : [],
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

  const updateDisplayName = useCallback(
    async (displayName: string) => {
      if (!user) throw new Error("Not logged in");

      const result = validateDisplayName({ display_name: displayName });
      if (result.success === false) {
        throw new Error(result.error);
      }

      setUpdatingDisplayName(true);
      try {
        const nextName = result.data.display_name;
        await Promise.all([
          updateProfile(user, { displayName: nextName }),
          updateDoc(doc(db, "users", user.uid), {
            displayName: nextName,
            updatedAt: serverTimestamp(),
          }),
        ]);
      } finally {
        setUpdatingDisplayName(false);
      }
    },
    [user]
  );

  return { currentProfile, loading, updateDisplayName, updatingDisplayName };
};
