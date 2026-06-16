// components/DepartmentsTab.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Building, 
  Plus, 
  Edit, 
  Loader2,
  Eye,
  MoreHorizontal,
  Search,
  Network
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { DepartmentType } from '@/types/user';

interface DepartmentsTabProps {
  departments: DepartmentType[];
  loading: boolean;
  onAddDepartment: (data: any) => Promise<void>;
  onUpdateDepartment: (departmentId: string, data: any) => Promise<void>;
}

export function DepartmentsTab({
  departments,
  loading,
  onAddDepartment,
  onUpdateDepartment
}: DepartmentsTabProps) {
  const [newDepartmentOpen, setNewDepartmentOpen] = useState(false);
  const [editDepartmentOpen, setEditDepartmentOpen] = useState(false);
  const [viewDepartmentOpen, setViewDepartmentOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentType | null>(null);
  
  const [addingDepartment, setAddingDepartment] = useState(false);
  const [updatingDepartment, setUpdatingDepartment] = useState(false);
  
  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    parentDepartmentId: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'main' | 'sub'>('all');

  const filteredDepartments = departments.filter(dept => {
    const searchMatch = 
      dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dept.parentDepartmentId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    if (filter === 'main') return !dept.parentDepartmentId;
    if (filter === 'sub') return !!dept.parentDepartmentId;
    return searchMatch;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const resetForm = () => {
    setDepartmentForm({ name: '', parentDepartmentId: '' });
  };

  const handleAddDepartment = async () => {
    setAddingDepartment(true);
    try {
      await onAddDepartment(departmentForm);
      setNewDepartmentOpen(false);
      resetForm();
    } finally {
      setAddingDepartment(false);
    }
  };

  const handleUpdateDepartment = async () => {
    if (!selectedDepartment) return;
    setUpdatingDepartment(true);
    try {
      await onUpdateDepartment(selectedDepartment._id, departmentForm);
      setEditDepartmentOpen(false);
      setSelectedDepartment(null);
      resetForm();
    } finally {
      setUpdatingDepartment(false);
    }
  };

  const handleEditOpen = (dept: DepartmentType) => {
    setSelectedDepartment(dept);
    setDepartmentForm({
      name: dept.name,
      parentDepartmentId: dept.parentDepartmentId?._id || ''
    });
    setEditDepartmentOpen(true);
  };

  const handleViewOpen = (dept: DepartmentType) => {
    setSelectedDepartment(dept);
    setViewDepartmentOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header with search and filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-800">All Departments ({departments.length})</h3>
          <p className="text-sm text-slate-500">Manage organizational departments</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Search departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 w-64 text-sm rounded-lg border-slate-200 focus:ring-orange-500"
            />
          </div>
          
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className="w-40 h-9 text-sm rounded-lg border-slate-200">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="main">Main Departments</SelectItem>
              <SelectItem value="sub">Sub-departments</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={() => setNewDepartmentOpen(true)} className="rounded-lg bg-orange-500 hover:bg-orange-600 text-white h-9">
            <Plus className="w-4 h-4 mr-2" />
            New Department
          </Button>
        </div>
      </div>

      {/* Departments Grid */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500" />
          <p className="mt-2 text-sm text-slate-500">Loading departments...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepartments.map((dept) => (
            <Card key={dept._id} className="rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-2 px-5 pt-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      dept.parentDepartmentId 
                        ? "bg-blue-100 text-blue-700" 
                        : "bg-orange-100 text-orange-700"
                    )}>
                      {dept.parentDepartmentId ? (
                        <Network className="w-5 h-5" />
                      ) : (
                        <Building className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold text-slate-800">{dept.name}</CardTitle>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Created {formatDate(dept.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-slate-500 hover:text-orange-600">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-lg border-slate-200">
                      <DropdownMenuItem onClick={() => handleViewOpen(dept)} className="text-sm">
                        <Eye className="mr-2 h-3.5 w-3.5" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditOpen(dept)} className="text-sm">
                        <Edit className="mr-2 h-3.5 w-3.5" />
                        Edit Department
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent className="px-5 pb-5 pt-0 space-y-3">
                {/* Type Badge */}
                <div>
                  {dept.parentDepartmentId ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 rounded-full text-xs">
                      <Network className="w-3 h-3 mr-1" />
                      Sub-department
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 rounded-full text-xs">
                      <Building className="w-3 h-3 mr-1" />
                      Main Department
                    </Badge>
                  )}
                </div>
                
                {/* Parent Department */}
                {dept.parentDepartmentId && (
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1">Parent Department:</div>
                    <div className="inline-flex items-center gap-1.5 text-sm text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg">
                      <Building className="w-3 h-3 text-slate-400" />
                      {dept.parentDepartmentId.name}
                    </div>
                  </div>
                )}
                
                {/* Stats */}
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center gap-1.5">
                    <Network className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-sm text-slate-600">
                      {departments.filter(d => d.parentDepartmentId?._id === dept._id).length} sub-depts
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredDepartments.length === 0 && (
        <Card className="border-dashed border-slate-200 rounded-xl">
          <CardContent className="py-12 text-center">
            <Building className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <h3 className="text-base font-semibold text-slate-800 mb-1">No departments found</h3>
            <p className="text-sm text-slate-500 mb-6">
              {searchQuery || filter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first department'}
            </p>
            <Button onClick={() => setNewDepartmentOpen(true)} className="rounded-lg bg-orange-500 hover:bg-orange-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Department
            </Button>
          </CardContent>
        </Card>
      )}

      {/* New Department Modal */}
      <Dialog open={newDepartmentOpen} onOpenChange={setNewDepartmentOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border-slate-200 p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
            <DialogTitle className="text-xl font-bold text-slate-800">Create New Department</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              Add a new department to your organization structure.
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Department Name *</Label>
              <Input
                value={departmentForm.name}
                onChange={(e) => setDepartmentForm({...departmentForm, name: e.target.value})}
                placeholder="e.g., Human Resources"
                disabled={addingDepartment}
                className="h-10 rounded-xl border-slate-200 focus:ring-orange-500"
              />
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Parent Department (Optional)</Label>
              <Select
                value={departmentForm.parentDepartmentId}
                onValueChange={(value) => setDepartmentForm({...departmentForm, parentDepartmentId: value})}
                disabled={addingDepartment}
              >
                <SelectTrigger className="h-10 rounded-xl border-slate-200">
                  <SelectValue placeholder="Select parent department (optional)" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value=" ">None (Create as main department)</SelectItem>
                  {departments
                    .filter(dept => !dept.parentDepartmentId)
                    .map((dept) => (
                      <SelectItem key={dept._id} value={dept._id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Leave empty to create a main department. Sub-departments can be created later.
              </p>
            </div>
          </div>
          
          <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white">
            <div className="flex gap-3 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={() => { setNewDepartmentOpen(false); resetForm(); }} 
                disabled={addingDepartment}
                className="rounded-xl border-slate-200"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddDepartment} 
                disabled={addingDepartment || !departmentForm.name}
                className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
              >
                {addingDepartment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Department
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Department Modal */}
      <Dialog open={editDepartmentOpen} onOpenChange={setEditDepartmentOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border-slate-200 p-0 overflow-hidden">
          {selectedDepartment && (
            <>
              <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
                <DialogTitle className="text-xl font-bold text-slate-800">Edit Department</DialogTitle>
                <DialogDescription className="text-sm text-slate-500">
                  Update department: {selectedDepartment.name}
                </DialogDescription>
              </DialogHeader>
              
              <div className="px-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Department Name *</Label>
                  <Input
                    value={departmentForm.name}
                    onChange={(e) => setDepartmentForm({...departmentForm, name: e.target.value})}
                    placeholder="Department name"
                    disabled={updatingDepartment}
                    className="h-10 rounded-xl border-slate-200 focus:ring-orange-500"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Parent Department</Label>
                  <Select
                    value={departmentForm.parentDepartmentId}
                    onValueChange={(value) => setDepartmentForm({...departmentForm, parentDepartmentId: value})}
                    disabled={updatingDepartment}
                  >
                    <SelectTrigger className="h-10 rounded-xl border-slate-200">
                      <SelectValue placeholder="Select parent department" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value=" ">None (Make it a main department)</SelectItem>
                      {departments
                        .filter(dept => dept._id !== selectedDepartment._id && !dept.parentDepartmentId)
                        .map((dept) => (
                          <SelectItem key={dept._id} value={dept._id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm text-amber-800">
                    <strong>Note:</strong> Changing parent department will affect all users and sub-departments in this department.
                  </p>
                </div>
              </div>
              
              <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white">
                <div className="flex gap-3 w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    onClick={() => { setEditDepartmentOpen(false); setSelectedDepartment(null); resetForm(); }} 
                    disabled={updatingDepartment}
                    className="rounded-xl border-slate-200"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleUpdateDepartment} 
                    disabled={updatingDepartment || !departmentForm.name}
                    className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {updatingDepartment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Update Department
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* View Department Modal */}
      <Dialog open={viewDepartmentOpen} onOpenChange={setViewDepartmentOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border-slate-200 p-0 overflow-hidden">
          {selectedDepartment && (
            <>
              <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
                <DialogTitle className="text-xl font-bold text-slate-800">Department Details</DialogTitle>
                <DialogDescription className="text-sm text-slate-500">
                  Complete information for {selectedDepartment.name}
                </DialogDescription>
              </DialogHeader>
              
              <div className="px-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-16 h-16 rounded-xl flex items-center justify-center",
                    selectedDepartment.parentDepartmentId 
                      ? "bg-blue-100 text-blue-700" 
                      : "bg-orange-100 text-orange-700"
                  )}>
                    {selectedDepartment.parentDepartmentId ? (
                      <Network className="w-8 h-8" />
                    ) : (
                      <Building className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">{selectedDepartment.name}</h3>
                    <p className="text-sm text-slate-500">
                      {selectedDepartment.parentDepartmentId ? 'Sub-department' : 'Main Department'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1">Created</div>
                    <p className="text-sm text-slate-700">{formatDate(selectedDepartment.createdAt)}</p>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1">Last Updated</div>
                    <p className="text-sm text-slate-700">{formatDate(selectedDepartment.updatedAt)}</p>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-500 mb-1">Sub-departments</div>
                    <p className="text-sm text-slate-700">
                      {departments.filter(d => d.parentDepartmentId?._id === selectedDepartment._id).length}
                    </p>
                  </div>
                </div>

                {selectedDepartment.parentDepartmentId && (
                  <div className="border-t border-slate-100 pt-4">
                    <div className="text-xs font-medium text-slate-500 mb-2">Parent Department</div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Building className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{selectedDepartment.parentDepartmentId.name}</div>
                        <div className="text-xs text-slate-500">Main Department</div>
                      </div>
                    </div>
                  </div>
                )}

                {departments.filter(d => d.parentDepartmentId?._id === selectedDepartment._id).length > 0 && (
                  <div className="border-t border-slate-100 pt-4">
                    <div className="text-xs font-medium text-slate-500 mb-2">Sub-departments</div>
                    <div className="space-y-2">
                      {departments
                        .filter(d => d.parentDepartmentId?._id === selectedDepartment._id)
                        .map(subDept => (
                          <div key={subDept._id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                              <Network className="h-4 w-4 text-slate-500" />
                            </div>
                            <div>
                              <div className="font-medium text-slate-700">{subDept.name}</div>
                              <div className="text-xs text-slate-400">
                                Created: {formatDate(subDept.createdAt)}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white">
                <Button variant="outline" onClick={() => setViewDepartmentOpen(false)} className="rounded-xl border-slate-200">
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Global style for hidden scrollbar */}
      <style>{`
        .custom-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}