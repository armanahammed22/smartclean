
'use server';
/**
 * @fileOverview A Text-To-Speech flow for product descriptions.
 *
 * - generateProductSpeech - Converts product text into audio data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import wav from 'wav';

const ProductSpeechInputSchema = z.object({
  text: z.string().describe('The text to convert to speech.'),
});
export type ProductSpeechInput = z.infer<typeof ProductSpeechInputSchema>;

const ProductSpeechOutputSchema = z.object({
  audioUri: z.string().describe('The data URI of the generated WAV audio.'),
});
export type ProductSpeechOutput = z.infer<typeof ProductSpeechOutputSchema>;

export async function generateProductSpeech(text: string): Promise<string> {
  const output = await productSpeechFlow({ text });
  return output.audioUri;
}

const prompt = ai.definePrompt({
  name: 'productSpeechPrompt',
  input: { schema: ProductSpeechInputSchema },
  config: {
    responseModalities: ['AUDIO'],
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: { voiceName: 'Algenib' },
      },
    },
  },
  prompt: `Speak the following product information naturally: {{{text}}}`,
});

const productSpeechFlow = ai.defineFlow(
  {
    name: 'productSpeechFlow',
    inputSchema: ProductSpeechInputSchema,
    outputSchema: ProductSpeechOutputSchema,
  },
  async input => {
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.0-flash-exp'),
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: `Speak the following product information naturally: ${input.text}`,
    });

    if (!media?.url) {
      throw new Error('Failed to generate speech');
    }

    // Standard Gemini returns base64 or PCM data URI
    return { audioUri: media.url };
  }
);

/**
 * Utility to convert PCM to WAV if required. 
 * Standard Gemini API media parts are often already encoded.
 */
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
