import { Home, IndianRupee, Receipt, Plus, Repeat } from "lucide-react";
import { motion } from "framer-motion";

type TabType = "home" | "balance" | "recurring" | "expenses" | "add";

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const tabs = [
    { id: "home" as const, label: "Home", icon: Home },
    { id: "balance" as const, label: "Balance", icon: IndianRupee },
    { id: "add" as const, label: "Add", icon: Plus, isMain: true },
    { id: "recurring" as const, label: "Recurring", icon: Repeat },
    { id: "expenses" as const, label: "Expenses", icon: Receipt },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border/50 pb-safe">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isMain) {
            return (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative -mt-6 flex flex-col items-center justify-center"
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary text-primary-foreground"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Icon className="h-6 w-6" />
                </motion.div>
                <span className="mt-1 text-xs font-medium text-muted-foreground">
                  {tab.label}
                </span>
              </motion.button>
            );
          }

          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex min-h-[56px] min-w-[64px] flex-col items-center justify-center gap-1 rounded-lg px-3 py-2"
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.1 : 1,
                  color: isActive ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Icon className="h-6 w-6" />
              </motion.div>
              <span
                className={`text-xs font-medium transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute bottom-1 h-1 w-8 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
