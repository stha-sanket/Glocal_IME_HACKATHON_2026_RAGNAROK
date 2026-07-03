// NLU translations
const D: Record<string, Record<string, string>> = {
  balance: {
    en: 'Your savings account balance is 84,560 rupees and 84 paisa. I have put the account card on screen.',
    ne: 'तपाईंको बचत खाताको मौज्दात रु. ८४,५६०.८४ छ। खाता कार्ड स्क्रिनमा देखाइएको छ।',
    rom: 'Tapaiko savings khata ma Rs. 84,560.84 chha. Account card screen ma dekhaeko chhu.',
  },
  transferAsk: {
    en: 'Sending {amt} rupees to {name}. For your security, please confirm on screen — voice alone cannot authorize a transfer.',
    ne: '{name}लाई रु. {amt} पठाउँदैछु। सुरक्षाका लागि स्क्रिनमा पुष्टि गर्नुहोस् — आवाजले मात्र रकमान्तर हुँदैन।',
    rom: '{name} lai Rs. {amt} pathaudai chhu. Suraksha ko lagi screen ma confirm garnuhos.',
  },
  transferDone: {
    en: 'Done. {amt} rupees sent to {name}. Your new balance is 82,560 rupees and 84 paisa.',
    ne: 'भयो। {name}लाई रु. {amt} पठाइयो। नयाँ मौज्दात रु. ८२,५६०.८४ छ।',
    rom: 'Bhayo! {name} lai Rs. {amt} pathaiyo. Naya balance Rs. 82,560.84 chha.',
  },
  topupAsk: {
    en: 'Recharging {amt} rupees to {num}. Please confirm on screen.',
    ne: '{num} मा रु. {amt} रिचार्ज गर्दैछु। स्क्रिनमा पुष्टि गर्नुहोस्।',
    rom: '{num} ma Rs. {amt} recharge gardai chhu. Screen ma confirm garnuhos.',
  },
  topupDone: {
    en: 'Recharge complete — {amt} rupees added to {num}.',
    ne: 'रिचार्ज भयो — {num} मा रु. {amt} थपियो।',
    rom: 'Recharge bhayo — {num} ma Rs. {amt} thapiyo.',
  },
  blockAsk: {
    en: 'I will block your Visa debit card ending 4082. This is sensitive — confirm on screen, then verify with OTP.',
    ne: 'तपाईंको भिसा डेबिट कार्ड (•••• ४०८२) ब्लक गर्दैछु। स्क्रिनमा पुष्टि र OTP आवश्यक छ।',
    rom: 'Tapaiko Visa debit card (…4082) block gardai chhu. Screen ma confirm ra OTP chahinchha.',
  },
  blockDone: {
    en: 'Your Visa debit card ending 4082 is now blocked. A replacement can be requested from the Cards tab.',
    ne: 'तपाईंको कार्ड (•••• ४०८२) ब्लक भयो। नयाँ कार्डका लागि Cards ट्याबबाट अनुरोध गर्न सकिन्छ।',
    rom: 'Tapaiko card (…4082) block bhayo. Naya card Cards tab bata request garna sakinchha.',
  },
  atm: {
    en: 'The nearest branch is Manamaiju Branch, 1.2 kilometers away, open till 5 PM. Nearby ATMs are listed on screen.',
    ne: 'सबैभन्दा नजिक मनमैजु शाखा हो, १.२ कि.मि. टाढा, ५ बजेसम्म खुला। नजिकका ATM स्क्रिनमा छन्।',
    rom: 'Sabai bhanda najik Manamaiju Branch ho, 1.2 km tadha, 5 baje samma khula. Najik ka ATM screen ma chhan.',
  },
  cancelled: {
    en: 'Okay, cancelled. Nothing was done.',
    ne: 'हुन्छ, रद्द गरियो। केही भएन।',
    rom: 'Hunchha, cancel bhayo. Kehi bhayena.',
  },
  faq: {
    en: 'I can check your balance, send money, recharge a phone, block your card, or find the nearest ATM. Try saying: check my balance.',
    ne: 'म मौज्दात हेर्न, पैसा पठाउन, रिचार्ज गर्न, कार्ड ब्लक गर्न वा नजिकको ATM खोज्न सक्छु।',
    rom: 'Ma balance herna, paisa pathauna, recharge garna, card block garna ra ATM khojna sakchhu.',
  },
  interest: {
    en: 'Your savings account earns 2.75 percent per annum, and fixed deposits go up to 7.1 percent.',
    ne: 'तपाईंको बचत खातामा वार्षिक २.७५ प्रतिशत ब्याज छ; मुद्दती निक्षेपमा ७.१ प्रतिशतसम्म।',
    rom: 'Savings khata ma barsik 2.75 pratishat byaj chha; fixed deposit ma 7.1 samma.',
  },
  hours: {
    en: 'Branches are open Sunday to Friday, 10 AM to 5 PM. Global Assist works 24/7.',
    ne: 'शाखाहरू आइतबारदेखि शुक्रबार, बिहान १० देखि ५ बजेसम्म खुला। Global Assist २४सै घण्टा चल्छ।',
    rom: 'Branch haru Aitabar dekhi Sukrabar, 10 dekhi 5 baje samma khula. Global Assist 24/7 chalchha.',
  },
};

