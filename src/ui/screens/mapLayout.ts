import type { MapNode } from '../../core/state';
import { hash } from '../../core/rng';

export interface NodePos { id: number; x: number; y: number; depth: number }

const DEPTH_STEP = 150;   // 層與層之間的最小間距（上一層最後一列到下一層第一列）
const ROW_STEP = 50;
// 每列只放兩個節點（左 40%、右 60%）；寬度變化時等比縮放，左右留出標籤空間。
const COL_RATIO = [0.4, 0.6] as const;

/** 節點深度 = 祖先數（沿 parentId 往上走）；遇到缺失或循環的父節點即停止。 */
function depthOf(node: MapNode, byId: Map<number, MapNode>): number {
  let depth = 0;
  let parent = node.parentId;
  const seen = new Set<number>();
  while (parent !== null && !seen.has(parent)) {
    seen.add(parent);
    depth++;
    parent = byId.get(parent)?.parentId ?? null;
  }
  return depth;
}

/**
 * 每個節點的畫面座標（y 向上為負）。回傳順序與輸入相同。
 * 同一深度依 id 排序，每列兩個；路徑左右擺動由深度的 sin 決定，另加 ±3 的抖動。
 */
export function nodePositions(nodes: MapNode[], width: number): NodePos[] {
  const byId = new Map(nodes.map(n => [n.id, n]));
  const depths = new Map(nodes.map(n => [n.id, depthOf(n, byId)]));

  const groups = new Map<number, MapNode[]>();
  for (const n of nodes) {
    const d = depths.get(n.id)!;
    groups.set(d, [...(groups.get(d) ?? []), n]);
  }
  const slot = new Map<number, { col: number; row: number }>();
  const rowsAt = new Map<number, number>();
  for (const [d, group] of groups) {
    [...group].sort((a, b) => a.id - b.id).forEach((n, i) => {
      slot.set(n.id, { col: i % 2, row: Math.floor(i / 2) });
    });
    rowsAt.set(d, Math.ceil(group.length / 2));
  }

  // 逐層累加高度：每層的頂端位置 = 上一層頂端 + 150 + 50 × (上一層列數 − 1)，
  // 確保深度 d 的最後一列與深度 d+1 的第一列至少相距 150px，層與層之間不會重疊。
  const maxDepth = Math.max(0, ...groups.keys());
  const depthTop: number[] = [0];
  for (let d = 0; d < maxDepth; d++) {
    depthTop.push(depthTop[d] + DEPTH_STEP + ROW_STEP * ((rowsAt.get(d) ?? 1) - 1));
  }

  return nodes.map(n => {
    const depth = depths.get(n.id)!;
    const { col, row } = slot.get(n.id)!;
    const jitter = (hash(n.seed, 'jx') % 7) - 3;
    const x = width * COL_RATIO[col] + Math.sin(depth * 0.9) * width * 0.08 + jitter;
    const y = 0 - (depthTop[depth] + row * ROW_STEP);
    return { id: n.id, x, y, depth };
  });
}
