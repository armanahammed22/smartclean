
'use server';
/**
 * @fileOverview A Text-To-Speech flow for product descriptions.
 *
 * - generateProductSpeech - Converts product text into audio data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import wav from 'wav';

const ProductSpeechInputSchema = z.object({
  text: z.string().describe('The text to convert to speech.'),
});

export async function generateProductSpeech(text: string) {
  const { media } = await ai.generate({
    model: 'googleai/gemini-2.0-flash-exp', // Using standard flash for text input
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Algenib' },
        },
      },
    },
    prompt: `Speak the following product information naturally: ${text}`,
  });

  if (!media?.url) {
    throw new Error('Failed to generate speech');
  }

  // Gemini returns audio/pcm or similar, we wrap it in a data URI
  // Note: Standard Gemini API returns base64 media.
  return media.url;
}

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
