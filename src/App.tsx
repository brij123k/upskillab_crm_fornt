import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { clearAuth, isSessionExpired } from "@/auth";
import { useEffect } from "react";
import AppRoutes from "./routes";

const queryClient = new QueryClient();

const SessionExpiryWatcher = () => {
  useEffect(() => {
    const redirectToLogin = () => {
      clearAuth();
      window.location.replace("/login?reason=session_expired");
    };

    const intervalId = window.setInterval(() => {
      if (isSessionExpired()) {
        redirectToLogin();
      }
    }, 1000);

    if (isSessionExpired()) {
      redirectToLogin();
    }

    return () => {
 window.clearInterval(intervalId);
    };
  }, []);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <SessionExpiryWatcher />
        <Toaster />
        <Sonner />
        <AppRoutes />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

// import CashfreeTest from "./CashfreeTest";

// function App() {
//   return <CashfreeTest />;
// }

// export default App;
// }

// export default App;// export default App;