import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { modulesConfig } from '@/config/modulesConfig';

interface Permission {
  module: string;
  actions: string[];
}

interface PermissionsSelectorProps {
  permissions: Permission[];
  onChange: (permissions: Permission[]) => void;
  disabled?: boolean;
  title?: string;
  description?: string;
}

export function PermissionsSelector({ 
  permissions, 
  onChange, 
  disabled = false,
  title = "Permissions",
  description = "Select modules and actions for this role"
}: PermissionsSelectorProps) {
  
  const toggleAction = (moduleId: string, actionId: string) => {
    const updatedPermissions = [...permissions];
    const moduleIndex = updatedPermissions.findIndex(p => p.module === moduleId);
    
    if (moduleIndex === -1) {
      // Add new module with this action
      updatedPermissions.push({ 
        module: moduleId, 
        actions: [actionId] 
      });
    } else {
      const currentActions = updatedPermissions[moduleIndex].actions;
      if (currentActions.includes(actionId)) {
        // Remove action if already selected
        updatedPermissions[moduleIndex].actions = currentActions.filter(a => a !== actionId);
        // Remove module if no actions left
        if (updatedPermissions[moduleIndex].actions.length === 0) {
          updatedPermissions.splice(moduleIndex, 1);
        }
      } else {
        // Add action if not selected
        updatedPermissions[moduleIndex].actions = [...currentActions, actionId];
      }
    }
    
    onChange(updatedPermissions);
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      
      <div className="space-y-3">
        {Object.values(modulesConfig).map((module) => {
          const modulePermission = permissions.find(p => p.module === module.id);
          const selectedActions = modulePermission?.actions || [];
          
          return (
            <Card key={module.id}>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>{module.label}</span>
                  {selectedActions.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedActions.length} selected
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <div className="flex flex-wrap gap-2">
                  {module.actions.map((action) => {
                    const isSelected = selectedActions.includes(action.id);
                    return (
                      <Button
                        key={action.id}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleAction(module.id, action.id)}
                        disabled={disabled}
                        className={cn(
                          isSelected && "bg-primary text-primary-foreground hover:bg-primary/90"
                        )}
                      >
                        {isSelected ? (
                          <Check className="w-3 h-3 mr-1" />
                        ) : (
                          <Square className="w-3 h-3 mr-1" />
                        )}
                        {action.label}
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}