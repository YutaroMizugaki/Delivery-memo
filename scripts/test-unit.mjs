/**
 * 検索正規化・ハイライト・サニタイズのユニットテスト（ブラウザ不要）
 */
import { normalize, highlight } from '../js/search.js';
import { sanitizeRecords } from '../js/storage.js';

let failed = 0;

function assert(condition, message) {
  if (!condition) {
    failed += 1;
    console.error('FAIL:', message);
  } else {
    console.log('ok:', message);
  }
}

// --- normalize ---
assert(normalize('豊州') === '豊洲', '豊州 → 豊洲');
assert(normalize('ブランズ タワー') === 'ブランズタワー', '空白除去');
assert(normalize('BRANZ Tower') === 'ブランズタワー', '英語エイリアス');
assert(normalize('hills') === 'ヒルズ', 'hills が hill に食われない');
assert(normalize('towers') === 'タワー', 'towers が tower に食われない');
assert(normalize('あお山') === 'アオ山', 'ひらがな→カタカナ');
assert(normalize('ＴＯＹＯＳＵ') === '豊洲', '全角＋エイリアス');

// --- highlight ---
const marked = highlight('パークタワー勝どきサウス', '勝どき');
assert(marked.includes('<mark>勝どき</mark>'), '日本語クエリのハイライト');

const aliasMark = highlight('BRANZ Tower 豊洲', 'branz');
assert(aliasMark.includes('<mark>'), 'エイリアス検索でもハイライトされる');
assert(!aliasMark.includes('undefined'), 'ハイライトに undefined が混入しない');

const spaceMark = highlight('パーク タワー', 'パークタワー');
assert(spaceMark.includes('<mark>'), '空白正規化後もハイライト可能');

// --- sanitize ---
const sanitized = sanitizeRecords([
  { name: 'A', permit: 1, procReq: 'weird', procOut: '旧フィールド' },
  { id: 'dup', name: 'B' },
  { id: 'dup', name: 'C' },
]);
assert(sanitized[0].permit === true, 'permit を boolean 化');
assert(sanitized[0].procReq === 'required', '不正な procReq をデフォルトへ');
assert(sanitized[0].notes.includes('旧フィールド'), 'procOut を notes へ移行');
assert(sanitized[1].id === 'dup', '先頭の id は維持');
assert(sanitized[2].id !== 'dup', '重複 id を振り直し');
assert(sanitized[2].id.startsWith('imp-'), '振り直し id のプレフィックス');

if (failed) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log('\nAll unit tests passed');
