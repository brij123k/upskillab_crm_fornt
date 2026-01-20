import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Building,
  Users,
  Eye,
  Filter,
  Download,
  RefreshCw,
  Loader2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Network,
  Layers,
  FolderTree
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { postDataHandlerWithToken, getDataHandlerWithToken, patchTokenDataHandler } from '@/config/services';
import ApiConfig from '@/config/apiConfig';

interface DepartmentType {
  _id: string;
  name: string;
  parentDepartmentId: {
    _id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface DepartmentForm {
  name: string;
  parentDepartmentId: string;
}

export function DepartmentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [departments, setDepartments] = useState<DepartmentType[]>([]);
  const [filteredDepartments, setFilteredDepartments] = useState<DepartmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());
  
  // Modal states
  const [newDepartmentOpen, setNewDepartmentOpen] = useState(false);
  const [editDepartmentOpen, setEditDepartmentOpen] = useState(false);
  const [viewDepartmentOpen, setViewDepartmentOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentType | null>(null);
  
  // Form states
  const [departmentForm, setDepartmentForm] = useState<DepartmentForm>({
    name: '',
    parentDepartmentId: ''
  });
  
  // Loading states
  const [addingDepartment, setAddingDepartment] = useState(false);
  const [updatingDepartment, setUpdatingDepartment] = useState(false);
  const [deletingDepartment, setDeletingDepartment] = useState<string | null>(null);
  
  // Filters
  const [filter, setFilter] = useState<'all' | 'hasParent' | 'noParent'>('all');

  // Fetch departments
  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await getDataHandlerWithToken("getAllDepartments", null, null);
      if (response) {
        setDepartments(response);
        applyFilters(response, searchQuery, filter);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch departments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const applyFilters = (depts: DepartmentType[], search: string, filterType: string) => {
    let filtered = [...depts];
    
    // Apply search filter
    if (search.trim()) {
      filtered = filtered.filter(dept =>
        dept.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Apply type filter
    switch (filterType) {
      case 'hasParent':
        filtered = filtered.filter(dept => dept.parentDepartmentId !== null);
        break;
      case 'noParent':
        filtered = filtered.filter(dept => dept.parentDepartmentId === null);
        break;
      default:
        // 'all' - no additional filtering
        break;
    }
    
    setFilteredDepartments(filtered);
  };

  // Initialize data
  useEffect(() => {
    fetchDepartments();
  }, []);

  // Apply filters when search or filter changes
  useEffect(() => {
    applyFilters(departments, searchQuery, filter);
  }, [searchQuery, filter, departments]);

  // Add new department
  const handleAddDepartment = async () => {
    try {
      setAddingDepartment(true);
      
      // Prepare data for API
      const dataToSend: any = {
        name: departmentForm.name
      };
      
      // Add parent department if selected
      if (departmentForm.parentDepartmentId && departmentForm.parentDepartmentId !== "") {
        dataToSend.parentDepartmentId = departmentForm.parentDepartmentId;
      }
      
      const response = await postDataHandlerWithToken("addNewDepartments", dataToSend);
      
      toast({
        title: "Success",
        description: response?.message || "Department created successfully",
      });
      
      // Reset form and close modal
      setDepartmentForm({
        name: '',
        parentDepartmentId: ''
      });
      setNewDepartmentOpen(false);
      fetchDepartments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create department",
        variant: "destructive",
      });
    } finally {
      setAddingDepartment(false);
    }
  };

  // Update department
  const handleUpdateDepartment = async () => {
    if (!selectedDepartment) return;
    
    try {
      setUpdatingDepartment(true);
      
      // Prepare data for API
      const dataToSend: any = {
        name: departmentForm.name
      };
      
      // Add parent department if selected
      if (departmentForm.parentDepartmentId && departmentForm.parentDepartmentId !== "") {
        dataToSend.parentDepartmentId = departmentForm.parentDepartmentId;
      } else {
        dataToSend.parentDepartmentId = null;
      }
      
      const endpoint = ApiConfig.updateDepartments(selectedDepartment._id);
      const response = await patchTokenDataHandler(endpoint, dataToSend, true);
      
      toast({
        title: "Success",
        description: response?.message || "Department updated successfully",
      });
      
      // Reset and close
      setEditDepartmentOpen(false);
      setSelectedDepartment(null);
      setDepartmentForm({
        name: '',
        parentDepartmentId: ''
      });
      fetchDepartments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update department",
        variant: "destructive",
      });
    } finally {
      setUpdatingDepartment(false);
    }
  };

