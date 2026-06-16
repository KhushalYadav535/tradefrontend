// catalog.js — Dynamic symbol + expiry helpers
// Previously had hardcoded dates; now all expiries are generated relative to today
// so they never go stale regardless of when the app runs.

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

// ── Dynamic Expiry Generation ────────────────────────────────────────────────
// All expiry lists are derived from today's date so they never go stale.

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

/** Format a Date as DD-MM-YYYY (NSE weekly format) */
function fmtDDMMYYYY(d) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
}

/** Format a Date as DDMMMYYYY (MCX format, e.g. 16JUN2026) */
function fmtDDMMMYYYY(d) {
  const dd = String(d.getDate()).padStart(2, '0');
  const mon = MONTHS[d.getMonth()];
  return `${dd}${mon}${d.getFullYear()}`;
}

/**
 * Generate next N upcoming Thursdays from today (NSE weekly expiry day).
 * Returned as DD-MM-YYYY strings.
 */
function nextThursdays(count = 8) {
  const result = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  // Move to next Thursday (or today if it's Thursday)
  const day = d.getDay(); // 0=Sun … 6=Sat
  const daysToThurs = day <= 4 ? 4 - day : 11 - day;
  d.setDate(d.getDate() + daysToThurs);
  for (let i = 0; i < count; i++) {
    result.push(fmtDDMMYYYY(new Date(d)));
    d.setDate(d.getDate() + 7);
  }
  return result;
}

/**
 * Generate upcoming MCX expiry Dates for a commodity.
 * Each commodity has its own expiry day-of-month convention:
 *   GOLD/SILVER  → 5th of alternate months
 *   NATURALGAS   → last Tuesday of month
 *   CRUDEOIL     → ~17th of month
 *   Base metals  → last working day of month (approx 28th)
 * We generate 5 forward months from today.
 */
function mcxDatesFor(sym) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates = [];

  if (sym.startsWith('GOLD') || sym.startsWith('SILVER')) {
    // Expiry: 5th of every 2nd month starting from nearest upcoming
    const months = [1, 3, 5, 7, 9, 11, 1, 3, 5, 7]; // Feb, Apr, Jun, Aug…
    let year = today.getFullYear();
    for (const mo of months) {
      if (dates.length >= 5) break;
      const d = new Date(year, mo, 5); // 5th of month (0-indexed mo)
      if (mo === 1 && dates.length > 0) year++;
      if (d >= today) dates.push(d);
    }
    // Simpler approach: just go month by month, pick 5th
    if (dates.length === 0) {
      let m = today.getMonth();
      let y = today.getFullYear();
      while (dates.length < 5) {
        const d = new Date(y, m, 5);
        if (d >= today) dates.push(d);
        m += 2; if (m > 11) { m -= 12; y++; }
      }
    }
    return dates.slice(0, 5).map(fmtDDMMMYYYY);
  }

  if (sym.startsWith('NATURALGAS') || sym.startsWith('CRUDEOIL')) {
    // Expiry: around 16-19th of each month
    const day = sym.startsWith('NATURALGAS') ? 25 : 17;
    let m = today.getMonth();
    let y = today.getFullYear();
    while (dates.length < 5) {
      const d = new Date(y, m, day);
      if (d >= today) dates.push(d);
      m++; if (m > 11) { m = 0; y++; }
    }
    return dates.map(fmtDDMMMYYYY);
  }

  // Base metals (COPPER, ZINC, ALUMINIUM, LEAD, NICKEL): last working day ~28th-31st
  let m = today.getMonth();
  let y = today.getFullYear();
  while (dates.length < 5) {
    // Use 28th as safe approximation for last-working-day
    const d = new Date(y, m, 28);
    if (d >= today) dates.push(d);
    m++; if (m > 11) { m = 0; y++; }
  }
  return dates.map(fmtDDMMMYYYY);
}

/**
 * NSE weekly expiry catalog — dynamically generated rolling Thursdays.
 * Replaces the old hardcoded EXPIRY_CATALOG.
 */
export const EXPIRY_CATALOG = nextThursdays(8);

/**
 * MCX expiry dates per commodity — dynamically generated from today.
 * Replaces the old hardcoded MCX_EXPIRY_CATALOG and mcxExpiriesFor().
 */
export const MCX_EXPIRY_CATALOG = (() => {
  let m = new Date().getMonth();
  let y = new Date().getFullYear();
  const res = [];
  while (res.length < 7) {
    const d = new Date(y, m, 16);
    if (d >= new Date()) res.push(fmtDDMMMYYYY(d));
    m++; if (m > 11) { m = 0; y++; }
  }
  return res;
})();

export function mcxExpiriesFor(scriptName) {
  const sym = scriptName?.toUpperCase() || '';
  return mcxDatesFor(sym);
}

/**
 * strikesFor — generates a strike ladder around a given center price.
 * If no livePrice is provided, falls back to reasonable defaults.
 * Prefer using live option chain data (useOptionChain) over this.
 */
export function strikesFor(scriptName, livePrice = null) {
  if (!scriptName) return [];

  const bankLike = ['BANKNIFTY', 'SENSEX', 'BANKEX'];
  const idxLike  = ['NIFTY', 'SGXNIFTY', 'FINNIFTY', 'MIDCPNIFTY'];

  let step = 50;
  let center;

  if (bankLike.includes(scriptName)) {
    step   = 100;
    center = livePrice ? Math.round(livePrice / step) * step : 55000;
  } else if (idxLike.includes(scriptName)) {
    step   = 50;
    center = livePrice ? Math.round(livePrice / step) * step : 24000;
  } else {
    step   = 25;
    center = livePrice ? Math.round(livePrice / step) * step : 1000;
  }

  return Array.from({ length: 40 }, (_, i) => String(center + (i - 20) * step));
}
