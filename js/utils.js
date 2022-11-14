import {
  shutdown,
  gluePromise,
  startApp,
  getApp,
  getUserProperties,
  themeObs,
  changeTheme,
  refreshApps,
  openNotificationPanel,
  glueVersion,
  getMonitorInfo,
  notificationEnabledObs,
  moveMyWindow,
  configureMyWindow,
  resizeWindowVisibleArea,
  minimize,
  isMinimizeAllowed,
  checkNotificationsConfigure,
  configureNotifications,
  openFeedbackForm,
  getWindowWorkArea,
  getScaleFactor,
  getPrimaryScaleFactor,
  windowCenter,
  windowRefresh,
  getLogicalWindowBounds,
  getPhysicalWindowBounds,
} from './glue-related.js';
import {
  toolbarWidth,
  toolbarDrawerSize,
  initialPosition,
  setSetting,
  getSetting,
} from './settings.js';
// import { searchInputObs } from './applications.js';
import {
  populateProfileData,
  profile_handleShutdownClick,
  profile_handleRestartClick,
  profile_handleFeedbackClick,
} from './profile.js';

import { topMenuVisibleObs } from './visible-area.js';

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
  qa('.theme-select').forEach((a) => {
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
        q('html').classList.remove(theme.name);
      });

      q('html').classList.add(themeObj.selected.name);

      populateSettingsDropdown(
        qa('.theme-select .select_options'),
        themeObj,
        'theme'
      );
    }
  });
}

function populateAboutPage() {
  q('.gd-version').innerText = glue42gd.version;
  q('.gw-url').innerText = glue42gd.gwURL;
  q('.username').innerText = glue42gd.user;

  gluePromise.then(async (glue) => {
    q('.glue-js-version').innerText = await glueVersion();
  });
}

function handleShutdownClick() {
  q('#shutdown').addEventListener('click', () => {
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
      let topElement = e.path.find((e) => e.getAttribute('menu-button-id'));
      let menuId = topElement.getAttribute('menu-button-id');

      qa(`[menu-button-id]:not([menu-button-id="${menuId}"])`).forEach(
        (menu) => {
          menu.classList.remove('is-active');
        }
      );
      qa(`[menu-id]:not([menu-id="${menuId}"])`).forEach((menu) => {
        menu.classList.add('hide');
      });
      topElement.classList.toggle('is-active');

      let menuToToggle = q(`[menu-id="${menuId}"]`);

      menuToToggle.addEventListener(
        'transitionend',
        focusMenuInputAfterTransition
      );
      menuToToggle.classList.toggle('hide');

      let hasVisibleDrawers = q('.toggle-content:not(.hide)');
      const isVertical = getSetting('vertical');
      const viewPortHeight = q('.viewport').offsetHeight;
      const drawerHeight = getHorizontalToolbarHeight();

      if (hasVisibleDrawers) {
        q('.app').classList.add('has-drawer');
      } else {
        q('.app').classList.remove('has-drawer');
      }

      // TODO: Fix Manager Height
      if (hasVisibleDrawers && !isVertical) {
        q('.app').style.maxHeight = `${viewPortHeight + drawerHeight}px`;
      } else if (!hasVisibleDrawers && !isVertical) {
        q('.app').style.maxHeight = `${viewPortHeight}px`;
      }

      setTimeout(() => {
        setWindowVisibleArea();
      }, 500);
    } else if (e.target.matches('#fav-apps .nav-item, #fav-apps .nav-item *')) {
      //start or focus an app from the favorites list
      let topElement = e.path.find(
        (e) => e.classList && e.classList.contains('nav-item')
      );
      let appName = topElement.getAttribute('app-name');
      let isActive = topElement.classList.contains('app-active');

      startApp(appName);
    }
  });
}