  // Delete department
  const handleDeleteDepartment = async (departmentId: string) => {
    if (!confirm("Are you sure you want to delete this department? This action cannot be undone.")) {
      return;
    }
    
    try {
      setDeletingDepartment(departmentId);
      // Note: You need to add a delete endpoint in your API config
      toast({
        title: "Coming Soon",
        description: "Delete functionality will be available soon.",
      });
      fetchDepartments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete department",
        variant: "destructive",
      });
    } finally {
      setDeletingDepartment(null);
    }
  };

  // Get child departments
  const getChildDepartments = (parentId: string) => {
    return departments.filter(dept => 
      dept.parentDepartmentId?._id === parentId
    );
  };

  // Get all descendants for tree view
  const getAllDescendants = (parentId: string): DepartmentType[] => {
    const children = getChildDepartments(parentId);
    let descendants = [...children];
    
    children.forEach(child => {
      descendants = [...descendants, ...getAllDescendants(child._id)];
    });
    
    return descendants;
  };

  // Toggle department expansion
  const toggleExpand = (departmentId: string) => {
    const newExpanded = new Set(expandedDepartments);
    if (newExpanded.has(departmentId)) {
      newExpanded.delete(departmentId);
    } else {
      newExpanded.add(departmentId);
    }
    setExpandedDepartments(newExpanded);
  };

  // Expand all
  const expandAll = () => {
    const allIds = departments.map(dept => dept._id);
    setExpandedDepartments(new Set(allIds));
  };

  // Collapse all
  const collapseAll = () => {
    setExpandedDepartments(new Set());
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setFilter('all');
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get department hierarchy level
  const getHierarchyLevel = (department: DepartmentType): number => {
    let level = 0;
    let current = department;
    
    while (current.parentDepartmentId) {
      const parent = departments.find(d => d._id === current.parentDepartmentId?._id);
      if (!parent) break;
      current = parent;
      level++;
    }
    
    return level;
  };

  // Render department tree
  const renderDepartmentTree = (parentId: string | null = null, level = 0) => {
    const departmentsAtLevel = filteredDepartments.filter(dept => {
      if (parentId === null) {
        return dept.parentDepartmentId === null;
      }
      return dept.parentDepartmentId?._id === parentId;
    });

    if (departmentsAtLevel.length === 0 && level === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No departments found</p>
          <p className="text-sm mt-1">Try adjusting your filters or add a new department</p>
        </div>
      );
    }

    return departmentsAtLevel.map(dept => {
      const hasChildren = getChildDepartments(dept._id).length > 0;
      const isExpanded = expandedDepartments.has(dept._id);
      const childDepartments = getChildDepartments(dept._id);

      return (
        <div key={dept._id}>
          <Card className={cn(
            "mb-2 transition-all duration-200",
            level > 0 && "ml-8 border-l-2 border-l-border"
          )}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {hasChildren && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => toggleExpand(dept._id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  {!hasChildren && (
                    <div className="w-8 flex justify-center">
                      <ChevronRight className="h-4 w-4 opacity-30" />
                    </div>
                  )}
                  
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-lg",
                    level === 0 
                      ? "bg-primary/10 text-primary" 
                      : level === 1 
                      ? "bg-blue-100 text-blue-700"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {level === 0 ? (
                      <Building className="h-5 w-5" />
                    ) : level === 1 ? (
                      <Layers className="h-5 w-5" />
                    ) : (
                      <FolderTree className="h-5 w-5" />
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{dept.name}</h3>
                      {dept.parentDepartmentId && (
                        <Badge variant="outline" className="text-xs">
                          Sub-department
                        </Badge>
                      )}
                      {!dept.parentDepartmentId && (
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                          Main Department
                        </Badge>
                      )}
                    </div>
                    {dept.parentDepartmentId && (
                      <p className="text-sm text-muted-foreground">
                        Parent: {dept.parentDepartmentId.name}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-muted-foreground">
                        Created: {formatDate(dept.createdAt)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {childDepartments.length} sub-departments
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedDepartment(dept);
                      setViewDepartmentOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedDepartment(dept);
                      setDepartmentForm({
                        name: dept.name,
                        parentDepartmentId: dept.parentDepartmentId?._id || ''
                      });
                      setEditDepartmentOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDepartment(dept._id)}
                    disabled={deletingDepartment === dept._id}
                  >
                    {deletingDepartment === dept._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {hasChildren && isExpanded && (
            <div className="pl-4">
              {renderDepartmentTree(dept._id, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Department Management</h1>
          <p className="text-muted-foreground">Manage organizational departments and hierarchy</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={expandAll} variant="outline" size="sm">
            <ChevronDown className="w-4 h-4 mr-2" />
            Expand All
          </Button>
          <Button onClick={collapseAll} variant="outline" size="sm">
            <ChevronUp className="w-4 h-4 mr-2" />
            Collapse All
          </Button>
          <Dialog open={newDepartmentOpen} onOpenChange={setNewDepartmentOpen}>
            <DialogTrigger asChild>
              <Button>
                {addingDepartment ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                New Department
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Department</DialogTitle>
                <DialogDescription>
                  Add a new department to your organization structure.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="department-name">Department Name *</Label>
                  <Input
                    id="department-name"
                    value={departmentForm.name}
                    onChange={(e) => setDepartmentForm({...departmentForm, name: e.target.value})}
                    placeholder="e.g., HR Department"
                    disabled={addingDepartment}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="parent-department">Parent Department (Optional)</Label>
                  <Select
                    value={departmentForm.parentDepartmentId}
                    onValueChange={(value) => setDepartmentForm({...departmentForm, parentDepartmentId: value})}
                    disabled={addingDepartment || loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent department (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No parent (Main Department)</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept._id} value={dept._id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Leave empty to create a main department
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewDepartmentOpen(false)} disabled={addingDepartment}>
                  Cancel
                </Button>
                <Button onClick={handleAddDepartment} disabled={addingDepartment || !departmentForm.name}>
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
        </div>
      </div>

      {/* Filters */}
      {/* <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Filters</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDepartments}
              >
                <Filter className="w-4 h-4 mr-2" />
                Apply
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search departments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Filter by Type</Label>
              <Select
                value={filter}
                onValueChange={(value: any) => setFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="noParent">Main Departments</SelectItem>
                  <SelectItem value="hasParent">Sub-departments</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Statistics</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{departments.length}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">
                    {departments.filter(d => d.parentDepartmentId === null).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Main</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card> */}

      {/* Departments List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Departments ({filteredDepartments.length})
              {loading && (
                <span className="ml-2 text-sm text-muted-foreground">
                  <Loader2 className="w-3 h-3 inline animate-spin mr-1" />
                  Loading...
                </span>
              )}
            </CardTitle>
            {/* <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div> */}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">Loading departments...</p>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {filteredDepartments.length} of {departments.length} departments
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-50">
                    {expandedDepartments.size} expanded
                  </Badge>
                </div>
              </div>
              
              {/* Tree View */}
              <div className="space-y-1">
                {renderDepartmentTree()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
                  <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building className="h-8 w-8 text-primary" />
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
                    <Label>Department ID</Label>
                    <p className="text-sm font-mono">{selectedDepartment._id}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Active
                    </Badge>
                  </div>
                  <div>
                    <Label>Created</Label>
                    <p className="text-sm">{formatDate(selectedDepartment.createdAt)}</p>
                  </div>
                  <div>
                    <Label>Last Updated</Label>
                    <p className="text-sm">{formatDate(selectedDepartment.updatedAt)}</p>
                  </div>
                </div>

                {selectedDepartment.parentDepartmentId && (
                  <div className="border-t pt-4">
                    <Label>Parent Department</Label>
                    <div className="mt-2 p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Layers className="h-5 w-5 text-blue-600" />
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

                <div className="border-t pt-4">
                  <Label>Sub-departments</Label>
                  <div className="mt-2 space-y-2">
                    {getChildDepartments(selectedDepartment._id).length > 0 ? (
                      getChildDepartments(selectedDepartment._id).map(child => (
                        <div key={child._id} className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                              <FolderTree className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <div className="font-medium">{child.name}</div>
                              <div className="text-xs text-muted-foreground">
                                Created: {formatDate(child.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        No sub-departments found
                      </div>
                    )}
                  </div>
                </div>
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

      {/* Edit Department Modal */}
      <Dialog open={editDepartmentOpen} onOpenChange={setEditDepartmentOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedDepartment && (
            <>
              <DialogHeader>
                <DialogTitle>Edit Department</DialogTitle>
                <DialogDescription>
                  Update department information for {selectedDepartment.name}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-department-name">Department Name *</Label>
                  <Input
                    id="edit-department-name"
                    value={departmentForm.name}
                    onChange={(e) => setDepartmentForm({...departmentForm, name: e.target.value})}
                    placeholder="e.g., HR Department"
                    disabled={updatingDepartment}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="edit-parent-department">Parent Department</Label>
                  <Select
                    value={departmentForm.parentDepartmentId}
                    onValueChange={(value) => setDepartmentForm({...departmentForm, parentDepartmentId: value})}
                    disabled={updatingDepartment || loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No parent (Main Department)</SelectItem>
                      {departments
                        .filter(dept => dept._id !== selectedDepartment._id)
                        .map((dept) => (
                          <SelectItem key={dept._id} value={dept._id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Warning: Changing parent department will affect department hierarchy
                  </p>
                </div>
                
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-sm text-yellow-800">
                    <strong>Current Details:</strong>
                    <div className="mt-1">Name: {selectedDepartment.name}</div>
                    <div>Parent: {selectedDepartment.parentDepartmentId?.name || 'None (Main Department)'}</div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setEditDepartmentOpen(false);
                  setSelectedDepartment(null);
                }} disabled={updatingDepartment}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateDepartment} disabled={updatingDepartment || !departmentForm.name}>
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
    </div>
  );
}