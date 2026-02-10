import { useState } from "react";
import { LogOut, Plus, UserPlus, Users, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useProfiles } from "@/hooks/useProfiles";
import { useGroups } from "@/hooks/useGroups";
import { GroupManagement } from "@/components/GroupManagement";
import { CreateGroupDialog } from "@/components/CreateGroupDialog";
import { JoinGroupDialog } from "@/components/JoinGroupDialog";

const ProfileView = () => {
  const { signOut, user } = useAuth();
  const { currentProfile } = useProfiles();
  const { groups } = useGroups();
  const [managingGroupId, setManagingGroupId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const nonPersonalGroups = groups.filter((g) => !g.isPersonal);

  return (
    <div className="px-4 py-6 space-y-6">
      {/* User info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border/50 bg-card p-6 space-y-4"
      >
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Name</p>
          <p className="text-lg font-medium">{currentProfile?.display_name}</p>
        </div>
        {currentProfile?.phone_number && (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Phone</p>
            <p className="text-lg font-medium">{currentProfile.phone_number}</p>
          </div>
        )}
        {user?.email && (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="text-lg font-medium">{user.email}</p>
          </div>
        )}
      </motion.div>

      {/* My Groups */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Users className="h-4 w-4" />
          My Groups ({nonPersonalGroups.length})
        </h3>

        {nonPersonalGroups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/50 bg-card/50 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No groups yet. Create or join one below.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {nonPersonalGroups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <button
                  onClick={() =>
                    setManagingGroupId(
                      managingGroupId === group.id ? null : group.id
                    )
                  }
                  className="w-full flex items-center justify-between rounded-xl border border-border/50 bg-card p-4 hover:bg-accent/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {group.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {group.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Code: {group.inviteCode}
                      </p>
                    </div>
                  </div>
                  <Settings
                    className={`h-4 w-4 text-muted-foreground transition-transform ${
                      managingGroupId === group.id ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {/* Inline group management */}
                {managingGroupId === group.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 rounded-xl border border-border/50 bg-card p-4"
                  >
                    <GroupManagement groupId={group.id} />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Group actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex gap-3"
      >
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Group
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => setJoinOpen(true)}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Join Group
        </Button>
      </motion.div>

      {/* Sign out */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          variant="outline"
          className="w-full"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </motion.div>

      {/* Dialogs */}
      <CreateGroupDialog open={createOpen} onOpenChange={setCreateOpen} />
      <JoinGroupDialog open={joinOpen} onOpenChange={setJoinOpen} />
    </div>
  );
};

export default ProfileView;
