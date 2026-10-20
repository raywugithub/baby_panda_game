import type { DialogueScript } from './types';

/** 項圈線索（主線 ch1–ch5 各給一個，放進相簿）。 */
export const COLLAR_CLUES: { id: 'clue-collar-1' | 'clue-collar-2' | 'clue-collar-3' | 'clue-collar-4' | 'clue-collar-5'; name: string }[] = [
  { id: 'clue-collar-1', name: '刻字的扣環' },
  { id: 'clue-collar-2', name: '會發光的碎片' },
  { id: 'clue-collar-3', name: '藏在內側的地圖' },
  { id: 'clue-collar-4', name: '慢慢老師的信' },
  { id: 'clue-collar-5', name: '遠方傳來的鈴聲' },
];

/** 主線五章：每章 8–10 句、一張場景插圖、一個線索（最後三句提到線索名稱）。 */
export const CHAPTER_SCRIPTS: Record<'ch1' | 'ch2' | 'ch3' | 'ch4' | 'ch5', DialogueScript> = {
  ch1: {
    id: 'ch1',
    illustration: 'bamboo-path',
    lines: [
      { speaker: 'narrator', text: '竹林小徑的風很輕，輕到竹葉落下來之前都要先想一想。' },
      { speaker: 'panda', pose: 'blush', text: '我把項圈湊到陽光底下，扣環內側好像有東西在反光。' },
      { speaker: 'manman', text: '這個扣環原本扣著一顆會發光的墜飾，是從很遠的地方來的。不過你說得對，它內側確實有字。' },
      { speaker: 'panda', pose: 'stare', text: '字？我怎麼看不到？我的眼睛很圓，但不是放大鏡。' },
      { speaker: 'manman', text: '圓眼睛看不清楚，那就換慢一點的眼睛。竹影會把細小的刻痕照出來，等太陽慢慢移過竹葉縫就好。' },
      { speaker: 'narrator', text: '慢慢老師伸出一片竹葉，輕輕擋住一道光。影子落在扣環上，一排細細的字浮了出來。' },
      { speaker: 'panda', pose: 'starEyes', text: '「回家的路，在第七顆星下面。」……第七顆星是哪一顆？' },
      { speaker: 'manman', text: '我年紀大了，記得的星星只有三顆半。剩下的，要靠你自己去找。' },
      { speaker: 'panda', pose: 'shy', text: '好，第一條線索我記下了。這次是腦袋先動，鼻子跟上。' },
      { speaker: 'narrator', text: '「刻字的扣環」被收進相簿的第一頁，陽光底下閃了一下，像是也很期待下一站。' },
    ],
  },
  ch2: {
    id: 'ch2',
    illustration: 'cloud-post',
    lines: [
      { speaker: 'narrator', text: '雲朵郵局的信箱上掛著一把數字鎖，三個轉輪歪歪的，像是被風推過。' },
      { speaker: 'mianhua', text: '密碼是慢慢老師寫的：前面是他記得的星星數（只取整數），後面兩位是第七顆星的七。' },
      { speaker: 'panda', pose: 'starEyes', text: '慢慢說過「三顆半」！取整數就是三，所以是三、七、七？' },
      { speaker: 'mianhua', text: '別急呀，雲上的數字可不是一次就對的。我試過七、七、七，信箱只會打嗝。' },
      { speaker: 'panda', pose: 'sit', text: '那要怎麼辦？我的爪子只會按按鈕，不會算數學。' },
      { speaker: 'gulu', text: '讓我來！我是咕嚕，愛發明的刺蝟。我做了一個回音裝置，轉輪每轉一格，都會發出不同的聲音。' },
      { speaker: 'narrator', text: '咕嚕把一顆小鈴鐺似的裝置貼在信箱上。叮、咚、叮三聲過後，轉輪乖乖停在三、七、七。' },
      { speaker: 'mianhua', text: '信箱開了！裡面有一封信，還有一小塊用雲絲包起來的碎片。' },
      { speaker: 'panda', pose: 'starEyes', text: '碎片亮亮的，像是一小段被關起來的星光。' },
      { speaker: 'narrator', text: '「會發光的碎片」被小心放進相簿，在裡面一閃一閃，像是在跟熊貓的項圈打招呼。' },
    ],
  },
  ch3: {
    id: 'ch3',
    illustration: 'shell-bay',
    lines: [
      { speaker: 'narrator', text: '貝殼灣的沙灘被海風梳得整整齊齊，只有一排影子歪了一下。' },
      { speaker: 'juzi', text: '歡迎來到貝殼灣！我是橘子，糖果店的老闆。今天的招牌是海鹽焦糖，甜得剛剛好。' },
      { speaker: 'panda', pose: 'blush', text: '我不是來買糖的，是來找一樣東西。慢慢老師說它原本掛在我的項圈上。' },
      { speaker: 'juzi', text: '慢慢老師？就是那個說故事說到一半會睡著的烏龜？' },
      { speaker: 'juzi', text: '好吧。貝殼灣的影子會把東西藏起來，要對準形狀才看得見。昨天有人在這裡掉了一顆糖，糖紙背面畫了一條線。' },
      { speaker: 'narrator', text: '橘子把糖紙翻過來，背面畫著歪歪的海岸線，和沙灘上的影子嚴絲合縫。' },
      { speaker: 'panda', pose: 'starEyes', text: '這是地圖！而且是從糖紙裡拿出來的地圖……' },
      { speaker: 'juzi', text: '地圖的線一路往山上爬，盡頭畫著一間小木屋，就在雪山上。藏得越小的東西，越要仔細拆。' },
      { speaker: 'narrator', text: '摺得小小的「藏在內側的地圖」被攤開在沙灘上，海浪把邊角輕輕捲走一點點，像在催你快出發。' },
    ],
  },
  ch4: {
    id: 'ch4',
    illustration: 'snow/lm-cabin',
    lines: [
      { speaker: 'narrator', text: '雪山上的小木屋煙囪冒著白煙，門口掛著一塊木牌：「慢慢來，雪會等你。」' },
      { speaker: 'panda', pose: 'shy', text: '這裡……慢慢老師居然比我先到？' },
      { speaker: 'manman', text: '我不是比你先到，是比雪先到。烏龜爬山很有效率的，只是沒人看見過程。' },
      { speaker: 'panda', text: '那你為什麼不在竹林等我？' },
      { speaker: 'manman', text: '有些話，我只能用信寫。信在壁爐旁邊，等你的爪子暖和了再拿。' },
      { speaker: 'passerby', text: '欸，你是那隻戴金項圈的熊貓吧？我在山腳下聽到風在傳你的名字。' },
      { speaker: 'panda', pose: 'starEyes', text: '風會傳名字？這座山真的很會說話。' },
      { speaker: 'narrator', text: '熊貓走到壁爐旁，信封被火光烤得暖暖的，寫著：「給墜飾的主人」。' },
      { speaker: 'manman', text: '墜飾不是丟了，是被人寄來的。它來自很遠的地方，來的時候還會發光，像一顆不肯熄的小星星。' },
      { speaker: 'narrator', text: '熊貓拆開「慢慢老師的信」，信紙上只寫了一句話：「別回頭，遠方的鈴聲在等你。」' },
    ],
  },
  ch5: {
    id: 'ch5',
    illustration: 'starlake/lm-star-well',
    lines: [
      { speaker: 'narrator', text: '星湖的水面平得像一面鏡子，每一顆星星都在偷偷照自己，順便照熊貓。' },
      { speaker: 'panda', pose: 'blush', text: '慢慢老師說，只要聽見遠方的鈴聲，墜飾就在附近。可我站了半天，只聽到青蛙在打哈欠。' },
      { speaker: 'gulu', text: '那是因為你用耳朵聽。我做了一個聲波收音器，要靠井水的回音來對準方向。' },
      { speaker: 'gulu', text: '星井就在湖心，丟一顆石頭下去，水會把聲音折回來。準備好了嗎？' },
      { speaker: 'panda', pose: 'starEyes', text: '丟東西我最在行，尤其是丟不準的那種。' },
      { speaker: 'gulu', text: '噓，安靜。井裡……有鈴聲！' },
      { speaker: 'mianhua', text: '這個聲音從天上來，也從井底來。我在雲上送信的時候，好像聽過同樣的音調。' },
      { speaker: 'manman', text: '墜飾曾經屬於一位旅人。他把心上最亮的一顆星寄了過來，順著風，寄到了你的項圈上。他自己呢？去了哪裡，我還不知道。' },
      { speaker: 'panda', pose: 'shy', text: '所以我的家在星星的另一邊？' },
      { speaker: 'narrator', text: '井水輕輕晃了一下，「遠方傳來的鈴聲」又響了一次，這次聽起來像在說：「快來找我。」' },
    ],
  },
};
