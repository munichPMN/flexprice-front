/**
 * For Arabic locale files: replace "" (and recurse into objects) with the
 * matching string from English so missing translations fall back visibly
 * until proper AR copy exists.
 */
import fs from 'node:fs';
import path from 'node:path';

const localesDir = path.resolve('src/i18n/locales');
const namespaces = [
  'billing',
  'catalog',
  'common',
  'customer-portal',
  'customers',
  'developers',
  'settings',
];

function fillFromEn(ar, en) {
  if (typeof en !== 'object' || en === null || Array.isArray(en)) {
    return ar === undefined || ar === '' ? en : ar;
  }
  const arObj =
    typeof ar === 'object' && ar !== null && !Array.isArray(ar) ? ar : {};
  const result = { ...arObj };
  for (const [k, v] of Object.entries(en)) {
    const a = arObj[k];
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      result[k] = fillFromEn(a, v);
    } else if (a === undefined || a === '') {
      result[k] = v;
    }
  }
  return result;
}

for (const ns of namespaces) {
  const enPath = path.join(localesDir, 'en', `${ns}.json`);
  const arPath = path.join(localesDir, 'ar', `${ns}.json`);
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));
  const merged = fillFromEn(ar, en);
  fs.writeFileSync(arPath, `${JSON.stringify(merged, null, '\t')}\n`);
}

console.log('Filled empty Arabic strings from English for:', namespaces.join(', '));
