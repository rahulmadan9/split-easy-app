import { motion } from "framer-motion";
import { Plus, type LucideIcon } from "lucide-react";

interface FABProps {
  onClick: () => void;
  icon?: LucideIcon;
}

const FAB = ({ onClick, icon: Icon = Plus }: FABProps) => {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
    >
      <Icon className="h-6 w-6" />
    </motion.button>
  );
};

export default FAB;
