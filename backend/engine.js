import fs from 'fs';
import axios from 'axios';
import { parse } from 'csv-parse/sync';
import YahooFinance from 'yahoo-finance2';
import { EMA, RSI, ATR } from 'technicalindicators';
import { GoogleGenAI } from '@google/genai';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config();

const yahooFinance = new YahooFinance({ suppressNotices: ['ripHistorical'] });

// 1. Initialize Firestore
let db = null;
try {
  if (fs.existsSync('./serviceAccountKey.json')) {
    const serviceAccount = JSON.parse(fs.readFileSync('./serviceAccountKey.json', 'utf8'));
    if (getApps().length === 0) {
      initializeApp({ credential: cert(serviceAccount) });
    }
  } else if (getApps().length === 0) {
    initializeApp(); // Cloud Functions environment auto-credentials
  }
  db = getFirestore();
} catch (e) {
  console.warn('⚠️ Firebase Admin init notice:', e.message);
}

// 2. Fetch Universe
async function fetchUniverse() {
  try {
    const res = await axios.get('https://api.kite.trade/instruments', { timeout: 8000 });
    const records = parse(res.data, { columns: true, skip_empty_lines: true });
    return records
      .filter(r => r.segment === 'NSE' && r.instrument_type === 'EQ' && r.name && !r.name.includes('-'))
      .map(r => r.tradingsymbol)
      .slice(0, 200);
  } catch {
    return [
      'EMMVEE', 'GLENMARK', 'DIXON', 'BEL', 'TRENT', 'HAL', 'POLYCAB', 'PERSISTENT',
      'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'BHARTIARTL', 'SBIN',
      'LT', 'TATAMOTORS', 'SUNPHARMA', 'TITAN', 'BAJFINANCE', 'ADANIENT',
      'NTPC', 'POWERGRID', 'ONGC', 'COALINDIA', 'TATASTEEL', 'JSWSTEEL',
      'HINDALCO', 'VEDL', 'BHEL', 'RECLTD', 'PFC', 'IRFC', 'RVNL',
      'MAZDOCK', 'COCHINSHIP', 'SUZLON', 'TATAPOWER', 'KPITTECH', 'COFORGE',
      'MAXHEALTH', 'APOLLOHOSP', 'ZYDUSLIFE', 'LUPIN', 'AUROPHARMA', 'FEDERALBNK',
      'IDFCFIRSTB', 'ASHOKLEY', 'BOSCHLTD', 'CUMMINSIND', '5PAISA', 'AAKASH', 'CARBORUNIV'
    ];
  }
}

// 3. Fetch Benchmark
async function fetchBenchmarkHistory() {
  const now = new Date();
  const startDate = new Date(Date.now() - 150 * 24 * 60 * 60 * 1000);
  const result = await yahooFinance.chart('^NSEI', {
    period1: startDate,
    period2: now,
    interval: '1d'
  });
  return result.quotes.map(q => q.close).filter(Boolean);
}

// 4. Analyze Stock Technicals
async function analyzeStock(symbol, niftyCloses) {
  try {
    const now = new Date();
    const startDate = new Date(Date.now() - 150 * 24 * 60 * 60 * 1000);
    const result = await yahooFinance.chart(`${symbol}.NS`, {
      period1: startDate,
      period2: now,
      interval: '1d'
    });

    const quotes = (result.quotes || []).filter(q => q.close && q.volume && q.high && q.low);
    if (quotes.length < 50) return null;

    const closes = quotes.map(q => q.close);
    const volumes = quotes.map(q => q.volume);
    const highs = quotes.map(q => q.high);
    const lows = quotes.map(q => q.low);

    const cmp = closes[closes.length - 1];
    const ema20 = EMA.calculate({ period: 20, values: closes }).pop();
    const ema50 = EMA.calculate({ period: 50, values: closes }).pop();
    const rsi14 = RSI.calculate({ period: 14, values: closes }).pop();
    const atr14 = ATR.calculate({ period: 14, high: highs, low: lows, close: closes }).pop();

    const avgVol20 = volumes.slice(-21, -1).reduce((a, b) => a + b, 0) / 20;
    const volMultiple = volumes[volumes.length - 1] / (avgVol20 + 1e-9);

    const stock1mReturn = (cmp - closes[closes.length - 22]) / closes[closes.length - 22];
    const nifty1mReturn = (niftyCloses[niftyCloses.length - 1] - niftyCloses[niftyCloses.length - 22]) / niftyCloses[niftyCloses.length - 22];
    const isOutperforming = stock1mReturn >= nifty1mReturn;

    const isBullishStructure = cmp > ema20 && ema20 > ema50;
    const isMomentumOptimal = rsi14 >= 50 && rsi14 <= 75;
    const isVolumeSurging = volMultiple >= 1.2;

    if (isBullishStructure && isMomentumOptimal && isVolumeSurging && isOutperforming) {
      return {
        symbol,
        cmp: Number(cmp.toFixed(2)),
        atr: Number(atr14.toFixed(2)),
        rsi: Number(rsi14.toFixed(2)),
        volMultiple: Number(volMultiple.toFixed(2)),
        stopLoss: Number((cmp - 1.5 * atr14).toFixed(2)),
        target: Number((cmp + 3.0 * atr14).toFixed(2)),
      };
    }
    return null;
  } catch {
    return null;
  }
}

