import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Plus, UserPlus, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProfiles } from "@/hooks/useProfiles";
import { useGroups } from "@/hooks/useGroups";
import { useCurrentGroup } from "@/hooks/useCurrentGroup";
import { CreateGroupDialog } from "@/components/CreateGroupDialog";
import { JoinGroupDialog } from "@/components/JoinGroupDialog";

const HomeView = () => {
  const { currentProfile } = useProfiles();
  const { groups, loading } = useGroups();
  const { setCurrentGroup } = useCurrentGroup();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const nonPersonalGroups = groups.filter((g) => !g.isPersonal);

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-2xl font-bold text-foreground">
          Welcome{currentProfile?.display_name ? `, ${currentProfile.display_name}` : ""}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your shared expenses across groups
        </p>
      </motion.div>

      {/* Summary placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-xl border border-border/50 bg-card p-5"
      >
        <h3 className="text-sm font-medium text-muted-foreground mb-1">Your Balance</h3>
        <p className="text-xs text-muted-foreground">
          Select a group to view detailed balances
        </p>
      </motion.div>

      {/* Groups list */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Users className="h-4 w-4" />
          Your Groups ({nonPersonalGroups.length})
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
          </div>
        ) : nonPersonalGroups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/50 bg-card/50 p-8 text-center">
            <Users className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No groups yet. Create or join a group to start splitting expenses.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {nonPersonalGroups.map((group, index) => (
              <motion.button
                key={group.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
                onClick={() => {
                  setCurrentGroup(group.id);
                  // Navigate to balance tab - dispatches via parent
                  const event = new CustomEvent("switchTab", { detail: "balance" });
                  window.dispatchEvent(event);
                }}
                className="w-full flex items-center justify-between rounded-xl border border-border/50 bg-card p-4 hover:bg-accent/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{group.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Created by {group.createdByName}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
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

      {/* Dialogs */}
      <CreateGroupDialog open={createOpen} onOpenChange={setCreateOpen} />
      <JoinGroupDialog open={joinOpen} onOpenChange={setJoinOpen} />
    </div>
  );
};

export default HomeView;
