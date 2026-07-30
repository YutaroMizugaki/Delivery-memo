export const STORAGE_KEY = 'delivery-memo-records';
export const SHARED_KEY = 'delivery-memo-shared';
export const SIMILAR_THRESHOLD = 0.55;
export const SEARCH_DEBOUNCE_MS = 150;
export const APP_VERSION = 2;

export const AREAS = ['豊洲', '晴海', '勝どき', '青山', '麻布台', '麻布', '日本橋', '虎ノ門', '六本木', 'その他'];
export const TIMES = ['—', '約3分', '約5分', '約5〜20分', '約10分', '約10〜15分', '約10〜20分', '約15分', '約15〜20分', '約20分', '約30分'];
export const HOURS_OPTS = ['', '9:00〜17:00', '9:00〜18:00', '9:00〜21:00', '24時間', 'その他'];
export const FILTER_AREAS = ['豊洲', '晴海', '勝どき', '青山', '麻布台'];

export const FILTER_CHIPS = [
  { key: 'cart', label: '🛒 台車で変わる' },
  { key: 'proc', label: '⚠ 手続き必要' },
  { key: 'hours', label: '🌙 時間外で変わる' },
];

// 検索用に各バリエーションを正規形へ畳み込む（双方向置換はしない）
export const KANJI_FOLD = [
  [/豊州/g, '豊洲'],
  [/ヶ/g, 'ケ'],
  [/ヵ/g, 'カ'],
  [/・/g, ''],
  [/　/g, ' '],
  [/ /g, ''],
];

export const ALIASES = {
  branz: 'ブランズ',
  brands: 'ブランズ',
  tower: 'タワー',
  towers: 'タワー',
  kachidoki: '勝どき',
  toyosu: '豊洲',
  harumi: '晴海',
  aoyama: '青山',
  azabu: '麻布',
  roppongi: '六本木',
  toranomon: '虎ノ門',
  nihonbashi: '日本橋',
  park: 'パーク',
  hill: 'ヒルズ',
  hills: 'ヒルズ',
  residence: 'レジデンス',
  ciel: 'シエル',
  flag: 'フラッグ',
  grand: 'グランド',
  mid: 'ミッド',
  south: 'サウス',
};

export const RECORD_FIELDS = [
  'id', 'name', 'area', 'time', 'permit', 'cash', 'parking', 'proc',
  'procReq', 'hours', 'hoursDiffers', 'procOut', 'cartDiffers', 'cartNo', 'cartYes', 'notes',
  'updatedAt',
];

export const TEXT_FIELDS = ['name', 'area', 'time', 'parking', 'proc', 'hours', 'procOut', 'cartNo', 'cartYes', 'notes'];
export const CHECK_FIELDS = ['permit', 'cash', 'cartDiffers', 'hoursDiffers'];
export const SELECT_FIELDS = ['area', 'time', 'hours'];
