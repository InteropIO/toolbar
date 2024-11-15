import { toolbarWidth, toolbarDrawerSize } from './settings.js';
import { getAppState, getHorizontalToolbarHeight } from './utils.js';
import { moveMyWindow, getScaleFactor } from './connect-related.js';

const prevBounds = {
  top: 0,
  left: 0,
  width: 0,
  height: 0,
};

let hadOpenLeft = false;
let hadOpenTop = false;
let wasExpanded = false;

function getChangedProperties(prevBounds, newBounds) {
  const diff = {};

  for (const key in newBounds) {
    if (newBounds[key] !== prevBounds[key]) {
      diff[key] = newBounds[key];
    }
  }

  return diff;
}

async function setWindowBounds() {
  const app = document.querySelector('.app');
  const classNames = Array.from(app.classList);
  const isVertical = classNames.includes('vertical');
  const isExpanded = classNames.includes('expanded');
  const hasDrawer = classNames.includes('has-drawer');
  const isOpenLeft = classNames.includes('open-left');
  const isOpenTop = classNames.includes('open-top');

  const toolbarHeight = getHorizontalToolbarHeight();
  const expandedToolbarWidth = 200;
  const newBounds = {};
  const { appBounds, visibleArea } = await getAppState();
  const scaleFactor = await getScaleFactor();

  function setVerticalSize() {
    newBounds.width = hasDrawer
      ? expandedToolbarWidth + toolbarDrawerSize.vertical
      : isExpanded
      ? expandedToolbarWidth
      : toolbarWidth.vertical;
    newBounds.height = toolbarHeight;

    if (isExpanded) {
      wasExpanded = true;
      newBounds.left = prevBounds.left;
    } else {
      wasExpanded = false;
    }

    if (isOpenLeft) {
      hadOpenLeft = true;
      newBounds.left =
        appBounds.left - toolbarDrawerSize.vertical / scaleFactor;
    }

    if (hadOpenLeft && !isOpenLeft) {
      newBounds.left =
        appBounds.left + toolbarDrawerSize.vertical / scaleFactor;
      hadOpenLeft = false;
    }
  }

  function setHorizontalSize() {
    const horizontalHeight = getHorizontalToolbarHeight() / scaleFactor;

    newBounds.width = toolbarWidth.horizontal;
    newBounds.height = hasDrawer ? toolbarHeight : isExpanded ? 175 : 48;

    if (isOpenTop) {
      hadOpenTop = true;

      if (isExpanded && hadOpenTop) {
        wasExpanded = true;
        newBounds.top = appBounds.top + visibleArea.height - horizontalHeight;
      }

      if (wasExpanded && !isExpanded) {
        wasExpanded = false;
        newBounds.top = prevBounds.top;
      }
    }

    if (hadOpenTop && !isOpenTop) {
      hadOpenTop = false;
      newBounds.top = appBounds.top - visibleArea.height + horizontalHeight;
    }
  }

  isVertical ? setVerticalSize() : setHorizontalSize();

  const bounds = getChangedProperties(prevBounds, newBounds);

  if (Object.keys(bounds).length === 0) return;

  moveMyWindow(bounds);

  Object.assign(prevBounds, newBounds);
}

export { setWindowBounds };