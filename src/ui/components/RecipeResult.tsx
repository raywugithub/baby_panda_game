import { RECIPES } from '../../content/recipes';

interface Props {
  /** 食譜 id，或 'mystery' 表示謎之料理。 */
  result: string;
  /** 是否為第一次做出此食譜（於 cook 前判斷）。 */
  discovered: boolean;
}

export function RecipeResult({ result, discovered }: Props) {
  if (result === 'mystery') {
    return <p>謎之料理：熊貓吃了表情很複雜，但還是會吃完</p>;
  }
  const name = RECIPES.find(r => r.id === result)?.name ?? result;
  return <p>{discovered ? `發現新食譜：${name}` : `${name}做好了`}</p>;
}
