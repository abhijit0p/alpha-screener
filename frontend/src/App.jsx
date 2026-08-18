import React, { useState, useEffect } from 'react';
import { TrendingUp, ShieldAlert, Sparkles, RefreshCw, BarChart2 } from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';

// 1. Firebase Client Configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'alpha-screener-c5516',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// Deployed Cloud Function Endpoint
const CLOUD_FUNCTION_URL = 'https://asia-south1-alpha-screener-c5516.cloudfunctions.net/triggerScan';

export default function App() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [lastUpdated, setLastUpdated] = useState('--');

  // 2. Real-time Firestore Listener
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'daily_signals'), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSignals(docs);
      setLoading(false);
      setLastUpdated(new Date().toLocaleTimeString('en-IN'));
    }, (error) => {
      console.error('Firestore subscription error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 3. Trigger On-Demand Scan via Cloud Function
  const handleTriggerScan = async () => {
    setIsScanning(true);
    setScanStatus('Scanning 200 NSE tickers & running Gemini AI audits...');
    try {
      const response = await fetch(CLOUD_FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (data.success) {
        setScanStatus(`Scan complete! Found ${data.count} setups.`);
      } else {
        setScanStatus('Scan completed with warnings.');
      }
    } catch (err) {
      console.error('Cloud Function error:', err);
      setScanStatus('Failed to trigger scan. Check cloud logs.');
    } finally {
      setIsScanning(false);
      setTimeout(() => setScanStatus(''), 4000);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc', padding: '2rem 1.5rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #1e293b', paddingBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <TrendingUp color="#38bdf8" size={28} /> AlphaScreener India
            </h1>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
              Relative Strength • Volume Compression • On-Demand Gemini AI Engine
            </p>
          </div>

          {/* Action Trigger & Meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '2px' }}>Last Synced</span>
              <span style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: '600' }}>{lastUpdated}</span>
            </div>

            <button
              onClick={handleTriggerScan}
              disabled={isScanning}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: isScanning ? '#334155' : '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '0.9rem',
                cursor: isScanning ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
              }}
            >
              <RefreshCw size={16} style={{ animation: isScanning ? 'spin 1s linear infinite' : 'none' }} />
              {isScanning ? 'Scanning...' : 'Scan Market'}
            </button>
          </div>
        </header>

        {/* Scan Status Feedback */}
        {scanStatus && (
          <div style={{ background: '#0284c715', border: '1px solid #0284c740', color: '#38bdf8', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
            {scanStatus}
          </div>
        )}

        {/* Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '12px', border: '1px solid #334155' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Active Breakouts</span>
            <h3 style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', color: '#f8fafc' }}>{signals.length} Setups</h3>
          </div>
          <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '12px', border: '1px solid #334155' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Risk : Reward Profile</span>
            <h3 style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', color: '#4ade80' }}>1 : 2.0 R (ATR)</h3>
          </div>
          <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '12px', border: '1px solid #334155' }}>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Scan Universe</span>
            <h3 style={{ margin: '0.5rem 0 0 0', fontSize: '1.5rem', color: '#38bdf8' }}>Top 200 NSE Liquid</h3>
          </div>
        </div>

        {/* Signals Table */}
        <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart2 size={18} color="#38bdf8" /> Live Breakout Signals
            </h2>
            {loading && <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Syncing with Firestore...</span>}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Ticker</th>
                  <th style={{ padding: '0.85rem 1rem' }}>CMP</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Stop-Loss</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Target (+R)</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Vol Spike</th>
                  <th style={{ padding: '0.85rem 1rem' }}>RSI</th>
                  <th style={{ padding: '0.85rem 1rem' }}>AI Score</th>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Gemini AI Thesis & Risks</th>
                </tr>
              </thead>
              <tbody>
                {signals.length === 0 && !loading ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                      No active signals currently stored in database. Click <strong>"Scan Market"</strong> above to run an on-demand scan.
                    </td>
                  </tr>
                ) : (
                  signals.map((stock) => {
                    const upside = (((stock.target - stock.cmp) / stock.cmp) * 100).toFixed(1);
                    const downside = (((stock.cmp - stock.stopLoss) / stock.cmp) * 100).toFixed(1);

                    return (
                      <tr key={stock.symbol} style={{ borderBottom: '1px solid #334155' }}>
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
                          {stock.redFlags && stock.redFlags.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24', fontSize: '0.75rem', marginTop: '6px' }}>
                              <ShieldAlert size={13} /> {stock.redFlags[0]}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}