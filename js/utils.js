import {
  shutdown,
  gluePromise,
  startApp,
  getApp,
  getUserProperties,
  themeObs,
  changeTheme,
  refreshApps,
  glueVersion,
  getMonitorInfo,
  moveMyWindow,
  minimize,
  isMinimizeAllowed,
  openFeedbackForm,
  getWindowWorkArea,
  getScaleFactor,
  getPrimaryScaleFactor,
  windowCenter,
  getPhysicalWindowBounds,
} from './connect-related.js';
import {
  toolbarWidth,
  toolbarDrawerSize,
  initialPosition,
  setSetting,
  getSetting,
} from './settings.js';
import {
  populateProfileData,
  profile_handleShutdownClick,
  profile_handleRestartClick,
  profile_handleFeedbackClick,
} from './profile.js';

import {
  handleNotificationClick,
  handleEnableNotifications,
} from './notifications.js';

import handleKeyboardNavigation from './keyboard-navigation.js';

const windowMargin = 50;

let pressedKey;
let keyObs = rxjs
  .fromEvent(document, 'keydown')
  .pipe(
    rxjs.operators.filter(
      (e) =>
        e.key === 'ArrowUp' ||
        e.key === 'ArrowRight' ||
        e.key === 'ArrowDown' ||
        e.key === 'ArrowLeft' ||
        e.key === 'Enter' ||
        e.key === 'Escape' ||
        e.key === 'Backspace' ||
        e.key === 'Tab'
    )
  )
  .subscribe((key) => (pressedKey = key));

function handleEvents() {
  handleNotificationClick();
  handleEnableNotifications();
  handleFeedbackClick();
  handleThemeChange();
  handleKeyboardNavigation();
  handleOrientationChange();
  handleAppRowsChange();
  populateAboutPage();
  handleShutdownClick();
  handleTopMenuClicks();
  handleCloseDrawerClicks();
  handleMinimizeClick();
  handleMouseHover();
  handleModalClose();
  populateProfileData();
  profile_handleShutdownClick();
  profile_handleRestartClick();
  profile_handleFeedbackClick();
  handleJumpListAction();
}

function handleThemeChange() {
  document.querySelectorAll('.theme-select').forEach((a) => {
    a.addEventListener('click', (e) => {
      if (e.target.matches('input.select_input[type="radio"]')) {
        let themeToSelect = e.target.getAttribute('theme-name');

        changeTheme(themeToSelect);
      }
    });
  });

  themeObs.subscribe((themeObj) => {
    if (themeObj) {
      themeObj.all.forEach((theme) => {
        document.querySelector('html').classList.remove(theme.name);
      });

      document.querySelector('html').classList.add(themeObj.selected.name);

      populateSettingsDropdown(
        document.querySelectorAll('.theme-select .select_options'),
        themeObj,
        'theme'
      );
    }
  });
}

function populateAboutPage() {
  document.querySelector('.connect-desktop-version').innerText =
    glue42gd.version;
  document.querySelector('.gw-url').innerText = glue42gd.gwURL;
  document.querySelector('.username').innerText = glue42gd.user;

  gluePromise.then(async (glue) => {
    document.querySelector('.desktop-client-version').innerText =
      await glueVersion();
  });
}

function handleShutdownClick() {
  document.querySelector('#shutdown').addEventListener('click', () => {
    shutdown();
  });
}

