
'use client';
/**
 * @fileOverview Social Agent Intelligence Logic.
 * Handles intent parsing, lead extraction, and smart reply generation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SocialAgentInputSchema = z.object({
  message: z.string().describe('Incoming message from customer'),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string()
  })).optional(),
  context: z.string().optional().describe('Business context (services, pricing, etc.)')
});

const SocialAgentOutputSchema = z.object({
  reply: z.string().describe('The AI generated response'),
  intent: z.string().describe('Detected customer intent'),
  capturedData: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    interest: z.string().optional()
  }).optional(),
  shouldHandover: z.boolean().describe('True if a human agent is needed')
});

/**
 * Main AI function to process social media messages
 */
export async function processSocialMessage(input: z.infer<typeof SocialAgentInputSchema>) {
  const { output } = await ai.generate({
    model: 'googleai/gemini-2.0-flash-exp',
    input: { schema: SocialAgentInputSchema, data: input },
    output: { schema: SocialAgentOutputSchema },
    system: `You are the Smart Clean Social Messaging Agent. 
    Your goal is to handle inquiries from Facebook and WhatsApp professionally.
    
    GUIDELINES:
    1. Be concise and friendly.
    2. Extract contact details (Name, Phone) if provided.
    3. If the user asks for pricing, mention standard services start from 1500 BDT.
    4. If the user is angry or very specific, set shouldHandover to true.
    
    Context: ${input.context || 'Professional cleaning services in Bangladesh.'}`,
    prompt: input.message
  });

  return output!;
}
