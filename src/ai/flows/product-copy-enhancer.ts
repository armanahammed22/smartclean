'use server';
/**
 * @fileOverview A GenAI tool to generate or rephrase product descriptions for clarity, engagement, and SEO optimization.
 *
 * - productCopyEnhancer - A function that handles the product copy enhancement process.
 * - ProductCopyEnhancerInput - The input type for the productCopyEnhancer function.
 * - ProductCopyEnhancerOutput - The return type for the productCopyEnhancer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProductCopyEnhancerInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  currentDescription: z
    .string()
    .optional()
    .describe('The current or existing product description to be enhanced or rephrased.'),
  targetAudience: z
    .string()
    .optional()
    .describe(
      'An optional description of the target audience for this product (e.g., "young professionals", "eco-conscious consumers").'
    ),
  keywords: z
    .string()
    .optional()
    .describe(
      'An optional comma-separated list of keywords to include for SEO optimization (e.g., "organic", "sustainable", "fast delivery").'
    ),
  tone: z
    .string()
    .optional()
    .describe(
      'An optional desired tone for the copy (e.g., "professional", "friendly", "humorous", "luxurious").'
    ),
});
export type ProductCopyEnhancerInput = z.infer<typeof ProductCopyEnhancerInputSchema>;

const ProductCopyEnhancerOutputSchema = z.object({
  enhancedDescription: z
    .string()
    .describe('The generated or rephrased product description, optimized for clarity, engagement, and SEO.'),
});
export type ProductCopyEnhancerOutput = z.infer<typeof ProductCopyEnhancerOutputSchema>;

export async function productCopyEnhancer(
  input: ProductCopyEnhancerInput
): Promise<ProductCopyEnhancerOutput> {
  return productCopyEnhancerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'productCopyEnhancerPrompt',
  input: {schema: ProductCopyEnhancerInputSchema},
  output: {schema: ProductCopyEnhancerOutputSchema},
  prompt: `You are an expert marketing copywriter specializing in e-commerce product descriptions.
Your goal is to generate or rephrase product descriptions to be clear, engaging, and SEO-optimized for public-facing ordering pages.

Product Name: {{{productName}}}

{{#if currentDescription}}
Existing Description: {{{currentDescription}}}
Rephrase the above description, making it more engaging and optimized for SEO.
{{else}}
Generate a compelling product description.
{{/if}}

{{#if targetAudience}}
Target Audience: {{{targetAudience}}}
Tailor the description to resonate with this audience.
{{/if}}

{{#if keywords}}
Include the following keywords for SEO: {{{keywords}}}
{{/if}}

{{#if tone}}
Maintain a {{{tone}}} tone throughout the description.
{{/if}}

The final description should be concise yet informative, highlighting key benefits and features. Focus on clarity and persuasion. Ensure the output is formatted as a single string field named 'enhancedDescription'.`,
});

const productCopyEnhancerFlow = ai.defineFlow(
  {
    name: 'productCopyEnhancerFlow',
    inputSchema: ProductCopyEnhancerInputSchema,
    outputSchema: ProductCopyEnhancerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
