export interface WhatsAppTemplateComponent {
  type: 'BODY' | 'HEADER' | 'BUTTONS' | 'FOOTER';
  text?: string;
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  buttons?: WhatsAppButton[];
  example?: {
    body_text?: string[][];
    header_text?: string[];
    header_handle?: string[];
  };
}

export interface WhatsAppButton {
  type: 'URL' | 'PHONE_NUMBER' | 'QUICK_REPLY';
  text: string;
  url?: string;
  phone_number?: string;
}

export interface WhatsAppTemplate {
  _id: string;
  wabaId: string;
  name: string;
  category: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'PAUSED';
  language: string;
  components: WhatsAppTemplateComponent[];
  mediaUrl?: string;
  templateId: string;
  metaTemplateId: string;
  createdAt: string;
  updatedAt: string;
}

export interface VariableConfig {
  dynamic: boolean;
  value: string;
}

export interface BulkWhatsAppRequest {
  from: string;
  templateName: string;
  leadIds: string[];
  variables: VariableConfig[];
  header?: {
    type: 'text' | 'image' | 'document';
    text?: string;
    mediaUrl?: string;
    filename?: string;
  };
  headerVariables?: VariableConfig[];
  buttons?: {
    params: string[];
  };
}

export interface BulkWhatsAppResponse {
  success: boolean;
  campaignId: string;
  totalRecipients: number;
  status: string;
  message: string;
}

export interface CampaignProgress {
  campaignId: string;
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
  messageId?: string;
  error?: string;
  timestamp: string;
  completedAt?: string;
}