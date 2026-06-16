import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { SidebarProvider, useSidebar } from './SidebarContext';

interface PanelLayoutProps {
  panel: 'admin' | 'bd';
}

// Inner component that consumes sidebar state
function PanelLayoutContent({ panel }: PanelLayoutProps) {
  const { isExpanded } = useSidebar();
  const sidebarWidth = isExpanded ? 'w-64' : 'w-16';

  return (
    <div className="min-h-screen bg-background">
      <Sidebar panel={panel} />
      <div className={`${isExpanded ? 'ml-64' : 'ml-16'} transition-all duration-300 ease-in-out`}>
        <TopNav panel={panel} />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function PanelLayout({ panel }: PanelLayoutProps) {
  return (
    <SidebarProvider>
      <PanelLayoutContent panel={panel} />
    </SidebarProvider>
  );
}