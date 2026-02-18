import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";
import HomePage from "./HomePage";
import GroupDetailPage from "./GroupDetailPage";
import GroupSettingsPage from "./GroupSettingsPage";
import ProfilePage from "./ProfilePage";

const Index = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Route to "/" redirects to "/home"
  if (location.pathname === "/") {
    return <Navigate to="/home" replace />;
  }

  if (location.pathname === "/home") {
    return <HomePage />;
  }

  if (location.pathname === "/profile") {
    return <ProfilePage />;
  }

  // /group/:id/settings
  if (/^\/group\/[^/]+\/settings$/.test(location.pathname)) {
    return <GroupSettingsPage />;
  }

  // /group/:id
  if (/^\/group\/[^/]+$/.test(location.pathname)) {
    return <GroupDetailPage />;
  }

  return <Navigate to="/home" replace />;
};

export default Index;
