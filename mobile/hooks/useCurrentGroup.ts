import { useCallback } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./useAuth";
import { useProfiles } from "./useProfiles";
import { useGroups, type Group } from "./useGroups";

export const useCurrentGroup = () => {
  const { user } = useAuth();
  const { currentProfile } = useProfiles();
  const { groups, loading: groupsLoading } = useGroups();

  const currentGroupId =
    currentProfile?.current_group_id ||
    currentProfile?.personal_group_id ||
    null;

  const currentGroup =
    groups.find((g) => g.id === currentGroupId) ||
    groups.find((g) => g.isPersonal) ||
    null;

  const setCurrentGroup = useCallback(
    async (groupId: string) => {
      if (!user) return;
      await updateDoc(doc(db, "users", user.uid), {
        currentGroupId: groupId,
        updatedAt: serverTimestamp(),
      });
    },
    [user]
  );

  return {
    currentGroup,
    currentGroupId: currentGroup?.id || null,
    groups,
    loading: groupsLoading,
    setCurrentGroup,
  };
};
