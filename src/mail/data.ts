import type { StringKey } from '../i18n'

export type Verdict = 'scam' | 'safe'

export type Mail = {
  id: number
  sender: string
  address: string
  initials: string
  subject: string
  preview: string
  body: string[]
  time: string
  unread?: boolean
  verdict: Verdict
  reasons: StringKey[]
  simple: StringKey
  // "How this scam works" (scam emails only): the signs of this kind of scam, each pointed out
  // in this email (clue = exact words from the email), then what to do instead
  learn?: { signs: { icon: string; title: StringKey; text: StringKey; clue: string }[]; instead: StringKey }
  link?: { label: string; domain: string }
  // Who the email pretends to be, for the link pause screen
  claim?: StringKey
  // One-line lesson shown after the email is moved away
  tip?: StringKey
  folder: 'inbox' | 'scam'
}

export const MAILS: Mail[] = [
  {
    id: 1,
    sender: 'Account Security Team',
    address: 'security@acc0unt-verify.net',
    initials: 'AS',
    subject: 'Your account will be locked today',
    preview: 'We detected an unusual sign-in. Confirm your identity within 24 hours or…',
    body: [
      'Dear Customer,',
      'We detected a new sign-in to your account from an unrecognised device. For your security, access to your account has been temporarily limited.',
      'Please confirm your identity within 24 hours to prevent your account from being permanently suspended.',
    ],
    folder: 'inbox',
    time: '10:42',
    unread: true,
    verdict: 'scam',
    reasons: ['r_sender', 'r_link', 'r_rush'],
    simple: 'simple_scam_account',
    learn: {
      signs: [
        { icon: 'warning', title: 'learn_sender_title', text: 'learn_sender_text', clue: 'security@acc0unt-verify.net' },
        { icon: 'clock', title: 'learn_rush_title', text: 'learn_rush_text', clue: '“within 24 hours”' },
        { icon: 'linkoff', title: 'learn_link_title', text: 'learn_link_text', clue: 'secure-check.info' },
      ],
      instead: 'learn_account_instead',
    },
    link: { label: 'Confirm my identity', domain: 'secure-check.info' },
    claim: 'claim_bank',
    tip: 'tip_account',
  },
  {
    id: 2,
    sender: 'Maya Chen',
    address: 'maya.chen@mail.com',
    initials: 'MC',
    subject: 'Notes from this morning',
    preview: 'Lovely to catch up today. Here are the notes and the dates we talked about.',
    body: [
      'Hi!',
      'Lovely to catch up this morning. Here are the dates we talked about: the book club moves to Thursdays from next month, and the coffee morning is on the 14th.',
      'See you soon,',
      'Maya',
    ],
    folder: 'inbox',
    time: '09:18',
    unread: true,
    verdict: 'safe',
    reasons: ['r_ok_contact', 'r_ok_personal'],
    simple: 'simple_safe',
  },
  {
    id: 3,
    sender: 'Parcel Track',
    address: 'notice@parcel-track-delivery.co',
    initials: 'PT',
    subject: 'Your package is on hold',
    preview: 'A small customs charge of £1.99 is needed before we can deliver your parcel.',
    body: [
      'Hello,',
      'Your parcel is waiting at our depot. A customs charge of £1.99 must be paid before we can deliver it.',
      'If the charge is not paid within 48 hours, the parcel will be returned to the sender.',
    ],
    folder: 'inbox',
    time: 'Yesterday',
    verdict: 'scam',
    reasons: ['r_money', 'r_link', 'r_rush'],
    simple: 'simple_scam_parcel',
    learn: {
      signs: [
        { icon: 'card', title: 'learn_fee_title', text: 'learn_fee_text', clue: '“A customs charge of £1.99”' },
        { icon: 'clock', title: 'learn_rush_title', text: 'learn_rush_text', clue: '“within 48 hours”' },
        { icon: 'linkoff', title: 'learn_pay_title', text: 'learn_pay_text', clue: 'parcel-fee-pay.top' },
      ],
      instead: 'learn_parcel_instead',
    },
    link: { label: 'Pay £1.99 now', domain: 'parcel-fee-pay.top' },
    claim: 'claim_parcel',
    tip: 'tip_parcel',
  },
  {
    id: 4,
    sender: 'Riverside Surgery',
    address: 'appointments@riversidesurgery.nhs.uk',
    initials: 'RS',
    subject: 'Appointment reminder: Tuesday 10:30',
    preview: 'This is a reminder of your appointment with Dr Patel on Tuesday at 10:30.',
    body: [
      'Dear patient,',
      'This is a reminder of your appointment with Dr Patel on Tuesday at 10:30.',
      'If you cannot attend, please phone the surgery on the number printed on your appointment card.',
    ],
    folder: 'inbox',
    time: 'Yesterday',
    verdict: 'safe',
    reasons: ['r_ok_nhs', 'r_ok_reminder'],
    simple: 'simple_safe',
  },
  {
    id: 5,
    sender: 'Sam Reid',
    address: 'sam.reid@mail.com',
    initials: 'SR',
    subject: 'Dinner on Friday?',
    preview: 'There’s a new place near the station I think you would like. Shall we try it?',
    body: ['Hello!', 'There’s a new place near the station I think you would like. Shall we try it on Friday at 7?', 'Sam'],
    folder: 'inbox',
    time: 'Mon',
    verdict: 'safe',
    reasons: ['r_ok_contact', 'r_ok_personal'],
    simple: 'simple_safe',
  },
]

// Already caught earlier, so the Scam folder is not empty on first look
export const FOLDER_MAILS: Mail[] = [
  {
    id: 6,
    sender: 'Free Prize Draw',
    address: 'winner@prize-draw-claims.biz',
    initials: 'FP',
    subject: 'You have won £500!',
    preview: 'Claim your prize today by confirming your bank details.',
    body: ['Congratulations!', 'You have won £500 in our monthly prize draw. To claim it, confirm your bank details today.'],
    folder: 'scam',
    time: 'Fri',
    verdict: 'scam',
    reasons: ['r_money', 'r_rush'],
    simple: 'simple_scam_account',
  },
  {
    id: 7,
    sender: 'Bank Support',
    address: 'support@secure-bank-help.co',
    initials: 'BS',
    subject: 'Urgent: update your details',
    preview: 'Your online banking needs updating before tomorrow.',
    body: ['Dear Customer,', 'Your online banking needs updating before tomorrow, or it will be suspended.'],
    folder: 'scam',
    time: 'Thu',
    verdict: 'scam',
    reasons: ['r_sender', 'r_rush'],
    simple: 'simple_scam_account',
  },
]
