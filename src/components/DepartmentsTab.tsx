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
  Trash2, 
  Users, 
  Network, 
  Loader2,
  Eye,
  MoreHorizontal,
  Search,
  Filter
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { DepartmentType } from '@/types/user';
import ApiConfig from '@/config/apiConfig';
import { getDataHandlerWithToken } from '@/config/services';

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
  
  // Loading states
  const [addingDepartment, setAddingDepartment] = useState(false);
  const [updatingDepartment, setUpdatingDepartment] = useState(false);
  const [deletingDepartment, setDeletingDepartment] = useState<string | null>(null);
  
  // Form states
  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    parentDepartmentId: ''
  });

  // Search and filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'main' | 'sub'>('all');

  // Filter departments
  const filteredDepartments = departments.filter(dept => {
    const searchMatch = 
      dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.parentDepartmentId?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'main') return dept.parentDepartmentId === null;
    if (filter === 'sub') return dept.parentDepartmentId !== null;
    return searchMatch;
  });

  // Get user count for department (you'll need to implement this based on your data)
//   const getUserCountForDepartment = async (departmentId: string) => {
//     try{
//         const endpoint = ApiConfig.getUserByDepartmentId(departmentId)
//         const response = await getDataHandlerWithToken(endpoint,null,null,true)
//         console.log(response)
//         if(response.length>0){
//             return response.length;
//         }else{
//             return 0
//         }
//     }catch(error){
//         return 0
//     }

