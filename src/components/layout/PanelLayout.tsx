import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { SidebarProvider, useSidebar } from './SidebarContext';
import '@/styles/app-theme.css';

interface PanelLayoutProps {
  panel: 'admin' | 'bd';
}

// Inner component that consumes sidebar state
function PanelLayoutContent({ panel }: PanelLayoutProps) {
  const { isExpanded } = useSidebar();
  const sidebarWidth = isExpanded ? 'w-64' : 'w-16';

  return (
    <div className="app-shell min-h-screen">
      <Sidebar panel={panel} />
      <div className={`${isExpanded ? 'ml-64' : 'ml-16'} transition-all duration-300 ease-in-out`}>
        <TopNav panel={panel} />
        <main className="p-6 lg:p-8">
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