import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import ProfileView from "@/components/ProfileView";

const ProfilePage = () => {
  const navigate = useNavigate();

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
            onClick={() => navigate("/home")}
            className="p-2 -ml-2 rounded-lg hover:bg-accent text-muted-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </motion.button>
          <h1 className="text-lg font-semibold text-foreground">Profile</h1>
        </div>
      </motion.header>

      <main className="container max-w-lg mx-auto">
        <ProfileView />
      </main>
    </div>
  );
};

export default ProfilePage;
