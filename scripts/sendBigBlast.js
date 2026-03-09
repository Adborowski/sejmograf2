#!/usr/bin/env node
/**
 * Big email blast — personalised emails to all active MEPs (and optionally editors).
 * Resumable: progress is tracked in Firestore blast_progress/big_blast. Run daily
 * with --limit to pace the blast over 30+ days without hitting Resend's free-tier cap.
 *
 * Usage:
 *   node scripts/sendBigBlast.js [--limit N] [--dry-run] [--editors]
 *
 *   --limit N    Max emails to send this run (default: 15)
 *   --dry-run    Print emails to console, no sends, no Firestore writes
 *   --editors    Send to editors.json instead of MEPs (no Firestore tracking)
 *
 * Config:    scripts/editors.json   [{name, email, outlet?}]  (editors mode only)
 * Progress:  Firestore  blast_progress/big_blast
 */
'use strict';

const fs     = require('fs');
const path   = require('path');
const dns    = require('dns').promises;
const crypto = require('crypto');
const admin  = require('firebase-admin');
const { colors, initFirebase, initResend, CLUB_FULL_NAMES } = require('./blastUtils');

// ── CLI flags ─────────────────────────────────────────────────────────────────

const DRY_RUN      = process.argv.includes('--dry-run');
const EDITORS_MODE = process.argv.includes('--editors');
const limitIdx     = process.argv.indexOf('--limit');
const LIMIT        = limitIdx !== -1 ? parseInt(process.argv[limitIdx + 1], 10) : 15;

const EDITORS_PATH = path.resolve(__dirname, 'editors.json');
const SENDER       = 'Sejmograf <kontakt@sejmograf.pl>';
const SITE_URL     = 'https://sejmograf.pl';

// ── Unsubscribe token ─────────────────────────────────────────────────────────

function generateUnsubscribeUrl(email) {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) throw new Error('UNSUBSCRIBE_SECRET env var not set');
  const token = crypto.createHmac('sha256', secret)
    .update(email.toLowerCase())
    .digest('hex')
    .slice(0, 32);
  const e = Buffer.from(email).toString('base64url');
  return `${SITE_URL}/api/unsubscribe?e=${e}&t=${token}`;
}

// ── Personalisation helpers ───────────────────────────────────────────────────

// Polish gender heuristic: first name ending in 'a' → female (~95% accurate)
function guessGender(firstName) {
  return firstName.trim().endsWith('a') ? 'female' : 'male';
}

function salutation(firstName) {
  return guessGender(firstName) === 'female'
    ? 'Szanowna Pani Poseł,'
    : 'Szanowny Panie Pośle,';
}

// Pronouns: possessive (Pana/Pani) and accusative (Pana/Panią)
function pronoun(firstName) {
  return guessGender(firstName) === 'female'
    ? { possessive: 'Pani', accusative: 'Panią' }
    : { possessive: 'Pana', accusative: 'Pana' };
}

function formatPct(rate) {
  return (rate * 100).toFixed(1);
}

function getBestWorstSitting(votingStats) {
  if (!votingStats || typeof votingStats !== 'object') return { best: null, worst: null };
  const entries = Object.values(votingStats)
    .filter(s => s.numVotings > 0)
    .map(s => ({ ...s, rate: s.numVoted / s.numVotings }));
  if (entries.length === 0) return { best: null, worst: null };
  entries.sort((a, b) => b.rate - a.rate);
  return {
    best:  entries[0],
    worst: entries.length > 1 ? entries[entries.length - 1] : null,
  };
}

