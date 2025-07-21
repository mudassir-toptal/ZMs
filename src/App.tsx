import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";

const App = () => {
  return (
    <TooltipProvider>
      <Toaster />
      <Home />
    </TooltipProvider>
  );
}

export default App;
