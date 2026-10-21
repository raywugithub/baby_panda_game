import type { Ability, Terrain } from '../core/state';

/** 地形：noun 用於地名（phrase + noun）；ability 為進入門檻（null 表示不加門檻）；每種 2 版型 */
export const TERRAINS: { id: Terrain; noun: string; ability: Ability | null; layouts: 2 }[] = [
  { id: 'bamboo', noun: '竹林', ability: 'climb', layouts: 2 },
  { id: 'beach', noun: '海岸', ability: 'dive', layouts: 2 },
  { id: 'cloud', noun: '雲梯', ability: null, layouts: 2 },
  { id: 'snow', noun: '雪山', ability: null, layouts: 2 },
  { id: 'mushroom', noun: '蘑菇林', ability: 'climb', layouts: 2 },
  { id: 'starlake', noun: '星湖', ability: 'dive', layouts: 2 },
];

export const WEATHERS: { id: 'sunny' | 'rain' | 'fog' | 'snow' | 'rainbow'; name: string }[] = [
  { id: 'sunny', name: '晴' },
  { id: 'rain', name: '雨' },
  { id: 'fog', name: '霧' },
  { id: 'snow', name: '下雪' },
  { id: 'rainbow', name: '彩虹' },
];

export const LANDMARKS: { id: string; name: string }[] = [
  { id: 'lm-treehouse', name: '樹屋' },
  { id: 'lm-stone-bridge', name: '石橋' },
  { id: 'lm-windmill', name: '風車' },
  { id: 'lm-lighthouse', name: '燈塔' },
  { id: 'lm-firefly-lamp', name: '螢火燈籠' },
  { id: 'lm-cabin', name: '小木屋' },
  { id: 'lm-swing-tree', name: '鞦韆樹' },
  { id: 'lm-waterwheel', name: '水車' },
  { id: 'lm-sky-garden', name: '空中花園' },
  { id: 'lm-giant-mushroom', name: '巨菇' },
  { id: 'lm-pavilion', name: '小涼亭' },
  { id: 'lm-star-well', name: '流星井' },
];

/** 怪事：phrase 接在地名前（phrase + noun）；event 為發現時的一句話 */
export const QUIRKS: { id: string; phrase: string; event: string }[] = [
  { id: 'q01', phrase: '會唱歌的', event: '歌聲聽起來像在打哈欠，唱到一半還會停下來喘口氣' },
  { id: 'q02', phrase: '打呵欠的', event: '一打呵欠，附近的花就全都合上了' },
  { id: 'q03', phrase: '下糖果雨的', event: '天上掉下的糖果雨，只有一顆是酸的' },
  { id: 'q04', phrase: '倒著走路的', event: '走了半天才發現，大家都在往後退' },
  { id: 'q05', phrase: '愛收集襪子的', event: '樹洞裡堆滿了失散的襪子，主人都在找' },
  { id: 'q06', phrase: '會打嗝冒泡的', event: '每打一個嗝，地上就長出一朵小泡泡花' },
  { id: 'q07', phrase: '怕影子的', event: '太陽一照，石頭們就躲到草叢後面去了' },
  { id: 'q08', phrase: '會讀心的', event: '石頭似乎知道你接下來想去哪裡' },
  { id: 'q09', phrase: '排隊排很久的', event: '一群蘑菇在等一隻不存在的蝸牛' },
  { id: 'q10', phrase: '偷偷換位置的', event: '每次回頭看，路牌都換了一個方向' },
  { id: 'q11', phrase: '愛迷路的', event: '指南針在這裡轉得像跳舞一樣' },
  { id: 'q12', phrase: '長出音符的', event: '微風吹過，樹葉上就長出一串小音符' },
  { id: 'q13', phrase: '會發光的', event: '夜裡的石頭一顆顆亮起來，像在交換暗號' },
  { id: 'q14', phrase: '喜歡跳舞的', event: '所有的小草都在隨風擺動，節奏剛剛好' },
  { id: 'q15', phrase: '會鑽洞的', event: '地底下傳來咚咚聲，大概是寶藏在敲門' },
  { id: 'q16', phrase: '把雲當被子的', event: '天上的雲被蓋得鬆鬆軟軟，還冒著熱氣' },
  { id: 'q17', phrase: '愛數雲朵的', event: '雲朵一朵一朵被數過，數到一半就睡著了' },
  { id: 'q18', phrase: '會說悄悄話的', event: '風在耳邊小聲說，今天的秘密是蘋果派' },
  { id: 'q19', phrase: '愛打盹的', event: '樹一打盹，整片葉子就跟著慢慢垂下來' },
  { id: 'q20', phrase: '會倒數的', event: '每走一步，遠方的燈塔就眨一下眼睛' },
];
