import { toolbarWidth, toolbarDrawerSize } from './settings.js';
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

function setWindowSize() {
  const app = document.querySelector('.app');
  const appClasses = Array.from(app.classList);

  const isVertical = appClasses.includes('vertical');
  const isExpanded = appClasses.includes('expanded');
  const hasDrawer = appClasses.includes('has-drawer');

  const toolbarHeight = getHorizontalToolbarHeight();

  if (isVertical) {
    const expandedToolbarWidth = 200;
    app.style.height = `${toolbarHeight}px`;

    if (isExpanded) {
      if (hasDrawer) {
        app.style.width = `${
          expandedToolbarWidth + toolbarDrawerSize.vertical
        }px`;
      } else {
        app.style.width = `${expandedToolbarWidth}px`;
      }
    } else {
      app.style.width = `${toolbarWidth.vertical}px`;
    }
  } else {
    app.style.width = `${toolbarWidth.horizontal}px`;

    if (isExpanded) {
      if (hasDrawer) {
        app.style.height = `${toolbarHeight}px`;
      } else {
        app.style.height = '175px';
      }
    } else {
      app.style.height = '60px';
    }
  }
}

export { observeSizeChange, setWindowSize };
