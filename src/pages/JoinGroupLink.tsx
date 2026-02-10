import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useGroups } from "@/hooks/useGroups";
import { useCurrentGroup } from "@/hooks/useCurrentGroup";
import { toast } from "sonner";

const JoinGroupLink = () => {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { joinGroupByCode } = useGroups();
  const { setCurrentGroup } = useCurrentGroup();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Redirect to auth with return URL
      navigate(`/auth?redirect=/join/${inviteCode}`, { replace: true });
      return;
    }

    if (!inviteCode || joining) return;

    const doJoin = async () => {
      setJoining(true);
      try {
        const result = await joinGroupByCode(inviteCode);
        if (result) {
          const groupId = typeof result === "string" ? result : result.id;
          if (groupId) {
            await setCurrentGroup(groupId);
          }
          toast.success("Successfully joined the group!");
        }
        navigate("/", { replace: true });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to join group";
        setError(message);
        toast.error(message);
      } finally {
        setJoining(false);
      }
    };

    doJoin();
  }, [user, authLoading, inviteCode]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="rounded-xl border border-border/50 bg-card p-8 text-center max-w-sm w-full space-y-4">
          <p className="text-destructive font-medium">{error}</p>
          <button
            onClick={() => navigate("/", { replace: true })}
            className="text-sm text-primary hover:underline"
          >
            Go to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-muted-foreground"
      >
        Joining group...
      </motion.p>
    </div>
  );
};

export default JoinGroupLink;
