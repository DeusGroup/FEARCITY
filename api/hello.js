// Basic Vercel serverless function (NOT Next.js)
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  res.status(200).json({
    message: 'Hello from Vercel Serverless!',
    timestamp: new Date().toISOString(),
    method: req.method,
    hasDatabase: !!process.env.DATABASE_URL
  });
};