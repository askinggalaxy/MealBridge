// app/api/ai/intake/route.ts
// IMPORTANT: Real integration with OpenAI Vision via HTTP fetch (no mocking).
// This route accepts up to 3 images via multipart/form-data and returns a strict JSON
// suitable for pre-filling the donation form. We do not store images here; we just forward
// them to OpenAI after encoding to base64 data URLs.

import { NextResponse } from 'next/server';

// Explicitly type the expected AI payload so the client can rely on it.
export type IntakeAIResult = {
  title: string;
  // Short, helpful description for the listing (1-2 sentences, plain text)
  description: string;
  category: 'bread' | 'dairy' | 'produce' | 'canned' | 'beverages' | 'desserts' | 'other';
  condition: 'sealed' | 'opened';
  storage: 'ambient' | 'refrigerated' | 'frozen';
  expiry_date: string | null; // YYYY-MM-DD or null
  allergens: string[]; // lowercase strings like 'gluten', 'nuts', etc.
  notes: string[]; // free-form notes or flags
  confidence: {
    overall: number; // 0..1
    expiry: number;  // 0..1
    category: number;// 0..1
  };
};

// Small helper to safely read env vars with clear error messages.
function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

// Short, concrete safety guideline inserted into the prompt (kept concise to fit token budgets).
const SAFE_SHARING_RULES = [
  // Keep these short and action-oriented for the model.
  'No visibly spoiled, moldy, or foul-smelling food',
  'Chilled foods must stay refrigerated; frozen foods must stay frozen',
  'No home-canned goods or items in compromised packaging',
  'Prepared/open foods must be within safe time/temperature limits',
  'Clearly label common allergens where relevant',
];

// Build the system/user prompts with explicit, strict instructions for JSON output.
function buildPrompt(): string {
  return [
    'You are a food-safety intake assistant for a food sharing app.',
    'From 1-3 product photos, extract a STRICT JSON with keys exactly:',
    '{ title, description, category(one of: bread, dairy, produce, canned, beverages, desserts, other),',
    '  condition(sealed|opened), storage(ambient|refrigerated|frozen),',
    '  expiry_date(YYYY-MM-DD or null), allergens[], notes[],',
    '  confidence:{overall, expiry, category} }.',
    '',
    'Rules:',
    `- If image quality is low or the date is unreadable, set expiry_date: null and add notes: ["RET TAKE: please upload a close-up of the expiration date"].`,
    '- Validate against these Safe-Sharing rules: ' + SAFE_SHARING_RULES.join('; ') + '.',
    '- If a rule might be violated, add notes: ["FLAG: possible unsafe item – <reason>"] and set confidence.overall < 0.6.',
    '',
    'Output requirements:',
    '- Return ONLY a single JSON object conforming to the schema. No markdown, no code fences, no commentary.',
    '- Use lowercase for category, condition, storage, and allergens.',
    '- Use ISO date format YYYY-MM-DD when a date is readable and certain; otherwise null.',
    '- description must be concise (1-2 sentences), neutral, and safe for public display.',
  ].join('\n');
}

// Utility to convert File/Blob to a data URL string for OpenAI vision input.
async function fileToDataUrl(file: File): Promise<string> {
  const buf = Buffer.from(await file.arrayBuffer());
  // Try to detect content-type from file type; default to image/jpeg.
  const mime = file.type && file.type.startsWith('image/') ? file.type : 'image/jpeg';
  const b64 = buf.toString('base64');
  return `data:${mime};base64,${b64}`;
}

export async function POST(request: Request) {
  try {
    const apiKey = getEnv('OPENAI_API_KEY');
    const model = process.env.OPEN_AI_MODEL || 'gpt-4.1-mini'; // allow override via env, provide sensible default

    // Read multipart form-data with up to 3 images under field name "images".
    // Use getAll to avoid downlevel iteration issues in some TS targets.
    const form = await request.formData();
    const images = form.getAll('images').filter((v): v is File => v instanceof File);

    if (images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }
    if (images.length > 3) {
      return NextResponse.json({ error: 'Maximum 3 images allowed' }, { status: 400 });
    }

    // Convert to data URLs for the chat/vision API.
    const imageParts: any[] = [];
    for (const img of images) {
      const dataUrl = await fileToDataUrl(img);
      imageParts.push({ type: 'image_url', image_url: { url: dataUrl } });
    }

    const userPrompt = buildPrompt();

    // Call OpenAI Chat Completions API directly via fetch to avoid extra deps.
    // We request JSON object output to minimize parsing issues.
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You only produce strict JSON. No prose.' },
          { role: 'user', content: [ { type: 'text', text: userPrompt }, ...imageParts ] },
        ],
        temperature: 0.2, // prefer deterministic extraction
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return NextResponse.json({ error: 'OpenAI error', details: errText }, { status: 502 });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'Invalid AI response' }, { status: 502 });
    }

    // Parse strict JSON content.
    let parsed: IntakeAIResult;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      return NextResponse.json({ error: 'Failed to parse AI JSON', raw: content }, { status: 502 });
    }

    // Minimal runtime validation to avoid crashing client.
    // We only check presence and types for critical fields; client can further validate.
    const hasTitle = typeof parsed.title === 'string';
    const hasDesc = typeof (parsed as any).description === 'string';
    const hasCat = typeof parsed.category === 'string';
    const hasCond = typeof (parsed as any).condition === 'string';
    const hasStor = typeof (parsed as any).storage === 'string';
    if (!hasTitle || !hasDesc || !hasCat || !hasCond || !hasStor) {
      return NextResponse.json({ error: 'AI JSON missing required fields', raw: parsed }, { status: 502 });
    }

    return NextResponse.json(parsed satisfies IntakeAIResult);
  } catch (err: any) {
    console.error('[api/ai/intake] Error:', err);
    return NextResponse.json({ error: 'Server error', message: err?.message || 'unknown' }, { status: 500 });
  }
}
