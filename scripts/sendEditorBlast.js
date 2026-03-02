#!/usr/bin/env node
/**
 * Editor email blast — personalised emails to news editors.
 * Resumable: progress tracked in Firestore blast_progress/editor_blast.
 *
 * Usage:
 *   node scripts/sendEditorBlast.js [--limit N] [--dry-run]
 *
 *   --limit N    Max emails to send this run (default: all remaining)
 *   --dry-run    Print emails to console, no sends, no Firestore writes
 *
 * Config:    Firestore  blast_config/editor_blast  { editors: [{name, email, outlet?}] }
 * Progress:  Firestore  blast_progress/editor_blast
 */
'use strict';

const dns    = require('dns').promises;
const crypto = require('crypto');
const admin  = require('firebase-admin');
const { colors, initFirebase, initResend } = require('./blastUtils');

// ── CLI flags ─────────────────────────────────────────────────────────────────

const DRY_RUN  = process.argv.includes('--dry-run');
const limitIdx = process.argv.indexOf('--limit');
const LIMIT    = limitIdx !== -1 ? parseInt(process.argv[limitIdx + 1], 10) : null;

const SENDER   = 'Sejmograf <kontakt@sejmograf.pl>';
const SITE_URL = 'https://sejmograf.pl';

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

// ── Variation content (Polish, formal press-pitch style) ─────────────────────
// 4 × 4 × 4 × 4 = 256 unique combinations — well above the 40 editors needed.

const SUBJECTS = [
  'Sejmograf — monitor frekwencji głosowań posłów Sejmu RP',
  'Nowe narzędzie: śledzenie frekwencji głosowań posłów X kadencji',
  'Sejmograf.pl — bezpłatny monitor aktywności parlamentarnej',
  'Czy wiedzą Państwo, jak często posłowie opuszczają głosowania?',
];

const INTROS = [
  'Chciałem poinformować o projekcie Sejmograf (sejmograf.pl) — bezpłatnym narzędziu śledzącym frekwencję głosowań posłów X kadencji Sejmu RP.',
  'Piszę, aby podzielić się projektem Sejmograf — narzędziem monitorującym aktywność posłów X kadencji Sejmu RP dostępnym pod adresem sejmograf.pl.',
  'Chciałem zwrócić uwagę na Sejmograf (sejmograf.pl) — projekt open-data śledzący udział posłów X kadencji w głosowaniach parlamentarnych.',
  'Pozwolę sobie przedstawić Sejmograf — bezpłatne narzędzie online, które w czasie rzeczywistym monitoruje frekwencję głosowań każdego z 460 posłów X kadencji Sejmu RP (sejmograf.pl).',
];

const BODIES = [
  'Dane aktualizują się codziennie na podstawie otwartych danych publikowanych przez Sejm RP. Projekt obejmuje rankingi frekwencji, wykresy aktywności w czasie, porównania między klubami parlamentarnymi oraz indywidualne profile każdego z 460 posłów.',
  'Serwis oferuje ranking wszystkich posłów według frekwencji, interaktywne wykresy aktywności, porównania między klubami parlamentarnymi i szczegółowe profile z historią każdego posiedzenia. Dane pobierane są automatycznie każdego dnia z oficjalnych źródeł Sejmu RP.',
  'Na stronie można sprawdzić, który poseł pojawia się na głosowaniach najrzadziej i najczęściej, porównać wyniki całych klubów parlamentarnych oraz prześledzić historię aktywności dowolnego posła na przestrzeni kolejnych posiedzeń — wszystko na podstawie oficjalnych danych Sejmu RP.',
  'Projekt przetwarza otwarte dane Sejmu RP i udostępnia je w przystępnej formie: ranking frekwencji 460 posłów, wykresy trendów aktywności, porównania między ugrupowaniami i archiwum głosowań dla każdego posiedzenia.',
];

