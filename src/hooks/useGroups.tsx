import { useEffect, useState, useCallback } from "react";
import {
  collection,
  collectionGroup,
  query,
  where,
  onSnapshot,
  addDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  getDocs,
  doc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/config";
import { useAuth } from "./useAuth";
import { useProfiles } from "./useProfiles";
import { validateGroup } from "@/lib/validation";
import { toast } from "sonner";
import type { GroupRole } from "@/integrations/firebase/types";

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  createdByName: string;
  isPersonal: boolean;
  createdAt: string;
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I/O/0/1 for readability
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const useGroups = () => {
  const { user } = useAuth();
  const { currentProfile } = useProfiles();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // Listen to user's group memberships via collection group query
  useEffect(() => {
    if (!user) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const membersQuery = query(
      collectionGroup(db, "members"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      membersQuery,
      async (snapshot) => {
        const groupIds = snapshot.docs.map((d) => d.ref.parent.parent?.id).filter(Boolean) as string[];

        if (groupIds.length === 0) {
          setGroups([]);
          setLoading(false);
          return;
        }

        // Listen to each group doc
        const groupPromises = groupIds.map(
          (gid) =>
            new Promise<Group | null>((resolve) => {
              const unsub = onSnapshot(doc(db, "groups", gid), (docSnap) => {
                unsub(); // We only need one read
                if (docSnap.exists()) {
                  const data = docSnap.data();
                  resolve({
                    id: docSnap.id,
                    name: data.name || "",
                    inviteCode: data.inviteCode || "",
                    createdBy: data.createdBy || "",
                    createdByName: data.createdByName || "",
                    isPersonal: data.isPersonal === true,
                    createdAt:
                      data.createdAt instanceof Timestamp
                        ? data.createdAt.toDate().toISOString()
                        : new Date().toISOString(),
                  });
                } else {
                  resolve(null);
                }
              });
            })
        );

        const results = await Promise.all(groupPromises);
        const validGroups = results.filter(Boolean) as Group[];
        // Personal groups first, then alphabetical
        validGroups.sort((a, b) => {
          if (a.isPersonal && !b.isPersonal) return -1;
          if (!a.isPersonal && b.isPersonal) return 1;
          return a.name.localeCompare(b.name);
        });
        setGroups(validGroups);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching groups", error);
        toast.error("Failed to load groups.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const createGroup = useCallback(
    async (name: string): Promise<{ id: string; inviteCode: string }> => {
      if (!currentProfile) throw new Error("Not logged in");

      const result = validateGroup({ name });
      if (result.success === false) throw new Error(result.error);

      // Generate unique invite code
      let inviteCode = "";
      for (let attempt = 0; attempt < 10; attempt++) {
        const candidate = generateInviteCode();
        const existing = await getDocs(
          query(collection(db, "groups"), where("inviteCode", "==", candidate))
        );
        if (existing.empty) {
          inviteCode = candidate;
          break;
        }
      }
      if (!inviteCode) throw new Error("Failed to generate invite code");

      const groupRef = await addDoc(collection(db, "groups"), {
        name: result.data.name,
        inviteCode,
        createdBy: currentProfile.id,
        createdByName: currentProfile.display_name,
        isPersonal: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Add creator as admin
      await setDoc(doc(db, "groups", groupRef.id, "members", currentProfile.id), {
        userId: currentProfile.id,
        userName: currentProfile.display_name,
        role: "admin" as GroupRole,
        joinedAt: serverTimestamp(),
      });

      return { id: groupRef.id, inviteCode };
    },
    [currentProfile]
  );

  const joinGroupByCode = useCallback(
    async (code: string): Promise<{ id: string; name: string }> => {
      if (!currentProfile) throw new Error("Not logged in");

      const upperCode = code.toUpperCase().trim();
      const groupsQuery = query(
        collection(db, "groups"),
        where("inviteCode", "==", upperCode)
      );
      const snapshot = await getDocs(groupsQuery);

      if (snapshot.empty) throw new Error("Invalid invite code");

      const groupDoc = snapshot.docs[0];
      const groupId = groupDoc.id;
      const groupName = groupDoc.data().name || "";

      // Check if already a member
      const memberDoc = doc(db, "groups", groupId, "members", currentProfile.id);
      const memberSnap = await getDocs(
        query(
          collection(db, "groups", groupId, "members"),
          where("userId", "==", currentProfile.id)
        )
      );
      if (!memberSnap.empty) throw new Error("You're already a member of this group");

      // Join as member
      await setDoc(memberDoc, {
        userId: currentProfile.id,
        userName: currentProfile.display_name,
        role: "member" as GroupRole,
        joinedAt: serverTimestamp(),
      });

      return { id: groupId, name: groupName };
    },
    [currentProfile]
  );

  const leaveGroup = useCallback(
    async (groupId: string) => {
      if (!currentProfile) throw new Error("Not logged in");
      await deleteDoc(doc(db, "groups", groupId, "members", currentProfile.id));
    },
    [currentProfile]
  );

  const updateGroupName = useCallback(
    async (groupId: string, name: string) => {
      const result = validateGroup({ name });
      if (result.success === false) throw new Error(result.error);
      await updateDoc(doc(db, "groups", groupId), {
        name: result.data.name,
        updatedAt: serverTimestamp(),
      });
    },
    []
  );

  return {
    groups,
    loading,
    createGroup,
    joinGroupByCode,
    leaveGroup,
    updateGroupName,
  };
};