function handleTopMenuClicks() {
  document.addEventListener('click', async (e) => {
    if (e.target.matches('a, a *') && e.ctrlKey) {
      e.preventDefault();
    }

    if (
      e.target.matches('[menu-button-id="apps"], [menu-button-id="apps"] *') &&
      e.altKey
    ) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      setSetting({ showHiddenApps: !getSetting('showHiddenApps') });
      refreshApps();

      return;
    }

    if (e.target.matches('[menu-button-id], [menu-button-id] *')) {
      // Open selected drawer (apps, layouts)
      let topElement = e
        .composedPath()
        .find((e) => e.getAttribute('menu-button-id'));
      let menuId = topElement.getAttribute('menu-button-id');

      document
        .querySelectorAll(`[menu-button-id]:not([menu-button-id="${menuId}"])`)
        .forEach((menu) => {
          menu.classList.remove('is-active');
        });
      document
        .querySelectorAll(`[menu-id]:not([menu-id="${menuId}"])`)
        .forEach((menu) => {
          menu.classList.add('hide');
        });
      topElement.classList.toggle('is-active');

      let menuToToggle = document.querySelector(`[menu-id="${menuId}"]`);

      menuToToggle.addEventListener(
        'transitionend',
        focusMenuInputAfterTransition
      );

      menuToToggle.classList.toggle('hide');

      let hasVisibleDrawers = document.querySelector(
        '.toggle-content:not(.hide)'
      );

      if (hasVisibleDrawers) {
        document.querySelector('.app').classList.add('has-drawer');
      } else {
        document.querySelector('.app').classList.remove('has-drawer');
      }

      setDrawerOpenDirection();
    } else if (e.target.matches('#fav-apps .nav-item, #fav-apps .nav-item *')) {
      // start or focus an app from the favorites list
      let topElement = e
        .composedPath()
        .find((e) => e.classList && e.classList.contains('nav-item'));
      let appName = topElement.getAttribute('app-name');

      startApp(appName);
    }
  });
}

function handleCloseDrawerClicks() {
  document.addEventListener('click', (e) => {
    if (e.target.matches('.close-drawer, .close-drawer *')) {
      let menu = e.composedPath().find((e) => e && e.getAttribute('menu-id'));
      let menuId = menu && menu.getAttribute('menu-id');

      if (menuId) {
        document.querySelector(`[menu-button-id="${menuId}"]`).click();
      }
    }
  });
}

function handleMinimizeClick() {
  document.addEventListener('click', (e) => {
    if (e.target.matches('.minimize, .minimize *')) {
      console.log('minimize');
      minimize();
    }
  });

  isMinimizeAllowed().then(
    (allowed) =>
      allowed && document.querySelector('.minimize').classList.remove('d-none')
  );
}

function focusMenuInputAfterTransition(e) {
  if (!e.propertyName || e.propertyName !== 'width') {
    return;
  }

  let menu = e.target;

  menu.removeEventListener('transitionend', focusMenuInputAfterTransition);

  if (!menu.classList.contains('hide')) {
    let autofocusInput = menu.querySelector('input[autofocus]');

    if (autofocusInput) {
      autofocusInput.focus();
    }
  }
}

function focusInputAfterWindowRecover(window) {
  const drawer = document.querySelectorAll('.toggle-content');

  if (window.isFocused) {
    drawer.forEach((el) => {
      if (!el.classList.contains('hide')) {
        const input = el.querySelector('.input-control');

        if (input) {
          input.focus();
        }
      }
    });
  }
}

function handleModalClose() {
  document.addEventListener('click', (e) => {
    if (
      e.target.matches(
        '.modal [data-dismiss="modal"], .modal [data-dismiss="modal"] *'
      )
    ) {
      let modal = e.composedPath().find((el) => el.classList.contains('modal'));

      modal.classList.remove('show');
    }
  });
}

async function handleJumpListAction() {
  try {
    const jumpList = glue.windows.my().jumpList;
    const category = await jumpList.categories.find('Tasks');
    const action = {
      icon: '%GDDIR%/assets/images/adjust.ico',
      singleInstanceTitle: 'Adjust',
      multiInstanceTitle: 'Adjust',
      callback: () => resetWindow(),
    };

    if (category) {
      category.actions.create([action]);
    } else {
      jumpList.categories.create('Tasks', [action]);
    }
  } catch (error) {
    console.error(error);
  }
}

function handleLayoutsHover() {
  const menuItem = '.show-actions';

  document.addEventListener('mouseover', (event) => {
    const target = event.target.closest(menuItem);

    if (target) {
      target.classList.add('hover');
    } else {
      document.querySelectorAll(menuItem).forEach((item) => {
        item.classList.remove('hover');
      });
    }
  });
}

