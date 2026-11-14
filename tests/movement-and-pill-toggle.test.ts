import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MovementController } from '../src/renderer/engine/movement-controller';

class MockDOMElement {
  private listeners: Record<string, Function[]> = {};

  addEventListener(event: string, fn: Function) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }

  removeEventListener(event: string, fn: Function) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((cb) => cb !== fn);
  }

  dispatchEvent(event: { type: string; [key: string]: any }) {
    const handlers = this.listeners[event.type] || [];
    for (const handler of handlers) {
      handler(event);
    }
  }

  getBoundingClientRect() {
    return { left: 100, top: 100, width: 100, height: 100 };
  }
}

describe('MovementController & Pill Toggle Lifecycle', () => {
  let mockElement: any;
  let mockIslandElement: any;
  let originalWindow: any;

  beforeEach(() => {
    mockElement = new MockDOMElement();
    mockIslandElement = new MockDOMElement();

    // Mock global window event listeners for node environment
    const winListeners: Record<string, Function[]> = {};
    (global as any).window = {
      addEventListener: vi.fn((event: string, fn: Function) => {
        if (!winListeners[event]) winListeners[event] = [];
        winListeners[event].push(fn);
      }),
      removeEventListener: vi.fn((event: string, fn: Function) => {
        if (!winListeners[event]) return;
        winListeners[event] = winListeners[event].filter((cb) => cb !== fn);
      }),
      dispatchEvent: (event: { type: string; [key: string]: any }) => {
        const handlers = winListeners[event.type] || [];
        for (const handler of handlers) {
          handler(event);
        }
      },
      mochiApi: {
        dragPet: vi.fn(),
      },
    };
  });

  afterEach(() => {
    delete (global as any).window;
  });

  it('attaches listeners to the element and window on initialization', () => {
    const addElemSpy = vi.spyOn(mockElement, 'addEventListener');

    const controller = new MovementController(mockElement, {});

    expect(addElemSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(addElemSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(addElemSpy).toHaveBeenCalledWith('mouseleave', expect.any(Function));
    expect(window.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(window.addEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));

    controller.destroy();
  });

  it('removes all listeners on destroy without leaking memory', () => {
    const removeElemSpy = vi.spyOn(mockElement, 'removeEventListener');

    const controller = new MovementController(mockElement, {});
    controller.destroy();

    expect(removeElemSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(removeElemSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(removeElemSpy).toHaveBeenCalledWith('mouseleave', expect.any(Function));
    expect(window.removeEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(window.removeEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
  });

  it('correctly fires onClick callback when pure click occurs without dragging', () => {
    const onClick = vi.fn();
    const onDragStart = vi.fn();

    const controller = new MovementController(mockElement, { onClick, onDragStart });

    // Simulate MouseDown
    mockElement.dispatchEvent({
      type: 'mousedown',
      button: 0,
      screenX: 100,
      screenY: 100,
    });

    // Simulate MouseUp at same position
    (window as any).dispatchEvent({
      type: 'mouseup',
      button: 0,
      screenX: 100,
      screenY: 100,
    });

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onDragStart).not.toHaveBeenCalled();

    controller.destroy();
  });

  it('detects drag movement when delta exceeds threshold (>3px)', () => {
    const onClick = vi.fn();
    const onDragStart = vi.fn();
    const onDrag = vi.fn();
    const onDragEnd = vi.fn();

    const controller = new MovementController(mockElement, {
      onClick,
      onDragStart,
      onDrag,
      onDragEnd,
    });

    // Start drag
    mockElement.dispatchEvent({
      type: 'mousedown',
      button: 0,
      screenX: 100,
      screenY: 100,
    });

    // Move mouse by 15px
    (window as any).dispatchEvent({
      type: 'mousemove',
      screenX: 115,
      screenY: 100,
    });

    expect(onDragStart).toHaveBeenCalledTimes(1);
    expect(onDrag).toHaveBeenCalledWith(15, 0);

    // Release mouse
    (window as any).dispatchEvent({ type: 'mouseup' });

    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(onClick).not.toHaveBeenCalled();

    controller.destroy();
  });

  it('supports seamless re-binding when switching between Orb and Dynamic Island pill mode', () => {
    const orbClick = vi.fn();
    const islandClick = vi.fn();

    // 1. Initial Orb state
    let activeController: MovementController | null = new MovementController(mockElement, {
      onClick: orbClick,
    });

    // Verify click on orb
    mockElement.dispatchEvent({ type: 'mousedown', button: 0, screenX: 50, screenY: 50 });
    (window as any).dispatchEvent({ type: 'mouseup', screenX: 50, screenY: 50 });
    expect(orbClick).toHaveBeenCalledTimes(1);

    // 2. Transition from Orb to Dynamic Island pill mode
    activeController.destroy();
    activeController = new MovementController(mockIslandElement, {
      onClick: islandClick,
    });

    // Verify click on island pill
    mockIslandElement.dispatchEvent({ type: 'mousedown', button: 0, screenX: 200, screenY: 200 });
    (window as any).dispatchEvent({ type: 'mouseup', screenX: 200, screenY: 200 });
    expect(islandClick).toHaveBeenCalledTimes(1);

    // 3. Transition from Dynamic Island pill mode BACK to Orb
    activeController.destroy();
    const newOrbElement = new MockDOMElement();
    const returnOrbClick = vi.fn();
    activeController = new MovementController(newOrbElement as any, {
      onClick: returnOrbClick,
    });

    // Verify click on newly mounted orb
    newOrbElement.dispatchEvent({ type: 'mousedown', button: 0, screenX: 300, screenY: 300 });
    (window as any).dispatchEvent({ type: 'mouseup', screenX: 300, screenY: 300 });
    expect(returnOrbClick).toHaveBeenCalledTimes(1);

    activeController.destroy();
  });
});
