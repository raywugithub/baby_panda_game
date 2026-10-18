import type { ComponentType } from 'preact';
import { BambooPendant, NestArt, LowTableArt, CushionArt } from './starter-art';
import {
  BambooShelf, PlantPot, Lantern, ToyBox, Rug, BambooChair, Lamp, Cabinet, SnackBasket, BambooFence,
  MushroomStool, FlowerVase, Sofa, Bed, Swing, ReadingNook, Bookshelf, Clock, Hammock, Beanbag, Fountain,
} from './furniture';

/** 物品圖登記表；沒有登記的 id 不會被渲染。 */
export const ITEM_ART: Record<string, ComponentType<{ size: number }>> = {
  'pendant-bamboo': BambooPendant,
  'furn-nest': NestArt,
  'furn-low-table': LowTableArt,
  'furn-cushion': CushionArt,
  'furn-bamboo-shelf': BambooShelf,
  'furn-plant-pot': PlantPot,
  'furn-lantern': Lantern,
  'furn-toy-box': ToyBox,
  'furn-rug': Rug,
  'furn-bamboo-chair': BambooChair,
  'furn-lamp': Lamp,
  'furn-cabinet': Cabinet,
  'furn-snack-basket': SnackBasket,
  'furn-bamboo-fence': BambooFence,
  'furn-mushroom-stool': MushroomStool,
  'furn-flower-vase': FlowerVase,
  'furn-sofa': Sofa,
  'furn-bed': Bed,
  'furn-swing': Swing,
  'furn-reading-nook': ReadingNook,
  'furn-bookshelf': Bookshelf,
  'furn-clock': Clock,
  'furn-hammock': Hammock,
  'furn-beanbag': Beanbag,
  'furn-fountain': Fountain,
};
