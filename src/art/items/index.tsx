import type { ComponentType } from 'preact';
import { BambooPendant, NestArt, LowTableArt, CushionArt } from './starter-art';
import {
  MianhuaMailbox, MianhuaLetterCabinet, MianhuaCart, JuziCandyJar, JuziCounter, JuziFoxLantern,
  ManmanStone, ManmanStoryShelf, ManmanTent, GuluWorkbench, GuluGearClock, GuluRobot,
} from './friendFurniture';
import {
  PendantShell, PendantMushroom, PendantSnowflake, PendantCloud, PendantStar, PendantMoonBell, PendantHeart,
} from './pendants';
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
  'furn-mianhua-1': MianhuaMailbox,
  'furn-mianhua-2': MianhuaLetterCabinet,
  'furn-mianhua-3': MianhuaCart,
  'furn-juzi-1': JuziCandyJar,
  'furn-juzi-2': JuziCounter,
  'furn-juzi-3': JuziFoxLantern,
  'furn-manman-1': ManmanStone,
  'furn-manman-2': ManmanStoryShelf,
  'furn-manman-3': ManmanTent,
  'furn-gulu-1': GuluWorkbench,
  'furn-gulu-2': GuluGearClock,
  'furn-gulu-3': GuluRobot,
  'pendant-shell': PendantShell,
  'pendant-mushroom': PendantMushroom,
  'pendant-snowflake': PendantSnowflake,
  'pendant-cloud': PendantCloud,
  'pendant-star': PendantStar,
  'pendant-moon-bell': PendantMoonBell,
  'pendant-heart': PendantHeart,
};
