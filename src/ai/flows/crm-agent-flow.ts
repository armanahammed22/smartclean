
'use server';

/**
 * @fileOverview A multi-tenant CRM AI Agent.
 *
 * - crmAgentFlow - Unified entry for Sales, Booking, and Support queries.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CRMAgentInputSchema = z.object({
  userQuery: z.string().describe('The customer query or intent.'),
  agentType: z.enum(['sales', 'booking', 'support', 'followup']).default('sales'),
  context: z.string().optional().describe('Additional CRM context (e.g., service list).'),
});

const CRMAgentOutputSchema = z.object({
  response: z.string().describe('The AI response for the customer.'),
  suggestedAction: z.string().optional().describe('An automated CRM action recommendation.'),
  capturedLead: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    intent: z.string().optional(),
  }).optional(),
});

export async function runCRMAgent(input: z.infer<typeof CRMAgentInputSchema>) {
  const { output } = await ai.generate({
    model: 'googleai/gemini-2.0-flash-exp',
    input: { schema: CRMAgentInputSchema, data: input },
    output: { schema: CRMAgentOutputSchema },
    system: `You are the Smart Clean AI Agent. You specialize in ${input.agentType}.
    Your goal is to be professional, efficient, and helpful.
    
    If agentType is 'sales': Pitch our services (Home, Office, Deep Cleaning).
    If agentType is 'booking': Help collect details for a booking.
    If agentType is 'support': Answer FAQs based on Context.
    
    Context: ${input.context || 'We provide professional cleaning services in Bangladesh.'}
    
    Always try to capture customer details (Name, Phone) if they show interest.`,
    prompt: input.userQuery,
  });
  
  return output!;
}