function buildMepEmail(mep, rank, totalActive, unsubscribeUrl) {
  const { firstName, id, club, attendanceRate, votingStats } = mep;
  const clubName = CLUB_FULL_NAMES[club] || club;
  const pct = formatPct(attendanceRate ?? 0);
  const p   = pronoun(firstName);
  const { best, worst } = getBestWorstSitting(votingStats);

  const subject = `Sejmograf — ${p.possessive} profil jest już dostępny`;

  const lines = [
    salutation(firstName),
    '',
    'Piszę w sprawie projektu Sejmograf — bezpłatnego monitora frekwencji głosowań posłów X kadencji Sejmu RP, dostępnego pod adresem https://sejmograf.pl.',
    '',
    `Zgodnie z danymi publikowanymi przez Sejm RP, ${p.possessive} frekwencja głosowań w bieżącej kadencji wynosi ${pct}%, co plasuje ${p.accusative} na miejscu ${rank}. z ${totalActive} aktywnych posłów (klub: ${clubName}).`,
  ];

  if (best) {
    lines.push('');
    lines.push(`Najlepsze posiedzenie: #${best.sitting} (${best.date}) — ${best.numVoted}/${best.numVotings} głosowań (${formatPct(best.rate)}%).`);
  }
  if (worst) {
    lines.push(`Posiedzenie z najniższą frekwencją: #${worst.sitting} (${worst.date}) — ${worst.numVoted}/${worst.numVotings} głosowań (${formatPct(worst.rate)}%).`);
  }

  lines.push(
    '',
    `${p.possessive} profil jest dostępny pod adresem: https://sejmograf.pl/mep/${id}`,
    '',
    'Będę wdzięczny za wszelki komentarz lub opinię — wystarczy odpowiedzieć na tę wiadomość.',
    '',
    'Z poważaniem,',
    'Adam Borowski',
    'Sejmograf',
    'https://sejmograf.pl',
    '',
    '---',
    `Aby wypisać się z listy, kliknij: ${unsubscribeUrl}`,
  );

  return { subject, body: lines.join('\n') };
}

function buildEditorEmail(editor, unsubscribeUrl) {
  const { outlet } = editor;
  const greeting = outlet ? `Szanowna Redakcjo ${outlet},` : 'Szanowna Redakcjo,';

  const body = [
    greeting,
    '',
    'Chciałem poinformować o projekcie Sejmograf (sejmograf.pl) — bezpłatnym narzędziu śledzącym frekwencję głosowań posłów X kadencji Sejmu RP.',
    '',
    'Dane aktualizują się codziennie na podstawie otwartych danych publikowanych przez Sejm RP. Projekt obejmuje rankingi frekwencji, wykresy aktywności w czasie, porównania między klubami parlamentarnymi oraz indywidualne profile każdego z 460 posłów.',
    '',
    'Czy byłaby to dla Państwa wartościowa informacja? Chętnie odpowiem na pytania lub przygotuję dodatkowe materiały.',
    '',
    'Pozdrawiam,',
    'Adam Borowski',
    'Sejmograf',
    'https://sejmograf.pl',
    '',
    '---',
    `Aby wypisać się z listy, kliknij: ${unsubscribeUrl}`,
  ].join('\n');

  return { subject: 'Sejmograf — monitor frekwencji głosowań posłów Sejmu RP', body };
}

// ── MX validation ─────────────────────────────────────────────────────────────

// Returns true if the email domain has at least one valid MX record.
// Results are cached per domain to avoid redundant DNS lookups.
const mxCache = new Map();

async function hasMxRecord(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  if (mxCache.has(domain)) return mxCache.get(domain);
  try {
    const records = await dns.resolveMx(domain);
    const valid = Array.isArray(records) && records.length > 0;
    mxCache.set(domain, valid);
    return valid;
  } catch {
    mxCache.set(domain, false);
    return false;
  }
}

// ── Firestore log helpers ─────────────────────────────────────────────────────

async function loadLog(db) {
  const snap = await db.collection('blast_progress').doc('big_blast').get();
  return snap.exists ? (snap.data().entries || []) : [];
}

