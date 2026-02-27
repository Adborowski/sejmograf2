#!/usr/bin/env node
/**
 * Small email blast — 18 uniquely varied emails to friends for domain warm-up.
 *
 * TWO MODES:
 *
 *   LOCAL (no --limit):
 *     Sends all remaining recipients with 60–240 min delays between each.
 *     Writes progress to Firestore + local small-blast-sent.json.
 *
 *   GHA (--limit N, typically --limit 1):
 *     Reads Firestore to find how many already sent, sends the next N, exits.
 *     No delays — GitHub Actions cron (every 4h) provides the stagger.
 *
 * Usage:
 *   node scripts/sendSmallBlast.js [--limit N] [--dry-run]
 *
 * Config:    scripts/small-blast-config.json   [{name, email}]
 * Progress:  Firestore  blast_progress/small_blast  (source of truth)
 * Local log: scripts/small-blast-sent.json  (local mode only, for convenience)
 *
 * Combo assignment is positional + seeded — recipient[i] always gets combo[i]
 * regardless of which run or mode, so GHA can safely pick up where local left off.
 */
'use strict';

const fs      = require('fs');
const path    = require('path');
const admin   = require('firebase-admin');
const { colors, initFirebase, initResend, sleep } = require('./blastUtils');

const DRY_RUN   = process.argv.includes('--dry-run');
const LIMIT_IDX = process.argv.indexOf('--limit');
const LIMIT     = LIMIT_IDX !== -1 ? parseInt(process.argv[LIMIT_IDX + 1], 10) : null;
const GHA_MODE  = LIMIT !== null;

const CONFIG_PATH = path.resolve(__dirname, 'small-blast-config.json');
const SENT_PATH   = path.resolve(__dirname, 'small-blast-sent.json');
const SENDER      = 'Sejmograf <kontakt@sejmograf.pl>';

// ── Variation content (Polish) ───────────────────────────────────────────────
// 4 × 5 × 4 × 4 × 4 × 4 = 5120 unique combinations — far more than 18 needed.

const SUBJECTS = [
  'Sprawdź frekwencję swojego posła — nowe narzędzie',
  'Mój nowy projekt: Sejmograf',
  'Czy wiesz, ile posiedzeń opuścił Twój poseł?',
  'sejmograf.pl — monitor polskiego parlamentu',
];

const GREETINGS = [
  'Cześć,',
  'Hej,',
  'Dzień dobry,',
  'Witaj,',
  'Hej, jak się masz?',
];

const INTROS = [
  'Chciałem się podzielić projektem, który właśnie uruchomiłem — Sejmograf (sejmograf.pl) to strona, która śledzi frekwencję głosowań polskich posłów na bieżąco.',
  'Stworzyłem Sejmograf — bezpłatne narzędzie monitorujące, jak często posłowie X kadencji Sejmu biorą udział w głosowaniach. Działa pod adresem sejmograf.pl.',
  'Niedawno wypuściłem projekt, którym chciałem się podzielić: Sejmograf to strona śledząca frekwencję wszystkich 460 posłów Sejmu RP. Dane aktualizują się codziennie.',
  'Jakiś czas temu zacząłem pracować nad Sejmografem — teraz jest już live. To narzędzie, które pokazuje, jak często posłowie pojawiają się na głosowaniach w Sejmie.',
];

const BODIES = [
  'Można zobaczyć ranking wszystkich posłów, porównać frekwencję między klubami parlamentarnymi i przejrzeć historię głosowań każdego posła w podziale na posiedzenia.',
  'Na stronie jest ranking frekwencji, interaktywne wykresy, profile posłów z historią głosowań — wszystko aktualizowane automatycznie każdego dnia z oficjalnych danych Sejmu.',
  'Każdy poseł ma własną stronę z wykresem aktywności, rankingiem na tle całego parlamentu i szczegółową historią każdego posiedzenia. Jest też wyszukiwarka i filtry po klubach.',
  'Projekt opiera się na otwartych danych Sejmu RP — ranking frekwencji, wykresy aktywności w czasie, porównania między klubami i indywidualne profile dla każdego z 460 posłów.',
];

