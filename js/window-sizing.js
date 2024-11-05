import { moveMyWindow, getPhysicalWindowBounds } from './connect-related.js';
import { getHorizontalToolbarHeight } from './utils.js';
import { toolbarWidth, toolbarDrawerSize } from './settings.js';

const expandedToolbarWidth = 200;

function debounceFunction(func, delay = 300) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

const debouncedMoveMyWindow = debounceFunction((params) => {
  moveMyWindow(params);
});

async function setWindowSizeOnHover() {
  const appClasses = Array.from(document.querySelector('.app').classList);
  const isVertical = appClasses.includes('vertical');
  const isExpanded = appClasses.includes('expanded');
  const hasDrawer = appClasses.includes('has-drawer');

  if (hasDrawer) return;

  const windowSize = isVertical
    ? { width: isExpanded ? expandedToolbarWidth : toolbarWidth.vertical }
    : { height: isExpanded ? 180 : 60 };

  if (isVertical && !isExpanded) {
    debouncedMoveMyWindow(windowSize);
  } else {
    moveMyWindow(windowSize);
  }
}

async function setWindowSize() {
  const windowBounds = await getPhysicalWindowBounds();
  const toolbarHeight = getHorizontalToolbarHeight();
  const appClasses = Array.from(document.querySelector('.app').classList);

  const isVertical = appClasses.includes('vertical');
  const isExpanded = appClasses.includes('expanded');
  const hasDrawer = appClasses.includes('has-drawer');
  const isOpenLeft = appClasses.includes('open-left');
  const isOpenTop = appClasses.includes('open-top');

  const bounds = isVertical
    ? { height: toolbarHeight }
    : { width: toolbarWidth.horizontal };

  if (isVertical) {
    if (isExpanded) {
      const calculatedLeft = hasDrawer
        ? windowBounds.left - toolbarDrawerSize.vertical
        : windowBounds.left + toolbarDrawerSize.vertical;

      bounds.left = isOpenLeft ? calculatedLeft : bounds.left;

      bounds.width = hasDrawer
        ? expandedToolbarWidth + toolbarDrawerSize.vertical
        : expandedToolbarWidth;
    } else {
      bounds.width = toolbarWidth.vertical;
    }
  } else {
    if (isExpanded) {
      const calculatedTop = hasDrawer
        ? windowBounds.top - toolbarDrawerSize.horizontal
        : windowBounds.top + toolbarDrawerSize.horizontal;

      const calculatedHeightOpenTop = hasDrawer
        ? toolbarHeight + toolbarDrawerSize.horizontal
        : toolbarHeight;

      const calculatedHeightNotOpenTop = hasDrawer ? toolbarHeight + 56 : 180;

      bounds.top = isOpenTop ? calculatedTop : bounds.top;

      bounds.height = isOpenTop
        ? calculatedHeightOpenTop
        : calculatedHeightNotOpenTop;
    } else {
      bounds.height = 56;
    }
  }

  moveMyWindow(bounds);
}

export { setWindowSize, setWindowSizeOnHover };
