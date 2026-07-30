function createRecord(name, area, time, overrides = {}) {
  return {
    id: `seed-${name.replace(/\s/g, '')}`,
    name,
    area,
    time: time || '—',
    permit: false,
    cash: false,
    parking: '',
    proc: '',
    route: '',
    procReq: 'required',
    cartDiffers: false,
    cartNo: '',
    cartYes: '',
    notes: '',
    updatedAt: '2026-01-15T09:00:00.000Z',
    ...overrides,
  };
}

export function seedData() {
  return [
    createRecord('豊洲シエルタワー', '豊洲', '約10分', {
      permit: true,
      parking: '地下駐車場B2（許可証必要）',
      proc: '1F東エレ付近。B2→1F、上がってすぐ右手の防災センター',
      route: 'センターで許可証提示→案内されたエレベーターで配送先階',
      notes: 'エレベーター混雑注意',
    }),
    createRecord('ザ・豊洲タワー', '豊洲', '約10〜15分', {
      permit: true,
      parking: '来客用駐車場（要許可証）',
      proc: '管理室で手続き後、案内に従う',
    }),
    createRecord('晴海フラッグパークビレッジ', '晴海', '約5〜20分', {
      procReq: 'conditional',
      cartDiffers: true,
      cartNo: '台車不可エリアあり。1F受付で確認',
      cartYes: '台車使用可ルートあり。受付で申告',
      proc: '1F受付（防災センター）。正面入口から入ってすぐ',
      route: '受付通過後、案内に従って各棟・各階へ',
      notes: '21時以降は防災センター閉鎖のため宅配ボックス利用',
    }),
    createRecord('パークタワー勝どきサウス', '勝どき', '約20分', {
      permit: true,
      parking: '地下駐車場',
      proc: '防災センターで手続き',
      notes: '大型荷物は事前連絡推奨',
    }),
    createRecord('クラス青山', '青山', '約10〜20分', {
      procReq: 'conditional',
      parking: '近隣コインパーキング',
      proc: '1Fコンシェルジュに声かけ',
    }),
    createRecord('麻布台ヒルズ アマンレジデンス', '麻布台', '約20分', {
      parking: '専用駐車場なし。近隣P利用',
      proc: 'セキュリティゲート通過→管理室',
      notes: 'セキュリティ厳重',
    }),
    createRecord('ブランズタワー豊洲', '豊洲', '約15分', {
      parking: '来客駐車場1台',
      proc: '管理室で来客登録',
    }),
    createRecord('ブリリアイストタワー勝どき', '勝どき', '約15〜20分', {
      parking: '地下駐車場',
      proc: '防災センター手続き',
    }),
    createRecord('晴海フラッグサンビレッジT棟', '晴海', '約15分', {
      permit: true,
      parking: '許可証駐車場',
      proc: '管理室で手続き',
    }),
    createRecord('ブランズ麻布狸穴町', '麻布', '約3分', {
      procReq: 'notRequired',
      parking: '路上不可。近隣P',
      proc: 'インターホンで呼び出し',
    }),
    createRecord('パークタワー勝どきミッド', '勝どき', '約20分', {
      parking: '地下駐車場',
      proc: '防災センター',
    }),
    createRecord('パークアクシスプレミア 日本橋室町', '日本橋', '約20分', {
      parking: '近隣P',
      proc: '1F受付',
    }),
    createRecord('虎ノ門ヒルズ レジデンシャルタワー', '虎ノ門', '約20分', {
      parking: '地下駐車場',
      proc: '1F防災センター。駐車場→エレベーターで1F',
      route: 'オフィスタワー側受付経由→レジデンシャル棟エレベーター',
      notes: 'ルート複雑注意',
    }),
    createRecord('六本木ヒルズ森タワー', '六本木', '約15分', {
      cash: true,
      parking: '森タワー地下',
      proc: '防災センター。現金精算あり',
      notes: '現金が必要な場合あり',
    }),
    createRecord('ミッドタワーグランド', '勝どき', '約15分', {
      parking: '地下駐車場',
      proc: '防災センター',
    }),
    createRecord('アークヒルズ仙石山レジデンス', '六本木', '約30分', {
      cash: true,
      parking: '専用駐車場',
      proc: 'ゲート通過→管理室。現金精算あり',
      notes: '所要時間長め',
    }),
    createRecord('勝どきビュータワー', '勝どき', '約15分', {
      parking: '地下駐車場',
      proc: '防災センター',
    }),
    createRecord('スカイズタワー&ガーデン', '豊洲', '約15分', {
      permit: true,
      parking: '許可証駐車場',
      proc: '管理室',
    }),
    createRecord('マッカーサタワー', 'その他', '—', {
      procReq: 'conditional',
      notes: '手順要確認',
      updatedAt: '2025-10-01T09:00:00.000Z',
    }),
  ];
}
