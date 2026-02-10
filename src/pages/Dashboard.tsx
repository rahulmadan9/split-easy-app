import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserCircle } from "lucide-react";
import { useCurrentGroup } from "@/hooks/useCurrentGroup";
import { GroupSelector } from "@/components/GroupSelector";
import BottomNav from "@/components/BottomNav";
import BalanceView from "@/components/BalanceView";
import ExpensesView from "@/components/ExpensesView";
import AddExpenseForm from "@/components/AddExpenseForm";
import RecurringView from "@/components/RecurringView";
import ProfileView from "@/components/ProfileView";
import HomeView from "@/components/HomeView";

type TabType = "home" | "balance" | "recurring" | "expenses" | "add" | "profile";

const Dashboard = () => {
  const { currentGroupId, loading } = useCurrentGroup();
  const [activeTab, setActiveTab] = useState<TabType>("home");

  if (loading) {
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

  const getTitle = () => {
    switch (activeTab) {
      case "home":
        return "Home";
      case "balance":
        return "Balance";
      case "recurring":
        return "Recurring";
      case "expenses":
        return "Expenses";
      case "add":
        return "Add Expense";
      case "profile":
        return "Profile";
    }
  };

  // BottomNav uses a narrower type without "profile"
  const handleBottomNavChange = (tab: "home" | "balance" | "recurring" | "expenses" | "add") => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-b border-border/30 bg-background/80 backdrop-blur-sm sticky top-0 z-20"
      >
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeTab !== "home" && activeTab !== "profile" ? (
              <GroupSelector />
            ) : (
              <h1 className="text-lg font-semibold text-foreground">
                {getTitle()}
              </h1>
            )}
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab("profile")}
            className={`p-2 rounded-lg transition-colors ${
              activeTab === "profile"
                ? "bg-primary/10 text-primary"
                : "hover:bg-accent text-muted-foreground"
            }`}
          >
            <UserCircle className="h-6 w-6" />
          </motion.button>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="container max-w-lg mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <HomeView />
            </motion.div>
          )}

          {activeTab === "balance" && (
            <motion.div
              key="balance"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <BalanceView groupId={currentGroupId} />
            </motion.div>
          )}

          {activeTab === "recurring" && (
            <motion.div
              key="recurring"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <RecurringView groupId={currentGroupId} />
            </motion.div>
          )}

          {activeTab === "expenses" && (
            <motion.div
              key="expenses"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <ExpensesView groupId={currentGroupId} />
            </motion.div>
          )}

          {activeTab === "add" && (
            <motion.div
              key="add"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="px-4 py-6"
            >
              <AddExpenseForm
                groupId={currentGroupId}
                onSuccess={() => setActiveTab("balance")}
              />
            </motion.div>
          )}

          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <ProfileView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab === "profile" ? "home" : activeTab}
        onTabChange={handleBottomNavChange}
      />
    </div>
  );
};

export default Dashboard;
