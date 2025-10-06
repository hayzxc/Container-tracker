import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthForm } from "@/components/AuthForm";
import { ContainerForm } from "@/components/ContainerForm";
import { ContainerList } from "@/components/ContainerList";
import { Button } from "@/components/ui/button";
import { LogOut, Package } from "lucide-react";

const Index = () => {
  const [user, setUser] = useState<any>(null);
  const [refreshList, setRefreshList] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleSuccess = () => {
    setRefreshList(!refreshList);
  };

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Container Tracker</h1>
                <p className="text-sm text-primary-foreground/80">{user.email}</p>
              </div>
            </div>
            <Button
              onClick={handleSignOut}
              variant="secondary"
              size="sm"
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <ContainerForm onSuccess={handleSuccess} />
        <ContainerList refresh={refreshList} />
      </main>
    </div>
  );
};

export default Index;