async function handleMouseHover() {
  document.querySelector('#fav-apps').addEventListener('mousewheel', (e) => {
    // TODO: move
    if (document.querySelector('.horizontal')) {
      document.querySelector('#fav-apps').scrollLeft += Math.round(
        e.deltaY * 0.8
      );
      e.preventDefault();
    }
  });

  let closeTimeout;

  document.querySelector('.app').addEventListener('mouseenter', (e) => {
    document.querySelector('.viewport').classList.add('expand');
    document.querySelector('.app').classList.add('expand-wrapper');

    if (closeTimeout) {
      clearTimeout(closeTimeout);
      closeTimeout = undefined;
    }
  });

  document.querySelector('.app').addEventListener('mouseleave', (e) => {
    closeTimeout = setTimeout(async () => {
      let { offsetWidth: viewPortWidth, offsetHeight: viewPortHeight } =
        document.querySelector('.viewport');
      let margin = windowMargin;

      if (
        e.x < viewPortWidth + margin &&
        e.x > margin &&
        e.y < viewPortHeight + margin - 6 &&
        e.y > margin
      ) {
        console.warn('fake leave');
      }

      if (
        document.querySelectorAll('.toggle-content:not(.hide)').length > 0 ||
        document.querySelectorAll('.dropdown-menu.show').length > 0
      ) {
        return;
      }

      let viewPortBounds = document
        .querySelector('.viewport')
        .getBoundingClientRect();
      let outOfMonitor = isOutOfMonitor(viewPortBounds);

      if (await outOfMonitor) {
        console.warn(
          'window is positioned outside of monitor. will not shrink'
        );
        return;
      }

      document.querySelector('.viewport').classList.remove('expand');
      document.querySelector('.show-actions').classList.remove('hover');
      document.querySelector('.app').classList.remove('expand-wrapper');
      document
        .querySelectorAll('.toggle-content')
        .forEach((e) => e.classList.add('hide'));
    }, 500);
  });
}

function handleDropDownClicks() {
  document.addEventListener('click', (e) => {
    if (e.target.matches('[dropdown-button-id], [dropdown-button-id] *')) {
      const btnElement = e
        .composedPath()
        .find((e) => e.getAttribute('dropdown-button-id'));
      const menuId = btnElement.getAttribute('dropdown-button-id');
      const menu = document.querySelector(`[dropdown-id="${menuId}"]`);

      menu.classList.toggle('show');
    } else {
      document
        .querySelectorAll(`[dropdown-id].show`)
        .forEach((e) => e.classList.remove('show'));
    }
  });
}

async function handleFeedbackClick() {
  document.querySelector('#feedback-panel').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    openFeedbackForm();
  });
}

async function startTutorial() {
  const userProperties = await getUserProperties();
  const hideTutorialOnStartup = userProperties.hideTutorialOnStartup;
  const hideTutorialOnRefresh = Boolean(sessionStorage.getItem('hideTutorial'));
  const tutorialApp = await getApp('getting-started');

  if (hideTutorialOnRefresh) {
    sessionStorage.removeItem('hideTutorial');
    return;
  }

  if (!tutorialApp || hideTutorialOnStartup) {
    setSetting({ showTutorial: false });
    document.querySelector('.show-tutorial-check').classList.add('d-none');
  } else {
    const showTutorial = getSetting('showTutorial');

    if (showTutorial) {
      try {
        await startApp('getting-started');
      } catch (e) {
        console.log('could not start Getting started app', e);
      }
    }
  }
}

