import type { RecipeDef } from './types';

export const RECIPES: RecipeDef[] = [
  { id: 'recipe-bamboo-mochi', name: '竹筍麻糬', inputs: ['ing-bamboo-shoot', 'ing-rice-flour'], reaction: 'yum' },
  { id: 'recipe-strawberry-daifuku', name: '草莓大福', inputs: ['ing-strawberry', 'ing-rice-flour'], reaction: 'blush' },
  { id: 'recipe-red-bean-dumpling', name: '紅豆湯圓', inputs: ['ing-red-bean', 'ing-rice-flour'], reaction: 'yum' },
  { id: 'recipe-honey-bean', name: '蜜豆', inputs: ['ing-red-bean', 'ing-honey'], reaction: 'yum' },
  { id: 'recipe-honey-berry', name: '蜜草莓', inputs: ['ing-strawberry', 'ing-honey'], reaction: 'starEyes' },
  { id: 'recipe-mushroom-soup', name: '蘑菇湯', inputs: ['ing-mushroom', 'ing-bamboo-shoot'], reaction: 'patBelly' },
  { id: 'recipe-mushroom-rice', name: '蘑菇炊飯', inputs: ['ing-mushroom', 'ing-rice-flour'], reaction: 'patBelly' },
  { id: 'recipe-honey-bamboo', name: '蜜竹筍', inputs: ['ing-bamboo-shoot', 'ing-honey'], reaction: 'yum' },
  { id: 'recipe-berry-bean-ice', name: '草莓紅豆冰', inputs: ['ing-strawberry', 'ing-red-bean'], reaction: 'starEyes' },
  { id: 'recipe-honey-mushroom', name: '蜜蘑菇', inputs: ['ing-mushroom', 'ing-honey'], reaction: 'yum' },
  { id: 'recipe-strawberry-salad', name: '草莓蘑菇沙拉', inputs: ['ing-strawberry', 'ing-mushroom'], reaction: 'sour' },
  { id: 'recipe-bamboo-red-bean-porridge', name: '竹筍紅豆粥', inputs: ['ing-bamboo-shoot', 'ing-red-bean'], reaction: 'patBelly' },
];
