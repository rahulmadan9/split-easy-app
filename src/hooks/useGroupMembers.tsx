import { useEffect, useState, useCallback } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/integrations/firebase/config";
import { useAuth } from "./useAuth";
import type { GroupRole } from "@/integrations/firebase/types";

export interface GroupMember {
  userId: string;
  userName: string;
  role: GroupRole;
  joinedAt: string;
}

export const useGroupMembers = (groupId: string | null) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !groupId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, "groups", groupId, "members"),
      (snapshot) => {
        const membersData: GroupMember[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            userId: data.userId || d.id,
            userName: data.userName || "",
            role: data.role || "member",
            joinedAt:
              data.joinedAt instanceof Timestamp
                ? data.joinedAt.toDate().toISOString()
                : new Date().toISOString(),
          };
        });
        membersData.sort((a, b) => {
          if (a.role === "admin" && b.role !== "admin") return -1;
          if (a.role !== "admin" && b.role === "admin") return 1;
          return a.userName.localeCompare(b.userName);
        });
        setMembers(membersData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching group members", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, groupId]);

  const currentUserRole = user
    ? members.find((m) => m.userId === user.uid)?.role || null
    : null;

  const isAdmin = currentUserRole === "admin";

  const promoteMember = useCallback(
    async (memberId: string) => {
      if (!groupId) return;
      await updateDoc(doc(db, "groups", groupId, "members", memberId), {
        role: "admin" as GroupRole,
      });
    },
    [groupId]
  );

  const demoteMember = useCallback(
    async (memberId: string) => {
      if (!groupId) return;
      await updateDoc(doc(db, "groups", groupId, "members", memberId), {
        role: "member" as GroupRole,
      });
    },
    [groupId]
  );

  const kickMember = useCallback(
    async (memberId: string) => {
      if (!groupId) return;
      await deleteDoc(doc(db, "groups", groupId, "members", memberId));
    },
    [groupId]
  );

  return {
    members,
    loading,
    currentUserRole,
    isAdmin,
    promoteMember,
    demoteMember,
    kickMember,
  };
};
