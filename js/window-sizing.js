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
  const expandedToolbarWidth = 200;

  function setVerticalSize() {
    const calculatedWidth = hasDrawer ? toolbarDrawerSize.vertical : 0;

    app.style.width = isExpanded
      ? `${expandedToolbarWidth + calculatedWidth}px`
      : `${toolbarWidth.vertical}px`;
    app.style.height = `${toolbarHeight}px`;
  }

  function setHorizontalSize() {
    const calculatedHeight = hasDrawer ? `${toolbarHeight}px` : '175px';

    app.style.width = `${toolbarWidth.horizontal}px`;
    app.style.height = isExpanded ? calculatedHeight : '48px';
  }

  isVertical ? setVerticalSize() : setHorizontalSize();
}

export { observeSizeChange, setWindowSize };
