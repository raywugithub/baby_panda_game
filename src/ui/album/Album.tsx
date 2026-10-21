import { useState } from 'preact/hooks';
import { ItemsTab } from './ItemsTab';
import { RecipesTab } from './RecipesTab';
import { FriendCardsTab } from './FriendCardsTab';
import { StampsTab } from './StampsTab';
import { PhotosTab } from './PhotosTab';
import { DiaryTab } from './DiaryTab';

// 相簿分頁順序（規格）：朋友卡、物品圖鑑、食譜、地點印章、回憶照片、熊貓日記。
type AlbumTab = 'friends' | 'items' | 'recipes' | 'stamps' | 'photos' | 'diary';
const TABS: { key: AlbumTab; label: string }[] = [
  { key: 'friends', label: '朋友卡' },
  { key: 'items', label: '物品圖鑑' },
  { key: 'recipes', label: '食譜' },
  { key: 'stamps', label: '地點印章' },
  { key: 'photos', label: '回憶照片' },
  { key: 'diary', label: '熊貓日記' },
];

export function Album() {
  const [tab, setTab] = useState<AlbumTab>('items');
  return (
    <div class="album">
      <div class="album-tabs" role="group" aria-label="相簿分頁">
        {TABS.map(t => (
          <button
            type="button"
            key={t.key}
            aria-pressed={tab === t.key}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'friends' ? <FriendCardsTab />
        : tab === 'items' ? <ItemsTab />
        : tab === 'recipes' ? <RecipesTab />
        : tab === 'stamps' ? <StampsTab />
        : tab === 'photos' ? <PhotosTab />
        : <DiaryTab />}
    </div>
  );
}
