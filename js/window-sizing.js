import { toolbarWidth, getSetting } from './settings.js';
import { getHorizontalToolbarHeight } from './utils.js';

function observeSizeChange(element, callback) {
  const resizeObserver = new ResizeObserver((entries) => {
    for (let entry of entries) {
      const { width, height, top, left } = entry.contentRect;

      callback(
        Math.floor(width),
        Math.floor(height),
        Math.floor(top),
        Math.floor(left)
      );
    }
  });
  resizeObserver.observe(element);

  return resizeObserver;
}

function setInitialWindowSize() {
  const app = document.querySelector('.app');
  const isVertical = app.classList.contains('vertical');
  const toolbarHeight = getHorizontalToolbarHeight();

  if (isVertical) {
    console.log('am i here?');
    app.style.width = toolbarWidth.vertical;
    app.style.height = `${toolbarHeight}px`;
  } else {
    console.log('am i here as well?');
    app.style.width = `${toolbarWidth.horizontal}px`;
  }
}

function setWindowSize() {
  const app = document.querySelector('.app');
  const isVertical = app.classList.contains('vertical');
  const isExpanded = app.classList.contains('expanded');
  const hasDrawer = app.classList.contains('has-drawer');
  const toolbarHeight = getHorizontalToolbarHeight();

  console.log('app classes', Array.from(app.classList));

  if (isVertical) {
    app.style.width = toolbarWidth.vertical;
    app.style.height = `${toolbarHeight}px`;
  } else {
    app.style.width = `${toolbarWidth.horizontal}px`;

    if (hasDrawer) {
      console.log('has drawer');
      app.style.height = `${toolbarHeight}px`;
    } else {
      app.style.height = `48px`;
    }
  }
}

export { observeSizeChange, setInitialWindowSize, setWindowSize };
