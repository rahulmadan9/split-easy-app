import { useEffect, useState, useCallback, createContext, useContext, type ReactNode } from "react";
import React from "react";
import {
  collection,
  collectionGroup,
  query,
  where,
  addDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  getDocs,
  getDoc,
  doc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./useAuth";
import { useProfiles } from "./useProfiles";
import { validateGroup } from "../../shared/lib/validation";
import type { GroupRole } from "../../shared/types/firebase";

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
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

interface GroupsContextValue {
  groups: Group[];
  loading: boolean;
  createGroup: (name: string) => Promise<string>;
  joinGroupByCode: (code: string) => Promise<string>;
  leaveGroup: (groupId: string) => Promise<void>;
  updateGroupName: (groupId: string, name: string) => Promise<void>;
}

const GroupsContext = createContext<GroupsContextValue | null>(null);

export const GroupsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { currentProfile } = useProfiles();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !currentProfile) {
      if (!user) {
        setGroups([]);
        setLoading(false);
      }
      return;
    }

    let cancelled = false;

    const fetchGroups = async (groupIds: string[]) => {
      // Migration: if groupIds is empty but user has a personal group,
      // try the collection group query as a one-time backfill
      if (groupIds.length === 0 && currentProfile.personal_group_id) {
        try {
          const membersQuery = query(
            collectionGroup(db, "members"),
            where("userId", "==", user.uid)
          );
          const snapshot = await getDocs(membersQuery);
          const discoveredIds = snapshot.docs
            .map((d) => d.ref.parent.parent?.id)
            .filter(Boolean) as string[];

          if (discoveredIds.length > 0) {
            await updateDoc(doc(db, "users", user.uid), {
              groupIds: discoveredIds,
            });
            return;
          }
        } catch (err) {
          console.warn("Migration collection group query failed, falling back to personal group", err);
        }

        groupIds = [currentProfile.personal_group_id];
      }

      const results = await Promise.all(
        groupIds.map(async (gid): Promise<Group | null> => {
          try {
            const docSnap = await getDoc(doc(db, "groups", gid));
            if (docSnap.exists()) {
              const data = docSnap.data();
              return {
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
              };
            }
            return null;
          } catch (err) {
            console.error(`Error fetching group ${gid}`, err);
            return null;
          }
        })
      );

      if (cancelled) return;

      const validGroups = results.filter(Boolean) as Group[];
      validGroups.sort((a, b) => {
        if (a.isPersonal && !b.isPersonal) return -1;
        if (!a.isPersonal && b.isPersonal) return 1;
        return a.name.localeCompare(b.name);
      });
      setGroups(validGroups);
      setLoading(false);
    };

    fetchGroups(currentProfile.group_ids);

    return () => {
      cancelled = true;
    };
  }, [user, currentProfile]);

  const createGroup = useCallback(
    async (name: string): Promise<string> => {
      if (!currentProfile) throw new Error("Not logged in");

      const result = validateGroup({ name });
      if (result.success === false) throw new Error(result.error);

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

      await Promise.all([
        setDoc(doc(db, "groups", groupRef.id, "members", currentProfile.id), {
          userId: currentProfile.id,
          userName: currentProfile.display_name,
          role: "admin" as GroupRole,
          joinedAt: serverTimestamp(),
        }),
        updateDoc(doc(db, "users", currentProfile.id), {
          groupIds: arrayUnion(groupRef.id),
        }),
      ]);

      return groupRef.id;
    },
    [currentProfile]
  );

  const joinGroupByCode = useCallback(
    async (code: string): Promise<string> => {
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

      const memberSnap = await getDocs(
        query(
          collection(db, "groups", groupId, "members"),
          where("userId", "==", currentProfile.id)
        )
      );
      if (!memberSnap.empty) throw new Error("You're already a member of this group");

      const memberDoc = doc(db, "groups", groupId, "members", currentProfile.id);
      await Promise.all([
        setDoc(memberDoc, {
          userId: currentProfile.id,
          userName: currentProfile.display_name,
          role: "member" as GroupRole,
          joinedAt: serverTimestamp(),
        }),
        updateDoc(doc(db, "users", currentProfile.id), {
          groupIds: arrayUnion(groupId),
        }),
      ]);

      return groupId;
    },
    [currentProfile]
  );

  const leaveGroup = useCallback(
    async (groupId: string) => {
      if (!currentProfile) throw new Error("Not logged in");
      await Promise.all([
        deleteDoc(doc(db, "groups", groupId, "members", currentProfile.id)),
        updateDoc(doc(db, "users", currentProfile.id), {
          groupIds: arrayRemove(groupId),
        }),
      ]);
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

  return React.createElement(
    GroupsContext.Provider,
    { value: { groups, loading, createGroup, joinGroupByCode, leaveGroup, updateGroupName } },
    children
  );
};

export const useGroups = (): GroupsContextValue => {
  const context = useContext(GroupsContext);
  if (!context) {
    throw new Error("useGroups must be used within a GroupsProvider");
  }
  return context;
};
