import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useGroups } from "@/hooks/useGroups";
import { GroupManagement } from "@/components/GroupManagement";

const GroupSettingsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { groups } = useGroups();

  const group = groups.find((g) => g.id === id);

  return (
    <div className="min-h-screen bg-background">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-b border-border/30 bg-background/80 backdrop-blur-sm sticky top-0 z-20"
      >
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/group/${id}`)}
            className="p-2 -ml-2 rounded-lg hover:bg-accent text-muted-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </motion.button>
          <h1 className="text-lg font-semibold text-foreground truncate">
            {group?.name ?? "Group"} Settings
          </h1>
        </div>
      </motion.header>

      <main className="container max-w-lg mx-auto px-4 py-6">
        {id ? (
          <GroupManagement groupId={id} />
        ) : (
          <p className="text-center text-muted-foreground py-12">Group not found</p>
        )}
      </main>
    </div>
  );
};

export default GroupSettingsPage;
