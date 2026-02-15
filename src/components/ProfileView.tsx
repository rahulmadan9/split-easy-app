import { useEffect, useState } from "react";
import { LogOut, Plus, UserPlus, Users, Settings, Pencil, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useProfiles } from "@/hooks/useProfiles";
import { useGroups } from "@/hooks/useGroups";
import { GroupManagement } from "@/components/GroupManagement";
import { CreateGroupDialog } from "@/components/CreateGroupDialog";
import { JoinGroupDialog } from "@/components/JoinGroupDialog";
import { toast } from "sonner";

const ProfileView = () => {
  const { signOut, user } = useAuth();
  const { currentProfile, updateDisplayName, updatingDisplayName } = useProfiles();
  const { groups, loading } = useGroups();
  const [managingGroupId, setManagingGroupId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  const nonPersonalGroups = groups.filter((g) => !g.isPersonal);
  const currentName = currentProfile?.display_name || "";
  const isNameChanged = nameDraft.trim() !== currentName;

  useEffect(() => {
    if (!isEditingName) {
      setNameDraft(currentName);
    }
  }, [currentName, isEditingName]);

  const handleStartEditingName = () => {
    setNameDraft(currentName);
    setIsEditingName(true);
  };

  const handleCancelEditingName = () => {
    setNameDraft(currentName);
    setIsEditingName(false);
  };

  const handleSaveDisplayName = async () => {
    if (!isNameChanged) {
      setIsEditingName(false);
      return;
    }

    try {
      await updateDisplayName(nameDraft);
      toast.success("Name updated");
      setIsEditingName(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update name";
      toast.error(message);
    }
  };

  return (
    <div className="px-4 py-6 space-y-6">
      {/* User info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border/50 bg-card p-6 space-y-4"
      >
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Name</p>
            {!isEditingName && (
              <button
                type="button"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                onClick={handleStartEditingName}
                aria-label="Edit display name"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </div>

          {isEditingName ? (
            <div className="space-y-2">
              <Input
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleSaveDisplayName();
                  }
                  if (event.key === "Escape") {
                    event.preventDefault();
                    handleCancelEditingName();
                  }
                }}
                placeholder="Enter your name"
                autoFocus
                maxLength={50}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleCancelEditingName}
                  disabled={updatingDisplayName}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => void handleSaveDisplayName()}
                  disabled={updatingDisplayName || !isNameChanged}
                >
                  <Check className="h-4 w-4 mr-1" />
                  {updatingDisplayName ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-lg font-medium">{currentName || "User"}</p>
          )}
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

        {loading ? (
          <div className="rounded-xl border border-border/50 bg-card/50 p-6 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Loading groups...</p>
          </div>
        ) : nonPersonalGroups.length === 0 ? (
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
