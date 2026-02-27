'use strict';

const admin = require('firebase-admin');
const { Resend } = require('resend');

// ANSI colors — identical to other scripts in this directory
const colors = {
  cyan:   "\x1b[36m",
  green:  "\x1b[32m",
  yellow: "\x1b[33m",
  red:    "\x1b[31m",
  dim:    "\x1b[2m",
  bold:   "\x1b[1m",
  reset:  "\x1b[0m",
};

function initFirebase() {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: "sejmograf-91428",
  });
  const db = admin.firestore();
  db.settings({ databaseId: 'sejmograf-db' });
  return db;
}

function initResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY environment variable is not set');
  return new Resend(key);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Club full names — mirrors lib/clubStyles.ts (CommonJS copy)
const CLUB_FULL_NAMES = {
  CENTRUM:         'Klub Centrum',
  Demokracja:      'Demokracja Bezpośrednia',
  KO:              'Koalicja Obywatelska',
  Konfederacja:    'Konfederacja',
  Konfederacja_KP: 'Konfederacja Korony Polskiej',
  Lewica:          'Lewica',
  'niez.':         'Niezrzeszeni',
  PiS:             'Prawo i Sprawiedliwość',
  Polska2050:      'Polska 2050',
  'PSL-TD':        'PSL – Trzecia Droga',
  Razem:           'Razem',
};

module.exports = { colors, initFirebase, initResend, sleep, CLUB_FULL_NAMES };