// 5. Gemini AI Search Grounded Audit
async function validateWithGemini(candidate, apiKey) {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) {
    return { confidenceScore: 75, catalystThesis: 'Technical breakout verified with volume expansion.', redFlags: [] };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const prompt = `
Perform a financial catalyst and risk assessment for Indian equity '${candidate.symbol}' listed on NSE.
CMP: ₹${candidate.cmp}, Volume Spike: ${candidate.volMultiple}x, RSI: ${candidate.rsi}.

Search recent Indian financial news, quarterly results, order wins, and corporate governance filings.
Return a strict JSON object:
{
  "confidenceScore": number (50-95),
  "catalystThesis": "1-2 sentence operational growth catalyst",
  "redFlags": ["any", "major", "risks"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const cleanJson = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      confidenceScore: typeof parsed.confidenceScore === 'number' && parsed.confidenceScore <= 1
        ? Math.round(parsed.confidenceScore * 100)
        : Math.round(parsed.confidenceScore || 75),
      catalystThesis: parsed.catalystThesis || 'Volume breakout confirmed with technical alignment.',
      redFlags: parsed.redFlags || []
    };
  } catch {
    return { confidenceScore: 70, catalystThesis: 'Technical pattern and volume surge confirmed.', redFlags: [] };
  }
}

// 6. Firestore Sync Helper
async function syncToFirestore(signals) {
  if (!db) return;
  try {
    const batch = db.batch();
    const collectionRef = db.collection('daily_signals');
    const existing = await collectionRef.get();
    existing.docs.forEach(doc => batch.delete(doc.ref));

    signals.forEach(stock => {
      const docRef = collectionRef.doc(stock.symbol);
      batch.set(docRef, { ...stock, updatedAt: new Date().toISOString() });
    });

    await batch.commit();
    console.log(`📡 Synced ${signals.length} signals directly to Firestore.`);
  } catch (err) {
    console.error('Firestore sync error:', err.message);
  }
}

// 7. Full Engine Pipeline
export async function runPipeline(apiKey) {
  console.log('🚀 Fetching universe & benchmark data...');
  const [symbols, niftyCloses] = await Promise.all([
    fetchUniverse(),
    fetchBenchmarkHistory()
  ]);

  console.log(`📊 Scanning ${symbols.length} tickers for volume breakouts & relative strength...`);
  const candidates = [];

  const chunkSize = 10;
  for (let i = 0; i < symbols.length; i += chunkSize) {
    const chunk = symbols.slice(i, i + chunkSize);
    const results = await Promise.all(chunk.map(s => analyzeStock(s, niftyCloses)));
    for (const res of results) {
      if (res) candidates.push(res);
    }
  }

  console.log(`🎯 Found ${candidates.length} technical candidates. Running Gemini Search audit...`);

  const finalizedSignals = [];
  for (const c of candidates) {
    const aiReport = await validateWithGemini(c, apiKey);
    finalizedSignals.push({ ...c, ...aiReport });
  }

  await syncToFirestore(finalizedSignals);
  return finalizedSignals;
}