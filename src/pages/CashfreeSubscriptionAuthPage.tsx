import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { load } from "@cashfreepayments/cashfree-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, ExternalLink, Copy, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Types
type CashfreeMode = "sandbox" | "production";
type CheckoutStatus = "idle" | "loading" | "success" | "error";

interface CashfreeError {
  message: string;
  code?: string;
}

// Constants
const STATUS_MESSAGES = {
  idle: "Ready to launch Cashfree subscription checkout.",
  loading: "Loading Cashfree checkout...",
  success: "Checkout opened successfully.",
  missingSession: "Missing subscription session ID. Please provide a valid session parameter.",
  sdkInitFailed: "Cashfree SDK could not initialize in this browser. Please check your internet connection and try again.",
  genericError: "Failed to open Cashfree subscription checkout. Please try again.",
} as const;

export function CashfreeSubscriptionAuthPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session") || searchParams.get("subsSessionId") || "";
  const mode = (searchParams.get("mode") === "production" ? "production" : "sandbox") as CashfreeMode;
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<CheckoutStatus>("idle");
  const [statusMessage, setStatusMessage] = useState(STATUS_MESSAGES.idle);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const pageUrl = useMemo(() => {
    if (typeof window === "undefined" || !sessionId) return "";
    const params = new URLSearchParams({
      session: sessionId,
      mode,
    });
    return `${window.location.origin}/cashfree/subscription-auth?${params.toString()}`;
  }, [mode, sessionId]);

  const updateStatus = useCallback((newStatus: CheckoutStatus, message?: string, error?: string | null) => {
    setStatus(newStatus);
    if (message) {
      setStatusMessage(message);
    } else {
      setStatusMessage(STATUS_MESSAGES[newStatus] || STATUS_MESSAGES.idle);
    }
    if (error !== undefined) {
      setErrorDetails(error);
    }
  }, []);

  const openCheckout = useCallback(async (target: "_self" | "_blank" = "_self") => {
    // Validation
    if (!sessionId) {
      updateStatus("error", STATUS_MESSAGES.missingSession, "No session ID provided");
      toast({
        title: "Missing Session ID",
        description: "Please provide a valid subscription session ID.",
        variant: "destructive",
      });
      return;
    }

    // Prevent duplicate loading
    if (loading) {
      return;
    }

    try {
      setLoading(true);
      updateStatus("loading", STATUS_MESSAGES.loading);
      
      // Initialize Cashfree SDK with timeout
      const cashfreePromise = load({ mode });
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("SDK initialization timeout")), 10000)
      );
      
      const cashfree = await Promise.race([cashfreePromise, timeoutPromise]) as Awaited<typeof cashfreePromise>;

      if (!cashfree) {
        throw new Error("SDK initialization failed");
      }

      // Launch checkout
      const result = await cashfree.subscriptionsCheckout({
        subsSessionId: sessionId,
        redirectTarget: target,
      });

      // Handle result
      if (result?.error?.message) {
        throw new Error(result.error.message);
      }

      // Success case
      updateStatus("success");
      
      if (target === "_blank") {
        toast({
          title: "Checkout Opened",
          description: "Cashfree subscription checkout has been opened in a new tab.",
        });
      } else {
        // For _self, page will redirect, so we don't show toast
        updateStatus("success", "Redirecting to checkout...");
      }
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : STATUS_MESSAGES.genericError;
      const isSdkError = errorMessage.includes("initialize") || errorMessage.includes("timeout");
      
      updateStatus(
        "error", 
        isSdkError ? STATUS_MESSAGES.sdkInitFailed : errorMessage,
        errorMessage
      );
      
      toast({
        title: "Checkout Failed",
        description: isSdkError ? STATUS_MESSAGES.sdkInitFailed : errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [sessionId, mode, loading, updateStatus]);

  // Auto-launch on mount
  useEffect(() => {
    // Small delay to ensure component is mounted
    const timer = setTimeout(() => {
      void openCheckout("_self");
    }, 100);
    
    return () => clearTimeout(timer);
  }, [openCheckout]);

  const copyUrl = useCallback(async () => {
    if (!pageUrl) return;
    
    try {
      await navigator.clipboard.writeText(pageUrl);
      toast({
        title: "Link Copied",
        description: "Subscription authentication link copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy link. Please manually select and copy the URL.",
        variant: "destructive",
      });
    }
  }, [pageUrl]);

  const handleRetry = useCallback(() => {
    setErrorDetails(null);
    void openCheckout("_self");
  }, [openCheckout]);

  const handleGoBack = useCallback(() => {
    if (typeof window !== "undefined") {
      window.history.back();
    }
  }, []);

  // Render different UI based on status
  const renderStatusAlert = () => {
    if (status === "error") {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Checkout Error</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{statusMessage}</p>
            {errorDetails && (
              <details className="text-xs mt-2">
                <summary className="cursor-pointer">Technical details</summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                  {errorDetails}
                </pre>
              </details>
            )}
          </AlertDescription>
        </Alert>
      );
    }

    if (status === "success") {
      return (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-800 dark:text-green-300">Success</AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-400">
            {statusMessage}
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          {status === "loading" && <Loader2 className="h-4 w-4 animate-spin mt-0.5" />}
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium">
              {status === "loading" ? "Processing" : "Status"}
            </p>
            <p className="text-sm text-muted-foreground">{statusMessage}</p>
          </div>
        </div>
      </div>
    );
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Invalid Request</CardTitle>
            <CardDescription>
              Missing subscription session ID.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Session ID Required</AlertTitle>
              <AlertDescription>
                Please provide a valid session ID using the <code className="text-xs bg-muted px-1">session</code> or{" "}
                <code className="text-xs bg-muted px-1">subsSessionId</code> query parameter.
              </AlertDescription>
            </Alert>
            <Button onClick={handleGoBack} variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-4 py-8">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Cashfree Subscription</CardTitle>
          <CardDescription>
            Complete your subscription payment securely through Cashfree's hosted checkout.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Session Info */}
          <div className="rounded-lg bg-muted/20 p-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Mode:</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-mono ${
                mode === "production" 
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" 
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
              }`}>
                {mode}
              </span>
            </div>
            <div className="text-sm">
              <span className="font-medium">Session ID:</span>
              <code className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded">
                {sessionId.slice(0, 12)}...{sessionId.slice(-8)}
              </code>
            </div>
          </div>

          {/* Status Alert */}
          {renderStatusAlert()}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => openCheckout("_blank")} 
              disabled={loading || status === "loading"} 
              className="flex-1"
              size="lg"
            >
              {loading && status === "loading" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 h-4 w-4" />
              )}
              Open Checkout in New Tab
            </Button>
            
            <Button 
              onClick={copyUrl} 
              variant="outline" 
              disabled={!pageUrl}
              size="lg"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Shareable Link
            </Button>

            {status === "error" && (
              <Button 
                onClick={handleRetry} 
                variant="secondary"
                size="lg"
              >
                Retry Checkout
              </Button>
            )}
          </div>

          {/* Shareable URL */}
          {pageUrl && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Shareable Link
              </label>
              <div className="rounded-lg border p-3 text-xs sm:text-sm font-mono break-all bg-background hover:bg-muted/10 transition-colors">
                {pageUrl}
              </div>
              <p className="text-xs text-muted-foreground">
                Share this link to allow others to complete this subscription payment.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CashfreeSubscriptionAuthPage;