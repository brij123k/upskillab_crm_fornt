// components/whatsapp/SendWhatsAppModal.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Loader2,
  Users,
  FileText,
  Image,
  File,
  Phone,
  MessageSquare,
  Check,
  AlertTriangle,
  Send,
  Smartphone,
  Variable,
  X,
  CheckCircle,
  XCircle,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { LeadType } from '@/types/lead';
import { getDataHandlerWithToken, postDataHandlerWithToken, postDataHandlerWithTokenFormData } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { connectCallSocket } from '@/config/callSocket';

// ==================== TYPES ====================
interface WhatsAppComponent {
  type: 'BODY' | 'HEADER' | 'BUTTONS' | 'FOOTER';
  text?: string;
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  example?: {
    body_text?: string[][];
    header_text?: string[];
    header_handle?: string[];
  };
}

interface WhatsAppTemplate {
  _id?: string;
  wabaId: string;
  name: string;
  category: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'PAUSED';
  language: string;
  components: WhatsAppComponent[];
  mediaUrl?: string;
  templateId: string;
  metaTemplateId: string;
  createdAt: string;
}

interface VariableConfig {
  dynamic: boolean;
  value: string;
}

interface SendWhatsAppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLeads: LeadType[];
  onSendSuccess: (campaignId: string) => void;
}

// ==================== CONSTANTS ====================
const WHATSAPP_NUMBERS = [
  { 
    value: '+919319427070', 
    label: 'Enroll +91 93194 27070',
    type: 'enroll'
  },
  { 
    value: '+919319426464', 
    label: 'Marketing +91 93194 26464',
    type: 'marketing'
  },
];

const LEAD_FIELDS = [
  { value: 'name', label: 'Name' },
  { value: 'phone', label: 'Phone' },
  { value: 'email', label: 'Email' },
  { value: 'city', label: 'City' },
  { value: 'state', label: 'State' },
  { value: 'leadId', label: 'Lead ID' },
  { value: 'source', label: 'Source' },
  { value: 'status', label: 'Status' },
  { value: 'healthScore', label: 'Health Score' },
  { value: 'assignedTo.name', label: 'Assigned To' },
  { value: 'assignedTo.email', label: 'Assigned Email' },
  { value: 'stageId.name', label: 'Stage' },
  { value: 'poolId.name', label: 'Pool' },
  { value: 'source_campaign', label: 'Campaign' },
  { value: 'createdAt', label: 'Created At' },
];

