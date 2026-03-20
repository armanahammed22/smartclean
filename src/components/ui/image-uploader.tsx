'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, ImageIcon, Loader2, AlertCircle, CheckCircle2, Link as LinkIcon, Globe } from 'lucide-react';
import Image from 'next/image';
import { Button } from './button';
import { Input } from './input';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

interface ImageUploaderProps {
  onUpload: (value: string) => void;
  initialUrl?: string;
  label?: string;
  maxSizeMB?: number;
  className?: string;
  aspectRatio?: string;
}

export function ImageUploader({
  onUpload,
  initialUrl = '',
  label = 'Upload Image',
  maxSizeMB = 2,
  className = '',
  aspectRatio = 'aspect-video'
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string>(initialUrl);
  const [urlInput, setUrlInput] = useState<string>(initialUrl.startsWith('data:') ? '' : initialUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveMode] = useState<'upload' | 'url'>(initialUrl.startsWith('data:') || !initialUrl ? 'upload' : 'url');
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Transforms common image hosting links (like Google Drive) into direct image URLs
   */
  const transformUrl = (url: string): string => {
    let transformed = url.trim();
    
    // Handle Google Drive Links
    if (transformed.includes('drive.google.com')) {
      const match = transformed.match(/\/d\/([^/]+)/) || transformed.match(/id=([^&]+)/);
      if (match && match[1]) {
        // Transform to direct view link
        return `https://lh3.googleusercontent.com/d/${match[1]}`;
      }
    }

    // Handle Dropbox
    if (transformed.includes('dropbox.com')) {
      return transformed.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '');
    }

    return transformed;
  };

  const handleUrlChange = (val: string) => {
    setUrlInput(val);
    if (val.trim()) {
      const directUrl = transformUrl(val);
      setPreview(directUrl);
      onUpload(directUrl);
    } else {
      setPreview('');
      onUpload('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(false);

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid format. Please use JPG, PNG, GIF or WEBP.');
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File is too large. Maximum size is ${maxSizeMB}MB.`);
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPreview(base64);
      onUpload(base64);
      setIsUploading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    };

    reader.onerror = () => {
      setError('Failed to read file. Please try again.');
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview('');
    setUrlInput('');
    onUpload('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={cn("space-y-3 w-full", className)}>
      {label && <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block">{label}</label>}
      
      <Tabs value={activeTab} onValueChange={(v) => setActiveMode(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-9 p-1 bg-gray-100 rounded-xl mb-3">
          <TabsTrigger value="upload" className="text-[10px] font-bold uppercase rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Upload size={12} className="mr-1.5" /> File Upload
          </TabsTrigger>
          <TabsTrigger value="url" className="text-[10px] font-bold uppercase rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <LinkIcon size={12} className="mr-1.5" /> Image URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-0">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative group cursor-pointer border-2 border-dashed rounded-2xl overflow-hidden transition-all duration-300 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-gray-100/50 min-h-[140px]",
              aspectRatio,
              error ? "border-destructive/50 bg-destructive/5" : "border-gray-200 hover:border-primary/50",
              preview && activeTab === 'upload' && preview.startsWith('data:') ? "border-solid border-primary/20" : ""
            )}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {preview && activeTab === 'upload' && preview.startsWith('data:') ? (
              <>
                <Image 
                  src={preview} 
                  alt="Preview" 
                  fill 
                  className="object-contain p-2 group-hover:scale-105 transition-transform duration-500" 
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button variant="secondary" size="sm" className="h-8 text-[10px] font-black">CHANGE FILE</Button>
                  <Button variant="destructive" size="icon" className="h-8 w-8" onClick={clearImage}><X size={14} /></Button>
                </div>
              </>
            ) : (
              <div className="text-center p-6 space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  {isUploading ? <Loader2 className="animate-spin" size={24} /> : <Upload size={24} />}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-700">Click to upload file</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Max {maxSizeMB}MB (JPG, PNG, GIF)</p>
                </div>
              </div>
            )}

            {isUploading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-20">
                <Loader2 className="animate-spin text-primary" size={32} />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Processing...</span>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="url" className="mt-0 space-y-3">
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input 
              value={urlInput}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="Paste image or Google Drive link..."
              className="h-11 pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-all rounded-xl"
            />
          </div>
          
          <div className={cn(
            "relative rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center min-h-[140px]",
            aspectRatio
          )}>
            {preview && (!preview.startsWith('data:') || activeTab === 'url') ? (
              <>
                <Image 
                  src={preview} 
                  alt="URL Preview" 
                  fill 
                  className="object-contain p-2"
                  unoptimized
                  onError={() => setError('Unable to load image. Ensure the link is direct or public.')}
                />
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="absolute top-2 right-2 h-8 w-8 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity" 
                  onClick={clearImage}
                >
                  <X size={14} />
                </Button>
              </>
            ) : (
              <div className="text-center p-6 space-y-2 text-muted-foreground/40">
                <ImageIcon size={48} className="mx-auto" />
                <p className="text-[10px] font-black uppercase tracking-widest">URL Preview Area</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {error && (
        <div className="flex items-center gap-2 text-destructive mt-2 animate-in fade-in slide-in-from-top-1">
          <AlertCircle size={14} />
          <span className="text-[10px] font-bold uppercase">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 text-green-600 mt-2 animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 size={14} />
          <span className="text-[10px] font-bold uppercase">Ready to save</span>
        </div>
      )}
    </div>
  );
}