function getAppIcon(app = {}) {
  if (app.icon) {
    let icon = app.icon;

    if (!icon.includes('://')) {
      icon = 'data:image/png;base64, ' + icon;
    }
    return `<img src="${icon}" draggable="false" style="width:16px;"/>`;
  } else {
    return `<span class="icon-size-16">
    <i class="icon-app" draggable="false"></i>
  </span>`;
  }
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function isOutOfMonitor(viewportBounds) {
  let monitors = await getMonitorInfo();
  let windowBounds = await getPhysicalWindowBounds();
  let leftMostPoint = monitors.reduce(
    (acc, curr) => (curr.workingAreaLeft < acc ? curr.workingAreaLeft : acc),
    0
  );
  let rightMostPoint = monitors.reduce(
    (acc, curr) =>
      curr.workingAreaLeft + curr.workingAreaWidth > acc
        ? curr.workingAreaLeft + curr.workingAreaWidth
        : acc,
    0
  );
  let visibleAreaLeft = windowBounds.left + viewportBounds.left;
  let visibleAreaRight =
    windowBounds.left + viewportBounds.left + viewportBounds.width;

  return visibleAreaLeft < leftMostPoint || visibleAreaRight > rightMostPoint;
}

function populateSettingsDropdown(
  selectElement,
  selectOptionsObj,
  elementName
) {
  selectElement.forEach((item, i) => {
    let html = ``;

    selectOptionsObj.all.forEach((element) => {
      html += `
            <li class="select_option">
                <input
                    class="select_input"
                    type="radio"
                    name="${elementName}"
                    id="${elementName}-${element.name}"
                    ${elementName}-name="${element.name}"
                    ${
                      element.name === selectOptionsObj.selected.name
                        ? 'checked'
                        : ''
                    }
                />
                <label class="select_label" for="${elementName}-${
        element.name
      }">${element.displayName}</label>
            </li>
            `;
    });

    item.innerHTML = html;
  });
}

function getHorizontalToolbarHeight(length) {
  const appContentHeaderSize = document.querySelector(
    '.app-content-header'
  ).offsetHeight;
  const navItemSize = 48;
  const numberOfRows = length ?? getSetting('toolbarAppRows');

  return appContentHeaderSize + navItemSize * numberOfRows;
}

async function handleAppRowsChange() {
  const numberOfRows = getSetting('toolbarAppRows');
  const appSelectOptions = {
    all: [
      { name: '8', displayName: '8 items (Default)' },
      { name: '10', displayName: '10 items' },
      { name: '12', displayName: '12 items' },
      { name: '14', displayName: '14 items' },
      { name: '16', displayName: '16 items' },
      { name: '18', displayName: '18 items' },
    ],
  };

  appSelectOptions.selected = {
    name: numberOfRows,
    displayName: appSelectOptions.all.find((el) => el.name === numberOfRows)
      .displayName,
  };

  populateSettingsDropdown(
    document.querySelectorAll('.length-select .select_options'),
    appSelectOptions,
    'length'
  );

  let currentToolbarHeight = getHorizontalToolbarHeight();

  document
    .querySelector('.length-select .select_options')
    .addEventListener('click', async (e) => {
      const isVertical = getSetting('vertical');

      if (e.target.matches('input.select_input[type="radio"]')) {
        const selectedLength = e.target.getAttribute('length-name');
        const windowBounds = await getPhysicalWindowBounds();
        const primaryScaleFactor = await getPrimaryScaleFactor();
        const scaleFactor = await getScaleFactor();
        const newToolbarHeight = getHorizontalToolbarHeight(selectedLength);

        setSetting({ toolbarAppRows: selectedLength });

        await setWindowSize();
        setDrawerOpenDirection();

        if (!isVertical) {
          await moveMyWindow({
            top:
              (windowBounds.top +
                currentToolbarHeight / scaleFactor -
                newToolbarHeight / scaleFactor) *
              primaryScaleFactor,
          });
        }

        currentToolbarHeight = newToolbarHeight;
      }
    });
}

async function setWindowSize() {
  const isVertical = getSetting('vertical');
  const appLancher = document.querySelector('.viewport-header');
  const appContentHeader = document.querySelector('.app-content-header');
  const appRowsNumber = getSetting('toolbarAppRows');
  const navItem = document.querySelector('.applications-nav');
  const contentItems = document.querySelector('.content-items');
  const horizontalHeight = getHorizontalToolbarHeight();

  appLancher.style.height = `${appLancher.offsetHeight}px`;
  appContentHeader.style.height = `${appContentHeader.offsetHeight}px`;
  contentItems.style.height = `${navItem.offsetHeight * appRowsNumber}px`;

  if (isVertical) {
    await moveMyWindow({
      width: toolbarWidth.vertical + toolbarDrawerSize.vertical * 2,
      height: horizontalHeight,
    });
  } else {
    await moveMyWindow({
      width: toolbarWidth.horizontal,
      height: appLancher.offsetHeight + horizontalHeight * 2,
    });
  }
}

function setDrawerOpenDirection() {
  const app = document.querySelector('.app');
  const isVertical = getSetting('vertical');
  const horizontalHeight = getHorizontalToolbarHeight();

  if (isVertical) {
    app.style.top = 0;
    app.style.maxHeight = `${horizontalHeight}px`;
  } else {
    const appLancher = document.querySelector('.viewport');

    app.style.top = `${horizontalHeight}px`;

    if (
      app.classList.contains('open-top') &&
      app.classList.contains('has-drawer')
    ) {
      app.style.top = 0;
    } else {
      app.style.top = `${horizontalHeight}px`;
    }

    if (app.classList.contains('has-drawer')) {
      app.style.maxHeight = `${appLancher.offsetHeight + horizontalHeight}px`;
    } else {
      app.style.maxHeight = `${appLancher.offsetHeight}px`;
    }
  }
}

async function setDrawerOpenClasses() {
  const workArea = await getWindowWorkArea();
  const visibleArea = await getVisibleArea(document.querySelector('.viewport'));
  const app = document.querySelector('.app');
  const isVertical = getSetting('vertical');
  const horizontalHeight = getHorizontalToolbarHeight();
  const drawerOpen = app.classList.contains('has-drawer');

  if (drawerOpen) {
    return;
  }

  if (isVertical) {
    if (visibleArea.right + toolbarDrawerSize.vertical > workArea.right) {
      app.classList.add('open-left');
    } else if (app.classList.contains('open-left')) {
      app.classList.remove('open-left');
    }
  } else if (visibleArea.bottom + horizontalHeight > workArea.bottom) {
    if (visibleArea.top - horizontalHeight < workArea.top) {
      if (app.classList.contains('open-top')) {
        app.classList.remove('open-top');
      }
    } else {
      app.classList.add('open-top');
    }
  } else if (app.classList.contains('open-top')) {
    app.classList.remove('open-top');
  }
}

function setOrientation() {
  const isVertical = getSetting('vertical');
  const app = document.querySelector('.app');

  document.querySelector('#toggle .mode').innerHTML = isVertical
    ? 'horizontal'
    : 'vertical';

  app.classList.add(isVertical ? 'vertical' : 'horizontal');
  app.classList.remove(isVertical ? 'horizontal' : 'vertical');

  document.querySelectorAll('[column]').forEach((col) => {
    isVertical
      ? col.classList.add('flex-column')
      : col.classList.remove('flex-column');
  });
}

function handleOrientationChange() {
  document.querySelector('#toggle').addEventListener('click', async () => {
    let isVertical = getSetting('vertical');

    isVertical = !isVertical;
    setSetting({ vertical: isVertical });

    await repositionOnOrientationChange(isVertical);
    await setWindowSize();
  });
}

async function repositionOnOrientationChange(vertical) {
  const windowBounds = await getPhysicalWindowBounds();
  const primaryScaleFactor = await getPrimaryScaleFactor();
  const scaleFactor = await getScaleFactor();
  const horizontalHeight = getHorizontalToolbarHeight();

  if (vertical) {
    await moveMyWindow({
      top:
        (windowBounds.top + horizontalHeight / scaleFactor) *
        primaryScaleFactor,
      left:
        (windowBounds.left - toolbarDrawerSize.vertical / scaleFactor) *
        primaryScaleFactor,
    });
  } else {
    await moveMyWindow({
      top:
        (windowBounds.top - horizontalHeight / scaleFactor) *
        primaryScaleFactor,
      left:
        (windowBounds.left + toolbarDrawerSize.vertical / scaleFactor) *
        primaryScaleFactor,
    });
  }
}

// Helper function to get a chosen HTML elements' visible area in the window bounds
async function getVisibleArea(element) {
  const windowBounds = await getPhysicalWindowBounds();
  const visibleArea = element.getBoundingClientRect();
  const scaleFactor = await getScaleFactor();

  return {
    left: windowBounds.left + visibleArea.left / scaleFactor,
    top: windowBounds.top + visibleArea.top / scaleFactor,
    right:
      windowBounds.left +
      visibleArea.left / scaleFactor +
      visibleArea.width / scaleFactor,
    bottom:
      windowBounds.top +
      visibleArea.top / scaleFactor +
      visibleArea.height / scaleFactor,
    width: visibleArea.width / scaleFactor,
    height: visibleArea.height / scaleFactor,
  };
}

function checkRectangleOffBounds(rect1, rect2) {
  const offBounds = [];

  // if rect2 moves beyond left boundaries of rect1
  if (rect2.left < rect1.left) {
    offBounds.push({
      left: rect2.left - rect1.left,
    });
  }

  // if rect2 moves beyond top boundaries of rect1
  if (rect2.top < rect1.top) {
    offBounds.push({
      top: rect2.top - rect1.top,
    });
  }

  // if rect2 moves beyond right boundaries of rect1
  if (rect2.right > rect1.right) {
    offBounds.push({
      right: rect2.right - rect1.right,
    });
  }

  // if rect2 moves beyond bottom boundaries of rect1
  if (rect2.bottom > rect1.bottom) {
    offBounds.push({
      bottom: rect2.bottom - rect1.bottom,
    });
  }

  return offBounds;
}

async function checkWindowPosition() {
  const workArea = await getWindowWorkArea();
  const visibleArea = await getVisibleArea(
    document.querySelector('.draggable')
  );

  return checkRectangleOffBounds(workArea, visibleArea);
}

async function setWindowPosition() {
  const isVertical = getSetting('vertical');
  const workArea = await getWindowWorkArea();
  const visibleArea = await getVisibleArea(
    document.querySelector('.draggable')
  );
  const offBounds = await checkWindowPosition();
  const primaryScaleFactor = await getPrimaryScaleFactor();
  const scaleFactor = await getScaleFactor();
  const startPosition = initialPosition / scaleFactor;
  const drawerSize = toolbarDrawerSize.vertical / scaleFactor;

  if (offBounds.length === 0) return;

  offBounds.forEach(async (offset) => {
    if (isVertical) {
      switch (Object.keys(offset)[0]) {
        case 'left':
          await moveMyWindow({
            left:
              (workArea.left + startPosition - drawerSize) * primaryScaleFactor,
          });
          break;

        case 'top':
          await moveMyWindow({
            top: (workArea.top + startPosition) * primaryScaleFactor,
          });
          break;

        case 'right':
          await moveMyWindow({
            left:
              (workArea.right -
                visibleArea.width -
                drawerSize -
                startPosition) *
              primaryScaleFactor,
          });
          break;

        case 'bottom':
          await moveMyWindow({
            top:
              (workArea.bottom - visibleArea.height - startPosition) *
              primaryScaleFactor,
          });
          break;

        default:
          break;
      }
    } else {
      const horizontalHeight = getHorizontalToolbarHeight();
      const drawerHeight = horizontalHeight / scaleFactor;

      switch (Object.keys(offset)[0]) {
        case 'left':
          await moveMyWindow({
            left: (workArea.left + startPosition) * primaryScaleFactor,
          });
          break;

        case 'top':
          await moveMyWindow({
            top:
              (workArea.top + startPosition - drawerHeight) *
              primaryScaleFactor,
          });
          break;

        case 'right':
          await moveMyWindow({
            left:
              (workArea.left +
                workArea.width -
                visibleArea.width -
                startPosition) *
              primaryScaleFactor,
          });
          break;

        case 'bottom':
          await moveMyWindow({
            top:
              (workArea.top +
                workArea.height -
                visibleArea.height -
                drawerHeight -
                startPosition) *
              primaryScaleFactor,
          });
          break;

        default:
          break;
      }
    }
  });
}

async function resetWindow() {
  setSetting({ vertical: true });
  await setWindowSize();
  windowCenter();
}

function elementObserver(element, config, callback) {
  const elementToObserve = element;
  const observer = new MutationObserver(callback);

  observer.observe(elementToObserve, config);
}

export {
  handleEvents,
  setOrientation,
  handleThemeChange,
  handleShutdownClick,
  handleTopMenuClicks,
  handleCloseDrawerClicks,
  handleModalClose,
  handleMouseHover,
  handleLayoutsHover,
  handleDropDownClicks,
  focusInputAfterWindowRecover,
  windowMargin,
  startTutorial,
  escapeHtml,
  getAppIcon,
  setWindowSize,
  setWindowPosition,
  setDrawerOpenClasses,
  setDrawerOpenDirection,
  elementObserver,
  populateSettingsDropdown,
};
