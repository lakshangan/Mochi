export interface DragCallbacks {
  onDragStart?: () => void;
  onDrag?: (dx: number, dy: number) => void;
  onDragEnd?: () => void;
  onGazeMove?: (normX: number, normY: number) => void;
  onClick?: () => void;
}

export class MovementController {
  private element: HTMLElement;
  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private hasMoved = false;
  private callbacks: DragCallbacks;

  constructor(element: HTMLElement, callbacks: DragCallbacks) {
    this.element = element;
    this.callbacks = callbacks;
    this.bindEvents();
  }

  private bindEvents(): void {
    this.element.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    this.element.addEventListener('mousemove', this.onElementMouseMove);
    this.element.addEventListener('mouseleave', this.onElementMouseLeave);
  }

  private onMouseDown = (e: MouseEvent): void => {
    if (e.button !== 0) return; // Only left click
    this.isDragging = true;
    this.hasMoved = false;
    this.startX = e.screenX;
    this.startY = e.screenY;
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.isDragging) return;

    const dx = e.screenX - this.startX;
    const dy = e.screenY - this.startY;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      if (!this.hasMoved) {
        this.hasMoved = true;
        this.callbacks.onDragStart?.();
      }
      this.startX = e.screenX;
      this.startY = e.screenY;
      this.callbacks.onDrag?.(dx, dy);

      if (window.mochiApi) {
        window.mochiApi.dragPet(dx, dy);
      }
    }
  };

  private onMouseUp = (): void => {
    if (this.isDragging) {
      this.isDragging = false;
      if (this.hasMoved) {
        this.callbacks.onDragEnd?.();
      } else {
        // Pure click without dragging
        this.callbacks.onClick?.();
      }
      this.hasMoved = false;
    }
  };

  private onElementMouseMove = (e: MouseEvent): void => {
    if (this.isDragging) return;
    const rect = this.element.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const normX = Math.max(-1, Math.min(1, (e.clientX - cx) / (rect.width / 2)));
    const normY = Math.max(-1, Math.min(1, (e.clientY - cy) / (rect.height / 2)));

    this.callbacks.onGazeMove?.(normX, normY);
  };

  private onElementMouseLeave = (): void => {
    if (!this.isDragging) {
      this.callbacks.onGazeMove?.(0, 0);
    }
  };

  public destroy(): void {
    this.element.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    this.element.removeEventListener('mousemove', this.onElementMouseMove);
    this.element.removeEventListener('mouseleave', this.onElementMouseLeave);
  }
}
