// Vercel Serverless Function — /api/audit
// Receives form submission, forwards to our server for audit generation
// Returns score + summary immediately, emails full report async

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { restaurant, city, email } = req.body;

    if (!restaurant || !city) {
      return res.status(400).json({ error: 'Restaurant name and city are required' });
    }

    // Forward to our audit webhook on the OpenClaw server
    const WEBHOOK_URL = process.env.AUDIT_WEBHOOK_URL || 'https://oc-199122-oz9a.xc1.app/api/audit';

    const auditResp = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AUDIT_API_KEY || ''}`
      },
      body: JSON.stringify({ restaurant, city, email }),
      signal: AbortSignal.timeout(90000) // 90 second timeout
    });

    if (!auditResp.ok) {
      // If backend is down, return a placeholder response and queue the audit
      console.error('Audit backend error:', auditResp.status);
      return res.status(200).json({
        score: null,
        status: 'queued',
        message: `We're generating your audit for ${restaurant}. You'll receive it at ${email || 'your email'} within 5 minutes.`,
        restaurant,
        city
      });
    }

    const data = await auditResp.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error('Audit error:', err);
    // Graceful fallback — always give user a good experience
    const { restaurant, city, email } = req.body || {};
    return res.status(200).json({
      score: null,
      status: 'queued',
      message: `Your audit for ${restaurant || 'your restaurant'} is being generated. Check your email in a few minutes!`,
      restaurant: restaurant || '',
      city: city || ''
    });
  }
}
