type DirectionField = 'left' | 'right' | 'gas' | 'brake';

export class InputHandler {
  left = false;
  right = false;
  gas = false;
  brake = false;
  pauseRequested = false;

  private onPause: () => void;

  private keyMap: Record<string, DirectionField> = {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'gas',
    ArrowDown: 'brake',
    KeyA: 'left',
    KeyD: 'right',
    KeyQ: 'left',
    KeyW: 'gas',
    KeyS: 'brake',
  };

  constructor(onPause: () => void) {
    this.onPause = onPause;
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Escape' || e.code === 'KeyP') {
      this.onPause();
      return;
    }
    const field = this.keyMap[e.code];
    if (field) {
      this[field] = true;
      e.preventDefault();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    const field = this.keyMap[e.code];
    if (field) {
      this[field] = false;
      e.preventDefault();
    }
  };

  bindTouchButton(el: HTMLElement | null, field: DirectionField) {
    if (!el) return;
    const start = (e: Event) => {
      e.preventDefault();
      this[field] = true;
    };
    const end = (e: Event) => {
      e.preventDefault();
      this[field] = false;
    };
    el.addEventListener('pointerdown', start);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointerleave', end);
    el.addEventListener('pointercancel', end);
  }

  reset() {
    this.left = this.right = this.gas = this.brake = false;
  }

  destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}
