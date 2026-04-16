// ReturnCallModal.jsx
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  PhoneCall,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReturnCallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callData: {
    leadId: string;
    leadName: string;
    lead: any;
  } | null;
}

export function ReturnCallModal({ open, onOpenChange, callData }: ReturnCallModalProps) {
  const [timeLeft, setTimeLeft] = useState(30); // 30 seconds auto-close

  // Format lead data for display
  const lead = callData?.lead;
  const leadName = callData?.leadName || lead?.name || 'Unknown Caller';
  const leadId = callData?.leadId || lead?.leadId || 'N/A';

  // Auto-close modal after 30 seconds
  useEffect(() => {
    if (open) {
      setTimeLeft(30);
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onOpenChange(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [open, onOpenChange]);

  // Play sound notification when modal opens
  useEffect(() => {
    if (open) {
      // Optional: Play a notification sound
      // const audio = new Audio('/notification-sound.mp3');
      // audio.play().catch(e => console.log('Audio play failed:', e));
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-2 border-blue-500 shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full animate-ring">
              <PhoneCall className="w-5 h-5 text-red-600 dark:text-red-400 animate-pulse" />
            </div>
            Incoming Return Call
          </DialogTitle>
          <DialogDescription className="flex items-center justify-between">
            <span>A lead is requesting a callback</span>
            <span className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              Auto-closes in: {timeLeft}s
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Caller Information - Prominent Display */}
        <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-lg">
          <div className="flex flex-col items-center text-center gap-4">
            {/* Avatar with ringing animation */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-[#F97E2C] flex items-center justify-center animate-bounce">
                <User className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1">
                <div className="w-5 h-5 bg-green-500 rounded-full animate-ping"></div>
                <div className="absolute top-0 right-0 w-5 h-5 bg-green-500 rounded-full"></div>
              </div>
            </div>

            {/* Lead Name - Large and Prominent */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {leadName}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Lead ID: {leadId}
              </p>
            </div>

            {/* Contact Information */}
            {lead && (
              <div className="w-full mt-2 space-y-2 text-sm border-t pt-4 border-blue-200 dark:border-blue-800">
                {lead.phone && (
                  <div className="flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300">
                    <Phone className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">{lead.phone}</span>
                  </div>
                )}
                {lead.email && (
                  <div className="flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span>{lead.email}</span>
                  </div>
                )}
                {lead.address && (
                  <div className="flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>{lead.address}</span>
                  </div>
                )}
                {lead.source && (
                  <div className="flex items-center justify-center gap-2 text-gray-700 dark:text-gray-300">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>{lead.source}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>


        {/* Additional Info */}
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            This reminder will automatically close in {timeLeft} seconds
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}