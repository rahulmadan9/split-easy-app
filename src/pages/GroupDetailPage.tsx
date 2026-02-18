import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Settings, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useGroups } from "@/hooks/useGroups";
import { useCurrentGroup } from "@/hooks/useCurrentGroup";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import BalanceView from "@/components/BalanceView";
import ExpensesView from "@/components/ExpensesView";
import RecurringView from "@/components/RecurringView";
import AddExpenseForm from "@/components/AddExpenseForm";
import { SettlementSuggestions } from "@/components/SettlementSuggestions";
import FAB from "@/components/FAB";
import { copyToClipboard } from "@/lib/clipboard";

const GroupDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { groups, loading: groupsLoading } = useGroups();
  const { setCurrentGroup } = useCurrentGroup();
  const { members } = useGroupMembers(id ?? null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settleDrawerOpen, setSettleDrawerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("expenses");

  const group = groups.find((g) => g.id === id);

  // Sync current group with URL param
  useEffect(() => {
    if (id) {
      setCurrentGroup(id);
    }
  }, [id, setCurrentGroup]);

  const handleCopyCode = async () => {
    if (!group?.inviteCode) return;
    try {
      await copyToClipboard(group.inviteCode);
      setCopied(true);
      toast.success("Invite code copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy code");
    }
  };

  if (groupsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-muted-foreground"
        >
          Loading...
        </motion.p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">Group not found</p>
        <button
          onClick={() => navigate("/home")}
          className="text-primary text-sm underline"
        >
          Go back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-b border-border/30 bg-background/80 backdrop-blur-sm sticky top-0 z-20"
      >
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/home")}
              className="p-2 -ml-2 rounded-lg hover:bg-accent text-muted-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </motion.button>
            <h1 className="text-lg font-semibold text-foreground truncate">
              {group.name}
            </h1>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/group/${id}/settings`)}
            className="p-2 rounded-lg hover:bg-accent text-muted-foreground"
          >
            <Settings className="h-5 w-5" />
          </motion.button>
        </div>
      </motion.header>

      <main className="container max-w-lg mx-auto">
        {/* Balance Card */}
        <BalanceView groupId={id ?? null} onSettleUp={() => setSettleDrawerOpen(true)} />

        {/* Members & Invite */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-6 pb-4"
        >
          <div className="rounded-xl border border-border/50 bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Members: {members.map((m) => m.userName).join(", ")}
              </p>
            </div>
            {group.inviteCode && (
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  Invite code: <span className="font-mono font-bold">{group.inviteCode}</span>
                </p>
                <button
                  onClick={handleCopyCode}
                  className="p-1 rounded hover:bg-accent text-muted-foreground"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Internal Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="recurring">Recurring</TabsTrigger>
            </TabsList>

            <TabsContent value="expenses" className="mt-0">
              <ExpensesView groupId={id ?? null} mode="list" />
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <ExpensesView groupId={id ?? null} mode="analytics" />
            </TabsContent>

            <TabsContent value="recurring" className="mt-0">
              <RecurringView groupId={id ?? null} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* FAB */}
      <FAB onClick={() => setDrawerOpen(true)} />

      {/* Add Expense Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Add Expense</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            <AddExpenseForm
              groupId={id ?? null}
              onSuccess={() => setDrawerOpen(false)}
            />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Settle Up Drawer */}
      <Drawer open={settleDrawerOpen} onOpenChange={setSettleDrawerOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>Settle Up</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            {id && <SettlementSuggestions groupId={id} />}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
};

export default GroupDetailPage;
