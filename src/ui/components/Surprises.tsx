import type { ComponentChildren } from 'preact';

interface Props {
  /** 戳戳忙碌狀態（由 Home 決定；Home 的 transient 姿勢為 busyBook 時為真）。 */
  busy?: boolean;
  /** 熊貓區的唯一 pointerdown 處理函式，由 Home 提供（先醒來、再計數）。 */
  onPointerDown?: (e: PointerEvent) => void;
  children?: ComponentChildren;
}

/** 包住熊貓的戳戳區：只負責轉發 pointerdown 與顯示「假裝很忙」，不做計數。 */
export function PandaTapZone({ busy = false, onPointerDown, children }: Props) {
  return (
    <div
      class="panda-tap-zone"
      data-testid="panda-tap-zone"
      onPointerDown={(e) => onPointerDown?.(e as unknown as PointerEvent)}
    >
      {children}
      {busy ? <p class="surprise-msg" role="status">假裝很忙，拿出一本書擋住臉</p> : null}
    </div>
  );
}