async function appendLogEntry(db, entry, meta) {
  await db.collection('blast_progress').doc('big_blast').set({
    ...meta,
    entries: admin.firestore.FieldValue.arrayUnion(entry),
  }, { merge: true });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const modeLabel = EDITORS_MODE ? 'EDITORS' : 'MEP';
  console.log(`${colors.cyan}${colors.bold}==== BIG EMAIL BLAST (${modeLabel}) ====${DRY_RUN ? `  ${colors.yellow}[DRY RUN — NO EMAILS SENT]` : ''}${colors.reset}\n`);

  if (isNaN(LIMIT) || LIMIT < 1) throw new Error('--limit must be a positive integer');

  // ── Editors mode ──────────────────────────────────────────────────────────────
  if (EDITORS_MODE) {
    if (!fs.existsSync(EDITORS_PATH)) throw new Error(`editors.json not found at ${EDITORS_PATH}`);
    const editors = JSON.parse(fs.readFileSync(EDITORS_PATH, 'utf8'));
    console.log(`${colors.green}✓ Loaded ${editors.length} editors${colors.reset}\n`);

    const resend = DRY_RUN ? null : initResend();
    let sentCount = 0;
    let failCount = 0;

    for (let i = 0; i < editors.length; i++) {
      const editor = editors[i];
      const { email, name } = editor;
      const unsubUrl = DRY_RUN ? `${SITE_URL}/api/unsubscribe?e=...&t=...` : generateUnsubscribeUrl(email);
      const { subject, body } = buildEditorEmail(editor, unsubUrl);

      console.log(`${colors.bold}[${i + 1}/${editors.length}]${colors.reset} ${name} <${email}>`);
      console.log(`  Subject: "${subject}"`);

      if (DRY_RUN) {
        console.log(`${colors.dim}  --- Email body ---`);
        body.split('\n').forEach(line => console.log(`  ${line}`));
        console.log(`  ---${colors.reset}\n`);
        sentCount++;
      } else {
        try {
          const result = await resend.emails.send({
            from: SENDER, to: email, subject, text: body,
            headers: {
              'List-Unsubscribe': `<${unsubUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          });
          if (result.error) throw new Error(result.error.message ?? JSON.stringify(result.error));
          console.log(`  ${colors.green}✓ Sent (id: ${result.data?.id})${colors.reset}\n`);
          sentCount++;
        } catch (err) {
          console.error(`  ${colors.red}✗ Failed: ${err.message}${colors.reset}\n`);
          failCount++;
        }
      }
    }

    console.log(`${colors.green}${colors.bold}==== DONE ====${colors.reset}`);
    if (failCount > 0) {
      console.log(`Sent: ${colors.green}${sentCount}${colors.reset}  Failed: ${colors.red}${failCount}${colors.reset}`);
    } else {
      console.log(`${colors.green}${sentCount}/${editors.length} emails sent${colors.reset}`);
    }
    return;
  }

  // ── MEP mode ──────────────────────────────────────────────────────────────────
  console.log(`${colors.cyan}Connecting to Firestore...${colors.reset}`);
  const db = initFirebase();

  const snapshot = await db.collection('meps').where('active', '==', true).get();
  const allActive = snapshot.docs.map(d => d.data());
  console.log(`${colors.green}✓ Loaded ${allActive.length} active MEPs from Firestore${colors.reset}`);

  // Sort all active by attendanceRate for ranking (rank against the full active pool)
  allActive.sort((a, b) => (b.attendanceRate ?? 0) - (a.attendanceRate ?? 0));
  const totalActive = allActive.length;
  const rankMap = new Map(allActive.map((m, i) => [m.id, i + 1]));

  // Filter to those with an email address
  const withEmail = allActive.filter(m => m.email && m.email.trim());
  console.log(`${colors.green}✓ ${withEmail.length} have email addresses${colors.reset}`);

  // Load unsubscribes and filter them out
  const unsubSnap  = DRY_RUN ? { docs: [] } : await db.collection('unsubscribes').get();
  const unsubEmails = new Set(unsubSnap.docs.map(d => d.id.toLowerCase()));
  if (unsubEmails.size > 0) {
    console.log(`${colors.yellow}✓ ${unsubEmails.size} unsubscribed — will skip${colors.reset}`);
  }
  const eligible = withEmail.filter(m => !unsubEmails.has(m.email.toLowerCase()));

  // Load progress log from Firestore
  const log     = DRY_RUN ? [] : await loadLog(db);
  const sentIds = new Set(log.map(e => e.mepId));
  console.log(`${colors.dim}✓ Progress loaded: ${sentIds.size} already sent${colors.reset}\n`);

  const remaining = eligible.filter(m => !sentIds.has(m.id));
  const toSend    = remaining.slice(0, LIMIT);
  const afterThis = remaining.length - toSend.length;

  console.log(`Total active: ${totalActive}  |  Have email: ${withEmail.length}  |  Already sent: ${sentIds.size}  |  Remaining: ${remaining.length}`);
  console.log(`This run: ${toSend.length} (--limit ${LIMIT})  |  Est. days after this run: ${Math.ceil(afterThis / LIMIT)}\n`);

  if (toSend.length === 0) {
    console.log(`${colors.yellow}Nothing to send — all MEPs with email addresses have already been contacted.${colors.reset}`);
    return;
  }

  // MX validation — filter out addresses whose domain has no MX record
  console.log(`${colors.cyan}Validating MX records...${colors.reset}`);
  const mxResults = await Promise.all(toSend.map(m => hasMxRecord(m.email)));
  const validated  = toSend.filter((_, i) => mxResults[i]);
  const skipped    = toSend.filter((_, i) => !mxResults[i]);
  if (skipped.length > 0) {
    for (const mep of skipped) {
      console.log(`  ${colors.yellow}⚠ No MX — skipping ${mep.email}${colors.reset}`);
      if (!DRY_RUN) {
        // Write to Firestore so this address is never retried
        const entry = {
          mepId:    mep.id,
          email:    mep.email,
          fullName: mep.fullName || `${mep.firstName} ${mep.lastName}`,
          club:     mep.club,
          sentAt:   new Date().toISOString(),
          skipped:  true,
          skipReason: 'no_mx',
        };
        await appendLogEntry(db, entry, { totalWithEmail: withEmail.length, totalActive });
      }
    }
  }
  console.log(`${colors.green}✓ ${validated.length} addresses pass MX check (${skipped.length} skipped)${colors.reset}\n`);

  const resend = DRY_RUN ? null : initResend();
  let sentCount = 0;
  let failCount = 0;

  for (let i = 0; i < validated.length; i++) {
    const mep  = validated[i];
    const rank = rankMap.get(mep.id);
    const unsubUrl = DRY_RUN ? `${SITE_URL}/api/unsubscribe?e=...&t=...` : generateUnsubscribeUrl(mep.email);
    const { subject, body } = buildMepEmail(mep, rank, totalActive, unsubUrl);
    const pct = formatPct(mep.attendanceRate ?? 0);

    console.log(`${colors.bold}[${i + 1}/${validated.length}]${colors.reset} ${mep.fullName || `${mep.firstName} ${mep.lastName}`} <${mep.email}>`);
    console.log(`  ${colors.dim}${mep.club}, rank ${rank}/${totalActive}, attendance ${pct}%${colors.reset}`);
    console.log(`  Subject: "${subject}"`);

    if (DRY_RUN) {
      console.log(`${colors.dim}  --- Email body ---`);
      body.split('\n').forEach(line => console.log(`  ${line}`));
      console.log(`  ---${colors.reset}\n`);
      sentCount++;
    } else {
      try {
        const result = await resend.emails.send({
            from: SENDER, to: mep.email, subject, text: body,
            headers: {
              'List-Unsubscribe': `<${unsubUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          });
        if (result.error) throw new Error(result.error.message ?? JSON.stringify(result.error));
        console.log(`  ${colors.green}✓ Sent (id: ${result.data?.id})${colors.reset}\n`);
        const entry = {
          mepId:    mep.id,
          email:    mep.email,
          fullName: mep.fullName || `${mep.firstName} ${mep.lastName}`,
          club:     mep.club,
          sentAt:   new Date().toISOString(),
        };
        // Write after every send — crash-safe. Also store totals for monitoring page.
        await appendLogEntry(db, entry, { totalWithEmail: withEmail.length, totalActive });
        sentCount++;
      } catch (err) {
        console.error(`  ${colors.red}✗ Failed: ${err.message}${colors.reset}\n`);
        failCount++; // NOT added to log — will retry on next run
      }
    }
  }

  const totalSentNow   = sentIds.size + sentCount;
  const totalRemaining = withEmail.length - totalSentNow;

  console.log(`${colors.green}${colors.bold}==== DONE ====${colors.reset}`);
  if (failCount > 0) {
    console.log(`Sent: ${colors.green}${sentCount}${colors.reset}  Failed: ${colors.red}${failCount}${colors.reset}`);
  } else {
    console.log(`${colors.green}${sentCount} sent this run${colors.reset}`);
  }
  if (!DRY_RUN) {
    console.log(`Total sent: ${colors.cyan}${totalSentNow} / ${withEmail.length}${colors.reset}  |  Remaining: ${totalRemaining}  |  Est. days left: ${Math.ceil(totalRemaining / LIMIT)}`);
    console.log(`${colors.dim}Progress saved to Firestore blast_progress/big_blast${colors.reset}`);
  }
}

main().catch(err => {
  console.error(`${colors.red}${colors.bold}Fatal error: ${err.message}${colors.reset}`);
  console.error(err.stack);
  process.exit(1);
});
