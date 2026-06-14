import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, File, X, Loader2, Eye, Image as ImageIcon } from 'lucide-react';
import { postDataHandlerWithTokenFormData } from '@/config/services';
import ApiConfig from '@/config/apiConfig';
import { toast } from '@/hooks/use-toast';

interface DocumentUploadProps {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  accept?: string;
}

function SingleDocumentUpload({ label, value, onChange, disabled = false, accept = "image/*" }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const response = await postDataHandlerWithTokenFormData(ApiConfig.uploadImage, formData, true);
      if (response?.success && response?.data?.url) {
        onChange(response.data.url);
        toast({
          title: "Success",
          description: `${label} uploaded successfully`,
        });
        // Clear preview after successful upload
        setTimeout(() => {
          URL.revokeObjectURL(objectUrl);
          setPreviewUrl('');
        }, 1000);
      } else {
        // Clear preview on failure
        URL.revokeObjectURL(objectUrl);
        setPreviewUrl('');
        toast({
          title: "Error",
          description: `Failed to upload ${label}. Please try again.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl('');
      toast({
        title: "Error",
        description: error.response?.data?.message || `Failed to upload ${label}`,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
  };

  const displayImage = previewUrl || value;
  const isImage = displayImage && (displayImage.match(/\.(jpeg|jpg|gif|png|webp)$/i) || displayImage.startsWith('blob:'));

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {displayImage ? (
        <div className="space-y-2">
          {isImage ? (
            <div className="relative inline-block">
              <img
                src={displayImage}
                alt={label}
                className="w-32 h-32 object-cover rounded-lg border-2 border-primary/20"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background shadow-md"
                onClick={handleRemove}
                disabled={disabled || uploading}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2 border rounded-md">
              <File className="w-4 h-4" />
              <span className="text-sm truncate flex-1">
                {displayImage.split('/').pop() || 'Document'}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => window.open(displayImage, '_blank')}
              >
                <Eye className="w-4 h-4 mr-1" />
                View
              </Button>
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                >
                  <X className="w-4 h-4 mr-1" />
                  Remove
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <input
            type="file"
            id={`upload-${label}`}
            accept={accept}
            onChange={handleUpload}
            disabled={disabled || uploading}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById(`upload-${label}`)?.click()}
            disabled={disabled || uploading}
            className="w-full"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            {uploading ? 'Uploading...' : `Upload ${label}`}
          </Button>
          {uploading && (
            <p className="text-xs text-muted-foreground mt-1 text-center">
              Uploading, please wait...
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface DocumentsUploadProps {
  value: any;
  onChange: (documents: any) => void;
  disabled?: boolean;
}

export function DocumentsUpload({ value = {}, onChange, disabled = false }: DocumentsUploadProps) {
  const handleChange = (field: string, url: string) => {
    onChange({
      ...value,
      [field]: url
    });
  };

  const handleCertificatesChange = (urls: string[]) => {
    onChange({
      ...value,
      educationalCertificates: urls
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <File className="w-4 h-4" />
          Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SingleDocumentUpload
            label="Aadhaar Card (Front)"
            value={value?.aadhaarFront}
            onChange={(url) => handleChange('aadhaarFront', url)}
            disabled={disabled}
          />
          <SingleDocumentUpload
            label="Aadhaar Card (Back)"
            value={value?.aadhaarBack}
            onChange={(url) => handleChange('aadhaarBack', url)}
            disabled={disabled}
          />
          <SingleDocumentUpload
            label="PAN Card"
            value={value?.panCard}
            onChange={(url) => handleChange('panCard', url)}
            disabled={disabled}
            accept="image/*"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Educational Certificates</Label>
          <MultiDocumentUpload
            value={value?.educationalCertificates || []}
            onChange={handleCertificatesChange}
            disabled={disabled}
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface MultiDocumentUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
}

function MultiDocumentUpload({ value = [], onChange, disabled = false }: MultiDocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<Map<number, string>>(new Map());

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    
    // Create previews for all files
    const newPreviews = new Map(previewUrls);
    filesArray.forEach((file, idx) => {
      const previewUrl = URL.createObjectURL(file);
      newPreviews.set(value.length + idx, previewUrl);
    });
    setPreviewUrls(newPreviews);

    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        setUploading(true);
        const response = await postDataHandlerWithTokenFormData(ApiConfig.uploadImage, formData, true);
        if (response?.success && response?.data?.url) {
          onChange([...value, response.data.url]);
          // Remove preview for this specific file
          setPreviewUrls(prev => {
            const newMap = new Map(prev);
            newMap.delete(value.length + i);
            return newMap;
          });
          toast({
            title: "Success",
            description: `Certificate uploaded successfully`,
          });
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.response?.data?.message || `Failed to upload certificate`,
          variant: "destructive",
        });
        // Remove preview on failure
        setPreviewUrls(prev => {
          const newMap = new Map(prev);
          newMap.delete(value.length + i);
          return newMap;
        });
      } finally {
        setUploading(false);
      }
    }
  };

  const handleRemove = (index: number) => {
    // Clean up preview URL if exists
    if (previewUrls.has(index)) {
      URL.revokeObjectURL(previewUrls.get(index)!);
      previewUrls.delete(index);
    }
    onChange(value.filter((_, i) => i !== index));
  };

  // Clean up all preview URLs on unmount
  const cleanupPreviews = () => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setPreviewUrls(new Map());
  };

  // Get all documents to display (previews + uploaded)
  const getAllDocuments = () => {
    const documents = [...value];
    previewUrls.forEach((previewUrl, index) => {
      if (index >= value.length) {
        documents[index] = previewUrl;
      }
    });
    return documents;
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="file"
          id="certificates-upload"
          accept=".pdf,.jpg,.jpeg,.png"
          multiple
          onChange={handleUpload}
          disabled={disabled || uploading}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('certificates-upload')?.click()}
          disabled={disabled || uploading}
          className="w-full"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          {uploading ? 'Uploading...' : 'Upload Certificates'}
        </Button>
        {uploading && (
          <p className="text-xs text-muted-foreground mt-1 text-center">
            Uploading certificate(s), please wait...
          </p>
        )}
      </div>
      
      {getAllDocuments().length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
          {getAllDocuments().map((url, index) => {
            const isPreview = previewUrls.has(index);
            const isImage = url && (url.match(/\.(jpeg|jpg|gif|png|webp)$/i) || url.startsWith('blob:'));
            
            return (
              <div key={index} className="relative group">
                {isImage ? (
                  <div className="relative">
                    <img
                      src={url}
                      alt={`Certificate ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-white hover:text-white hover:bg-white/20"
                        onClick={() => window.open(url, '_blank')}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      {!disabled && !isPreview && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-white hover:text-white hover:bg-white/20"
                          onClick={() => handleRemove(index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    {isPreview && (
                      <Badge variant="secondary" className="absolute top-1 left-1 text-xs">
                        Preview
                      </Badge>
                    )}
                  </div>
                ) : (
                  <div className="border rounded-lg p-2 text-center">
                    <File className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="text-xs truncate mt-1">
                      {url.split('/').pop()?.slice(0, 15) || `Certificate ${index + 1}`}
                    </p>
                    <div className="flex justify-center gap-1 mt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => window.open(url, '_blank')}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      {!disabled && !isPreview && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-destructive"
                          onClick={() => handleRemove(index)}
                        >
                          <X className="w-3 h-3 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                    {isPreview && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        Preview
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}