import { useCurrentGroup } from "@/hooks/useCurrentGroup";
import { ChevronDown, Users } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function GroupSelector() {
  const { currentGroup, groups, loading, setCurrentGroup } = useCurrentGroup();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading || !currentGroup) return null;

  const sortedGroups = [...groups].sort((a, b) => {
    if (a.isPersonal && !b.isPersonal) return -1;
    if (!a.isPersonal && b.isPersonal) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
      >
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-sm truncate max-w-[160px]">
          {currentGroup.isPersonal ? "Personal" : currentGroup.name}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1 w-56 bg-popover border rounded-lg shadow-lg z-50 overflow-hidden"
          >
            {sortedGroups.map((group) => (
              <button
                key={group.id}
                onClick={() => {
                  setCurrentGroup(group.id);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors flex items-center justify-between ${
                  group.id === currentGroup.id ? "bg-accent/50 font-medium" : ""
                }`}
              >
                <span className="truncate">
                  {group.isPersonal ? "Personal" : group.name}
                </span>
                {group.isPersonal && (
                  <span className="text-xs text-muted-foreground ml-2 shrink-0">
                    Personal
                  </span>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
