import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, FileSpreadsheet, Download, Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { postDataHandlerWithToken } from '@/config/services';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';

interface CSVUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: Array<{ _id: string; name: string; email: string; role?: { name: string }; employeeId?: string }>;
  onUploadSuccess: () => void;
}

interface CSVLead {
  name: string;
  phone: string;
  email: string;
  source: string;
  source_campaign?: string;
  assignedTo?: string;
  reason?: string;
  isValid: boolean;
  errors: string[];
}

export function CSVUploadModal({
  open,
  onOpenChange,
  users,
  onUploadSuccess
}: CSVUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedLeads, setParsedLeads] = useState<CSVLead[]>([]);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [bulkReason, setBulkReason] = useState<string>('');

  const downloadCSVTemplate = () => {
    const headers = ['name', 'phone', 'email', 'source', 'source_campaign'];
    const example = ['John Doe', '1234567890', 'john@example.com', 'manual', 'Summer Campaign'];
    const csvContent = [headers, example].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lead_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith('.csv')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload a CSV file',
        variant: 'destructive',
      });
      return;
    }

    setFile(uploadedFile);
    parseCSVFile(uploadedFile);
  };

  const parseCSVFile = (csvFile: File) => {
    setParsing(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const lines = content.split('\n');
        const headers = lines[0]?.split(',').map(h => h.trim().toLowerCase());
        
        if (!headers) {
          toast({
            title: 'Invalid CSV',
            description: 'CSV file is empty or incorrectly formatted',
            variant: 'destructive',
          });
          return;
        }

        // Validate required headers
        const requiredHeaders = ['name', 'phone', 'email'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          toast({
            title: 'Invalid CSV Format',
            description: `Missing required columns: ${missingHeaders.join(', ')}`,
            variant: 'destructive',
          });
          return;
        }

        // Parse data rows
        const leads: CSVLead[] = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i]?.trim()) continue;
          
          const values = lines[i].split(',').map(v => v.trim());
          const lead: CSVLead = {
            name: values[headers.indexOf('name')] || '',
            phone: values[headers.indexOf('phone')] || '',
            email: values[headers.indexOf('email')] || '',
            source: (values[headers.indexOf('source')]).toLowerCase() || 'manual',
            source_campaign: values[headers.indexOf('source_campaign')] || '',
            isValid: true,
            errors: []
          };

          // Validate lead
          const errors: string[] = [];
          if (!lead.name) errors.push('Name is required');
          if (!lead.phone) errors.push('Phone is required');
          if (!lead.email) errors.push('Email is required');
          
          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (lead.email && !emailRegex.test(lead.email)) {
            errors.push('Invalid email format');
          }

          lead.isValid = errors.length === 0;
          lead.errors = errors;
          leads.push(lead);
        }

        setParsedLeads(leads);
        toast({
          title: 'CSV Parsed',
          description: `Successfully parsed ${leads.length} leads`,
        });
      } catch (error) {
        toast({
          title: 'Parse Error',
          description: 'Failed to parse CSV file',
          variant: 'destructive',
        });
      } finally {
        setParsing(false);
      }
    };

    reader.onerror = () => {
      toast({
        title: 'File Error',
        description: 'Failed to read CSV file',
        variant: 'destructive',
      });
      setParsing(false);
    };

    reader.readAsText(csvFile);
  };

  const handleUpload = async () => {
    if (parsedLeads.length === 0) {
      toast({
        title: 'No Data',
        description: 'No valid leads to upload',
        variant: "destructive",
      });
      return;
    }

    const validLeads = parsedLeads.filter(lead => lead.isValid);
    if (validLeads.length === 0) {
      toast({
        title: 'Invalid Data',
        description: 'No valid leads found in CSV',
        variant: "destructive",
      });
      return;
    }

    // Validate bulk assignment
    if (selectedUserId && selectedUserId.trim() !== "" && !bulkReason.trim()) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for bulk assignment',
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Process leads one by one
      let successCount = 0;
      let errorCount = 0;

      for (const lead of validLeads) {
        try {
          const dataToSend: any = {
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            source: (lead.source).toLowerCase() || 'manual',
            stageId: '696cadcadcbcf508621922e6',
            source_campaign: lead.source_campaign || undefined,
            assignedTo: selectedUserId || lead.assignedTo || undefined,
            reason: selectedUserId ? bulkReason : (lead.reason || undefined)
          };

          // Remove undefined values
          Object.keys(dataToSend).forEach(key => {
            if (dataToSend[key] === undefined || dataToSend[key] === '') {
              delete dataToSend[key];
            }
          });

          await postDataHandlerWithToken('createNewLead', dataToSend);
          successCount++;
        } catch (error) {
          errorCount++;
          console.error('Failed to upload lead:', error);
        }
      }

      toast({
        title: 'Upload Complete',
        description: `Successfully uploaded ${successCount} leads. ${errorCount} failed.`,
      });

      // Reset and close
      setFile(null);
      setParsedLeads([]);
      setSelectedUserId('');
      setBulkReason('');
      onOpenChange(false);
      onUploadSuccess();
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload leads',
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getUserName = (id: string) => {
    return users.find(u => u._id === id)?.name || id;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload CSV File</DialogTitle>
          <DialogDescription>
            Upload a CSV file containing lead data. Make sure your CSV follows the required format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* File Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">1. Download Template</h3>
                <p className="text-sm text-muted-foreground">
                  Download our CSV template to ensure proper formatting
                </p>
              </div>
              <Button variant="outline" onClick={downloadCSVTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">2. Upload CSV File</h3>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                {file ? (
                  <div className="space-y-2">
                    <FileSpreadsheet className="w-12 h-12 mx-auto text-primary" />
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {parsedLeads.length} leads found
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFile(null);
                        setParsedLeads([]);
                      }}
                      disabled={parsing || uploading}
                    >
                      Change File
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <Label htmlFor="csv-upload" className="cursor-pointer">
                      <div className="text-center">
                        <p className="text-sm font-medium mb-1">Click to upload CSV file</p>
                        <p className="text-xs text-muted-foreground">
                          Supports .csv files with required columns
                        </p>
                      </div>
                      <Input
                        id="csv-upload"
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={parsing}
                      />
                    </Label>
                  </>
                )}
              </div>
              {parsing && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Parsing CSV file...
                </div>
              )}
            </div>

            {/* Bulk Assignment (Optional) */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">3. Optional: Assign All Leads</h3>
                <div className="space-y-2">
                  <Label>Assign To (Optional)</Label>
                  <SearchableDropdown
                    options={[
                      { value: "", label: "Not assigned" },
                      ...users.map(user => ({
                        value: user._id,
                        label: user.name,
                        role: user.role?.name || user.role,
                        empId: user.employeeId,
                        email: user.email
                      }))
                    ]}
                    value={selectedUserId}
                    onValueChange={setSelectedUserId}
                    placeholder="Select user to assign all leads"
                    searchPlaceholder="Search by name, email, or role..."
                    emptyMessage="No users found"
                    disabled={uploading}
                    allowClear
                    onClear={() => {
                      setSelectedUserId("");
                      setBulkReason("");
                    }}
                    triggerClassName="h-10 text-sm"
                    contentClassName="w-full max-w-[var(--radix-popover-trigger-width)]"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This will assign all leads to the selected user
                </p>
              </div>

              {/* Bulk Reason Field - Only shown when user is selected */}
              {selectedUserId && selectedUserId.trim() !== "" && (
                <div className="space-y-2">
                  <Label htmlFor="bulk-reason">
                    Reason for Bulk Assignment *
                    <span className="text-xs text-muted-foreground ml-1">
                      (Required when assigning all leads)
                    </span>
                  </Label>
                  <textarea
                    id="bulk-reason"
                    value={bulkReason}
                    onChange={(e) => setBulkReason(e.target.value)}
                    placeholder="Enter reason for assigning all leads..."
                    className="w-full min-h-[60px] p-2 border rounded-md text-sm resize-y focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={uploading}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    This reason will be recorded in the lead history for all assigned leads.
                  </p>
                </div>
              )}
            </div>

            {/* Preview Section */}
            {parsedLeads.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">4. Preview & Validate</h3>
                  <Badge variant={parsedLeads.every(l => l.isValid) ? "default" : "destructive"}>
                    {parsedLeads.filter(l => l.isValid).length} / {parsedLeads.length} Valid
                  </Badge>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Email</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedLeads.slice(0, 10).map((lead, index) => (
                          <TableRow key={index} className={!lead.isValid ? "bg-red-50" : ""}>
                            <TableCell>
                              {lead.isValid ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-red-600" />
                              )}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{lead.name}</div>
                                {lead.errors.length > 0 && (
                                  <div className="text-xs text-red-600">
                                    {lead.errors[0]}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{lead.phone}</TableCell>
                            <TableCell>{lead.email}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {parsedLeads.length > 10 && (
                    <div className="p-2 text-center text-sm text-muted-foreground border-t">
                      Showing 10 of {parsedLeads.length} leads
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              onOpenChange(false);
              setFile(null);
              setParsedLeads([]);
              setSelectedUserId('');
              setBulkReason('');
            }} 
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!file || parsedLeads.length === 0 || uploading || parsing}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload Now'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}