const SIGNOFFS = [
  'Czy byłaby to dla Państwa wartościowa informacja? Chętnie odpowiem na pytania lub przygotuję dodatkowe materiały.',
  'Jeśli temat wydaje się Państwu interesujący, chętnie odpowiem na pytania lub udostępnię dodatkowe dane.',
  'Będę wdzięczny za informację, czy temat jest dla Państwa interesujący. Mogę przygotować dodatkowe zestawienia lub odpowiedzieć na pytania.',
  'Pozostaję do dyspozycji w przypadku pytań lub potrzeby dodatkowych materiałów.',
];

// ── Deterministic combination assignment ─────────────────────────────────────

function seededShuffle(array, seed) {
  const arr = [...array];
  let s = seed >>> 0;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildCombinationPool() {
  const pool = [];
  for (let si = 0; si < SUBJECTS.length; si++)
  for (let ii = 0; ii < INTROS.length;   ii++)
  for (let bi = 0; bi < BODIES.length;   bi++)
  for (let oi = 0; oi < SIGNOFFS.length; oi++)
    pool.push([si, ii, bi, oi]);
  return pool;
}

function assignCombinations(count) {
  const pool     = buildCombinationPool();
  const shuffled = seededShuffle(pool, 42);
  if (count > shuffled.length) {
    throw new Error(`Need ${count} unique combinations but pool only has ${shuffled.length}`);
  }
  return shuffled.slice(0, count);
}

// ── Email builder ─────────────────────────────────────────────────────────────

function buildEditorEmail(editor, combo, unsubscribeUrl) {
  const { outlet } = editor;
  const [si, ii, bi, oi] = combo;

  const subject  = SUBJECTS[si];
  const greeting = 'Szanowna Redakcjo,';
  const variantKey = `s${si}-i${ii}-b${bi}-o${oi}`;

  const body = [
    greeting,
    '',
    INTROS[ii],
    '',
    BODIES[bi],
    '',
    SIGNOFFS[oi],
    '',
    'Pozdrawiam,',
    'Adam Borowski',
    'Sejmograf',
    'https://sejmograf.pl',
    '',
    '---',
    `Aby wypisać się z listy, kliknij: ${unsubscribeUrl}`,
  ].join('\n');

  return { subject, body, variantKey };
}

// ── MX validation ─────────────────────────────────────────────────────────────

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

// ── Firestore helpers ─────────────────────────────────────────────────────────

async function readFirestoreEditors(db) {
  const snap = await db.collection('blast_config').doc('editor_blast').get();
  if (!snap.exists) throw new Error('blast_config/editor_blast not found in Firestore. Upload editors first.');
  const editors = snap.data().editors;
  if (!Array.isArray(editors) || editors.length === 0) {
    throw new Error('blast_config/editor_blast.editors must be a non-empty array of {name, email, outlet?} objects');
  }
  return editors;
}

async function readFirestoreProgress(db) {
  const snap = await db.collection('blast_progress').doc('editor_blast').get();
  return snap.exists ? (snap.data().entries || []) : [];
}

async function writeFirestoreEntry(db, entry, totalEditors) {
  await db.collection('blast_progress').doc('editor_blast').set({
    totalEditors,
    entries: admin.firestore.FieldValue.arrayUnion(entry),
  }, { merge: true });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`${colors.cyan}${colors.bold}==== EDITOR EMAIL BLAST ====${DRY_RUN ? `  ${colors.yellow}[DRY RUN — NO EMAILS SENT]` : ''}${colors.reset}\n`);

  if (LIMIT !== null && (isNaN(LIMIT) || LIMIT < 1)) throw new Error('--limit must be a positive integer');

  // Initialize Firebase (always needed — editors live in Firestore)
  const db = initFirebase();

  // Load editors from Firestore
  const editors = await readFirestoreEditors(db);
  console.log(`${colors.green}✓ Config loaded: ${editors.length} editors (Firestore)${colors.reset}`);

  // Assign all combinations upfront (deterministic — same result every time)
  const combos = assignCombinations(editors.length);
  console.log(`${colors.green}✓ Combinations assigned (seed: 42, pool: ${buildCombinationPool().length})${colors.reset}`);

  // Load unsubscribes
  const unsubSnap   = DRY_RUN ? { docs: [] } : await db.collection('unsubscribes').get();
  const unsubEmails = new Set(unsubSnap.docs.map(d => d.id.toLowerCase()));
  if (unsubEmails.size > 0) {
    console.log(`${colors.yellow}✓ ${unsubEmails.size} unsubscribed — will skip${colors.reset}`);
  }

  // Load progress
  const sentEntries = DRY_RUN ? [] : await readFirestoreProgress(db);
  const sentEmails  = new Set(sentEntries.map(e => e.email.toLowerCase()));
  console.log(`${colors.dim}✓ Progress: ${sentEmails.size} already sent${colors.reset}\n`);

  const eligible  = editors.filter(e => !unsubEmails.has(e.email.toLowerCase()));
  const remaining = eligible.filter(e => !sentEmails.has(e.email.toLowerCase()));
  const toSend    = LIMIT !== null ? remaining.slice(0, LIMIT) : remaining;

  console.log(`Total editors: ${editors.length}  |  Already sent: ${sentEmails.size}  |  Remaining: ${remaining.length}  |  This run: ${toSend.length}\n`);

  if (toSend.length === 0) {
    console.log(`${colors.yellow}Nothing to send — all editors have already been contacted.${colors.reset}`);
    return;
  }

  // MX validation
  console.log(`${colors.cyan}Validating MX records...${colors.reset}`);
  const mxResults = await Promise.all(toSend.map(e => hasMxRecord(e.email)));
  const validated  = toSend.filter((_, i) => mxResults[i]);
  const skipped    = toSend.filter((_, i) => !mxResults[i]);
  if (skipped.length > 0) {
    skipped.forEach(e => console.log(`  ${colors.yellow}⚠ No MX — skipping ${e.email}${colors.reset}`));
  }
  console.log(`${colors.green}✓ ${validated.length} addresses pass MX check (${skipped.length} skipped)${colors.reset}\n`);

  const resend = DRY_RUN ? null : initResend();
  let sentCount = 0;
  let failCount = 0;

  for (let i = 0; i < validated.length; i++) {
    const editor = validated[i];
    const { name, email, outlet } = editor;
    // Use the editor's original index so combo assignment is stable across runs
    const originalIndex = editors.findIndex(e => e.email === email);
    const combo = combos[originalIndex];
    const unsubUrl = DRY_RUN ? `${SITE_URL}/api/unsubscribe?e=...&t=...` : generateUnsubscribeUrl(email);
    const { subject, body, variantKey } = buildEditorEmail(editor, combo, unsubUrl);

    console.log(`${colors.bold}[${i + 1}/${validated.length}]${colors.reset} ${name} <${email}>${outlet ? `  (${outlet})` : ''}`);
    console.log(`  Subject: "${subject}"`);
    console.log(`  Variant: ${variantKey}`);

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
        const entry = { name, email, outlet: outlet ?? null, sentAt: new Date().toISOString(), id: result.data?.id, variantKey };
        await writeFirestoreEntry(db, entry, editors.length);
        sentCount++;
      } catch (err) {
        console.error(`  ${colors.red}✗ Failed: ${err.message}${colors.reset}\n`);
        const entry = { name, email, outlet: outlet ?? null, sentAt: new Date().toISOString(), error: true, errorMessage: err.message };
        await writeFirestoreEntry(db, entry, editors.length);
        failCount++;
      }
    }
  }

  console.log(`${colors.green}${colors.bold}==== DONE ====${colors.reset}`);
  if (failCount > 0) {
    console.log(`Sent: ${colors.green}${sentCount}${colors.reset}  Failed: ${colors.red}${failCount}${colors.reset}`);
  } else {
    console.log(`${colors.green}${sentCount} email(s) sent successfully${colors.reset}`);
  }
}

main().catch(err => {
  console.error(`${colors.red}${colors.bold}Fatal error: ${err.message}${colors.reset}`);
  console.error(err.stack);
  process.exit(1);
});
