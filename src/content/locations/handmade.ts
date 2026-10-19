import type { FriendId, HandmadeId, Terrain } from '../../core/state';
import type { DialogueLine } from '../story/types';

/** 手工地點（spec 6.3）：名稱、地形、場景版型、居民、請求種類與專屬對話。 */
export const HANDMADE: Record<HandmadeId, {
  name: string;
  terrain: Terrain;
  scene: { layout: 0 | 1 };
  resident: FriendId | 'passerby';
  request: { kind: 'find' } | { kind: 'bring' };
  talk: DialogueLine[];
}> = {
  'bamboo-path': {
    name: '竹林小徑',
    terrain: 'bamboo',
    scene: { layout: 0 },
    resident: 'manman',
    request: { kind: 'find' },
    talk: [
      { speaker: 'manman', text: '哎呀，新朋友來啦。我是慢慢，這條小徑的老住戶了。走得慢，但沒有一片竹葉逃得過我的眼睛。' },
      { speaker: 'panda', pose: 'blush', text: '……慢慢你好，我是熊貓。我在找一樣東西。' },
      { speaker: 'manman', text: '找東西的人我見多了。大多是找鑰匙，偶爾是找心情。你找的是什麼？' },
      { speaker: 'panda', text: '一顆會發光的墜飾，原本扣在我的項圈上。' },
      { speaker: 'manman', text: '竹林裡藏東西很容易，藏得太好，連竹子自己都忘了。幫我找找看吧，我記得有一處的竹葉顏色不太對。' },
      { speaker: 'narrator', text: '慢慢慢慢地眨了一下眼睛，像是把一個秘密收回了殼裡。' },
    ],
  },
  'cloud-post': {
    name: '雲朵郵局',
    terrain: 'cloud',
    scene: { layout: 1 },
    resident: 'mianhua',
    request: { kind: 'bring' },
    talk: [
      { speaker: 'mianhua', text: '歡迎來到雲朵郵局！我是棉花，負責把信送到每一朵雲上。今天的信袋特別沉，大概裝了太多想念。' },
      { speaker: 'panda', text: '這裡的信都是飄著送的嗎？' },
      { speaker: 'mianhua', text: '當然，不飄怎麼叫雲朵郵局。不過有一封信很奇怪，寄件人寫著「慢慢老師」，收件人卻是你的項圈。' },
      { speaker: 'panda', pose: 'starEyes', text: '我的項圈？慢慢老師說扣環是空的，就是因為少了那顆墜飾。' },
      { speaker: 'mianhua', text: '那就對了。信裡還提到一組三位數的密碼，要用場景裡的線索推出來，信箱才會打開。' },
      { speaker: 'mianhua', text: '打開之後，麻煩你幫我帶一份點心來。甜的最好，我飛了一早上，肚子咕嚕咕嚕叫。' },
    ],
  },
  'shell-bay': {
    name: '貝殼灣',
    terrain: 'beach',
    scene: { layout: 0 },
    resident: 'passerby',
    request: { kind: 'find' },
    talk: [
      { speaker: 'passerby', text: '欸，你是那隻戴金項圈的熊貓吧？海風都在傳了。' },
      { speaker: 'panda', text: '傳什麼？' },
      { speaker: 'passerby', text: '說有人在找一顆會發光的墜飾。我今早撿到一個貝殼，裡面亮亮的，說不定跟你的項圈有關。' },
      { speaker: 'panda', pose: 'starEyes', text: '真的嗎？慢慢老師說的就是這種東西！' },
      { speaker: 'passerby', text: '貝殼灣的影子很多，東西會藏在影子裡，要把形狀對起來才看得見。你幫我找找沙灘上那些不太對勁的影子吧。' },
      { speaker: 'narrator', text: '遠處的海浪一下一下，像在替誰數著拍子。' },
    ],
  },
};

/** 手工地點的祕密類型；dailyLayout（Task 4）以此常數決定覆寫，不另行硬編。 */
export const HANDMADE_SECRET: Record<HandmadeId, 'hidden' | 'codelock' | 'shadow'> = {
  'bamboo-path': 'hidden',
  'cloud-post': 'codelock',
  'shell-bay': 'shadow',
};
