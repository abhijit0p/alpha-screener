import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  BarChart2, 
  Info, 
  X, 
  Cpu, 
  Activity, 
  Layers, 
  Search, 
  Target,
  RefreshCw
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, query, orderBy } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function App() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('--');
  const [showMethodology, setShowMethodology] = useState(false);

  // Live Firestore Listener
  useEffect(() => {
    const q = query(collection(db, 'daily_signals'), orderBy('confidenceScore', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSignals(docs);
      setLoading(false);
      setLastUpdated(new Date().toLocaleTimeString('en-IN'));
    }, (error) => {
      console.error("Firestore read error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Trigger On-Demand Cloud Function Scan
  const handleTriggerScan = async () => {
    setScanning(true);
    try {
      const functionUrl = `https://asia-south1-${import.meta.env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net/triggerScan`;
      const response = await fetch(functionUrl, { method: 'POST' });
      const data = await response.json();
      console.log('Scan complete:', data);
    } catch (err) {
      console.error('Scan trigger error:', err);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0b0f19', color: '#f8fafc', padding: '2rem 1.5rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #1e293b', paddingBottom: '1.25rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <TrendingUp color="#38bdf8" size={28} /> AlphaScreener India
            </h1>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
              High-Probability Indian Equities • Pure Math Screener + Live Gemini Catalyst Audit
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            
            {/* Run Live Scan Button */}
            <button 
              onClick={handleTriggerScan}
              disabled={scanning}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: scanning ? '#1e293b' : '#38bdf8',
                color: scanning ? '#94a3b8' : '#0b0f19',
                border: scanning ? '1px solid #334155' : 'none',
                padding: '8px 14px',
                borderRadius: '8px',
                fontWeight: '700',
                cursor: scanning ? 'not-allowed' : 'pointer',
                fontSize: '0.85rem'
              }}
            >
              <RefreshCw size={15} className={scanning ? 'spin' : ''} style={{ animation: scanning ? 'spin 1s linear infinite' : 'none' }} />
              {scanning ? 'Scanning...' : 'Run Live Scan'}
            </button>

            {/* Methodology Button */}
            <button 
              onClick={() => setShowMethodology(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#1e293b',
                color: '#38bdf8',
                border: '1px solid #334155',
                padding: '8px 14px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              <Info size={15} /> How It Works
            </button>

            {/* Last Updated Timestamp */}
            <div style={{ textAlign: 'right', marginLeft: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Last Scanned</span>
              <span style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: '600' }}>{lastUpdated}</span>
            </div>
          </div>
        </header>

        {/* Signals Table */}
        <div style={{ background: '#131c2e', borderRadius: '12px', border: '1px solid #1e293b', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart2 size={18} color="#38bdf8" /> Live Breakout Candidates
            </h2>
            {loading && <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Connecting to Firestore...</span>}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#0b0f19', color: '#94a3b8', borderBottom: '1px solid #1e293b' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Ticker</th>
                  <th style={{ padding: '0.85rem 1rem' }}>CMP</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Stop-Loss</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Target (+2R)</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Vol Spike</th>
                  <th style={{ padding: '0.85rem 1rem' }}>RSI</th>
                  <th style={{ padding: '0.85rem 1rem' }}>AI Score</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Gemini AI Thesis & Catalyst</th>
                </tr>
              </thead>
              <tbody>
                {signals.length === 0 && !loading ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                      No active setups matching quantitative & AI criteria today. Click <b>Run Live Scan</b> to scan the market now.
                    </td>
                  </tr>
                ) : (
                  signals.map((stock) => {
                    const upside = (((stock.target - stock.cmp) / stock.cmp) * 100).toFixed(1);
                    const downside = (((stock.cmp - stock.stopLoss) / stock.cmp) * 100).toFixed(1);

                    return (
                      <tr key={stock.symbol} style={{ borderBottom: '1px solid #1e293b' }}>
                        <td style={{ padding: '1rem 1.25rem', fontWeight: '700', color: '#f8fafc' }}>
                          {stock.symbol}
                        </td>
                        <td style={{ padding: '1rem', fontWeight: '600' }}>₹{stock.cmp?.toLocaleString('en-IN')}</td>
                        <td style={{ padding: '1rem', color: '#f87171' }}>
                          ₹{stock.stopLoss?.toLocaleString('en-IN')}
                          <div style={{ fontSize: '0.75rem' }}>-{downside}%</div>
                        </td>
                        <td style={{ padding: '1rem', color: '#4ade80' }}>
                          ₹{stock.target?.toLocaleString('en-IN')}
                          <div style={{ fontSize: '0.75rem' }}>+{upside}%</div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ background: '#0284c720', color: '#38bdf8', padding: '3px 8px', borderRadius: '6px', fontWeight: '600' }}>
                            {stock.volMultiple}x
                          </span>
                        </td>
                        <td style={{ padding: '1rem', color: '#cbd5e1' }}>{stock.rsi}</td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#22c55e20', color: '#4ade80', padding: '3px 8px', borderRadius: '6px', fontWeight: '700' }}>
                            <Sparkles size={13} /> {stock.confidenceScore}%
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.25rem', maxWidth: '380px' }}>
                          <div style={{ color: '#cbd5e1', fontSize: '0.82rem', lineHeight: '1.4' }}>{stock.catalystThesis}</div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Methodology Modal */}
        {showMethodology && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 50
          }}>
            <div style={{
              background: '#131c2e',
              border: '1px solid #334155',
              borderRadius: '16px',
              maxWidth: '750px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              color: '#e2e8f0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cpu color="#38bdf8" /> Trading Methodology & Pipeline
                </h2>
                <button 
                  onClick={() => setShowMethodology(false)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={24} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Step 1 */}
                <div style={{ background: '#0b0f19', padding: '1.25rem', borderRadius: '10px', borderLeft: '4px solid #38bdf8' }}>
                  <h3 style={{ fontSize: '1rem', color: '#38bdf8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={18} /> 1. Dynamic Universe Ingestion
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.5', margin: 0 }}>
                    We ingest 200+ liquid equities across Nifty Midcap and Largecap segments directly from the official exchange master. Illiquid penny stocks, ASM/GSM surveillance lists, and circuit traps are excluded.
                  </p>
                </div>

                {/* Step 2 */}
                <div style={{ background: '#0b0f19', padding: '1.25rem', borderRadius: '10px', borderLeft: '4px solid #4ade80' }}>
                  <h3 style={{ fontSize: '1rem', color: '#4ade80', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity size={18} /> 2. Quantitative Screening Rules (Pure Math)
                  </h3>
                  <ul style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.6', margin: 0, paddingLeft: '1.2rem' }}>
                    <li><b>Trend Alignment:</b> CMP &gt; 20 EMA &gt; 50 EMA ensures the stock is in a confirmed stage-2 uptrend.</li>
                    <li><b>Volume Spike:</b> Daily volume must be &ge; 1.2x of its 20-day average, signaling institutional accumulation.</li>
                    <li><b>Momentum Zone:</b> RSI(14) between 50 and 75 captures active momentum without exhaustion.</li>
                    <li><b>Relative Strength (Alpha):</b> 1-month return delta must outperform the Nifty 50 benchmark index.</li>
                  </ul>
                </div>

                {/* Step 3 */}
                <div style={{ background: '#0b0f19', padding: '1.25rem', borderRadius: '10px', borderLeft: '4px solid #a855f7' }}>
                  <h3 style={{ fontSize: '1rem', color: '#c084fc', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Search size={18} /> 3. Google Gemini AI Validation & Risk Audit
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.5', margin: '0 0 0.5rem 0' }}>
                    Math finds the chart pattern, but <b>Gemini 2.5 Flash</b> audits the underlying company before taking trade risk:
                  </p>
                  <ul style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.6', margin: 0, paddingLeft: '1.2rem' }}>
                    <li><b>Catalyst Search:</b> Identifies quarterly earnings beats, order book inflows, capacity expansions, or sector tailwinds.</li>
                    <li><b>Forensic Risk Gate:</b> Filters out false volume spikes caused by promoter share pledges, auditor resignations, SEBI inquiries, or debt defaults.</li>
                    <li><b>Confidence Score:</b> Computes a unified 50–95 conviction score.</li>
                  </ul>
                </div>

                {/* Step 4 */}
                <div style={{ background: '#0b0f19', padding: '1.25rem', borderRadius: '10px', borderLeft: '4px solid #f59e0b' }}>
                  <h3 style={{ fontSize: '1rem', color: '#fbbf24', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Target size={18} /> 4. Volatility-Based Risk Management (ATR)
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.5', margin: 0 }}>
                    Stop-loss is dynamically set at <code>CMP - (1.5 × ATR)</code> to give trades room. Targets are set at <code>CMP + (3.0 × ATR)</code>, maintaining an asymmetric <b>1 : 2 Risk-to-Reward ratio</b> on every signal.
                  </p>
                </div>

              </div>

              <div style={{ marginTop: '1.75rem', textAlign: 'right' }}>
                <button 
                  onClick={() => setShowMethodology(false)}
                  style={{
                    background: '#38bdf8',
                    color: '#0b0f19',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Got It
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}