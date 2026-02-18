export default function handler(req, res) {
  const event = {
    ts: new Date().toISOString(),
    type: req.query.t || 'pageview',
    ref: req.query.ref || req.headers.referer || 'direct',
    source: req.query.src || 'direct',
    ua: (req.headers['user-agent'] || '').substring(0, 100),
    ip: (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim(),
    page: req.query.p || '/',
    button: req.query.btn || '',
  };
  
  // Log to Vercel logs (viewable in dashboard)
  console.log('FLUX_TRACK:', JSON.stringify(event));
  
  // Return 1x1 transparent pixel
  res.setHeader('Cache-Control', 'no-cache, no-store');
  res.setHeader('Content-Type', 'image/gif');
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  res.end(pixel);
}
