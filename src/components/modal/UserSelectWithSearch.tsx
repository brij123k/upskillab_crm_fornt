// components/UserSelectWithSearch.tsx
import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserSelectWithSearchProps {
  value: string;
  onValueChange: (value: string) => void;
  users: Array<{ _id: string; name: string; email: string }>;
  loading?: boolean;
  placeholder?: string;
  disabled?: boolean;
  departmentId?: string;
  userDepartments?: Record<string, string>;
  onDepartmentChange?: (departmentId: string) => void;
  allowEmpty?: boolean;
}

export function UserSelectWithSearch({
  value,
  onValueChange,
  users,
  loading = false,
  placeholder = "Select user",
  disabled = false,
  departmentId = '',
  userDepartments = {},
  onDepartmentChange,
  allowEmpty = true
}: UserSelectWithSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState(users);
  
  // Filter users based on search and department
  useEffect(() => {
    let filtered = users;
    
    // Filter by department if specified
    if (departmentId && Object.keys(userDepartments).length > 0) {
      filtered = filtered.filter(user => 
        userDepartments[user._id] === departmentId
      );
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(query) || 
        user.email.toLowerCase().includes(query)
      );
    }
    
    setFilteredUsers(filtered);
  }, [users, departmentId, userDepartments, searchQuery]);
  
  // When user is selected, update department
  const handleUserSelect = (userId: string) => {
    onValueChange(userId);
    if (userId && userDepartments[userId] && onDepartmentChange) {
      onDepartmentChange(userDepartments[userId]);
    }
  };
  
  // When department changes, clear user if not in department
  useEffect(() => {
    if (value && departmentId && userDepartments[value] !== departmentId) {
      onValueChange('');
    }
  }, [departmentId, value, userDepartments[value]]);

  return (
    <Select
      value={value}
      onValueChange={handleUserSelect}
      disabled={disabled || loading}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {/* Search input */}
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        
        {/* Loading state */}
        {loading ? (
          <div className="py-2 text-center">
            <Loader2 className="w-4 h-4 mx-auto animate-spin" />
          </div>
        ) : (
          <>
            {/* Optional empty option */}
            {allowEmpty && (
              <SelectItem value=" ">
                <span className="text-muted-foreground">Not assigned</span>
              </SelectItem>
            )}
            
            {/* User list */}
            {filteredUsers.length === 0 ? (
              <div className="py-2 text-center text-sm text-muted-foreground">
                {departmentId 
                  ? "No users found in this department" 
                  : "No users found"}
              </div>
            ) : (
              filteredUsers.map((user) => (
                <SelectItem key={user._id} value={user._id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </SelectItem>
              ))
            )}
            
            {/* Department info */}
            {departmentId && filteredUsers.length > 0 && (
              <div className="p-2 text-xs text-muted-foreground border-t">
                Showing users from selected department
              </div>
            )}
          </>
        )}
      </SelectContent>
    </Select>
  );
}