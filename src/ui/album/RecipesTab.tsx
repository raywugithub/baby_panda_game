import { RECIPES } from '../../content/recipes';
import { ITEM_BY_ID } from '../../content/items';
import { game } from '../store';

const HINT = '把兩種食材放進鍋子試試看';

export function RecipesTab() {
  const found = new Set(game.value.recipes);
  return (
    <ul class="album-recipes">
      {RECIPES.map(r => {
        if (!found.has(r.id)) {
          return (
            <li key={r.id} class="album-recipe album-recipe-locked">
              <span class="album-recipe-name">？？？</span>
              <span class="album-recipe-hint">{HINT}</span>
            </li>
          );
        }
        const [a, b] = r.inputs.map(id => ITEM_BY_ID[id]?.name ?? id);
        return (
          <li key={r.id} class="album-recipe">
            <span class="album-recipe-name">{r.name}</span>
            <span class="album-recipe-inputs">{a} + {b}</span>
          </li>
        );
      })}
    </ul>
  );
}
