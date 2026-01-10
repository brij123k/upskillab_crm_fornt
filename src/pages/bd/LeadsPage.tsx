import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Plus, 
  Filter,
  LayoutGrid,
  List,
  Phone,
  Mail,
  Calendar,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Lead {
  id: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  stage: string;
  value: string;
  source: string;
  lastContact: string;
}

const leads: Lead[] = [
  { id: '1', company: 'ABC Corporation', contact: 'John Smith', email: 'john@abc.com', phone: '+1 234 567 890', stage: 'new', value: '$15,000', source: 'Website', lastContact: '2 days ago' },
  { id: '2', company: 'XYZ Industries', contact: 'Sarah Lee', email: 'sarah@xyz.com', phone: '+1 234 567 891', stage: 'contacted', value: '$28,000', source: 'Referral', lastContact: '1 day ago' },
  { id: '3', company: 'Tech Solutions Inc', contact: 'Mike Brown', email: 'mike@techsol.com', phone: '+1 234 567 892', stage: 'qualified', value: '$45,000', source: 'LinkedIn', lastContact: '3 hours ago' },
  { id: '4', company: 'Global Services', contact: 'Emily Davis', email: 'emily@global.com', phone: '+1 234 567 893', stage: 'proposal', value: '$62,000', source: 'Cold Call', lastContact: '5 days ago' },
  { id: '5', company: 'Delta Inc', contact: 'Robert Wilson', email: 'robert@delta.com', phone: '+1 234 567 894', stage: 'negotiation', value: '$38,000', source: 'Trade Show', lastContact: '1 week ago' },
  { id: '6', company: 'Omega Corp', contact: 'Lisa Anderson', email: 'lisa@omega.com', phone: '+1 234 567 895', stage: 'new', value: '$22,000', source: 'Website', lastContact: 'Today' },
];

const stages = [
  { id: 'new', label: 'New', color: 'bg-info' },
  { id: 'contacted', label: 'Contacted', color: 'bg-bd' },
  { id: 'qualified', label: 'Qualified', color: 'bg-warning' },
  { id: 'proposal', label: 'Proposal', color: 'bg-admin' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-hr' },
  { id: 'closed', label: 'Closed Won', color: 'bg-success' },
];

const getStageColor = (stage: string) => {
  const found = stages.find(s => s.id === stage);
  return found?.color || 'bg-muted';
};

function KanbanCard({ lead }: { lead: Lead }) {
  return (
    <Card className="mb-3 cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-medium text-foreground">{lead.company}</h4>
            <p className="text-sm text-muted-foreground">{lead.contact}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-3 w-3" />
            {lead.email}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-bd">{lead.value}</span>
            <Badge variant="secondary" className="text-xs">{lead.source}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Mail className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function LeadsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'kanban' | 'list'>('kanban');

  const filteredLeads = leads.filter(lead =>
    lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.contact.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLeadsByStage = (stage: string) => filteredLeads.filter(lead => lead.stage === stage);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground">Manage and track your sales pipeline</p>
        </div>
        <Button className="bg-bd hover:bg-bd/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Lead
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
          <Button
            variant={view === 'kanban' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('kanban')}
          >
            <LayoutGrid className="h-4 w-4 mr-1" />
            Kanban
          </Button>
          <Button
            variant={view === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setView('list')}
          >
            <List className="h-4 w-4 mr-1" />
            List
          </Button>
        </div>
      </div>

      {view === 'kanban' ? (
        <div className="grid grid-cols-6 gap-4 overflow-x-auto">
          {stages.map((stage) => (
            <div key={stage.id} className="min-w-[280px]">
              <div className="flex items-center gap-2 mb-4">
                <div className={cn("w-3 h-3 rounded-full", stage.color)} />
                <h3 className="font-medium text-foreground">{stage.label}</h3>
                <Badge variant="secondary" className="ml-auto">
                  {getLeadsByStage(stage.id).length}
                </Badge>
              </div>
              <div className="space-y-3">
                {getLeadsByStage(stage.id).map((lead) => (
                  <KanbanCard key={lead.id} lead={lead} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="text-left p-4 font-medium">Company</th>
                  <th className="text-left p-4 font-medium">Contact</th>
                  <th className="text-left p-4 font-medium">Stage</th>
                  <th className="text-left p-4 font-medium">Value</th>
                  <th className="text-left p-4 font-medium">Source</th>
                  <th className="text-left p-4 font-medium">Last Contact</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="border-t border-border hover:bg-secondary/30">
                    <td className="p-4 font-medium">{lead.company}</td>
                    <td className="p-4">
                      <div>
                        <p>{lead.contact}</p>
                        <p className="text-sm text-muted-foreground">{lead.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={cn(getStageColor(lead.stage), 'text-white')}>
                        {stages.find(s => s.id === lead.stage)?.label}
                      </Badge>
                    </td>
                    <td className="p-4 font-medium text-bd">{lead.value}</td>
                    <td className="p-4">{lead.source}</td>
                    <td className="p-4 text-muted-foreground">{lead.lastContact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
