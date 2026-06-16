import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

function defineGlobal(name: PropertyKey, value: unknown) {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    writable: true,
    value,
  });
}

export function installDom(url: string): JSDOM {
  return installDomWithHTML(url, '<div id="app"></div>');
}

export function installDomWithHTML(url: string, bodyHtml: string): JSDOM {
  const dom = new JSDOM(`<!DOCTYPE html><html lang="en"><body>${bodyHtml}</body></html>`, { url });

  const windowLike = dom.window as unknown as typeof globalThis & Window;
  defineGlobal('window', windowLike);
  defineGlobal('document', windowLike.document);
  defineGlobal('navigator', windowLike.navigator);
  defineGlobal('CustomEvent', windowLike.CustomEvent);
  defineGlobal('Event', windowLike.Event);
  defineGlobal('MouseEvent', windowLike.MouseEvent);
  defineGlobal('KeyboardEvent', windowLike.KeyboardEvent);
  defineGlobal('Element', windowLike.Element);
  defineGlobal('HTMLElement', windowLike.HTMLElement);
  defineGlobal('HTMLLabelElement', windowLike.HTMLLabelElement);
  defineGlobal('HTMLMediaElement', windowLike.HTMLMediaElement);
  defineGlobal('HTMLInputElement', windowLike.HTMLInputElement);
  defineGlobal('HTMLButtonElement', windowLike.HTMLButtonElement);
  defineGlobal('HTMLSelectElement', windowLike.HTMLSelectElement);
  defineGlobal('HTMLTextAreaElement', windowLike.HTMLTextAreaElement);
  defineGlobal('SVGElement', windowLike.SVGElement);
  defineGlobal('Node', windowLike.Node);
  defineGlobal('Text', windowLike.Text);
  defineGlobal('Comment', windowLike.Comment);
  defineGlobal('Blob', globalThis.Blob || windowLike.Blob);
  defineGlobal('File', globalThis.File || windowLike.File);
  defineGlobal('FileReader', globalThis.FileReader || windowLike.FileReader);
  defineGlobal('FormData', globalThis.FormData || windowLike.FormData);
  defineGlobal('MutationObserver', windowLike.MutationObserver);
  defineGlobal('getComputedStyle', windowLike.getComputedStyle.bind(windowLike));
  defineGlobal('atob', globalThis.atob || windowLike.atob.bind(windowLike));
  defineGlobal('btoa', globalThis.btoa || windowLike.btoa.bind(windowLike));

  const createObjectURL = (() => {
    let objectUrlCounter = 0;
    return () => `blob:mock-${objectUrlCounter += 1}`;
  })();
  const revokeObjectURL = () => {};
  defineGlobal('URL', globalThis.URL || windowLike.URL);
  globalThis.URL.createObjectURL = createObjectURL;
  globalThis.URL.revokeObjectURL = revokeObjectURL;
  windowLike.URL.createObjectURL = createObjectURL;
  windowLike.URL.revokeObjectURL = revokeObjectURL;

  const requestAnimationFrame = (callback: FrameRequestCallback) =>
    setTimeout(() => callback(Date.now()), 0) as unknown as number;
  const cancelAnimationFrame = (id: number) => clearTimeout(id);
  defineGlobal('requestAnimationFrame', requestAnimationFrame);
  defineGlobal('cancelAnimationFrame', cancelAnimationFrame);
  windowLike.requestAnimationFrame = requestAnimationFrame;
  windowLike.cancelAnimationFrame = cancelAnimationFrame;

  if (!windowLike.matchMedia) {
    windowLike.matchMedia = () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent() {
        return false;
      },
      media: '',
      onchange: null,
    });
  }

  if (!Object.getOwnPropertyDescriptor(windowLike.HTMLElement.prototype, 'innerText')) {
    Object.defineProperty(windowLike.HTMLElement.prototype, 'innerText', {
      configurable: true,
      get() {
        return this.textContent;
      },
      set(value: string) {
        this.textContent = value;
      },
    });
  }

  return dom;
}

export function teardownPage(dom: JSDOM | null | undefined) {
  dom?.window.close();
}

export async function flushAsyncWork() {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function assertElementType<T extends HTMLElement>(
  element: HTMLElement | null,
  expectedId: string,
): T {
  assert.ok(element, `Expected #${expectedId} to exist`);
  return element as T;
}

export function setInputValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  element.value = value;
  element.dispatchEvent(new window.Event('input', { bubbles: true }));
}

export function setSelectValue(element: HTMLSelectElement, value: string) {
  element.value = value;
  element.dispatchEvent(new window.Event('change', { bubbles: true }));
}

export function requiredElement<T extends HTMLElement>(id: string): T {
  return assertElementType<T>(document.getElementById(id), id);
}
