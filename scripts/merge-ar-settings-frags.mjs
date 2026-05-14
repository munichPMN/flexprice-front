/**
 * Deep-merge Arabic fragment JSON files into ar/settings.json (UTF-8).
 * Usage: node scripts/merge-ar-settings-frags.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

function deepMerge(target, source) {
	for (const [k, v] of Object.entries(source)) {
		if (
			v &&
			typeof v === 'object' &&
			!Array.isArray(v) &&
			target[k] &&
			typeof target[k] === 'object' &&
			!Array.isArray(target[k])
		) {
			deepMerge(target[k], v);
		} else {
			target[k] = v;
		}
	}
	return target;
}

const root = path.resolve('.');
const arPath = path.join(root, 'src/i18n/locales/ar/settings.json');
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

for (const f of [
	'scripts/ar-settings-frag-insights.json',
	'scripts/ar-settings-frag-core.json',
	'scripts/ar-settings-frag-connection.json',
]) {
	const p = path.join(root, f);
	deepMerge(ar, JSON.parse(fs.readFileSync(p, 'utf8')));
}

fs.writeFileSync(arPath, `${JSON.stringify(ar, null, '\t')}\n`, 'utf8');
console.log('Wrote', arPath);