//   };

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const resetForm = () => {
    setDepartmentForm({
      name: '',
      parentDepartmentId: ''
    });
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">All Departments ({departments.length})</h3>
          <p className="text-sm text-muted-foreground">Manage organizational departments</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="main">Main Departments</SelectItem>
              <SelectItem value="sub">Sub-departments</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={() => setNewDepartmentOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Department
          </Button>
        </div>
      </div>

      {/* Departments Grid */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Loading departments...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepartments.map((dept) => (
            <Card key={dept._id} className="relative group hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      dept.parentDepartmentId 
                        ? "bg-blue-100 text-blue-700" 
                        : "bg-primary/10 text-primary"
                    )}>
                      {dept.parentDepartmentId ? (
                        <Network className="w-5 h-5" />
                      ) : (
                        <Building className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base">{dept.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Created {formatDate(dept.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={deletingDepartment === dept._id}>
                        {deletingDepartment === dept._id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreHorizontal className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => handleViewOpen(dept)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditOpen(dept)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Department
                      </DropdownMenuItem>
                      
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {/* Department Type Badge */}
                  <div>
                    {dept.parentDepartmentId ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        <Network className="w-3 h-3 mr-1" />
                        Sub-department
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        <Building className="w-3 h-3 mr-1" />
                        Main Department
                      </Badge>
                    )}
                  </div>
                  
                  {/* Parent Department */}
                  {dept.parentDepartmentId && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        Parent Department:
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {dept.parentDepartmentId.name}
                      </Badge>
                    </div>
                  )}
                  
                  {/* Stats */}
                  <div className="flex items-center gap-4 pt-2">
                    {/* <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {getUserCountForDepartment(dept._id)} users
                      </span>
                    </div> */}
                    
                    {/* Sub-departments count */}
                    <div className="flex items-center gap-2">
                      <Network className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">
                        {departments.filter(d => d.parentDepartmentId?._id === dept._id).length} sub-depts
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredDepartments.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No departments found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || filter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first department'}
            </p>
            <Button onClick={() => setNewDepartmentOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Department
            </Button>
          </CardContent>
        </Card>
      )}

      {/* New Department Modal */}
      <Dialog open={newDepartmentOpen} onOpenChange={setNewDepartmentOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New Department</DialogTitle>
            <DialogDescription>
              Add a new department to your organization structure.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Department Name *</Label>
              <Input
                id="name"
                value={departmentForm.name}
                onChange={(e) => setDepartmentForm({...departmentForm, name: e.target.value})}
                placeholder="e.g., Human Resources"
                disabled={addingDepartment}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="parent">Parent Department (Optional)</Label>
              <Select
                value={departmentForm.parentDepartmentId}
                onValueChange={(value) => setDepartmentForm({...departmentForm, parentDepartmentId: value})}
                disabled={addingDepartment}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent department (optional)" />
                </SelectTrigger>
                <SelectContent>
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
              <p className="text-xs text-muted-foreground">
                Leave empty to create a main department. Sub-departments can be created later.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setNewDepartmentOpen(false);
                resetForm();
              }} 
              disabled={addingDepartment}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddDepartment} 
              disabled={addingDepartment || !departmentForm.name}
            >
              {addingDepartment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Department'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Department Modal */}
      <Dialog open={editDepartmentOpen} onOpenChange={setEditDepartmentOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedDepartment && (
            <>
              <DialogHeader>
                <DialogTitle>Edit Department</DialogTitle>
                <DialogDescription>
                  Update department: {selectedDepartment.name}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Department Name *</Label>
                  <Input
                    id="edit-name"
                    value={departmentForm.name}
                    onChange={(e) => setDepartmentForm({...departmentForm, name: e.target.value})}
                    placeholder="e.g., Human Resources"
                    disabled={updatingDepartment}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-parent">Parent Department</Label>
                  <Select
                    value={departmentForm.parentDepartmentId}
                    onValueChange={(value) => setDepartmentForm({...departmentForm, parentDepartmentId: value})}
                    disabled={updatingDepartment}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent department" />
                    </SelectTrigger>
                    <SelectContent>
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
                
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Changing parent department will affect all users and sub-departments in this department.
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEditDepartmentOpen(false);
                    setSelectedDepartment(null);
                    resetForm();
                  }} 
                  disabled={updatingDepartment}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateDepartment} 
                  disabled={updatingDepartment || !departmentForm.name}
                >
                  {updatingDepartment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Department'
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* View Department Modal */}
      <Dialog open={viewDepartmentOpen} onOpenChange={setViewDepartmentOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedDepartment && (
            <>
              <DialogHeader>
                <DialogTitle>Department Details</DialogTitle>
                <DialogDescription>
                  Complete information for {selectedDepartment.name}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-16 h-16 rounded-lg flex items-center justify-center",
                    selectedDepartment.parentDepartmentId 
                      ? "bg-blue-100 text-blue-700" 
                      : "bg-primary/10 text-primary"
                  )}>
                    {selectedDepartment.parentDepartmentId ? (
                      <Network className="w-8 h-8" />
                    ) : (
                      <Building className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedDepartment.name}</h3>
                    <p className="text-muted-foreground">
                      {selectedDepartment.parentDepartmentId ? 'Sub-department' : 'Main Department'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Created</Label>
                    <p className="text-sm">{formatDate(selectedDepartment.createdAt)}</p>
                  </div>
                  <div>
                    <Label>Last Updated</Label>
                    <p className="text-sm">{formatDate(selectedDepartment.updatedAt)}</p>
                  </div>
                  {/* <div>
                    <Label>Total Users</Label>
                    <p className="text-sm">{getUserCountForDepartment(selectedDepartment._id)}</p>
                  </div> */}
                  <div>
                    <Label>Sub-departments</Label>
                    <p className="text-sm">
                      {departments.filter(d => d.parentDepartmentId?._id === selectedDepartment._id).length}
                    </p>
                  </div>
                </div>

                {selectedDepartment.parentDepartmentId && (
                  <div className="border-t pt-4">
                    <Label>Parent Department</Label>
                    <div className="mt-2 p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Building className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium">{selectedDepartment.parentDepartmentId.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Main Department
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-departments List */}
                {departments.filter(d => d.parentDepartmentId?._id === selectedDepartment._id).length > 0 && (
                  <div className="border-t pt-4">
                    <Label>Sub-departments</Label>
                    <div className="mt-2 space-y-2">
                      {departments
                        .filter(d => d.parentDepartmentId?._id === selectedDepartment._id)
                        .map(subDept => (
                          <div key={subDept._id} className="p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                <Network className="h-4 w-4 text-gray-600" />
                              </div>
                              <div>
                                <div className="font-medium">{subDept.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  Created: {formatDate(subDept.createdAt)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewDepartmentOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}