import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';

interface PanelLayoutProps {
  panel: 'admin' | 'hr' | 'bd';
}

export function PanelLayout({ panel }: PanelLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar panel={panel} />
      <div className="pl-64">
        <TopNav panel={panel} />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
