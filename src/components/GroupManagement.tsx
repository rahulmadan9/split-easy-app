import { useState } from "react";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import { useGroups } from "@/hooks/useGroups";
import { useCurrentGroup } from "@/hooks/useCurrentGroup";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Copy,
  Check,
  Crown,
  Shield,
  UserMinus,
  ArrowUp,
  ArrowDown,
  LogOut,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface GroupManagementProps {
  groupId: string;
}

export function GroupManagement({ groupId }: GroupManagementProps) {
  const { members, loading: membersLoading, currentUserRole, isAdmin, promoteMember, demoteMember, kickMember } =
    useGroupMembers(groupId);
  const { leaveGroup } = useGroups();
  const { currentGroup } = useCurrentGroup();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleCopyCode = async () => {
    if (!currentGroup?.inviteCode) return;
    try {
      await navigator.clipboard.writeText(currentGroup.inviteCode);
      setCopied(true);
      toast.success("Invite code copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy code");
    }
  };

  const handleAction = async (
    action: () => Promise<void>,
    memberId: string,
    successMsg: string
  ) => {
    setActionLoading(memberId);
    try {
      await action();
      toast.success(successMsg);
    } catch {
      toast.error("Action failed. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeaveGroup = async () => {
    if (!currentGroup || currentGroup.isPersonal) return;
    setActionLoading("leave");
    try {
      await leaveGroup(groupId);
      toast.success("Left the group");
    } catch {
      toast.error("Failed to leave group");
    } finally {
      setActionLoading(null);
    }
  };

  if (membersLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const isPersonal = currentGroup?.isPersonal ?? false;

  return (
    <div className="space-y-6">
      {/* Group Info */}
      {!isPersonal && currentGroup?.inviteCode && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Invite Code</h3>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted rounded-lg px-4 py-2.5 font-mono text-lg tracking-widest font-bold text-center">
              {currentGroup.inviteCode}
            </div>
            <Button variant="outline" size="icon" onClick={handleCopyCode}>
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Member List */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Users className="h-4 w-4" />
          Members ({members.length})
        </h3>
        <div className="space-y-1">
          {members.map((member, index) => (
            <motion.div
              key={member.userId}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                  {member.userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="text-sm font-medium">
                    {member.userName}
                    {member.userId === user?.uid && (
                      <span className="text-muted-foreground ml-1">(you)</span>
                    )}
                  </span>
                </div>
                {member.role === "admin" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium dark:bg-amber-900/30 dark:text-amber-400">
                    <Crown className="h-3 w-3" />
                    Admin
                  </span>
                )}
                {member.role === "moderator" && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium dark:bg-blue-900/30 dark:text-blue-400">
                    <Shield className="h-3 w-3" />
                    Mod
                  </span>
                )}
              </div>

              {/* Admin Actions */}
              {isAdmin && member.userId !== user?.uid && !isPersonal && (
                <div className="flex items-center gap-1">
                  {member.role !== "admin" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={actionLoading === member.userId}
                      onClick={() =>
                        handleAction(
                          () => promoteMember(member.userId),
                          member.userId,
                          `${member.userName} promoted`
                        )
                      }
                      title="Promote"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                  )}
                  {member.role !== "member" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={actionLoading === member.userId}
                      onClick={() =>
                        handleAction(
                          () => demoteMember(member.userId),
                          member.userId,
                          `${member.userName} demoted`
                        )
                      }
                      title="Demote"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    disabled={actionLoading === member.userId}
                    onClick={() =>
                      handleAction(
                        () => kickMember(member.userId),
                        member.userId,
                        `${member.userName} removed from group`
                      )
                    }
                    title="Remove from group"
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Leave Group */}
      {!isPersonal && (
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleLeaveGroup}
          disabled={actionLoading === "leave"}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {actionLoading === "leave" ? "Leaving..." : "Leave Group"}
        </Button>
      )}
    </div>
  );
}
