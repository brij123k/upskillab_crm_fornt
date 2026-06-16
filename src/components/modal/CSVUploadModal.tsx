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
  pools: Array<{ _id: string; name: string }>;
  onUploadSuccess: () => void;
}

interface CSVLead {
  name: string;
  phone: string;
  email: string;
  city: string;
  state: string;
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
  pools,
  onUploadSuccess
}: CSVUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedLeads, setParsedLeads] = useState<CSVLead[]>([]);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [bulkReason, setBulkReason] = useState<string>('');
  const [selectedPoolId, setSelectedPoolId] = useState<string>('');
  const [currentError, setCurrentError] = useState<string>('');

  const downloadCSVTemplate = () => {
    const headers = ['name', 'phone', 'email', 'city', 'state', 'source', 'source_campaign'];
    const example = ['John Doe', '1234567890', 'john@example.com', 'Lucknow', 'Uttar Pradesh', 'manual', 'Summer Campaign'];
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

        const leads: CSVLead[] = [];
        const getCellValue = (values: string[], headerName: string, fallback = '') => {
          const index = headers.indexOf(headerName);
          return index >= 0 ? (values[index] ?? '').trim() || fallback : fallback;
        };

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i]?.trim()) continue;
          
          const values = lines[i].split(',').map(v => v.trim());
          const lead: CSVLead = {
            name: getCellValue(values, 'name'),
            phone: getCellValue(values, 'phone'),
            email: getCellValue(values, 'email'),
            city: getCellValue(values, 'city', 'N/A'),
            state: getCellValue(values, 'state', 'N/A'),
            source: getCellValue(values, 'source', 'manual').toLowerCase() || 'manual',
            source_campaign: getCellValue(values, 'source_campaign'),
            isValid: true,
            errors: []
          };

          const errors: string[] = [];
          if (!lead.name) errors.push('Name is required');
          if (!lead.phone) errors.push('Phone is required');
          if (!lead.email) errors.push('Email is required');
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

    if (!selectedPoolId.trim()) {
      toast({
        title: 'Pool Required',
        description: 'Please select a pool before uploading leads',
        variant: "destructive",
      });
      return;
    }

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
      let successCount = 0;
      let errorCount = 0;

      for (const lead of validLeads) {
        try {
          const dataToSend: any = {
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            city: lead.city || 'N/A',
            state: lead.state || 'N/A',
            source: (lead.source).toLowerCase() || 'manual',
            stageId: '696cadcadcbcf508621922e6',
            source_campaign: lead.source_campaign || undefined,
            assignedTo: selectedUserId || lead.assignedTo || undefined,
            poolId : selectedPoolId ? selectedPoolId : undefined,
            reason: selectedUserId ? bulkReason : (lead.reason || undefined)
          };

          Object.keys(dataToSend).forEach(key => {
            if (dataToSend[key] === undefined || dataToSend[key] === '') {
              delete dataToSend[key];
            }
          });

          await postDataHandlerWithToken('createNewLead', dataToSend);
          successCount++;
        } catch (error: any) {
          errorCount++;
          console.error('Failed to upload lead:', error.message);
          setCurrentError(error.message);
        }
      }

      toast({
        title: 'Upload Complete',
        description: `Successfully uploaded ${successCount} leads. ${errorCount} failed`,
      });

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] rounded-2xl border-slate-200 p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-xl font-bold text-slate-800">Upload CSV File</DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Upload a CSV file containing lead data. Make sure your CSV follows the required format.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-6">
            {/* File Upload Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">1. Download Template</h3>
                  <p className="text-sm text-slate-500">Download our CSV template to ensure proper formatting</p>
                </div>
                <Button variant="outline" onClick={downloadCSVTemplate} className="rounded-xl border-slate-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200">
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-slate-800">2. Upload CSV File</h3>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50/30">
                  {file ? (
                    <div className="space-y-2">
                      <FileSpreadsheet className="w-12 h-12 mx-auto text-orange-500" />
                      <p className="font-medium text-slate-800">{file.name}</p>
                      <p className="text-sm text-slate-500">{parsedLeads.length} leads found</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFile(null);
                          setParsedLeads([]);
                        }}
                        disabled={parsing || uploading}
                        className="rounded-lg"
                      >
                        Change File
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                      <Label htmlFor="csv-upload" className="cursor-pointer">
                        <div className="text-center">
                          <p className="text-sm font-medium text-slate-700 mb-1">Click to upload CSV file</p>
                          <p className="text-xs text-slate-400">Supports .csv files with required columns</p>
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
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Parsing CSV file...
                  </div>
                )}
              </div>

              {/* Pool & Assignment Section */}
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-800">3. Select Pool and Optional Assignment</h3>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Assign To Pool *</Label>
                    <SearchableDropdown
                      options={[
                        ...pools.map(pool => ({
                          value: pool._id,
                          label: pool.name,
                        }))
                      ]}
                      value={selectedPoolId}
                      onValueChange={setSelectedPoolId}
                      placeholder="Select pool for all leads"
                      searchPlaceholder="Search pool by name..."
                      emptyMessage="No pools found"
                      disabled={uploading}
                      allowClear
                      triggerClassName="rounded-xl border-slate-200"
                    />
                    <p className="text-xs text-slate-400">Pool selection is required for upload.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Assign To User (Optional)</Label>
                    <SearchableDropdown
                      options={[
                        { value: "", label: "Not assigned" },
                        ...users.map(user => ({
                          value: user._id,
                          label: user.name,
                          role: user.role?.name,
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
                      triggerClassName="rounded-xl border-slate-200"
                    />
                  </div>

                  {/* Bulk Reason */}
                  {selectedUserId && selectedUserId.trim() !== "" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="bulk-reason" className="text-sm font-medium text-slate-700">
                        Reason for Bulk Assignment *
                      </Label>
                      <textarea
                        id="bulk-reason"
                        value={bulkReason}
                        onChange={(e) => setBulkReason(e.target.value)}
                        placeholder="Enter reason for assigning all leads..."
                        className="w-full min-h-[80px] p-3 border border-slate-200 rounded-xl text-sm resize-y focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                        disabled={uploading}
                        rows={3}
                      />
                      <p className="text-xs text-slate-400">
                        This reason will be recorded in the lead history for all assigned leads.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Preview Section */}
              {parsedLeads.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800">4. Preview & Validate</h3>
                    <Badge className={parsedLeads.every(l => l.isValid) ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200" : "bg-red-100 text-red-700 hover:bg-red-100 border-red-200"}>
                      {parsedLeads.filter(l => l.isValid).length} / {parsedLeads.length} Valid
                    </Badge>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50">
                            <TableHead className="text-xs font-semibold text-slate-500">Status</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-500">Name</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-500">Phone</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-500">Email</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-500">City</TableHead>
                            <TableHead className="text-xs font-semibold text-slate-500">State</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parsedLeads.slice(0, 10).map((lead, index) => (
                            <TableRow key={index} className={!lead.isValid ? "bg-red-50/50" : "hover:bg-slate-50"}>
                              <TableCell>
                                {lead.isValid ? (
                                  <Check className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-red-600" />
                                )}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <div className="font-medium text-sm text-slate-800">{lead.name}</div>
                                  {lead.errors.length > 0 && (
                                    <div className="text-xs text-red-600 mt-0.5">
                                      {lead.errors[0]}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-slate-600">{lead.phone}</TableCell>
                              <TableCell className="text-sm text-slate-600">{lead.email}</TableCell>
                              <TableCell className="text-sm text-slate-600">{lead.city || 'N/A'}</TableCell>
                              <TableCell className="text-sm text-slate-600">{lead.state || 'N/A'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {parsedLeads.length > 10 && (
                      <div className="p-2 text-center text-sm text-slate-500 border-t border-slate-200 bg-slate-50">
                        Showing 10 of {parsedLeads.length} leads
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white">
          <div className="flex gap-3 w-full sm:w-auto">
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
              className="flex-1 sm:flex-none rounded-xl border-slate-200 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || parsedLeads.length === 0 || uploading || parsing}
              className="flex-1 sm:flex-none rounded-xl bg-orange-500 hover:bg-orange-600 text-white"
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
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Global style for thin scrollbar */}
      <style>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </Dialog>
  );
}