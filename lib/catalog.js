// Static catalog of script symbols per segment, used for the watchlist add-dialog.
// Only scripts also seeded in the DB can actually be traded; the rest will
// surface a "not available" toast if BUY/SELL is pressed on them.

export const SCRIPT_CATALOG = {
  NSEFUT: [
    'NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY', 'SENSEX', 'BANKEX',
    'RELIANCE', 'HDFCBANK', 'INFOSYS', 'TCS', 'ICICIBANK', 'KOTAKBANK',
    'LT', 'AXISBANK', 'SBIN', 'ITC', 'HINDUNILVR', 'BHARTIARTL',
    'BAJFINANCE', 'BAJAJFINSV', 'MARUTI', 'M&M', 'HCLTECH', 'WIPRO',
    'TITAN', 'ULTRACEMCO', 'NESTLEIND', 'POWERGRID', 'NTPC', 'ONGC',
    'COALINDIA', 'ADANIENT', 'ADANIPORTS', 'TATASTEEL', 'JSWSTEEL', 'HINDALCO',
  ],
  NSEOPT: [
    'NIFTY', 'BANKNIFTY', 'SGXNIFTY', 'FINNIFTY', 'MIDCPNIFTY',
    '360ONE', 'AARTIIND', 'ABB', 'ABCAPITAL', 'ABFRL',
    'RELIANCE', 'HDFCBANK', 'INFOSYS', 'TCS', 'ICICIBANK',
    'KOTAKBANK', 'LT', 'AXISBANK', 'SBIN', 'ITC',
    'HINDUNILVR', 'BHARTIARTL', 'BAJFINANCE', 'BAJAJFINSV', 'MARUTI',
  ],
  NSEEQT: [
    'RELIANCE', 'HDFCBANK', 'INFOSYS', 'TCS', 'ICICIBANK', 'KOTAKBANK',
    'LT', 'AXISBANK', 'SBIN', 'ITC', 'HINDUNILVR', 'BHARTIARTL',
    'BAJFINANCE', 'BAJAJFINSV', 'MARUTI', 'M&M', 'HCLTECH', 'WIPRO',
    'TITAN', 'ULTRACEMCO', 'NESTLEIND', 'POWERGRID', 'NTPC', 'ONGC',
  ],
  MCXFUT: [
    'GOLD', 'GOLDM', 'GOLDPETAL', 'SILVER', 'SILVERM', 'SILVERMIC',
    'CRUDEOIL', 'CRUDEOILM', 'NATURALGAS', 'NATURALGASMINI',
    'COPPER', 'ZINC', 'ALUMINIUM', 'LEAD', 'NICKEL',
  ],
  MCXOPT: [
    'GOLD', 'SILVER', 'CRUDEOIL', 'NATURALGAS', 'COPPER', 'ZINC',
  ],
  NSECDS: [
    'USDINR', 'EURUSD', 'EURINR', 'GBPINR', 'JPYINR', 'GBPUSD', 'USDJPY',
  ],
  GLOBAL_FUT: [
    'DOW', 'NASDAQ', 'SPX', 'DAX', 'FTSE', 'NIKKEI', 'HANGSENG',
  ],
  GLOBAL_STK: [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
  ],
};

export const EXPIRY_CATALOG = [
  '26-05-2026',
  '02-06-2026',
  '09-06-2026',
  '16-06-2026',
  '30-06-2026',
  '31-07-2026',
  '28-08-2026',
  '25-09-2026',
];

// Generates strike ladders matched to underlying name
export function strikesFor(scriptName) {
  if (!scriptName) return [];
  const idxLike = ['NIFTY', 'SGXNIFTY', 'FINNIFTY', 'MIDCPNIFTY'];
  const bankLike = ['BANKNIFTY', 'SENSEX', 'BANKEX'];
  if (bankLike.includes(scriptName)) {
    const center = 50000;
    return Array.from({ length: 40 }, (_, i) => String(center + (i - 20) * 100));
  }
  if (idxLike.includes(scriptName)) {
    const center = 17000; // matches your screenshot
    return Array.from({ length: 40 }, (_, i) => String(center + (i - 20) * 50));
  }
  // Equity options — wider step
  const center = 1000;
  return Array.from({ length: 40 }, (_, i) => String(center + (i - 20) * 25));
}
