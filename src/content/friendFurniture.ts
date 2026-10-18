import type { FriendId } from '../core/state';

/** 朋友專屬家具表：好感度等級 3／6／10 由 core/friends.ts 的 addAffinity 發放，不在禮盒池。 */
export interface FriendFurnitureRow {
  friendId: FriendId;
  level: number;
  itemId: string;
  name: string;
  size: { w: number; h: number };
  wallMounted?: boolean;
  hint: string;
}

export const FRIEND_FURNITURE: FriendFurnitureRow[] = [
  { friendId: 'mianhua', level: 3, itemId: 'furn-mianhua-1', name: '郵筒', size: { w: 1, h: 1 }, hint: '棉花寄來的信都會先放在這裡…' },
  { friendId: 'mianhua', level: 6, itemId: 'furn-mianhua-2', name: '信件櫃', size: { w: 2, h: 1 }, hint: '一封一封整整齊齊，都是寫給你的…' },
  { friendId: 'mianhua', level: 10, itemId: 'furn-mianhua-3', name: '郵差小推車', size: { w: 2, h: 1 }, hint: '每天早上推著它送信，叮叮噹噹的…' },
  { friendId: 'juzi', level: 3, itemId: 'furn-juzi-1', name: '糖果罐', size: { w: 1, h: 1 }, hint: '打開蓋子就飄出橘子糖的香味…' },
  { friendId: 'juzi', level: 6, itemId: 'furn-juzi-2', name: '糖果櫃檯', size: { w: 2, h: 1 }, hint: '擺滿了亮晶晶的糖果，橘子最愛站在這裡…' },
  { friendId: 'juzi', level: 10, itemId: 'furn-juzi-3', name: '狐狸燈籠', size: { w: 1, h: 1 }, wallMounted: true, hint: '掛在牆上，橘色的光暖暖的…' },
  { friendId: 'manman', level: 3, itemId: 'furn-manman-1', name: '烏龜石', size: { w: 1, h: 1 }, hint: '慢慢最愛坐在上面曬太陽，一動也不動…' },
  { friendId: 'manman', level: 6, itemId: 'furn-manman-2', name: '故事書櫃', size: { w: 2, h: 1 }, hint: '慢慢最喜歡的故事都收在這裡…' },
  { friendId: 'manman', level: 10, itemId: 'furn-manman-3', name: '龜殼帳篷', size: { w: 2, h: 2 }, hint: '背著家走路的小帳篷，裡面軟軟的…' },
  { friendId: 'gulu', level: 3, itemId: 'furn-gulu-1', name: '發明工作台', size: { w: 2, h: 1 }, hint: '咕嚕的點子都是在這張桌上誕生的…' },
  { friendId: 'gulu', level: 6, itemId: 'furn-gulu-2', name: '齒輪掛鐘', size: { w: 1, h: 1 }, wallMounted: true, hint: '齒輪一轉一轉，滴答滴答…' },
  { friendId: 'gulu', level: 10, itemId: 'furn-gulu-3', name: '小機器人', size: { w: 1, h: 1 }, hint: '咕嚕做的第一個朋友，會嗶嗶地打招呼…' },
];
