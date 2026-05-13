import { JSDOM } from 'jsdom';

function defineGlobal(name, value) {
  Object.defineProperty(globalThis, name, {
    configurable: true,
    writable: true,
    value,
  });
}

export function installDom(url) {
  const dom = new JSDOM('<!DOCTYPE html><html lang="en"><body><div id="app"></div></body></html>', {
    url,
  });

  const { window } = dom;
  defineGlobal('window', window);
  defineGlobal('document', window.document);
  defineGlobal('navigator', window.navigator);
  defineGlobal('CustomEvent', window.CustomEvent);
  defineGlobal('Event', window.Event);
  defineGlobal('MouseEvent', window.MouseEvent);
  defineGlobal('KeyboardEvent', window.KeyboardEvent);
  defineGlobal('Element', window.Element);
  defineGlobal('HTMLElement', window.HTMLElement);
  defineGlobal('HTMLMediaElement', window.HTMLMediaElement);
  defineGlobal('HTMLInputElement', window.HTMLInputElement);
  defineGlobal('HTMLButtonElement', window.HTMLButtonElement);
  defineGlobal('HTMLSelectElement', window.HTMLSelectElement);
  defineGlobal('HTMLTextAreaElement', window.HTMLTextAreaElement);
  defineGlobal('SVGElement', window.SVGElement);
  defineGlobal('Node', window.Node);
  defineGlobal('Text', window.Text);
  defineGlobal('Comment', window.Comment);
  defineGlobal('MutationObserver', window.MutationObserver);
  defineGlobal('getComputedStyle', window.getComputedStyle.bind(window));

  const requestAnimationFrame = (callback) => setTimeout(() => callback(Date.now()), 0);
  const cancelAnimationFrame = (id) => clearTimeout(id);
  defineGlobal('requestAnimationFrame', requestAnimationFrame);
  defineGlobal('cancelAnimationFrame', cancelAnimationFrame);
  window.requestAnimationFrame = requestAnimationFrame;
  window.cancelAnimationFrame = cancelAnimationFrame;

  if (!window.matchMedia) {
    window.matchMedia = () => ({
      matches: false,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent() {
        return false;
      },
    });
  }

  return dom;
}

export function teardownPage(dom) {
  if (dom) {
    dom.window.close();
  }
}

export async function flushAsyncWork() {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

export function setInputValue(element, value) {
  element.value = value;
  element.dispatchEvent(new window.Event('input', { bubbles: true }));
}

export function setSelectValue(element, value) {
  element.value = value;
  element.dispatchEvent(new window.Event('change', { bubbles: true }));
}