export function translate(
  key: string,
  lang: string,
  vars: Record<string, string> = {}
): string {
  let s = (D[key] && (D[key][lang] || D[key].en)) || '';
  Object.keys(vars).forEach((k) => {
    s = s.split('{' + k + '}').join(vars[k]);
  });
  return s;
}

export function detectLang(text: string): string {
  if (/[\u0900-\u097F]/.test(text)) return 'ne';
  if (
    /\b(pathau|pathaideu|kati|chha|cha|chaina|mero|khata|paisa|gara|garnu|rok|banda|najik|kaha)\b/i.test(
      text
    )
  )
    return 'rom';
  return 'en';
}

export interface ConfirmAction {
  type: 'transfer' | 'topup' | 'block';
  danger: boolean;
  lang: string;
  title: string;
  btn: string;
  rows: { k: string; v: string }[];
  done: { title: string; sub: string; speak: string };
  needsOtp: boolean;
}

export function processQuery(
  text: string,
  lang: string
): {
  reply: string;
  card?: 'bal' | 'atm';
  confirm?: ConfirmAction;
} {
  const L =
    lang === 'auto'
      ? detectLang(text)
      : lang === 'rom'
      ? detectLang(text) === 'ne'
        ? 'ne'
        : 'rom'
      : lang;

  const t = text.toLowerCase();
  const amtM = text.replace(/,/g, '').match(/(\d{2,6})/);
  const amt = amtM ? parseInt(amtM[1], 10) : null;

  if (/balance|ब्यालेन्स|मौज्दात|कति छ|kati chha|kati cha|balance kati/i.test(t)) {
    return { reply: translate('balance', L), card: 'bal' };
  }

  if (/send|transfer|pathau|पठाऊ|पठाउ|पैसा पठा/i.test(t)) {
    let name = 'Anisha';
    const m1 = text.match(/to\s+([A-Za-z\u0900-\u097F]+)/i);
    const m2 = text.match(/([A-Za-z\u0900-\u097F]+)\s*(lai|लाई)/i);
    if (m1) name = m1[1];
    else if (m2 && !/rs|रु/i.test(m2[1])) name = m2[1];
    name = name.charAt(0).toUpperCase() + name.slice(1);
    const a = amt || 2000;
    const fmtAmt = a.toLocaleString('en-IN');
    return {
      reply: translate('transferAsk', L, { amt: fmtAmt, name }),
      confirm: {
        type: 'transfer',
        danger: false,
        lang: L,
        title: 'Confirm fund transfer',
        btn: 'Confirm & verify',
        rows: [
          { k: 'To', v: name + ' Shrestha' },
          { k: 'Amount', v: 'Rs. ' + fmtAmt },
          { k: 'From', v: 'Savings •••• 0408' },
          { k: 'Fee', v: 'Rs. 0' },
        ],
        done: {
          title: 'Transfer successful',
          sub: 'Rs. ' + fmtAmt + ' sent to ' + name + ' Shrestha · Ref #GT7284',
          speak: translate('transferDone', L, { amt: fmtAmt, name }),
        },
        needsOtp: true,
      },
    };
  }

  if (/topup|top up|recharge|रिचार्ज|थप/i.test(t)) {
    const numM = text.match(/(9\d{9})/);
    const num = numM ? numM[1] : '9769342293';
    const a = amt && amt !== parseInt(num, 10) ? amt : 200;
    return {
      reply: translate('topupAsk', L, { amt: String(a), num }),
      confirm: {
        type: 'topup',
        danger: false,
        lang: L,
        title: 'Confirm mobile topup',
        btn: 'Confirm topup',
        rows: [
          { k: 'Number', v: num + ' (NTC)' },
          { k: 'Amount', v: 'Rs. ' + a },
          { k: 'From', v: 'Savings •••• 0408' },
        ],
        done: {
          title: 'Topup successful',
          sub: 'Rs. ' + a + ' added to ' + num,
          speak: translate('topupDone', L, { amt: String(a), num }),
        },
        needsOtp: false,
      },
    };
  }

  if (/block|रोक|बन्द|banda|rok/i.test(t)) {
    return {
      reply: translate('blockAsk', L),
      confirm: {
        type: 'block',
        danger: true,
        lang: L,
        title: 'Block debit card',
        btn: 'Block card',
        rows: [
          { k: 'Card', v: 'Visa Debit •••• 4082' },
          { k: 'Holder', v: 'Prashant Shrestha' },
          { k: 'Effect', v: 'Immediate, all channels' },
        ],
        done: {
          title: 'Card blocked',
          sub: 'Visa Debit •••• 4082 is blocked on all channels',
          speak: translate('blockDone', L),
        },
        needsOtp: true,
      },
    };
  }

  if (/atm|branch|शाखा|नजिक|najik|kaha/i.test(t)) {
    return { reply: translate('atm', L), card: 'atm' };
  }

  if (/interest|ब्याज|byaj/i.test(t)) {
    return { reply: translate('interest', L) };
  }

  if (/hours|time|खुल|khula|samaya/i.test(t)) {
    return { reply: translate('hours', L) };
  }

  return { reply: translate('faq', L) };
}
