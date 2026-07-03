export const HISTORY_ROWS = [
  { id: '1', name: 'Dari Gyang Bakery Gumba', time: '5:38 PM | 03 Jun 2026', amt: '- 1,240.00' },
  { id: '2', name: 'Sipaya Cafe', time: '2:18 PM | 03 Jun 2026', amt: '- 485.00' },
];

export const ATM_ROWS = [
  { id: '1', name: 'Manamaiju Branch (D8)', sub: 'Open till 5 PM · Branch + ATM', dist: '1.2 km' },
  { id: '2', name: 'Balaju Chowk ATM', sub: '24/7 · Cash + QR withdraw', dist: '2.0 km' },
  { id: '3', name: 'New Road Branch', sub: 'Open till 5 PM', dist: '4.8 km' },
];

export const CARD_PERKS = [
  {
    id: '1',
    title: 'Support in Nepal and India',
    sub: 'One card to spend or withdraw money',
    icon: 'globe',
  },
  {
    id: '2',
    title: 'Withdraw from ATMs anywhere',
    sub: 'Withdrawal fees apply if you go over your fee-free limit',
    icon: 'atm',
  },
  {
    id: '3',
    title: 'Get instant notification',
    sub: "See what you've spent and track in app at home and on the go",
    icon: 'bell',
  },
];

export const HUB_SECTIONS = [
  {
    title: 'Home Services',
    tiles: [
      { id: 'hs1', label: 'Mobile Topup', icon: 'phone' },
      { id: 'hs2', label: 'Fixed Deposit', icon: 'percent' },
      { id: 'hs3', label: 'Digital Universe', icon: 'net' },
    ],
  },
  {
    title: 'Bill Payments',
    tiles: [
      { id: 'bp1', label: 'Mobile Topup', icon: 'phone' },
      { id: 'bp2', label: 'Data Pack', icon: 'signal' },
      { id: 'bp3', label: 'Khanepani/ NEA', icon: 'droplet' },
      { id: 'bp4', label: 'Internet', icon: 'wifi' },
      { id: 'bp5', label: 'Landline', icon: 'phone-call' },
      { id: 'bp6', label: 'Television', icon: 'tv' },
      { id: 'bp7', label: 'Insurance', icon: 'umbrella' },
      { id: 'bp8', label: 'Credit Card', icon: 'credit-card' },
      { id: 'bp9', label: 'Vehicle EMI', icon: 'truck' },
      { id: 'bp10', label: 'Merchant Payment', icon: 'store' },
      { id: 'bp11', label: 'Govt Payment', icon: 'landmark' },
      { id: 'bp12', label: 'Wallet Load', icon: 'wallet' },
    ],
  },
  {
    title: 'Banking Services',
    tiles: [
      { id: 'bs1', label: 'Fixed Deposit', icon: 'percent' },
      { id: 'bs2', label: 'QR Withdraw', icon: 'qr-code' },
      { id: 'bs3', label: 'Apply Locker', icon: 'lock' },
      { id: 'bs4', label: 'Remit Tracker', icon: 'globe' },
      { id: 'bs5', label: 'Global Junior', icon: 'users' },
    ],
  },
  {
    title: 'Travel',
    tiles: [
      { id: 'tr1', label: 'Domestic Flight', icon: 'plane' },
      { id: 'tr2', label: 'Hotel Booking', icon: 'bed-double' },
      { id: 'tr3', label: "Int'l Flight", icon: 'globe' },
      { id: 'tr4', label: 'Ride Sharing', icon: 'car' },
    ],
  },
  {
    title: 'Personal Finance',
    tiles: [
      { id: 'pf1', label: 'Budget 360º', icon: 'bar-chart-2' },
      { id: 'pf2', label: 'Goal Savings', icon: 'piggy-bank', badge: 'Start Saving' },
      { id: 'pf3', label: 'Split Bill', icon: 'git-branch', badge: 'Share Bill' },
    ],
  },
  {
    title: 'Investment',
    tiles: [
      { id: 'iv1', label: 'Live Market', icon: 'candlestick-chart' },
      { id: 'iv2', label: 'Apply IPO', icon: 'trending-up', badge: 'Now Open' },
      { id: 'iv3', label: 'Capital Payment', icon: 'briefcase' },
    ],
  },
];

export const VOICE_CHIPS = [
  { id: 'c1', label: '"Check my balance"', query: 'Check my balance' },
  { id: 'c2', label: '"Send Rs. 2,000 to Anisha"', query: 'Send Rs. 2000 to Anisha' },
  { id: 'c3', label: '"मेरो ब्यालेन्स कति छ?"', query: 'मेरो ब्यालेन्स कति छ?' },
  { id: 'c4', label: '"Anisha lai 2000 pathau"', query: 'Anisha lai 2000 pathau' },
  { id: 'c5', label: '"Recharge 200"', query: 'Recharge Rs. 200 to 9769342293' },
  { id: 'c6', label: '"Block my debit card"', query: 'Block my debit card' },
  { id: 'c7', label: '"Nearest ATM"', query: 'Where is the nearest ATM?' },
];
