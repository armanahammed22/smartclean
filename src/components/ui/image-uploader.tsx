
'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, ImageIcon, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onUpload: (base64: string) => void;
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
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(false);

    // 1. Format Validation
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid format. Please use JPG, PNG, GIF or WEBP.');
      return;
    }

    // 2. Size Validation
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
      // Reset success after 3 seconds
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
    onUpload('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={cn("space-y-2 w-full", className)}>
      {label && <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest block">{label}</label>}
      
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "relative group cursor-pointer border-2 border-dashed rounded-2xl overflow-hidden transition-all duration-300 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-gray-100/50",
          aspectRatio,
          error ? "border-destructive/50 bg-destructive/5" : "border-gray-200 hover:border-primary/50",
          preview && "border-solid border-primary/20"
        )}
      >
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {preview ? (
          <>
            <Image 
              src={preview} 
              alt="Preview" 
              fill 
              className="object-contain p-2 group-hover:scale-105 transition-transform duration-500" 
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button variant="secondary" size="sm" className="h-8 text-[10px] font-black">CHANGE</Button>
              <Button 
                variant="destructive" 
                size="icon" 
                className="h-8 w-8" 
                onClick={clearImage}
              >
                <X size={14} />
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center p-6 space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              {isUploading ? <Loader2 className="animate-spin" size={24} /> : <Upload size={24} />}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-700">Click or drag to upload</p>
              <p className="text-[10px] text-muted-foreground font-medium">JPG, PNG, GIF (Max {maxSizeMB}MB)</p>
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

      {error && (
        <div className="flex items-center gap-2 text-destructive mt-2 animate-in fade-in slide-in-from-top-1">
          <AlertCircle size={14} />
          <span className="text-[10px] font-bold uppercase">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 text-green-600 mt-2 animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 size={14} />
          <span className="text-[10px] font-bold uppercase">Upload Successful</span>
        </div>
      )}
    </div>
  );
}