function handleCloseDrawerClicks() {
  document.addEventListener('click', (e) => {
    if (e.target.matches('.close-drawer, .close-drawer *')) {
      let menu = e.path.find((e) => e && e.getAttribute('menu-id'));
      let menuId = menu && menu.getAttribute('menu-id');

      if (menuId) {
        q(`[menu-button-id="${menuId}"]`).click();
        // q('.expand').classList.remove('expand');
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
    (allowed) => allowed && q('.minimize').classList.remove('d-none')
  );
}

function focusMenuInputAfterTransition(e) {
  if (!e.propertyName || e.propertyName !== 'width') {
    return;
  }

  let menu = e.srcElement;

  menu.removeEventListener('transitionend', focusMenuInputAfterTransition);

  if (!menu.classList.contains('hide')) {
    let autofocusInput = menu.querySelector('input[autofocus]');

    if (autofocusInput) {
      autofocusInput.focus();
    }
  }
}

function focusInputAfterWindowRecover(window) {
  const drawer = qa('.toggle-content');

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
      let modal = e.path.find((el) => el.classList.contains('modal'));

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

async function handleMouseHover() {
  q('#fav-apps').addEventListener('mousewheel', (e) => {
    // TODO: move
    if (q('.horizontal')) {
      q('#fav-apps').scrollLeft += Math.round(e.deltaY * 0.8);
      e.preventDefault();
    }
  });

  let closeTimeout;

  q('.app').addEventListener('mouseenter', (e) => {
    q('.viewport').classList.add('expand');
    q('.app').classList.add('expand-wrapper');

    if (closeTimeout) {
      clearTimeout(closeTimeout);
    }
  });

  q('.app').addEventListener('mouseleave', async (e) => {
    let { offsetWidth: viewPortWidth, offsetHeight: viewPortHeight } =
      q('.viewport');
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
      qa('.toggle-content:not(.hide)').length > 0 ||
      qa('.dropdown-menu.show').length > 0
    ) {
      return;
    }

    let viewPortBounds = q('.viewport').getBoundingClientRect();
    let outOfMonitor = isOutOfMonitor(viewPortBounds);

    if (await outOfMonitor) {
      console.warn('window is positioned outside of monitor. will not shrink');
      return;
    }

    closeTimeout = setTimeout(async () => {
      // await applyOpenClasses();
      q('.viewport').classList.remove('expand');
      q('.app').classList.remove('expand-wrapper');
      qa('.toggle-content').forEach((e) => e.classList.add('hide'));
      // qa('[dropdown-id].show').forEach(e => e.classList.remove('show'));
    }, 500);
  });
}

async function handleNotificationClick() {
  const enableNotifications = getSetting('enableNotifications');

  if (enableNotifications) {
    notificationEnabledObs.subscribe((data) => {
      q('#notification-panel').classList[data ? 'remove' : 'add']('d-none');
    });
  }

  q('#notification-panel').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    openNotificationPanel();
  });
}

async function handleEnableNotifications() {
  const methodExists = await checkNotificationsConfigure();

  if (methodExists) {
    handleEnableNotificationsClick();
    handleEnableToastsClick();
  }
}

function handleEnableNotificationsClick() {
  const notificationPanel = q('#notification-panel');
  const enableNotifications = q('#enable-notifications');
  const enableToasts = q('#enable-toasts');

  enableNotifications.addEventListener('click', (e) => {
    if (e.target.checked) {
      configureNotifications({ enable: true, enableToasts: false });
      notificationPanel.classList.remove('d-none');
      enableToasts.disabled = false;
    } else {
      configureNotifications({ enable: false, enableToasts: false });
      notificationPanel.classList.add('d-none');
      enableToasts.checked = false;
      enableToasts.disabled = true;
    }
  });
}

function handleEnableToastsClick() {
  const enableToasts = q('#enable-toasts');

  enableToasts.addEventListener('click', (e) => {
    if (e.target.checked) {
      configureNotifications({ enableToasts: true });
    } else {
      configureNotifications({ enableToasts: false });
    }
  });
}

async function handleFeedbackClick() {
  q('#feedback-panel').addEventListener('click', (e) => {
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
    q('.show-tutorial-check').classList.add('d-none');
  } else {
    const showTutorial = getSetting('showTutorial');

    if (showTutorial) {
      try {
        startApp('getting-started');
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

// function clearSearch() {
//   searchInputObs.next('');
//   q('#app-search').value = '';
// }

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
                    id="${elementName}-${element.name + i}"
                    ${elementName}-name="${element.name}"
                    ${
                      element.name === selectOptionsObj.selected.name
                        ? 'checked'
                        : ''
                    }
                />
                <label class="select_label" for="${elementName}-${
        element.name + i
      }">${element.displayName}</label>
            </li>
            `;
    });

    item.innerHTML = html;
  });
}

function getHorizontalToolbarHeight(length) {
  const appContentHeader = q('.app-content-header');
  const navItem = q('.applications-nav');
  const numberOfRows = length ?? getSetting('toolbarAppRows');

  return appContentHeader.offsetHeight + navItem.offsetHeight * numberOfRows;
}

async function handleAppRowsChange() {
  const numberOfRows = getSetting('toolbarAppRows');
  const app = q('.app');
  const appSelectOptions = {
    all: [
      { name: '8', displayName: '8 Items (Default)' },
      { name: '10', displayName: '10 Items' },
      { name: '12', displayName: '12 Items' },
      { name: '14', displayName: '14 Items' },
      { name: '16', displayName: '16 Items' },
      { name: '18', displayName: '18 Items' },
    ],
  };

  appSelectOptions.selected = {
    name: numberOfRows,
    displayName: appSelectOptions.all.find((el) => el.name === numberOfRows)
      .displayName,
  };

  populateSettingsDropdown(
    qa('.length-select .select_options'),
    appSelectOptions,
    'length'
  );

  const currentToolbarHeight = getHorizontalToolbarHeight();

  q('.length-select .select_options').addEventListener('click', async (e) => {
    const isVertical = getSetting('vertical');

    if (e.target.matches('input.select_input[type="radio"]')) {
      const selectedLength = e.target.getAttribute('length-name');
      const newToolbarHeight = getHorizontalToolbarHeight(selectedLength);

      setSetting({ toolbarAppRows: selectedLength });

      if (!isVertical) {
        qa('.toggle-content').forEach((toggle) => {
          toggle.classList.add('hide');
        });
        app.classList.remove('open-top');

        await moveMyWindow({
          top: currentToolbarHeight - newToolbarHeight,
        });
      }

      windowRefresh();
    }
  });
}

async function setWindowSize() {
  const isVertical = getSetting('vertical');
  const appLancher = q('.viewport-header');
  const appContentHeader = q('.app-content-header');
  const appRowsNumber = getSetting('toolbarAppRows');
  const navItem = q('.applications-nav');
  const contentItems = q('.content-items');
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

function setWindowVisibleArea(topMenuVisible, layoutDropDownVisible) {
  const isVertical = getSetting('vertical');
  const visibleAreas = [];

  visibleAreas.push(buildVisibleArea(q('.app')));

  if (!isVertical) {
    if (topMenuVisible) {
      visibleAreas.push(buildVisibleArea(q('#menu-top')));
    }

    if (layoutDropDownVisible) {
      visibleAreas.push(buildVisibleArea(q('.layout-menu-tool')));
    }
  }

  return resizeWindowVisibleArea(visibleAreas);
}

function buildVisibleArea(element) {
  const { top, left, width, height } = element.getBoundingClientRect();

  return {
    top: Math.round(top),
    left: Math.round(left),
    width: Math.round(width),
    height: Math.round(height),
  };
}

function setDrawerOpenDirection() {
  const app = q('.app');
  const isVertical = getSetting('vertical');
  const horizontalHeight = getHorizontalToolbarHeight();

  if (isVertical) {
    app.style.top = 0;
    app.style.maxHeight = `${horizontalHeight}px`;
  } else {
    const appLancher = q('.viewport');

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
  const visibleArea = await getVisibleArea(q('.viewport'));
  const app = q('.app');
  const isVertical = getSetting('vertical');
  const horizontalHeight = getHorizontalToolbarHeight();

  if (isVertical) {
    if (visibleArea.right + toolbarDrawerSize.vertical > workArea.right) {
      app.classList.add('open-left');
    } else {
      if (app.classList.contains('open-left')) {
        app.classList.remove('open-left');
      }
    }
  } else {
    if (visibleArea.bottom + horizontalHeight > workArea.bottom) {
      if (visibleArea.top - horizontalHeight < workArea.top) {
        if (app.classList.contains('open-top')) {
          app.classList.remove('open-top');
        }
      } else {
        app.classList.add('open-top');
      }
    } else {
      if (app.classList.contains('open-top')) {
        app.classList.remove('open-top');
      }
    }
  }
}

function setOrientation() {
  const isVertical = getSetting('vertical');
  const app = q('.app');

  q('#toggle .mode').innerHTML = isVertical ? 'horizontal' : 'vertical';

  app.classList.add(isVertical ? 'vertical' : 'horizontal');
  app.classList.remove(isVertical ? 'horizontal' : 'vertical');

  qa('[column]').forEach((col) => {
    isVertical
      ? col.classList.add('flex-column')
      : col.classList.remove('flex-column');
  });
}

function handleOrientationChange() {
  q('#toggle').addEventListener('click', async () => {
    let isVertical = getSetting('vertical');

    isVertical = !isVertical;
    setSetting({ vertical: isVertical });

    await repositionOnOrientationChange(isVertical);
    setWindowMoveArea();

    setTimeout(() => {
      windowRefresh();
    }, 250);
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

function closeAllMenus() {
  const appDrawer = q('.app');
  const openedMenus = qa('.toggle-content:not(.hide)');
  const dropdownMenus = qa('.dropdown-menu');
  const activeButtons = qa('.nav-item.is-active');

  openedMenus.forEach((el) => el.classList.add('hide'));
  activeButtons.forEach((el) => el.classList.remove('is-active'));
  dropdownMenus.forEach((el) => el.classList.remove('show'));
  topMenuVisibleObs.next(false);
  appDrawer.classList.contains('has-drawer')
    ? appDrawer.classList.remove('has-drawer')
    : null;
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
  // if rect2 moves beyond left boundaries of rect1
  if (rect2.left < rect1.left) {
    return {
      left: rect2.left - rect1.left,
    };
  }

  // if rect2 moves beyond top boundaries of rect1
  if (rect2.top < rect1.top) {
    return {
      top: rect2.top - rect1.top,
    };
  }

  // if rect2 moves beyond right boundaries of rect1
  if (rect2.right > rect1.right) {
    return {
      right: rect2.right - rect1.right,
    };
  }

  // if rect2 moves beyond bottom boundaries of rect1
  if (rect2.bottom > rect1.bottom) {
    return {
      bottom: rect2.bottom - rect1.bottom,
    };
  }

  return false;
}

async function checkWindowPosition() {
  const workArea = await getWindowWorkArea();
  const visibleArea = await getVisibleArea(q('.draggable'));

  return checkRectangleOffBounds(workArea, visibleArea);
}

async function setWindowPosition() {
  const isVertical = getSetting('vertical');
  const workArea = await getWindowWorkArea();
  const visibleArea = await getVisibleArea(q('.draggable'));
  const offBounds = await checkWindowPosition();
  const offBoundsDirection = Object.keys(offBounds)[0];
  const primaryScaleFactor = await getPrimaryScaleFactor();
  const scaleFactor = await getScaleFactor();
  const startPosition = initialPosition / scaleFactor;
  const drawerSize = toolbarDrawerSize.vertical / scaleFactor;

  if (!offBounds) return;

  if (isVertical) {
    if (offBoundsDirection !== 'undefined' && offBoundsDirection === 'left') {
      await moveMyWindow({
        left: (workArea.left + startPosition - drawerSize) * primaryScaleFactor,
      });
    }

    if (offBoundsDirection !== 'undefined' && offBoundsDirection === 'top') {
      await moveMyWindow({
        top: (workArea.top + startPosition) * primaryScaleFactor,
      });
    }

    if (offBoundsDirection !== 'undefined' && offBoundsDirection === 'right') {
      await moveMyWindow({
        left:
          (workArea.right - visibleArea.width - drawerSize - startPosition) *
          primaryScaleFactor,
      });
    }

    if (offBoundsDirection !== 'undefined' && offBoundsDirection === 'bottom') {
      await moveMyWindow({
        top:
          (workArea.bottom - visibleArea.height - startPosition) *
          primaryScaleFactor,
      });
    }
  } else {
    const horizontalHeight = getHorizontalToolbarHeight();
    const drawerHeight = horizontalHeight / scaleFactor;

    if (offBoundsDirection !== 'undefined' && offBoundsDirection === 'left') {
      await moveMyWindow({
        left: (workArea.left + startPosition) * primaryScaleFactor,
      });
    }

    if (offBoundsDirection !== 'undefined' && offBoundsDirection === 'top') {
      await moveMyWindow({
        top: (workArea.top + startPosition - drawerHeight) * primaryScaleFactor,
      });
    }

    if (offBoundsDirection !== 'undefined' && offBoundsDirection === 'right') {
      await moveMyWindow({
        left:
          (workArea.left + workArea.width - visibleArea.width - startPosition) *
          primaryScaleFactor,
      });
    }

    if (offBoundsDirection !== 'undefined' && offBoundsDirection === 'bottom') {
      await moveMyWindow({
        top:
          (workArea.top +
            workArea.height -
            visibleArea.height -
            drawerHeight -
            startPosition) *
          primaryScaleFactor,
      });
    }
  }
}

async function resetWindow() {
  setSetting({ vertical: true });
  setOrientation();
  windowCenter();
  windowRefresh();
}

function setWindowMoveArea() {
  setTimeout(async () => {
    const dragAreaRect = q('.draggable').getBoundingClientRect();
    const windowBounds = await getLogicalWindowBounds();

    await configureMyWindow({
      moveAreaTopMargin: `${Math.round(dragAreaRect.left)}, ${Math.round(
        dragAreaRect.top
      )}, ${Math.round(
        windowBounds.width - (dragAreaRect.left + dragAreaRect.width)
      )}, 0`,
      moveAreaThickness: `0, ${Math.round(
        dragAreaRect.top + dragAreaRect.height
      )}, 0, 0`,
    });
  }, 500);
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
  handleNotificationClick,
  handleModalClose,
  handleMouseHover,
  setWindowVisibleArea,
  focusInputAfterWindowRecover,
  windowMargin,
  startTutorial,
  // clearSearch,
  escapeHtml,
  getAppIcon,
  // openDrawer,
  setWindowSize,
  setWindowPosition,
  setWindowMoveArea,
  setDrawerOpenClasses,
  setDrawerOpenDirection,
  closeAllMenus,
  elementObserver,
};
