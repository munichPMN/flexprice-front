/**
 * Validates src/i18n/locales JSON files:
 * - Valid JSON (UTF-8)
 * - No empty / whitespace-only / null string leaves (except allowlist)
 * - Same key paths for each namespace across all locale folders
 *
 * Usage: node scripts/validate-i18n-locales.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src/i18n/locales');

/** Keys that may be "" by design (e.g. no plural affix in a language). Format: "lang/file.json:key.path" */
const ALLOW_EMPTY_STRING = new Set(['ar/catalog.json:features.drawer.displayUnitPluralAutoSuffix']);

function flattenLeaves(obj, prefix = '') {
	/** @type {Record<string, unknown>} */
	const out = {};
	if (obj !== null && typeof obj === 'object' && !Array.isArray(obj)) {
		for (const [k, v] of Object.entries(obj)) {
			Object.assign(out, flattenLeaves(v, prefix ? `${prefix}.${k}` : k));
		}
	} else {
		out[prefix] = obj;
	}
	return out;
}

function walkStructureIssues(obj, keyPath, acc) {
	if (obj === null || obj === undefined) {
		acc.push({ keyPath, kind: 'nullish' });
		return;
	}
	if (Array.isArray(obj)) {
		if (obj.length === 0) acc.push({ keyPath, kind: 'empty-array' });
		obj.forEach((v, i) => walkStructureIssues(v, `${keyPath}[${i}]`, acc));
		return;
	}
	if (typeof obj === 'object') {
		const keys = Object.keys(obj);
		if (keys.length === 0 && keyPath !== '') acc.push({ keyPath, kind: 'empty-object' });
		for (const k of keys) walkStructureIssues(obj[k], keyPath ? `${keyPath}.${k}` : k, acc);
		return;
	}
	if (typeof obj === 'string') {
		if (obj === '') acc.push({ keyPath, kind: 'empty-string' });
		else if (/^\s+$/.test(obj)) acc.push({ keyPath, kind: 'whitespace-only' });
		return;
	}
	if (typeof obj !== 'number' && typeof obj !== 'boolean') {
		acc.push({ keyPath, kind: `unexpected-type-${typeof obj}` });
	}
}

function main() {
	const langs = fs
		.readdirSync(root)
		.filter((d) => fs.statSync(path.join(root, d)).isDirectory())
		.sort();

	const parseErrors = [];
	const blockers = [];
	const info = [];

	for (const lang of langs) {
		const dir = path.join(root, lang);
		for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
			const fp = path.join(dir, file);
			const rel = `${lang}/${file}`;
			let json;
			try {
				json = JSON.parse(fs.readFileSync(fp, 'utf8'));
			} catch (e) {
				parseErrors.push(`${rel}: ${/** @type {Error} */ (e).message}`);
				continue;
			}

			const struct = [];
			walkStructureIssues(json, '', struct);
			for (const { keyPath, kind } of struct) {
				if (kind === 'empty-array' || kind === 'empty-object') {
					info.push(`${rel}: [${kind}] ${keyPath || '(root)'}`);
					continue;
				}
				if (kind === 'empty-string') {
					const id = `${rel}:${keyPath}`;
					if (ALLOW_EMPTY_STRING.has(id)) continue;
				}
				blockers.push(`${rel}: [${kind}] ${keyPath}`);
			}
		}
	}

	const en = langs.includes('en') ? 'en' : null;
	if (en) {
		const enDir = path.join(root, en);
		const files = fs.readdirSync(enDir).filter((f) => f.endsWith('.json'));
		for (const other of langs.filter((l) => l !== en)) {
			for (const file of files) {
				const pEn = path.join(enDir, file);
				const pO = path.join(root, other, file);
				if (!fs.existsSync(pO)) {
					blockers.push(`${other}/${file}: MISSING FILE (present in ${en})`);
					continue;
				}
				const fe = flattenLeaves(JSON.parse(fs.readFileSync(pEn, 'utf8')));
				const fo = flattenLeaves(JSON.parse(fs.readFileSync(pO, 'utf8')));
				const mk = Object.keys(fe).filter((k) => !(k in fo));
				const ok = Object.keys(fo).filter((k) => !(k in fe));
				for (const k of mk) blockers.push(`${other}/${file}: missing key vs ${en}: ${k}`);
				for (const k of ok) blockers.push(`${other}/${file}: extra key vs ${en}: ${k}`);
				for (const k of Object.keys(fe)) {
					if (!(k in fo)) continue;
					const te = Array.isArray(fe[k]) ? 'array' : typeof fe[k];
					const to = Array.isArray(fo[k]) ? 'array' : typeof fo[k];
					if (te !== to) blockers.push(`${other}/${file}: type mismatch at ${k}: ${en}=${te} ${other}=${to}`);
				}
			}
		}
	}

	if (parseErrors.length) {
		console.error('JSON parse errors:\n', parseErrors.join('\n'));
	}
	if (blockers.length) {
		console.error('Validation failed:\n', blockers.join('\n'));
	}
	if (info.length) {
		console.warn('Informational (empty {} or [] in tree):\n', info.join('\n'));
	}

	if (parseErrors.length || blockers.length) {
		process.exit(1);
	}
	console.log(`OK: ${langs.length} locale(s), all JSON valid, keys aligned, no disallowed empty values.`);
}

main();