const CTAS = [
  'Przy okazji — powiedz mi, jak robisz swojego ulubionego kanapkę? Pytam serio, chętnie spróbuję.',
  'PS. Mam do Ciebie jedno pytanie niezwiązane z Sejmem: jak wygląda Twoja idealna kanapka? Odpisz, jeśli masz chwilę.',
  'A tak przy okazji — jaką kanapkę byś mi polecił/a? Szukam inspiracji i pytam znajomych.',
  'Jedno pytanie na koniec: co wkładasz do swojej ulubionej kanapki? Zbieram przepisy od znajomych.',
];

const SIGNOFFS = [
  'Pozdrawiam,',
  'Serdecznie,',
  'Dzięki i pozdrawiam,',
  'Trzymaj się,',
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
  for (let si = 0; si < SUBJECTS.length;  si++)
  for (let gi = 0; gi < GREETINGS.length; gi++)
  for (let ii = 0; ii < INTROS.length;    ii++)
  for (let bi = 0; bi < BODIES.length;    bi++)
  for (let ci = 0; ci < CTAS.length;      ci++)
  for (let oi = 0; oi < SIGNOFFS.length;  oi++)
    pool.push([si, gi, ii, bi, ci, oi]);
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

// ── Email assembly ────────────────────────────────────────────────────────────

function buildEmail(recipient, combo) {
  const [si, gi, ii, bi, ci, oi] = combo;
  const subject = SUBJECTS[si];
  const body = [
    GREETINGS[gi],
    '',
    INTROS[ii],
    '',
    BODIES[bi],
    '',
    'Link: https://sejmograf.pl',
    '',
    CTAS[ci],
    '',
    SIGNOFFS[oi],
    'Adam',
    'sejmograf.pl',
  ].join('\n');
  const variantKey = `s${si}-g${gi}-i${ii}-b${bi}-c${ci}-o${oi}`;
  return { subject, body, variantKey };
}

// ── Firestore helpers ─────────────────────────────────────────────────────────

async function readFirestoreProgress(db) {
  const snap = await db.collection('blast_progress').doc('small_blast').get();
  return snap.exists ? (snap.data().sent || []) : [];
}

async function writeFirestoreEntry(db, entry) {
  await db.collection('blast_progress').doc('small_blast').set(
    { sent: admin.firestore.FieldValue.arrayUnion(entry) },
    { merge: true }
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const modeTag = GHA_MODE ? `GHA --limit ${LIMIT}` : 'LOCAL';
  console.log(`${colors.cyan}${colors.bold}==== SMALL EMAIL BLAST (${modeTag}) ====${DRY_RUN ? `  ${colors.yellow}[DRY RUN]` : ''}${colors.reset}\n`);

  if (GHA_MODE && (isNaN(LIMIT) || LIMIT < 1)) throw new Error('--limit must be a positive integer');

  // Load recipients
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error(`Config file not found: ${CONFIG_PATH}`);
  }
  const recipients = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  if (!Array.isArray(recipients) || recipients.length === 0) {
    throw new Error('small-blast-config.json must be a non-empty array of {name, email} objects');
  }
  console.log(`${colors.green}✓ Config loaded: ${recipients.length} recipients${colors.reset}`);

  // Assign all combinations upfront (deterministic — same result every time)
  const combos = assignCombinations(recipients.length);
  console.log(`${colors.green}✓ Combinations assigned (seed: 42, pool: ${buildCombinationPool().length})${colors.reset}`);

  // Initialize Firebase (unless dry-run)
  const db = DRY_RUN ? null : initFirebase();

  // Determine starting index
  let startIndex = 0;
  if (GHA_MODE && !DRY_RUN) {
    const alreadySent = await readFirestoreProgress(db);
    startIndex = alreadySent.length;
    console.log(`${colors.dim}✓ Firestore progress: ${startIndex}/${recipients.length} already sent${colors.reset}`);
    if (startIndex >= recipients.length) {
      console.log(`\n${colors.green}All ${recipients.length} emails already sent. Nothing to do.${colors.reset}`);
      return;
    }
  }
  console.log();

  const endIndex  = GHA_MODE ? Math.min(startIndex + LIMIT, recipients.length) : recipients.length;
  const toProcess = recipients.slice(startIndex, endIndex);

  const resend = DRY_RUN ? null : initResend();
  const localResults = [];
  let sentCount = 0;
  let failCount = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const recipientIndex = startIndex + i;
    const { name, email } = toProcess[i];
    const { subject, body, variantKey } = buildEmail({ name, email }, combos[recipientIndex]);

    console.log(`${colors.bold}[${recipientIndex + 1}/${recipients.length}]${colors.reset} ${name} <${email}>`);
    console.log(`  Subject: "${subject}"`);
    console.log(`  Variant: ${variantKey}`);

    const entry = { name, email, subject, variantKey, sentAt: new Date().toISOString() };

    if (DRY_RUN) {
      console.log(`${colors.dim}  --- Email body ---`);
      body.split('\n').forEach(line => console.log(`  ${line}`));
      console.log(`  ---${colors.reset}\n`);
      localResults.push({ ...entry, dryRun: true });
      sentCount++;
    } else {
      try {
        const result = await resend.emails.send({ from: SENDER, to: email, subject, text: body });
        if (result.error) throw new Error(result.error.message ?? JSON.stringify(result.error));
        console.log(`  ${colors.green}✓ Sent (id: ${result.data?.id})${colors.reset}`);
        const fullEntry = { ...entry, dryRun: false, id: result.data?.id };
        await writeFirestoreEntry(db, fullEntry); // crash-safe: write immediately
        localResults.push(fullEntry);
        sentCount++;
      } catch (err) {
        console.error(`  ${colors.red}✗ Failed: ${err.message}${colors.reset}`);
        const errEntry = { ...entry, dryRun: false, error: true, errorMessage: err.message };
        await writeFirestoreEntry(db, errEntry);
        localResults.push(errEntry);
        failCount++;
      }
    }

    // Staggered delay in local mode only (skip after last, skip in GHA, skip in dry-run)
    if (!GHA_MODE && !DRY_RUN && i < toProcess.length - 1) {
      const delayMin = Math.floor(Math.random() * (240 - 60 + 1)) + 60;
      const until = new Date(Date.now() + delayMin * 60 * 1000);
      console.log(`${colors.yellow}  Waiting ${delayMin} min (next send at ${until.toLocaleTimeString('pl-PL')})...${colors.reset}\n`);
      await sleep(delayMin * 60 * 1000);
    } else {
      console.log();
    }
  }

  // Write local JSON log (local mode + dry-run)
  if (!GHA_MODE || DRY_RUN) {
    fs.writeFileSync(SENT_PATH, JSON.stringify(localResults, null, 2));
  }

  console.log(`${colors.green}${colors.bold}==== DONE ====${colors.reset}`);
  if (failCount > 0) {
    console.log(`Sent: ${colors.green}${sentCount}${colors.reset}  Failed: ${colors.red}${failCount}${colors.reset}`);
  } else {
    console.log(`${colors.green}${sentCount} email(s) sent successfully${colors.reset}`);
  }
  if (GHA_MODE && !DRY_RUN) {
    console.log(`${colors.cyan}Total progress: ${startIndex + sentCount}/${recipients.length}${colors.reset}`);
  }
}

main().catch(err => {
  console.error(`${colors.red}${colors.bold}Fatal error: ${err.message}${colors.reset}`);
  console.error(err.stack);
  process.exit(1);
});
