import type { FriendId } from '../../core/state';
import type { DialogueLine, DialogueScript } from './types';

/**
 * 朋友專屬故事線：每位朋友 5 段，第 n 段於朋友等級 n 解鎖（Task 8 storySegmentsUnlocked）。
 * 每位朋友的第 5 段提到一次「項圈」，其餘段落不提。
 */
function segment(id: FriendId, n: number, lines: DialogueLine[]): [string, DialogueScript] {
  const key = `friend-${id}-${n}`;
  return [key, { id: key, lines }];
}

export const FRIEND_STORIES: Record<string, DialogueScript> = Object.fromEntries([
  // 棉花：一封一直沒送進去的信
  segment('mianhua', 1, [
    { speaker: 'mianhua', text: '山坡後面那戶的信箱，我已經三個禮拜沒好好送進去了。' },
    { speaker: 'mianhua', text: '信是寄給一位阿公的，寄件人是他住很遠的女兒。' },
    { speaker: 'panda', pose: 'stare', text: '那你為什麼沒送？郵差不是最勤快的嗎？' },
    { speaker: 'mianhua', text: '我每次走到門口就跑，跑得比誰都快，然後假裝忘了。' },
    { speaker: 'mianhua', text: '你別笑，這件事不寫在制服上，是我的小秘密。' },
  ]),
  segment('mianhua', 2, [
    { speaker: 'mianhua', text: '今天我又帶著信爬上山坡，阿公正在門口曬被子。' },
    { speaker: 'mianhua', text: '他一看到信就問：「是不是小美寄來的？」我嚇了一跳。' },
    { speaker: 'panda', pose: 'starEyes', text: '因為郵差的腳步聲很響吧？' },
    { speaker: 'mianhua', text: '才不是！我是怕他拆了信會哭，所以每次放下就跑。' },
    { speaker: 'mianhua', text: '這樣算不算很不合格的郵差？我自己也覺得有點丟臉。' },
  ]),
  segment('mianhua', 3, [
    { speaker: 'mianhua', text: '阿公說他眼睛還很好，只是懶得拆信，因為拆了就要回信。' },
    { speaker: 'panda', pose: 'shy', text: '回信？那你不是要跑兩趟？' },
    { speaker: 'mianhua', text: '我第一次發現，送信不只是跑，還要等。' },
    { speaker: 'mianhua', text: '所以我決定陪他坐一下，等他寫完，順便曬曬太陽。' },
    { speaker: 'panda', pose: 'sit', text: '郵差也會偷懶欸，我幫你記一筆。' },
  ]),
  segment('mianhua', 4, [
    { speaker: 'mianhua', text: '阿公寫完了，字歪歪的，像是用左手寫的。' },
    { speaker: 'mianhua', text: '他說：「女兒總說我慢，我就慢慢寫給她看。」' },
    { speaker: 'panda', pose: 'blush', text: '那這封回信會寄得很慢吧？' },
    { speaker: 'mianhua', text: '才不會。這一趟我要一路不停地跑下山，腳底都快冒煙了。' },
    { speaker: 'mianhua', text: '送信的時候要跑，等回信的時候要坐，我現在兩樣都會了。' },
  ]),
  segment('mianhua', 5, [
    { speaker: 'mianhua', text: '小美的回信寄到了！阿公笑得眼睛都瞇起來了。' },
    { speaker: 'mianhua', text: '他說這是今年最好的信，我說那是因為我今天跑得特別快。' },
    { speaker: 'panda', pose: 'starEyes', text: '你看，我的項圈也在閃，好像在替你們高興。' },
    { speaker: 'mianhua', text: '看見了！這才叫好郵差的待遇，比任何獎章都亮。' },
    { speaker: 'mianhua', text: '以後山坡後面的信箱，我每個禮拜都來擦一次。' },
  ]),

  // 橘子：一顆金色的糖，和一條快要撐不下去的店
  segment('juzi', 1, [
    { speaker: 'juzi', text: '今天店裡安靜到，我聽得見糖在融化的聲音。' },
    { speaker: 'juzi', text: '帳本上的數字紅紅的，我只好把折扣寫成八折、再八折。' },
    { speaker: 'panda', pose: 'stare', text: '八折再八折不是虧更多嗎？' },
    { speaker: 'juzi', text: '所以我才說，只賣給心情好的人。開玩笑的啦。' },
    { speaker: 'juzi', text: '其實我只是有點想念以前那些天天來的客人。' },
  ]),
  segment('juzi', 2, [
    { speaker: 'juzi', text: '櫃台底下那顆金色的糖，你還記得吧？我說過要等你猜。' },
    { speaker: 'panda', pose: 'starEyes', text: '我猜了三次，每次都猜成糖果本身。' },
    { speaker: 'juzi', text: '那是我奶奶留下的配方，她做的糖每顆都會讓人想起一件事。' },
    { speaker: 'juzi', text: '可是我試了好多次，總做不出一模一樣的。' },
    { speaker: 'panda', pose: 'shy', text: '做不一樣，不就是一顆新的糖嗎？' },
  ]),
  segment('juzi', 3, [
    { speaker: 'juzi', text: '我今天又試做了一鍋，結果變成一顆歪歪的大球。' },
    { speaker: 'panda', pose: 'blush', text: '這顆比你的招牌還可愛欸。' },
    { speaker: 'juzi', text: '你不要安慰我！我的臉都快燒起來了。' },
    { speaker: 'juzi', text: '不過……有個小孩拿著它看了半天，說它長得像月亮。' },
    { speaker: 'panda', pose: 'sit', text: '那他是不是買了？' },
  ]),
  segment('juzi', 4, [
    { speaker: 'juzi', text: '那天之後，我做了一種「歪歪糖」，不完美，但每顆都不一樣。' },
    { speaker: 'juzi', text: '售價一律十塊，不打折，因為歪的東西本來就不需要折扣。' },
    { speaker: 'panda', pose: 'stare', text: '你居然會說不打折？這是奇蹟。' },
    { speaker: 'juzi', text: '今天全賣光了，連我都有點不敢相信。' },
    { speaker: 'juzi', text: '原來客人要的不是最甜的糖，是有人認真替他做的那一顆。' },
  ]),
  segment('juzi', 5, [
    { speaker: 'juzi', text: '金色的糖，我終於做出來了，雖然形狀還是歪的。' },
    { speaker: 'juzi', text: '奶奶留的紙條寫著：「糖不是為了甜，是為了讓人想回來。」' },
    { speaker: 'panda', pose: 'starEyes', text: '那我下次來，要帶什麼回去？' },
    { speaker: 'juzi', text: '帶你的項圈來，我幫你把扣環擦亮，這次不收錢。' },
    { speaker: 'juzi', text: '不過金糖只給有耐心的人，你先乖乖排隊。' },
  ]),

  // 慢慢：一個十年沒有結局的故事
  segment('manman', 1, [
    { speaker: 'manman', text: '我有個故事，已經說了十年，還沒有結局。' },
    { speaker: 'panda', pose: 'stare', text: '十年？你的聽眾一定都睡著了吧。' },
    { speaker: 'manman', text: '不，他們都醒著，只是等得很累。' },
    { speaker: 'manman', text: '故事裡有一位旅人，他把心上最亮的一顆星寄了出去。' },
    { speaker: 'panda', pose: 'shy', text: '寄星星？那他自己呢？' },
  ]),
  segment('manman', 2, [
    { speaker: 'manman', text: '我不知道旅人最後去了哪裡，所以這個故事一直停在半路。' },
    { speaker: 'manman', text: '我寫過他走過竹林、爬過高山，每一段都寫得很慢。' },
    { speaker: 'panda', pose: 'sit', text: '那結局要怎麼辦？' },
    { speaker: 'manman', text: '我只寫到他把星星送出去，後面全是空白。' },
    { speaker: 'manman', text: '你覺得，空白的地方該寫什麼？' },
  ]),
  segment('manman', 3, [
    { speaker: 'manman', text: '我請熊貓幫忙想，結果你只寫了一句「要吃點心」。' },
    { speaker: 'panda', pose: 'blush', text: '這是很重要的結局！吃點心的時候，故事才會有溫度。' },
    { speaker: 'manman', text: '你說得也有道理。那我就讓旅人在一家糖果店停下來。' },
    { speaker: 'manman', text: '老闆是一隻狐狸，她說：「先吃一顆再說。」' },
    { speaker: 'panda', pose: 'starEyes', text: '這樣寫，橘子會來找你麻煩的。' },
  ]),
  segment('manman', 4, [
    { speaker: 'manman', text: '寫到這裡我才發現，結局不是我一個人決定的。' },
    { speaker: 'manman', text: '旅人也有自己的選擇，我只能陪他走到路口。' },
    { speaker: 'panda', pose: 'shy', text: '所以你不用一直等結局，它會自己來？' },
    { speaker: 'manman', text: '差不多。烏龜的結局，本來就是慢慢長出來的。' },
    { speaker: 'manman', text: '好，我要開始寫最後一章了，你幫我看看標點。' },
  ]),
  segment('manman', 5, [
    { speaker: 'manman', text: '故事寫完了。旅人把最亮的星星送出去，然後自己也出發了。' },
    { speaker: 'manman', text: '我在最後寫了一句：「星星不會熄，只會換個地方亮。」' },
    { speaker: 'panda', pose: 'starEyes', text: '所以我的項圈上那顆亮光，也是他的星星嗎？' },
    { speaker: 'manman', text: '答案要你自己走下去找。慢慢來，故事不會跑。' },
    { speaker: 'manman', text: '這一章，我寫的是你。' },
  ]),

  // 咕嚕：一台說不出話的機器，和一個很想有人來的工作室
  segment('gulu', 1, [
    { speaker: 'gulu', text: '我的找襪子裝置進度是四分之一，你覺得它會成功嗎？' },
    { speaker: 'panda', pose: 'stare', text: '我覺得它比襪子還難找，你把它藏在鍋子裡。' },
    { speaker: 'gulu', text: '那是因為鍋子比較安靜，沒人會來打擾我。' },
    { speaker: 'gulu', text: '其實……我最近常常一個人在工作室，安靜到有點吵。' },
    { speaker: 'panda', pose: 'shy', text: '你是想要有人陪你吧？' },
  ]),
  segment('gulu', 2, [
    { speaker: 'gulu', text: '我偷偷在做一台會說話的機器，暫時叫它「小刺」。' },
    { speaker: 'gulu', text: '目前它只會說一句話：「爆炸！」' },
    { speaker: 'panda', pose: 'starEyes', text: '那你得先修它的嘴巴。' },
    { speaker: 'gulu', text: '我把杯子的聲音拆下來裝進去，結果它變成在唱歌。' },
    { speaker: 'panda', pose: 'sit', text: '好有活力，跟你一樣。' },
  ]),
  segment('gulu', 3, [
    { speaker: 'gulu', text: '我試了三次，小刺每次都把我的刺當成開關，全部翹起來了。' },
    { speaker: 'panda', pose: 'blush', text: '翹起來很可愛，不過你會不會痛？' },
    { speaker: 'gulu', text: '痛是小事，最糟的是它唱到半夜，我完全睡不著。' },
    { speaker: 'gulu', text: '我想，它要的也許不是完美的聲音，而是有人聽它。' },
    { speaker: 'panda', pose: 'stare', text: '那我來聽，你來調整。' },
  ]),
  segment('gulu', 4, [
    { speaker: 'gulu', text: '我們一起把嘴巴的線路重新接過，小刺終於會說話了。' },
    { speaker: 'gulu', text: '它第一句話是：「你來了。」我差點把螺絲掉進鍋子裡。' },
    { speaker: 'panda', pose: 'starEyes', text: '它比你還會說感性的話欸。' },
    { speaker: 'gulu', text: '我原本想做一個陪我的機器，結果發現我真正想要的，是有人來敲門。' },
    { speaker: 'gulu', text: '所以以後你來的時候，記得先敲門，小刺會嚇到。' },
  ]),
  segment('gulu', 5, [
    { speaker: 'gulu', text: '小刺現在會提醒我吃飯，我總算有個會吵我的夥伴了。' },
    { speaker: 'gulu', text: '我還幫你做了一個小發明，讓項圈的扣環不會再夾到毛。' },
    { speaker: 'panda', pose: 'blush', text: '咕嚕，你真的是最會替別人想的發明家。' },
    { speaker: 'gulu', text: '那當然。發明的第一步是懷疑，第二步是替朋友把東西修好。' },
    { speaker: 'gulu', text: '下次來工作室，記得先敲門，然後我們再一起炸一次鍋。' },
  ]),
]);