// ==================== COMPONENT ====================
export function SendWhatsAppModal({
  open,
  onOpenChange,
  selectedLeads,
  onSendSuccess,
}: SendWhatsAppModalProps) {
  // State
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [fromNumber, setFromNumber] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [variableConfigs, setVariableConfigs] = useState<VariableConfig[]>([]);
  const [headerConfig, setHeaderConfig] = useState<{
    type: 'text' | 'image' | 'document';
    text?: string;
    mediaUrl?: string;
    filename?: string;
    file?: File;
  } | null>(null);
  const [headerVariables, setHeaderVariables] = useState<VariableConfig[]>([]);
  const [sending, setSending] = useState(false);
  const [previewLead] = useState<LeadType | null>(selectedLeads[0] || null);

  // Preview modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Progress state
  const [showProgress, setShowProgress] = useState(false);
  const [campaignId, setCampaignId] = useState('');
  const [progress, setProgress] = useState<{
    status: 'PROCESSING' | 'COMPLETED' | 'PARTIAL' | 'FAILED';
    totalRecipients: number;
    sentCount: number;
    failedCount: number;
    pendingCount: number;
    currentLead?: {
      leadId: string;
      name: string;
      phone: string;
    };
    result?: 'SENT' | 'FAILED';
    error?: string;
    completedAt?: string;
  } | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Socket ref
  const socketRef = useRef<any>(null);
  const campaignIdRef = useRef<string>('');

  // Load templates
  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setSelectedTemplate(null);
      setVariableConfigs([]);
      setHeaderConfig(null);
      setHeaderVariables([]);
      setFromNumber('');
      setShowProgress(false);
      setProgress(null);
      setIsCompleted(false);
      setCampaignId('');
      campaignIdRef.current = '';
      setShowPreviewModal(false);
    }
  }, [open]);

  // Cleanup socket
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.off('campaign-progress');
        socketRef.current.off('campaign-completed');
        socketRef.current.off('campaign-failed');
      }
    };
  }, []);

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const response = await getDataHandlerWithToken(
        ApiConfig.getWhatsappTemplates,
        null,
        null,
        true
      );
      const approved = (response.data || []).filter(
        (t: WhatsAppTemplate) => t.status === 'APPROVED'
      );
      setTemplates(approved);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load WhatsApp templates',
        variant: 'destructive',
      });
    } finally {
      setLoadingTemplates(false);
    }
  };

  const getFilteredTemplates = () => {
    const selectedNumber = WHATSAPP_NUMBERS.find(n => n.value === fromNumber);
    if (!selectedNumber) return templates;
    if (selectedNumber.type === 'enroll') {
      return templates.filter(t => t.category === 'utility');
    }
    if (selectedNumber.type === 'marketing') {
      return templates.filter(t => t.category === 'marketing');
    }
    return templates;
  };

  const filteredTemplates = getFilteredTemplates();

  const handleTemplateSelect = useCallback((templateId: string) => {
    const template = filteredTemplates.find(t => t.templateId === templateId);
    if (!template) return;

    setSelectedTemplate(template);
    setVariableConfigs([]);
    setHeaderConfig(null);
    setHeaderVariables([]);

    // Parse BODY variables
    const bodyComp = template.components.find(c => c.type === 'BODY');
    if (bodyComp?.text) {
      const matches = bodyComp.text.match(/{{(\d+)}}/g);
      if (matches) {
        const count = matches.length;
        const configs: VariableConfig[] = Array.from({ length: count }, () => ({
          dynamic: true,
          value: '',
        }));

        if (bodyComp.example?.body_text?.[0]) {
          const names = bodyComp.example.body_text[0];
          names.forEach((name, idx) => {
            const matched = LEAD_FIELDS.find(f => f.value === name);
            if (matched && idx < configs.length) {
              configs[idx] = { dynamic: true, value: matched.value };
            }
          });
        }
        setVariableConfigs(configs);
      }
    }

    // Parse HEADER
    const headerComp = template.components.find(c => c.type === 'HEADER');
    if (headerComp) {
      setHeaderConfig({
        type: (headerComp.format?.toLowerCase() as any) || 'text',
        text: headerComp.text || '',
        mediaUrl: template.mediaUrl || '',
      });

      if (headerComp.text) {
        const matches = headerComp.text.match(/{{(\d+)}}/g);
        if (matches) {
          setHeaderVariables(
            matches.map(() => ({ dynamic: true, value: '' }))
          );
        }
      }
    }
  }, [filteredTemplates]);

  // Helper functions
  const getVariableCount = (t: WhatsAppTemplate) => {
    const body = t.components.find(c => c.type === 'BODY');
    return body?.text?.match(/{{(\d+)}}/g)?.length || 0;
  };

  const getHeaderInfo = (t: WhatsAppTemplate) => {
    const h = t.components.find(c => c.type === 'HEADER');
    return h?.format || null;
  };

  const isVariablesConfigured = () => variableConfigs.every(c => c.value);
  const isHeaderConfigured = () => headerVariables.every(c => c.value);

  const canSend = fromNumber &&
    selectedTemplate &&
    isVariablesConfigured() &&
    isHeaderConfigured() &&
    selectedLeads.length > 0 &&
    !sending;

  // Handlers
  const handleVariableChange = (index: number, config: VariableConfig) => {
    const newConfigs = [...variableConfigs];
    newConfigs[index] = config;
    setVariableConfigs(newConfigs);
  };

  const handleHeaderVariableChange = (index: number, config: VariableConfig) => {
    const newConfigs = [...headerVariables];
    newConfigs[index] = config;
    setHeaderVariables(newConfigs);
  };

  const handleHeaderFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', headerConfig?.type || 'image');

      const response = await postDataHandlerWithTokenFormData(
        ApiConfig.uploadImage,
        formData,
        true
      );

      setHeaderConfig(prev => ({
        ...prev!,
        mediaUrl: response.data.url,
        file,
        filename: response.data.filename || file.name,
      }));

      toast({ title: 'Success', description: 'File uploaded successfully' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to upload file',
        variant: 'destructive',
      });
    }
  };

  // Socket event handlers
  const handleCampaignProgress = useCallback((data: any) => {
    if (data.campaignId !== campaignIdRef.current) return;

    setProgress({
      status: data.status,
      totalRecipients: data.totalRecipients,
      sentCount: data.sentCount || 0,
      failedCount: data.failedCount || 0,
      pendingCount: data.pendingCount || 0,
      currentLead: data.currentLead,
      result: data.result,
      error: data.error,
    });

    if (data.status === 'COMPLETED' || data.status === 'PARTIAL' || data.status === 'FAILED') {
      setIsCompleted(true);
    }
  }, []);

  const handleCampaignCompleted = useCallback((data: any) => {
    if (data.campaignId !== campaignIdRef.current) return;

    setProgress(prev => ({
      status: data.status,
      totalRecipients: data.totalRecipients || prev?.totalRecipients || 0,
      sentCount: data.sentCount || 0,
      failedCount: data.failedCount || 0,
      pendingCount: data.pendingCount || 0,
      completedAt: data.completedAt,
    }));
    setIsCompleted(true);
  }, []);

  const setupSocketListeners = useCallback((campaignId: string) => {
    campaignIdRef.current = campaignId;

    const socket = connectCallSocket({
      onCallCompleted: (data: any) => {
        if (data.campaignId === campaignIdRef.current) {
          handleCampaignProgress(data);
        }
      },
      onCallBackReceived: (data: any) => {
        console.log('📞 Callback received:', data);
      },
      onUnknownCall: (data: any) => {
        console.log('❓ Unknown call:', data);
      },
    });

    socketRef.current = socket;

    if (socket) {
      socket.off('campaign-progress');
      socket.off('campaign-completed');
      socket.off('campaign-failed');

      socket.on('campaign-progress', handleCampaignProgress);
      socket.on('campaign-completed', handleCampaignCompleted);
      socket.on('campaign-failed', handleCampaignCompleted);
    }
  }, [handleCampaignProgress, handleCampaignCompleted]);

  const handleSend = async () => {
    if (!fromNumber) {
      toast({ title: 'Error', description: 'Please select a WhatsApp number', variant: 'destructive' });
      return;
    }
    if (!selectedTemplate) {
      toast({ title: 'Error', description: 'Please select a template', variant: 'destructive' });
      return;
    }
    if (variableConfigs.some(c => !c.value)) {
      toast({ title: 'Error', description: 'Please configure all template variables', variant: 'destructive' });
      return;
    }
    if (headerVariables.some(c => !c.value)) {
      toast({ title: 'Error', description: 'Please configure all header variables', variant: 'destructive' });
      return;
    }

    if (!confirm(`Send this WhatsApp template to ${selectedLeads.length} selected leads?`)) {
      return;
    }

    try {
      setSending(true);
      const requestData: any = {
        from: fromNumber,
        templateName: selectedTemplate.name,
        leadIds: selectedLeads.map(lead => lead._id),
        variables: variableConfigs,
      };

      if (headerConfig) {
        requestData.header = { type: headerConfig.type };
        if (headerConfig.type === 'text' && headerConfig.text) {
          requestData.header.text = headerConfig.text;
        }
        if (headerConfig.type !== 'text' && headerConfig.mediaUrl) {
          requestData.header.link = headerConfig.mediaUrl;
          if (headerConfig.filename) requestData.header.filename = headerConfig.filename;
        }
        if (headerVariables.length > 0) requestData.headerVariables = headerVariables;
      }

      const response = await postDataHandlerWithToken(ApiConfig.bulkWhatsappSend, requestData, true);
      
      toast({ title: 'Success', description: response.message || 'Campaign created successfully' });
      
      const newCampaignId = response.campaignId;
      setCampaignId(newCampaignId);
      campaignIdRef.current = newCampaignId;
      
      setupSocketListeners(newCampaignId);
      
      setShowProgress(true);
      setProgress({
        status: 'PROCESSING',
        totalRecipients: selectedLeads.length,
        sentCount: 0,
        failedCount: 0,
        pendingCount: selectedLeads.length,
      });
      setIsCompleted(false);
      
      onSendSuccess(newCampaignId);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send WhatsApp messages',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const formatVarName = (name: string) => {
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .trim()
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

const renderPreviewContent = () => {
  if (!selectedTemplate) {
    return null;
  }
  
  const bodyComp = selectedTemplate.components.find(c => c.type === 'BODY');
  
  if (!bodyComp?.text) {
    return null;
  }
  
  
  let renderedText = bodyComp.text;
  
  // Check for variables in the text
  const variableMatches = renderedText.match(/{{(\d+)}}/g);
  
  // Only replace variables if there are any
  if (variableConfigs.length > 0) {
    
    variableConfigs.forEach((config, idx) => {
      const placeholder = `{{${idx + 1}}}`;
      
      let value = '';
      if (config.dynamic && config.value) {
        const parts = config.value.split('.');
        
        let current: any = previewLead;
        for (const p of parts) {
          if (current && typeof current === 'object') {
            current = current[p];
          } else {
            current = undefined;
            break;
          }
        }
        value = current !== undefined && current !== null ? String(current) : `[${config.value}]`;
      } else if (!config.dynamic && config.value) {
        value = config.value;
      } else {
        value = `[Var ${idx + 1}]`;
      }
      
      // Replace the placeholder
      const before = renderedText;
      renderedText = renderedText.replace(new RegExp(placeholder, 'g'), value);
      if (before !== renderedText) {
        console.log(`Replaced ${placeholder} with "${value}"`);
      } else {
        console.log(`⚠️ ${placeholder} not found in text`);
      }
    });
  } else {
    console.log('No variableConfigs, returning raw text');
  }
  
  
  return renderedText;
};

  const getProgressPercentage = () => {
    if (!progress || progress.totalRecipients === 0) return 0;
    const completed = (progress.sentCount || 0) + (progress.failedCount || 0);
    return Math.round((completed / progress.totalRecipients) * 100);
  };

  const progressPercent = getProgressPercentage();

  return (
    <>
      {/* Main Modal */}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] p-0 overflow-hidden rounded-2xl border-slate-200 flex flex-col bg-white">
          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-orange-500" />
                  Send WhatsApp Message
                </DialogTitle>
                <div className="text-sm text-slate-500 flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <strong>{selectedLeads.length}</strong> leads selected
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    Template: <strong>{selectedTemplate?.name || 'Not selected'}</strong>
                  </span>
                </div>
              </div>
              {selectedTemplate && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreviewModal(true)}
                  className="rounded-xl border-slate-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              )}
            </div>
          </DialogHeader>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
            {showProgress ? (
              // ===== PROGRESS VIEW =====
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                    Sending Messages
                  </h3>
                  <Badge className={cn(
                    progress?.status === 'PROCESSING' && 'bg-blue-100 text-blue-700 border-blue-200',
                    progress?.status === 'COMPLETED' && 'bg-green-100 text-green-700 border-green-200',
                    progress?.status === 'PARTIAL' && 'bg-amber-100 text-amber-700 border-amber-200',
                    progress?.status === 'FAILED' && 'bg-red-100 text-red-700 border-red-200',
                  )}>
                    {progress?.status === 'PROCESSING' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                    {progress?.status === 'COMPLETED' && <Check className="w-3 h-3 mr-1" />}
                    {progress?.status === 'PARTIAL' && <AlertTriangle className="w-3 h-3 mr-1" />}
                    {progress?.status === 'FAILED' && <XCircle className="w-3 h-3 mr-1" />}
                    {progress?.status || 'Processing...'}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-200">
                    <div className="text-2xl font-bold text-slate-700">{progress?.totalRecipients || 0}</div>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">Total</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
                    <div className="text-2xl font-bold text-green-600">{progress?.sentCount || 0}</div>
                    <div className="text-xs text-green-600 font-medium mt-0.5">Sent</div>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4 text-center border border-red-200">
                    <div className="text-2xl font-bold text-red-600">{progress?.failedCount || 0}</div>
                    <div className="text-xs text-red-600 font-medium mt-0.5">Failed</div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 font-medium">Progress</span>
                    <span className="font-bold text-slate-700">{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-700 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Started</span>
                    <span>{progress?.pendingCount || 0} remaining</span>
                  </div>
                </div>

                {progress?.currentLead && (
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{progress.currentLead.name}</p>
                        <p className="text-xs text-slate-500">{progress.currentLead.phone}</p>
                      </div>
                      <Badge className={cn(
                        progress.result === 'SENT' && 'bg-green-100 text-green-700 border-green-200',
                        progress.result === 'FAILED' && 'bg-red-100 text-red-700 border-red-200',
                        !progress.result && 'bg-slate-100 text-slate-600 border-slate-200'
                      )}>
                        {progress.result === 'SENT' && <Check className="w-3 h-3 mr-1" />}
                        {progress.result === 'FAILED' && <XCircle className="w-3 h-3 mr-1" />}
                        {!progress.result && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                        {progress.result || 'Sending...'}
                      </Badge>
                    </div>
                    {progress.error && (
                      <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg">
                        {progress.error}
                      </div>
                    )}
                  </div>
                )}

                {isCompleted && (
                  <div className={cn(
                    "p-4 rounded-xl border-2",
                    progress?.status === 'COMPLETED' && "border-green-200 bg-green-50",
                    progress?.status === 'PARTIAL' && "border-amber-200 bg-amber-50",
                    progress?.status === 'FAILED' && "border-red-200 bg-red-50",
                  )}>
                    <div className="flex items-start gap-3">
                      {progress?.status === 'COMPLETED' && <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />}
                      {progress?.status === 'PARTIAL' && <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />}
                      {progress?.status === 'FAILED' && <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />}
                      <div>
                        <div className="font-semibold text-slate-800">
                          {progress?.status === 'COMPLETED' && 'All messages sent successfully!'}
                          {progress?.status === 'PARTIAL' && 'Partially completed'}
                          {progress?.status === 'FAILED' && 'Failed to send'}
                        </div>
                        <div className="text-sm text-slate-600 mt-0.5">
                          {progress?.sentCount || 0} sent successfully
                          {progress?.failedCount > 0 && `, ${progress.failedCount} failed`}
                        </div>
                        {progress?.completedAt && (
                          <div className="text-xs text-slate-400 mt-1">
                            Completed at: {new Date(progress.completedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    setShowProgress(false);
                    if (isCompleted) {
                      onOpenChange(false);
                    }
                  }}
                  className="w-full rounded-xl border-slate-200 hover:bg-slate-50"
                >
                  {isCompleted ? 'Close' : 'Minimize'}
                </Button>
              </div>
            ) : (
              // ===== CONFIGURATION VIEW =====
              <div className="space-y-5">
                {/* From Number */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-orange-500" />
                    WhatsApp Number
                  </Label>
                  <select
                    value={fromNumber}
                    onChange={(e) => {
                      setFromNumber(e.target.value);
                      setSelectedTemplate(null);
                      setVariableConfigs([]);
                      setHeaderConfig(null);
                      setHeaderVariables([]);
                    }}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">Select WhatsApp number</option>
                    {WHATSAPP_NUMBERS.map((num) => (
                      <option key={num.value} value={num.value}>
                        {num.label}
                      </option>
                    ))}
                  </select>
                  {fromNumber && (
                    <p className="text-xs text-slate-500 mt-1">
                      Showing {WHATSAPP_NUMBERS.find(n => n.value === fromNumber)?.type === 'enroll' ? 'utility' : 'marketing'} templates
                    </p>
                  )}
                </div>

                {/* Template Selection */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-500" />
                    WhatsApp Template
                  </Label>
                  <select
                    value={selectedTemplate?.templateId || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value) {
                        handleTemplateSelect(value);
                      } else {
                        setSelectedTemplate(null);
                      }
                    }}
                    disabled={loadingTemplates || !fromNumber}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-slate-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!fromNumber ? 'Select a number first' : 
                       loadingTemplates ? 'Loading templates...' : 
                       'Select a template'}
                    </option>
                    {filteredTemplates.map((template) => {
                      const varCount = getVariableCount(template);
                      const headerInfo = getHeaderInfo(template);
                      
                      return (
                        <option key={template.templateId} value={template.templateId}>
                          {template.name} ({template.category} • {template.language}
                          {varCount > 0 ? ` • ${varCount} vars` : ''}
                          {headerInfo ? ` • Header: ${headerInfo}` : ''})
                        </option>
                      );
                    })}
                  </select>
                  {loadingTemplates && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Loading templates...
                    </div>
                  )}
                  {fromNumber && filteredTemplates.length === 0 && !loadingTemplates && (
                    <p className="text-xs text-amber-600 mt-1">
                      No {WHATSAPP_NUMBERS.find(n => n.value === fromNumber)?.type === 'enroll' ? 'utility' : 'marketing'} templates found
                    </p>
                  )}
                </div>

                {/* Variables Configuration */}
                {selectedTemplate && variableConfigs.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Variable className="w-4 h-4 text-orange-500" />
                        Variables
                      </Label>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {variableConfigs.filter(c => c.value).length}/{variableConfigs.length} configured
                      </span>
                    </div>

                    {variableConfigs.map((config, index) => {
                      const bodyComp = selectedTemplate.components.find(c => c.type === 'BODY');
                      const varName = bodyComp?.example?.body_text?.[0]?.[index] || `Variable ${index + 1}`;

                      return (
                        <Card key={index} className="rounded-xl border-slate-200 shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                                {index + 1}
                              </span>
                              <span className="text-sm font-medium text-slate-700">
                                {formatVarName(varName)}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <select
                                  value={config.dynamic ? 'dynamic' : 'static'}
                                  onChange={(e) => {
                                    handleVariableChange(index, {
                                      ...config,
                                      dynamic: e.target.value === 'dynamic',
                                      value: e.target.value === 'dynamic' ? '' : config.value,
                                    });
                                  }}
                                  className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                                >
                                  <option value="dynamic">Dynamic</option>
                                  <option value="static">Static</option>
                                </select>
                              </div>

                              <div>
                                {config.dynamic ? (
                                  <select
                                    value={config.value}
                                    onChange={(e) => {
                                      handleVariableChange(index, { ...config, value: e.target.value });
                                    }}
                                    className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                                  >
                                    <option value="">Select field...</option>
                                    {LEAD_FIELDS.map((field) => (
                                      <option key={field.value} value={field.value}>
                                        {field.label}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <Input
                                    value={config.value}
                                    onChange={(e) => {
                                      handleVariableChange(index, { ...config, value: e.target.value });
                                    }}
                                    placeholder="Enter value..."
                                    className="h-9 text-xs rounded-lg border-slate-200"
                                  />
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {/* Header Variables */}
                {selectedTemplate && headerVariables.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <Image className="w-4 h-4 text-blue-500" />
                      Header Variables
                    </Label>

                    {headerVariables.map((config, index) => (
                      <Card key={`header-${index}`} className="rounded-xl border-slate-200 shadow-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                              {index + 1}
                            </span>
                            <span className="text-sm font-medium text-slate-700">
                              Header Variable {index + 1}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <select
                                value={config.dynamic ? 'dynamic' : 'static'}
                                onChange={(e) => {
                                  handleHeaderVariableChange(index, {
                                    ...config,
                                    dynamic: e.target.value === 'dynamic',
                                    value: e.target.value === 'dynamic' ? '' : config.value,
                                  });
                                }}
                                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                              >
                                <option value="dynamic">Dynamic</option>
                                <option value="static">Static</option>
                              </select>
                            </div>

                            <div>
                              {config.dynamic ? (
                                <select
                                  value={config.value}
                                  onChange={(e) => {
                                    handleHeaderVariableChange(index, { ...config, value: e.target.value });
                                  }}
                                  className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
                                >
                                  <option value="">Select field...</option>
                                  {LEAD_FIELDS.map((field) => (
                                    <option key={field.value} value={field.value}>
                                      {field.label}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <Input
                                  value={config.value}
                                  onChange={(e) => {
                                    handleHeaderVariableChange(index, { ...config, value: e.target.value });
                                  }}
                                  placeholder="Enter value..."
                                  className="h-9 text-xs rounded-lg border-slate-200"
                                />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Header Media Upload */}
                {headerConfig && headerConfig.type !== 'text' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                      <File className="w-4 h-4 text-purple-500" />
                      Upload {headerConfig.type}
                    </Label>
                    <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl hover:border-orange-300 transition-colors">
                      <input
                        type="file"
                        accept={headerConfig.type === 'image' ? 'image/*' : '.pdf,.doc,.docx,.xlsx,.xls,.txt'}
                        onChange={handleHeaderFileUpload}
                        className="w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                      />
                    </div>
                  </div>
                )}

                {/* Status Summary & Send Button */}
                {selectedTemplate && (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-slate-600 font-medium">Status:</span>
                        <Badge className={cn(
                          variableConfigs.length > 0 && !isVariablesConfigured() 
                            ? 'bg-amber-100 text-amber-700 border-amber-200' 
                            : 'bg-green-100 text-green-700 border-green-200',
                          'text-xs'
                        )}>
                          {variableConfigs.length > 0 && !isVariablesConfigured() ? (
                            <><AlertTriangle className="w-3 h-3 mr-1" /> {variableConfigs.filter(c => !c.value).length} pending</>
                          ) : (
                            <><Check className="w-3 h-3 mr-1" /> Variables ready</>
                          )}
                        </Badge>
                        {headerVariables.length > 0 && (
                          <Badge className={cn(
                            !isHeaderConfigured() 
                              ? 'bg-amber-100 text-amber-700 border-amber-200' 
                              : 'bg-green-100 text-green-700 border-green-200',
                            'text-xs'
                          )}>
                            {!isHeaderConfigured() ? 'Header pending' : 'Header ready'}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={handleSend}
                      disabled={!canSend}
                      className="w-full rounded-xl bg-orange-500 hover:bg-orange-600 text-white h-11 text-base font-medium"
                    >
                      {sending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                      ) : (
                        <><Send className="mr-2 h-4 w-4" /> Send to {selectedLeads.length} leads</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white flex-shrink-0">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Users className="w-4 h-4" />
                <span>
                  Sending to <strong className="text-slate-700">{selectedLeads.length}</strong> leads
                  {selectedTemplate && (
                    <> using <strong className="text-slate-700">{selectedTemplate.name}</strong></>
                  )}
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  if (socketRef.current) {
                    socketRef.current.off('campaign-progress');
                    socketRef.current.off('campaign-completed');
                    socketRef.current.off('campaign-failed');
                  }
                  onOpenChange(false);
                }}
                disabled={sending}
                className="rounded-xl border-slate-200 hover:bg-slate-50 px-6"
              >
                Cancel
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal - Like LeadActionsModal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border-slate-200 p-0 overflow-hidden">
          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Eye className="w-5 h-5 text-orange-500" />
              Template Preview
            </DialogTitle>
            <div className="text-sm text-slate-500">
              Preview of {selectedTemplate?.name} for {previewLead?.name}
            </div>
          </DialogHeader>

          {/* Body */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              {/* Lead Info */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-orange-700">
                      {previewLead?.name?.charAt(0)?.toUpperCase() || 'L'}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{previewLead?.name}</p>
                    <p className="text-xs text-slate-500">{previewLead?.phone}</p>
                  </div>
                </div>
              </div>

              {/* Template Preview Card */}
              <div className="bg-[#e5ddd5] rounded-xl p-4">
                <div className="bg-white rounded-2xl p-4 shadow-sm max-w-[85%] mx-auto">
                  {/* Header */}
                  {headerConfig?.text && (
                    <div className="pb-2.5 mb-2.5 border-b border-slate-100">
                      {headerConfig.type === 'image' && headerConfig.mediaUrl && (
                        <img
                          src={headerConfig.mediaUrl}
                          alt="Header"
                          className="max-h-32 rounded-lg object-cover mb-2 w-full"
                        />
                      )}
                      {headerConfig.type === 'document' && headerConfig.filename && (
                        <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg mb-2">
                          <File className="w-4 h-4 text-orange-500" />
                          <span className="text-xs font-medium">{headerConfig.filename}</span>
                        </div>
                      )}
                      <p className="text-sm font-semibold text-slate-800">{headerConfig.text}</p>
                    </div>
                  )}

                  {/* Body */}
                  <div className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed">
                    {renderPreviewContent()} assdas
                  </div>

                  {/* Timestamp */}
                  <div className="mt-2.5 text-right">
                    <span className="text-[10px] text-slate-400">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Variables Summary */}
              {variableConfigs.length > 0 && (
                <div className="border border-slate-200 rounded-xl p-4">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Variables Used</p>
                  <div className="space-y-1.5">
                    {variableConfigs.map((config, index) => {
                      const bodyComp = selectedTemplate?.components.find(c => c.type === 'BODY');
                      const varName = bodyComp?.example?.body_text?.[0]?.[index] || `Variable ${index + 1}`;
                      const value = config.dynamic ? `Dynamic: ${config.value || 'Not set'}` : `Static: ${config.value || 'Not set'}`;
                      
                      return (
                        <div key={index} className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">{formatVarName(varName)}</span>
                          <Badge variant="outline" className="border-slate-200 text-slate-600">
                            {value}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-white">
            <Button
              variant="outline"
              onClick={() => setShowPreviewModal(false)}
              className="w-full rounded-xl border-slate-200 hover:bg-slate-50"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom scrollbar style */}
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
    </>
  );
}