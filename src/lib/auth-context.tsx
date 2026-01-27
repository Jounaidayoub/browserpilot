import { createContext, useContext, ReactNode, useState } from "react";
import { useSession, signIn, signUp, signOut } from "@/lib/auth-client";

interface AuthContextType {
  session: ReturnType<typeof useSession>["data"];
  isPending: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  showAuthDialog: boolean;
  triggerAuthDialog: () => void;
  closeAuthDialog: () => void;
  signIn: typeof signIn;
  signUp: typeof signUp;
  signOut: typeof signOut;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending, error } = useSession();
  const [showAuthDialog, setShowAuthDialog] = useState(true);

  const triggerAuthDialog = () => setShowAuthDialog(true);
  const closeAuthDialog = () => setShowAuthDialog(false);

  const value: AuthContextType = {
    session,
    isPending,
    error: error ?? null,
    isAuthenticated: !!session,
    showAuthDialog,
    triggerAuthDialog,
    closeAuthDialog,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
