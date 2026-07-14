import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

/**
 * Dynamic Verification File Server
 * Serves HTML files from the root based on database config.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    if (!db) {
      return new Response('Database not connected', { status: 503 });
    }

    const { filename } = await params;
    // Normalize filename by removing .html if the proxy didn't already
    const cleanName = filename.replace(/\.html$/, '');
    
    // Search in Firestore
    const filesRef = db.collection('verification_files');
    const query = await filesRef.where('filename', 'in', [filename, cleanName, `${cleanName}.html`]).limit(1).get();

    if (query.empty) {
      return new Response('File not found', { status: 404 });
    }

    const fileData = query.docs[0].data();

    return new Response(fileData.content, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=59',
      },
    });

  } catch (error) {
    return new Response('Internal Server Error', { status: 500 });
  }
}
