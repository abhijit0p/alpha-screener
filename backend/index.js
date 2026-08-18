import { onRequest } from 'firebase-functions/v2/https';
import cors from 'cors';
import { runPipeline } from './engine.js';

const corsHandler = cors({ origin: true });

// 1. Cloud Function for On-Demand UI Triggers
export const triggerScan = onRequest({
  timeoutSeconds: 300,
  memory: '512MiB',
  region: 'asia-south1',
  cors: true
}, async (req, res) => {
  corsHandler(req, res, async () => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const results = await runPipeline(apiKey);
      res.status(200).json({ success: true, count: results.length, data: results });
    } catch (err) {
      console.error('Pipeline error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
});

// 2. Direct CLI Local Run (`npm start` or `node index.js`)
if (process.argv[1] && process.argv[1].endsWith('index.js')) {
  runPipeline().then(signals => {
    console.log('\n================================== TOP PICKS ==================================');
    console.table(signals.map(s => ({
      Symbol: s.symbol,
      CMP: `₹${s.cmp}`,
      'Stop-Loss': `₹${s.stopLoss}`,
      Target: `₹${s.target}`,
      'Vol Spike': `${s.volMultiple}x`,
      'AI Score': `${s.confidenceScore}%`,
      Thesis: (s.catalystThesis || '').slice(0, 48) + '...'
    })));
  }).catch(err => console.error(err));
}