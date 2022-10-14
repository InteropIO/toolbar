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

let arrowKeysObs = rxjs
  .fromEvent(document, 'keydown')
  .pipe(
    rxjs.operators.filter((e) => {
      return e.key === 'ArrowUp' || e.key === 'ArrowDown';
    })
  )
  .pipe(rxjs.operators.map((e) => e.key.slice(5)))
  .subscribe(console.warn);

function handleEvents() {
  handleNotificationClick();
  handleEnableNotifications();
  handleFeedbackClick();
  handleThemeChange();
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

function openDrawer(drawerId) {
  let menuButton = q(`[menu-button-id=${drawerId}]`);
  let hoverEvent = new MouseEvent('mouseenter', {
    view: window,
    bubbles: true,
  });

  menuButton.dispatchEvent(hoverEvent);
  menuButton.click();
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

async function handleToolbarAppRowsChange() {
  const isVertical = getSetting('vertical');
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

  q('.length-select .select_options').addEventListener('click', (e) => {
    if (e.target.matches('input.select_input[type="radio"]')) {
      const selectedLength = e.target.getAttribute('length-name');

      setSetting({ toolbarAppRows: selectedLength });

      if (!isVertical) {
        qa('.toggle-content').forEach((toggle) => {
          toggle.classList.add('hide');
        });
        app.classList.remove('open-top');
      }

      setWindowParams();
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

  appLancher.style.height = `${appLancher.offsetHeight}px`;
  appContentHeader.style.height = `${appContentHeader.offsetHeight}px`;
  contentItems.style.height = `${navItem.offsetHeight * appRowsNumber}px`;

  if (isVertical) {
    app.classList.contains('open-left')
      ? (app.style.left = '0')
      : (app.style.left = `${toolbarDrawerSize.vertical}px`);
    app.style.top = '0';
    app.style.maxHeight = `${
      appContentHeader.offsetHeight + navItem.offsetHeight * appRowsNumber
    }px`;

    await moveMyWindow({
      width: toolbarWidth.vertical + toolbarDrawerSize.vertical * 2,
      height:
        appContentHeader.offsetHeight + navItem.offsetHeight * appRowsNumber,
    });
  } else {
    app.style.top = `${
      appContentHeader.offsetHeight + navItem.offsetHeight * appRowsNumber
    }px`;
    app.style.left = '0';
    app.style.maxHeight = `${appLancher.offsetHeight}px`;

    await moveMyWindow({
      width: toolbarWidth.horizontal,
      height:
        appLancher.offsetHeight +
        (appContentHeader.offsetHeight + navItem.offsetHeight * appRowsNumber) *
          2,
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
    app.style.top = `${
      appContentHeader.offsetHeight + navItem.offsetHeight * appRowsNumber
    }px`;

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
  await setWindowVisibleArea();
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

async function setWindowPosition() {
  const isVertical = getSetting('vertical');
  const workArea = await getWindowWorkArea();
  const windowBounds = await getWindowBounds();
  const app = q('.app');
  const appCoords = app.getBoundingClientRect();
  const appContentHeader = q('.app-content-header');
  const navItem = q('.applications-nav');
  const appRowsNumber = getSetting('toolbarAppRows');

  const workAreaRect = {
    lx: workArea.left,
    ly: workArea.top,
    rx: workArea.left + workArea.width,
    ry: workArea.top + workArea.height,
  };

  const visibleAreaRect = {
    lx: windowBounds.left + appCoords.left,
    ly: windowBounds.top + appCoords.top,
    rx: windowBounds.left + appCoords.left + appCoords.width,
    ry: windowBounds.top + appCoords.top + appCoords.height,
  };

  // Returns true if rect1 and rect2 overlap
  async function overlap(rect1, rect2) {
    // if rect has area 0, no overlap
    if (
      rect1.lx === rect1.rx ||
      rect1.ly === rect1.ry ||
      rect2.rx === rect2.lx ||
      rect2.ly === rect2.ry
    ) {
      return false;
    }

    // if rect2 moves beyound boundries of rect1
    if (
      rect2.lx < rect1.lx ||
      rect2.ly < rect1.ly ||
      rect2.rx > rect1.rx ||
      rect2.ry > rect1.ry
    ) {
      if (isVertical) {
        await moveMyWindow({
          top: workArea.top + initialPosition.top,
          left:
            workArea.left + initialPosition.left - toolbarDrawerSize.vertical,
        });
      } else {
        await moveMyWindow({
          top:
            workArea.top +
            initialPosition.top -
            (appContentHeader.offsetHeight +
              navItem.offsetHeight * appRowsNumber),
          left: workArea.left + initialPosition.left,
        });
      }
    }

    return true;
  }

  overlap(workAreaRect, visibleAreaRect);
}

async function setWindowMoveArea() {
  const isVertical = getSetting('vertical');
  const appRowsNumber = getSetting('toolbarAppRows');
  const dragArea = q('.draggable').getBoundingClientRect();
  const appContentHeader = q('.app-content-header');
  const navItem = q('.applications-nav');

  if (isVertical) {
    await configureMyWindow({
      moveAreaTopMargin: `${toolbarDrawerSize.vertical}, 0, ${
        toolbarWidth.vertical +
        toolbarDrawerSize.vertical -
        Math.round(dragArea.width)
      }, 0`,
      moveAreaThickness: `0, ${Math.round(dragArea.height)}, 0, 0`,
    });
  } else {
    await configureMyWindow({
      moveAreaLeftMargin: `0, ${Math.round(
        appContentHeader.offsetHeight + navItem.offsetHeight * appRowsNumber
      )}, 0, ${Math.round(
        appContentHeader.offsetHeight + navItem.offsetHeight * appRowsNumber
      )}`,
      moveAreaThickness: `${Math.round(dragArea.width)}, 0, 0, 0`,
    });
  }
}

export {
  handleEvents,
  setToolbarOrientation,
  setWindowPosition,
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
  openDrawer,
};
