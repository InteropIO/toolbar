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
  getWindowBounds,
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
  handleToolbarOrientationChange();
  handleToolbarAppRowsChange();
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
      setDrawerOpenClass();

      let hasVisibleDrawers = q('.toggle-content:not(.hide)');

      if (hasVisibleDrawers) {
        q('.app').classList.add('has-drawer');
      } else {
        q('.app').classList.remove('has-drawer');
      }
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
  const tutorialApp = await getApp('getting-started');
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
  let windowBounds = await getWindowBounds();
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

// function openDrawer(drawerId) {
//   let menuButton = q(`[menu-button-id=${drawerId}]`);
//   let hoverEvent = new MouseEvent('mouseenter', {
//     view: window,
//     bubbles: true,
//   });

//   menuButton.dispatchEvent(hoverEvent);
//   menuButton.click();
// }

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

async function handleToolbarAppRowsChange() {
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

      await setWindowSize();
      setWindowVisibleArea();
      await setWindowMoveArea();
    }
  });
}

async function setWindowSize() {
  const isVertical = getSetting('vertical');
  const app = q('.app');
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
    app.classList.contains('open-left')
      ? (app.style.left = '0')
      : (app.style.left = `${toolbarDrawerSize.vertical}px`);
    app.style.top = '0';
    app.style.maxHeight = `${horizontalHeight}px`;

    await moveMyWindow({
      width: toolbarWidth.vertical + toolbarDrawerSize.vertical * 2,
      height: horizontalHeight,
    });
  } else {
    app.style.top = `${horizontalHeight}px`;
    app.style.left = '0';
    app.style.maxHeight = `${appLancher.offsetHeight}px`;

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

async function setDrawerOpenClass() {
  const isVertical = getSetting('vertical');
  const workArea = await getWindowWorkArea();
  const windowBounds = await getWindowBounds();
  const app = q('.app');
  const appLancher = q('.viewport-header');
  const appContentHeader = q('.app-content-header');
  const appRowsNumber = getSetting('toolbarAppRows');
  const navItem = q('.applications-nav');
  const horizontalHeight = getHorizontalToolbarHeight();

  if (isVertical) {
    app.style.left = `${toolbarDrawerSize.vertical}px`;

    if (
      windowBounds.left + windowBounds.width >
      workArea.left + workArea.width
    ) {
      app.classList.add('open-left');
      app.classList.contains('has-drawer')
        ? (app.style.left = '0')
        : (app.style.left = `${toolbarDrawerSize.vertical}px`);
    } else {
      app.classList.remove('open-left');
    }
  } else {
    app.style.top = `${horizontalHeight}px`;

    app.classList.contains('has-drawer')
      ? (app.style.maxHeight = `${
          appLancher.offsetHeight +
          appContentHeader.offsetHeight +
          navItem.offsetHeight * appRowsNumber
        }px`)
      : (app.style.maxHeight = `${appLancher.offsetHeight}px`);

    if (
      windowBounds.top + windowBounds.height >
      workArea.top + workArea.height
    ) {
      app.classList.add('open-top');
      app.classList.contains('has-drawer')
        ? (app.style.top = '0')
        : appLancher.offsetHeight +
          appContentHeader.offsetHeight +
          navItem.offsetHeight * appRowsNumber;
    } else {
      app.classList.remove('open-top');
    }
  }
}

async function setWindowParams() {
  await setWindowSize();
  setWindowVisibleArea();
  await setWindowMoveArea();
  await setWindowPosition();
}

function setToolbarOrientation() {
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

function handleToolbarOrientationChange() {
  q('#toggle').addEventListener('click', () => {
    let isVertical = getSetting('vertical');
    const app = q('.app');
    isVertical = !isVertical;

    setSetting({ vertical: isVertical });

    if (isVertical) {
      app.classList.remove('open-top');
    } else {
      app.classList.remove('open-left');
    }

    setWindowParams();
    closeAllMenus();
  });
}

function closeAllMenus() {
  const openedMenus = qa('.toggle-content:not(.hide)');
  const activeButtons = qa('.nav-item.is-active');

  openedMenus.forEach((el) => el.classList.add('hide'));
  activeButtons.forEach((el) => el.classList.remove('is-active'));
}

// Helper function to get a chosen HTML elements' visible area in the window bounds
async function getVisibleArea(element) {
  const windowBounds = await getWindowBounds();
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

async function checkWindowPosition() {
  const workArea = await getWindowWorkArea();
  const visibleArea = await getVisibleArea(q('.draggable'));

  async function overlap(rect1, rect2) {
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

    return true;
  }

  return overlap(workArea, visibleArea);
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

  if (isVertical) {
    if (offBoundsDirection === 'left') {
      await moveMyWindow({
        left: (workArea.left + startPosition - drawerSize) * primaryScaleFactor,
      });
    }

    if (offBoundsDirection === 'top') {
      await moveMyWindow({
        top: (workArea.top + startPosition) * primaryScaleFactor,
      });
    }

    if (offBoundsDirection === 'right') {
      await moveMyWindow({
        left:
          (workArea.left +
            workArea.width -
            visibleArea.width -
            drawerSize -
            startPosition) *
          primaryScaleFactor,
      });
    }

    if (offBoundsDirection === 'bottom') {
      await moveMyWindow({
        top:
          (workArea.top +
            workArea.height -
            visibleArea.height -
            startPosition) *
          primaryScaleFactor,
      });
    }
  } else {
    const horizontalHeight = getHorizontalToolbarHeight();
    const drawerHeight = horizontalHeight / scaleFactor;

    if (offBoundsDirection === 'left') {
      await moveMyWindow({
        left: (workArea.left + startPosition) * primaryScaleFactor,
      });
    }

    if (offBoundsDirection === 'top') {
      await moveMyWindow({
        top: (workArea.top + startPosition - drawerHeight) * primaryScaleFactor,
      });
    }

    if (offBoundsDirection === 'right') {
      await moveMyWindow({
        left:
          (workArea.left + workArea.width - visibleArea.width - startPosition) *
          primaryScaleFactor,
      });
    }

    if (offBoundsDirection === 'bottom') {
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

async function configureWindowMoveArea(margin, thickness) {
  await configureMyWindow({
    moveAreaTopMargin: `${Math.round(margin.left)}, ${Math.round(
      margin.top
    )}, ${Math.round(margin.right)}, ${Math.round(margin.bottom)}`,
    moveAreaThickness: `${Math.round(thickness.left)}, ${Math.round(
      thickness.top
    )}, ${Math.round(thickness.right)}, ${Math.round(thickness.bottom)}`,
  });
}

async function setWindowMoveArea() {
  const isVertical = getSetting('vertical');
  const dragAreaRect = q('.draggable').getBoundingClientRect();
  const horizontalHeight = getHorizontalToolbarHeight();
  const dragArea = {
    width: dragAreaRect.width,
    height: dragAreaRect.height,
  };

  if (isVertical) {
    const margin = {
      left: toolbarDrawerSize.vertical,
      top: 0,
      right:
        toolbarDrawerSize.vertical + toolbarWidth.vertical - dragArea.width,
      bottom: 0,
    };

    const thickness = {
      left: 0,
      top: dragArea.height,
      right: 0,
      bottom: 0,
    };

    configureWindowMoveArea(margin, thickness);
  } else {
    const margin = {
      left: 0,
      top: horizontalHeight,
      right: 0,
      bottom: horizontalHeight,
    };

    const thickness = {
      left: dragArea.width,
      top: 0,
      right: 0,
      bottom: 0,
    };

    configureWindowMoveArea(margin, thickness);
  }
}

// Keyboard Navigation
function handleKeyboardNavigation() {
  listenBodyClicks();
  let currentItem;
  let clickedItem;

  function getActiveNodeFolderName(node) {
    const folderName = node.getAttribute('folder-name');
    return qa(`.nav-item[folder-name="${folderName}"]`)[0];
  }

  function getStartingListInMainMenu() {
    return q('.viewport .nav-tabs');
  }

  function getStartingUlInToggleView() {
    const visibleContent = q('.toggle-content:not(.hide)');
    if (visibleContent) {
      const children = visibleContent.children;
      return [...children].find(
        (el) => el.tagName && el.tagName.toLowerCase() == 'ul'
      );
    }
  }

  function getInput() {
    return q('.toggle-content:not(.hide)')?.querySelector(
      '.form-control.input-control'
    );
  }

  function isAppElement(e) {
    return !!e?.getAttribute('app-name');
  }

  function isFolderElement(e) {
    return e?.matches('.folder');
  }

  function isInput(e) {
    return e?.matches('.form-control.input-control');
  }

  function isFolderOpenedElement(e) {
    return e?.matches('.folder.folder-open');
  }

  const isLayoutItem = () =>
    upTo(currentItem, (el) => {
      return el?.id === 'layout-menu-tool';
    });

  const isDrawerOpenDirectionDifferent = () => {
    return q('.app')
      .className.split(' ')
      .some((cn) => /open-.*/.test(cn));
  };

  const isInToggleView = () =>
    upTo(currentItem, (el) => {
      return el?.classList && el.classList?.contains('toggle-content');
    });

  const isItemInFolder = (e) =>
    upTo(e, (el) => {
      return el?.classList && el.classList?.contains('folder');
    });

  const isItemAppFavorite = (e) =>
    upTo(e, (el) => {
      return el?.id === 'fav-apps';
    });

  const isItemFromMainMenu = (e) =>
    upTo(e, (el) => {
      return el?.id === 'applicationLauncher';
    });

  function reset(e) {
    if (e.isTrusted) {
      currentItem?.classList.remove('hover');
      currentItem = undefined;
      clickedItem = undefined;
    }
  }

  function listenBodyClicks() {
    document.addEventListener('click', reset);
  }

  function onEnterClicked() {
    if (!currentItem) {
      return;
    }
    if (currentItem.id === 'layout-menu-tool') {
      return;
    }
    currentItem.click();
    removeHover();

    if (isAppElement(currentItem)) {
      // nothing
    } else if (isFolderElement(currentItem)) {
      currentItem = getActiveNodeFolderName(currentItem);
    } else if (q('.toggle-content:not(.hide)')) {
      clickedItem = currentItem;
      currentItem = getInput();
    }
    if (isLayoutItem(currentItem)) {
      currentItem.parentElement.parentElement.classList.remove('hover');
    }
    addHover();
  }

  function upToElement(el, tagName) {
    tagName = tagName.toLowerCase();

    while (el && el.parentNode) {
      el = el.parentNode;
      if (el.tagName && el.tagName.toLowerCase() == tagName) {
        return el;
      }
    }
    return null;
  }

  function upTo(el, func) {
    if (func(el)) {
      return el;
    }
    while (el && el.parentNode) {
      el = el.parentNode;
      if (func(el)) {
        return el;
      }
    }
    return null;
  }

  function getConnectedNode(item) {
    if (item.id !== '') {
      return document.getElementById(item.id);
    }
    const attributes = [...item.attributes]
      .filter((a) => a.name !== 'class')
      .map((a) => `[${a.name}="${a.value}"]`)
      .join('');
    const classList = [...item.classList].join('.');
    const classAsString = classList.length > 0 ? `.${classList}` : '';
    const found = qa(`${item.nodeName}${classAsString}${attributes ?? ''}`)[0];
    return found;
  }

  function addRemoveFavouriteApp() {
    const itemHasAddRemove = currentItem.querySelector('.add-favorite');

    if (itemHasAddRemove) {
      itemHasAddRemove.click();
    }
  }

  function makeSureNodeIsConnected() {
    if (currentItem && !currentItem.isConnected) {
      currentItem = getConnectedNode(currentItem);
    }
  }

  function removeHover() {
    if (isLayoutItem(currentItem)) {
      currentItem.parentElement.parentElement.classList.remove('hover');
    }
    currentItem?.classList?.remove('hover');
  }

  function addHover() {
    if (isLayoutItem(currentItem)) {
      currentItem.parentElement.parentElement.classList.add('hover');
    }
    if (isInput(currentItem)) {
      currentItem.focus();
    }
    currentItem?.classList?.add('hover');
  }

  function setup() {
    if (!currentItem) {
      currentItem = q('.viewport .nav-tabs')?.querySelector('.nav-item');
    }
  }

  function getFirstList(item) {
    const ulNode = [...item.children].find((child) => child.nodeName === 'UL');
    return ulNode;
  }

  function go(direction = 'up') {
    makeSureNodeIsConnected();

    let nextItem;
    const isVertical = getSetting('vertical');
    if (!isVertical) {
      if (direction === 'right') {
        direction = 'down';
      } else if (direction === 'left') {
        direction = 'up';
      }
    }
    if (direction === 'left' || direction === 'right') {
      if (isDrawerOpenDirectionDifferent()) {
        if (direction === 'left') {
          direction = 'right';
        } else if (direction === 'right') {
          direction = 'left';
        }
      }
      if (isItemFromMainMenu(currentItem)) {
        const mainList = getStartingUlInToggleView();
        if (!mainList) {
          return;
        }
        if (clickedItem) {
          nextItem = clickedItem;
        } else {
          nextItem = mainList.querySelector('.nav-item');
        }
      } else if (isInToggleView()) {
        if (clickedItem) {
          nextItem = clickedItem;
        } else {
          const mainList = getStartingListInMainMenu();
          nextItem = mainList.querySelector('.nav-item');
        }
      } else {
        // do nothing;
        return;
      }
    } else if (direction === 'up' || direction === 'down') {
      if (isVertical) {
        nextItem = next(currentItem, direction);
      } else {
        nextItem = next(currentItem, direction);
      }
    }
    removeHover();
    currentItem = nextItem;
    addHover();
    currentItem?.scrollIntoViewIfNeeded();
  }

  function next(item, direction) {
    if (!item) {
      setup();
      return currentItem;
    }
    const isNavItem = () =>
      item &&
      item.classList.contains('nav-item') &&
      !item.classList.contains('d-none');
    do {
      let items = [];
      if (isNavItem(item)) {
        items = [...item.parentElement.querySelectorAll('.nav-item')];
        if (isFolderOpenedElement(item.parentElement?.parentElement)) {
          items.unshift(item.parentElement?.parentElement);
        }
      } else if (isInput(item)) {
        const ul = getFirstList(item.parentElement.parentElement);
        items = [...ul.querySelectorAll('.nav-item')];
      }

      if (isInToggleView(item)) {
        const input = getInput();
        if (input) {
          items.unshift(input);
        }
      }
      items = items.filter((i) => {
        const parentUL = upToElement(i, 'li');
        if (
          parentUL &&
          isFolderElement(parentUL) &&
          !isFolderOpenedElement(parentUL)
        ) {
          return false;
        }
        return true;
      });
      let index = items.findIndex((i) => {
        return i === item;
      });
      let temp = items[index - 1];
      if (direction === 'down') {
        temp = items[index + 1];
      }

      if (!temp) {
        if (isItemInFolder(item)) {
          const mainList = upTo(
            item,
            (el) =>
              el.tagName?.toLowerCase() == 'ul' &&
              el?.classList?.contains('nav-tabs')
          );
          items = [...mainList.querySelectorAll('.nav-item')];
          index = items.findIndex((i) => {
            return i === item;
          });
          // TODO check it
        } else if (isItemFromMainMenu(item)) {
          const mainList = upTo(
            item,
            (el) =>
              el.tagName?.toLowerCase() == 'div' &&
              el?.id === 'applicationLauncher'
          ).firstElementChild;
          items = [...mainList.querySelectorAll('.nav-item')];
          index = items.findIndex((i) => {
            return i === item;
          });
        }
        if (direction === 'down') {
          if (index + 1 >= items.length) {
            item = items[0];
          } else {
            item = items[index + 1];
          }
        } else {
          if (index - 1 < 0) {
            item = items[items.length - 1];
          } else {
            item = items[index - 1];
          }
        }
      } else {
        item = temp;
      }
    } while (!isNavItem() && !isInput(item));
    return item;
  }

  document.addEventListener('keydown', (e) => {
    q('.app').classList.add('expand-wrapper');
    q('.viewport').classList.add('expand');
    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        if (e.target.tagName === 'INPUT') {
          e.target.blur();
        }
        go('down');
        break;
      case 'Escape':
        let hasVisibleDrawers = q('.toggle-content:not(.hide)');
        if (hasVisibleDrawers) {
          hasVisibleDrawers.classList.add('hide');
          if (isItemFromMainMenu(currentItem)) {
            return;
          }
          removeHover();
          currentItem = undefined;
        }
        break;
      case 'Enter':
        onEnterClicked();
        break;
      case 'ArrowUp':
        if (e.target.tagName === 'INPUT') {
          e.target.blur();
        }
        go('up');
        break;
      case 'ArrowRight':
        if (e.target.tagName === 'INPUT') {
          e.target.blur();
        }
        go('right');
        break;
      case 'ArrowDown':
        if (e.target.tagName === 'INPUT') {
          e.target.blur();
        }
        go('down');
        break;
      case 'ArrowLeft':
        if (e.target.tagName === 'INPUT') {
          e.target.blur();
        }
        go('left');
        break;

      default:
        break;
    }
  });
}

export {
  handleEvents,
  setToolbarOrientation,
  handleThemeChange,
  handleShutdownClick,
  handleTopMenuClicks,
  handleCloseDrawerClicks,
  handleNotificationClick,
  handleModalClose,
  handleMouseHover,
  setWindowVisibleArea,
  setWindowParams,
  focusInputAfterWindowRecover,
  windowMargin,
  startTutorial,
  // clearSearch,
  escapeHtml,
  getAppIcon,
  // openDrawer,
  setWindowPosition,
  setWindowMoveArea,
};
