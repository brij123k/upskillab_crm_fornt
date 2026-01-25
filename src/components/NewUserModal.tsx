import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Copy, Loader2, RefreshCw, UserPlus } from 'lucide-react';
import { RoleType } from '@/types/user';

interface NewUserModalProps {
  roles: RoleType[];
  loadingRoles: boolean;
  onSubmit: (data: any) => Promise<void>;
  trigger?: React.ReactNode;
}

export function NewUserModal({ roles, loadingRoles, onSubmit, trigger }: NewUserModalProps) {
  const [open, setOpen] = useState(false);
  const [addingUser, setAddingUser] = useState(false);
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    number: '',
    password: '',
    role: ''
  });

  // Auto-generate password
  useEffect(() => {
    if (form.name && form.number) {
      const firstName = form.name.split(' ')[0] || '';
      const firstFourDigits = form.number.slice(0, 4);
      const generatedPassword = `${firstName}@${firstFourDigits}`;
      setForm(prev => ({ ...prev, password: generatedPassword }));
    }
  }, [form.name, form.number]);

  const copyPasswordToClipboard = () => {
    navigator.clipboard.writeText(form.password);
    // Add toast notification here
  };

  const handleSubmit = async () => {
    setAddingUser(true);
    try {
      await onSubmit(form);
      setForm({ name: '', email: '', number: '', password: '', role: '' });
      setOpen(false);
    } finally {
      setAddingUser(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            New Employee
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new user account.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
              placeholder="John Doe"
              disabled={addingUser}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({...form, email: e.target.value})}
              placeholder="john@company.com"
              disabled={addingUser}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="number">Phone Number</Label>
            <Input
              id="number"
              value={form.number}
              onChange={(e) => setForm({...form, number: e.target.value})}
              placeholder="1234567890"
              disabled={addingUser}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role">Role</Label>
            <Select 
              value={form.role} 
              onValueChange={(value) => setForm({...form, role: value})}
              disabled={addingUser || loadingRoles}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {loadingRoles ? (
                  <div className="py-2 text-center">
                    <Loader2 className="w-4 h-4 mx-auto animate-spin" />
                  </div>
                ) : (
                  roles.map((role) => (
                    <SelectItem key={role._id} value={role._id}>
                      {role.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Generated Password</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={copyPasswordToClipboard}
                disabled={addingUser}
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                id="password"
                type="text"
                value={form.password}
                onChange={(e) => setForm({...form, password: e.target.value})}
                placeholder="Auto-generated password"
                disabled={addingUser}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const firstName = form.name.split(' ')[0] || '';
                  const firstFourDigits = form.number.slice(0, 4);
                  setForm(prev => ({
                    ...prev,
                    password: `${firstName}@${firstFourDigits}`
                  }));
                }}
                disabled={addingUser}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Password is auto-generated from name and phone number
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={addingUser}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={addingUser}>
            {addingUser ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create User'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}