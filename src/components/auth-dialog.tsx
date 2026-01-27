import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

export function AuthDialog() {
  const {
    isAuthenticated,
    isPending,
    signIn,
    signUp,
    showAuthDialog,
    closeAuthDialog,
  } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    await signIn.email(
      { email, password },
      {
        onError: (ctx) => {
          setError(ctx.error.message);
          setIsLoading(false);
        },
        onSuccess: () => {
          setIsLoading(false);
        },
      },
    );
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    await signUp.email(
      { email, password, name },
      {
        onError: (ctx) => {
          setError(ctx.error.message);
          setIsLoading(false);
        },
        onSuccess: () => {
          setIsLoading(false);
        },
      },
    );
  };

  const switchToSignUp = (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveTab("signup");
    setError(null);
  };

  const switchToSignIn = (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveTab("signin");
    setError(null);
  };

  // Don't render if still checking auth or already authenticated
  if (isPending || isAuthenticated) {
    return null;
  }

  // Dialog is open when not authenticated AND showAuthDialog is true
  const isOpen = !isAuthenticated && showAuthDialog;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeAuthDialog()}>
      <DialogContent className="sm:max-w-[425px]">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "signin" | "signup")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn}>
              <DialogHeader className="mb-4">
                <DialogTitle>Welcome back</DialogTitle>
                <DialogDescription>
                  Enter your credentials to access your account
                </DialogDescription>
              </DialogHeader>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <div className="flex items-center">
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <a
                      href="#"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Field>
                {error && (
                  <div className="text-sm text-destructive">{error}</div>
                )}
                <Field>
                  <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Sign In
                  </Button>
                  <FieldDescription className="text-center">
                    Don&apos;t have an account?{" "}
                    <a href="#" onClick={switchToSignUp}>
                      Sign up
                </a>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp}>
              <DialogHeader className="mb-4">
                <DialogTitle>Create an account</DialogTitle>
                <DialogDescription>
                  Enter your details to create a new account
                </DialogDescription>
              </DialogHeader>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Name</FieldLabel>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="signup-email">Email</FieldLabel>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="signup-password">Password</FieldLabel>
                  <Input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Field>
                {error && (
                  <div className="text-sm text-destructive">{error}</div>
                )}
                <Field>
                  <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Account
                  </Button>
                  <FieldDescription className="text-center">
                    Already have an account?{" "}
                    <a href="#" onClick={switchToSignIn}>
                      Sign in
                    </a>
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
