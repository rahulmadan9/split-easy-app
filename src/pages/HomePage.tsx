import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Plus, UserPlus, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useProfiles } from "@/hooks/useProfiles";
import { useGroups } from "@/hooks/useGroups";
import { CreateGroupDialog } from "@/components/CreateGroupDialog";
import { JoinGroupDialog } from "@/components/JoinGroupDialog";
import AddExpenseForm from "@/components/AddExpenseForm";
import HomeGroupCard from "@/components/HomeGroupCard";

const HomePage = () => {
  const navigate = useNavigate();
  const { currentProfile } = useProfiles();
  const { groups, loading } = useGroups();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddGroupId, setQuickAddGroupId] = useState<string | null>(null);

  const nonPersonalGroups = groups.filter((g) => !g.isPersonal);
  const quickAddGroupName = nonPersonalGroups.find((group) => group.id === quickAddGroupId)?.name;

  const handleQuickAdd = (groupId: string) => {
    setQuickAddGroupId(groupId);
    setQuickAddOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-b border-border/30 bg-background/80 backdrop-blur-sm sticky top-0 z-20"
      >
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">Split Easy</h1>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/profile")}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground"
          >
            <UserCircle className="h-6 w-6" />
          </motion.button>
        </div>
      </motion.header>

      <main className="container max-w-lg mx-auto px-4 py-6 space-y-6">
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
                <HomeGroupCard
                  key={group.id}
                  group={group}
                  index={index}
                  onNavigate={(groupId) => navigate(`/group/${groupId}`)}
                  onQuickAdd={handleQuickAdd}
                />
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
        <Drawer
          open={quickAddOpen}
          onOpenChange={(open) => {
            setQuickAddOpen(open);
            if (!open) {
              setQuickAddGroupId(null);
            }
          }}
        >
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>
                Add Expense{quickAddGroupName ? ` - ${quickAddGroupName}` : ""}
              </DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-6 overflow-y-auto">
              <AddExpenseForm
                groupId={quickAddGroupId}
                onSuccess={() => {
                  setQuickAddOpen(false);
                  setQuickAddGroupId(null);
                }}
              />
            </div>
          </DrawerContent>
        </Drawer>
      </main>
    </div>
  );
};

export default HomePage;
