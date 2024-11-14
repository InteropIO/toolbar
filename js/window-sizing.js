import { toolbarWidth, toolbarDrawerSize } from './settings.js';
import { getAppState, getHorizontalToolbarHeight } from './utils.js';
import { moveMyWindow } from './connect-related.js';

const prevBounds = {
  top: 0,
  left: 0,
  width: 0,
  height: 0,
};

let hadOpenLeft = false;
let hadOpenTop = false;

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

  function setVerticalSize() {
    newBounds.width = hasDrawer
      ? expandedToolbarWidth + toolbarDrawerSize.vertical
      : isExpanded
      ? expandedToolbarWidth
      : toolbarWidth.vertical;
    newBounds.height = toolbarHeight;

    if (isOpenLeft) {
      hadOpenLeft = true;
      newBounds.left = appBounds.left - toolbarDrawerSize.vertical;
    }

    if (hadOpenLeft && !isOpenLeft) {
      newBounds.left = appBounds.left + toolbarDrawerSize.vertical;
      hadOpenLeft = false;
    }
  }

  function setHorizontalSize() {
    const horizontalHeight = getHorizontalToolbarHeight();

    newBounds.width = toolbarWidth.horizontal;
    newBounds.height = hasDrawer ? toolbarHeight : isExpanded ? 175 : 48;

    if (isOpenTop) {
      hadOpenTop = true;
      newBounds.top = appBounds.top + visibleArea.height - horizontalHeight;
    }

    if (hadOpenTop && !isOpenTop) {
      newBounds.top = appBounds.top - visibleArea.height + horizontalHeight;
      hadOpenTop = false;
    }
  }

  isVertical ? setVerticalSize() : setHorizontalSize();

  const bounds = getChangedProperties(prevBounds, newBounds);

  if (Object.keys(bounds).length === 0) return;

  console.log('Setting window bounds:', bounds);

  moveMyWindow(bounds);

  Object.assign(prevBounds, newBounds);
}

export { setWindowBounds };
