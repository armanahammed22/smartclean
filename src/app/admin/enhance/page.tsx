"use client";

import React, { useState } from 'react';
import { productCopyEnhancer } from '@/ai/flows/product-copy-enhancer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminEnhancePage() {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    productName: '',
    currentDescription: '',
    targetAudience: '',
    keywords: '',
    tone: 'professional'
  });
  
  const [result, setResult] = useState('');

  const handleEnhance = async () => {
    if (!formData.productName) {
      toast({
        title: "Product name required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const output = await productCopyEnhancer(formData);
      setResult(output.enhancedDescription);
    } catch (error) {
      console.error(error);
      toast({
        title: "AI Enhancement failed",
        description: "There was an error generating your copy.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied to clipboard"
    });
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col gap-2 mb-10">
          <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
            <Sparkles className="text-primary" />
            Product Copy Enhancer
          </h1>
          <p className="text-muted-foreground">
            Use AI to generate professional, engaging, and SEO-optimized product descriptions.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
              <CardDescription>Provide context about your product</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name *</Label>
                <Input 
                  id="productName" 
                  placeholder="e.g. Pro Ergonomic Desk Chair"
                  value={formData.productName}
                  onChange={(e) => setFormData({...formData, productName: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentDescription">Current Description (Optional)</Label>
                <Textarea 
                  id="currentDescription" 
                  placeholder="Paste existing text to rewrite..."
                  className="min-h-[100px]"
                  value={formData.currentDescription}
                  onChange={(e) => setFormData({...formData, currentDescription: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tone">Tone</Label>
                  <Select 
                    value={formData.tone} 
                    onValueChange={(val) => setFormData({...formData, tone: val})}
                  >
                    <SelectTrigger id="tone">
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="humorous">Humorous</SelectItem>
                      <SelectItem value="luxurious">Luxurious</SelectItem>
                      <SelectItem value="minimalist">Minimalist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Input 
                    id="targetAudience" 
                    placeholder="e.g. Remote Workers"
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({...formData, targetAudience: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keywords">SEO Keywords (comma separated)</Label>
                <Input 
                  id="keywords" 
                  placeholder="e.g. lumbar support, home office, mesh chair"
                  value={formData.keywords}
                  onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                />
              </div>

              <Button 
                onClick={handleEnhance} 
                className="w-full gap-2 mt-4" 
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Sparkles size={18} />}
                Generate Enhanced Copy
              </Button>
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>AI Generated Output</CardTitle>
                <CardDescription>Optimized marketing copy ready for use</CardDescription>
              </div>
              {result && (
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex-1">
              {!result && !loading && (
                <div className="h-full min-h-[300px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                  <Sparkles size={48} className="mb-4 opacity-20" />
                  <p>Your generated copy will appear here.</p>
                  <p className="text-sm">Fill in the product details and click "Generate".</p>
                </div>
              )}
              
              {loading && (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center space-y-4">
                  <Loader2 size={32} className="animate-spin text-primary" />
                  <p className="text-sm font-medium animate-pulse text-primary">Crafting your perfect copy...</p>
                </div>
              )}

              {result && !loading && (
                <div className="h-full p-4 bg-muted/50 rounded-lg border text-sm leading-relaxed whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {result}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}