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

import { allApplicationsObs } from './applications.js';
import { favoriteApps } from './favorites.js';

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

async function getWindowVisibleArea() {
  const workArea = await getWindowWorkArea();
  const windowBounds = await getWindowBounds();
  const app = q('.app');
  const appCoords = app.getBoundingClientRect();

  return {
    top: workArea.top + windowBounds.top + appCoords.top,
    left: workArea.left + windowBounds.left + appCoords.left,
    width: appCoords.width,
    height: appCoords.height,
  };
}

async function checkWindowPosition() {
  const workArea = await getWindowWorkArea();
  const windowBounds = await getWindowBounds();
  const app = q('.draggable');
  const appCoords = app.getBoundingClientRect();

  console.log(appCoords);

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

  const objArr = [];

  objArr.push(workAreaRect, visibleAreaRect);

  console.table(objArr);

  async function overlap(rect1, rect2) {
    // if rect2 moves beyond left boundaries of rect1
    if (rect2.lx < rect1.lx) {
      console.log('left bounds');
      return {
        left: rect2.lx - rect1.lx,
      };
    }

    // if rect2 moves beyond top boundaries of rect1
    if (rect2.ly < rect1.ly) {
      console.log('top bounds');
      return {
        top: rect2.ly - rect1.ly,
      };
    }

    // if rect2 moves beyond right boundaries of rect1
    if (rect2.rx > rect1.rx) {
      console.log('right bounds');
      return {
        right: rect2.rx - rect1.rx,
      };
    }

    // if rect2 moves beyond bottom boundaries of rect1
    if (rect2.ry > rect1.ry) {
      console.log('bottom bounds');
      return {
        bottom: rect2.ry - rect1.ry,
      };
    }

    return true;
  }

  return overlap(workAreaRect, visibleAreaRect);
}

async function setWindowPosition() {
  const isVertical = getSetting('vertical');
  const workArea = await getWindowWorkArea();
  const offBounds = await checkWindowPosition();
  const offBoundsDirection = Object.keys(offBounds)[0];
  const winodwVisibleArea = await getWindowVisibleArea();

  if (isVertical) {
    if (offBoundsDirection === 'top') {
      await moveMyWindow({
        top: workArea.top + initialPosition.top,
      });
    } else if (offBoundsDirection === 'right') {
      await moveMyWindow({
        left:
          workArea.left +
          workArea.width -
          toolbarDrawerSize.vertical -
          toolbarWidth.vertical -
          initialPosition.left,
      });
    } else if (offBoundsDirection === 'bottom') {
      await moveMyWindow({
        top:
          workArea.top +
          workArea.height -
          winodwVisibleArea.height -
          initialPosition.top,
      });
    } else if (offBoundsDirection === 'left') {
      await moveMyWindow({
        left: workArea.left + initialPosition.left - toolbarDrawerSize.vertical,
      });
    }
  } else {
    const horizontalHeight = getHorizontalToolbarHeight();

    if (offBoundsDirection === 'top') {
      await moveMyWindow({
        top: workArea.top + initialPosition.top - horizontalHeight,
      });
    } else if (offBoundsDirection === 'right') {
      await moveMyWindow({
        left:
          workArea.left +
          workArea.width -
          toolbarWidth.horizontal -
          initialPosition.left,
      });
    } else if (offBoundsDirection === 'bottom') {
      await moveMyWindow({
        top:
          workArea.top +
          workArea.height -
          winodwVisibleArea.height -
          horizontalHeight -
          initialPosition.top,
      });
    } else if (offBoundsDirection === 'left') {
      await moveMyWindow({
        left: workArea.left + initialPosition.left,
      });
    }
  }
}

async function setWindowMoveArea() {
  const isVertical = getSetting('vertical');
  const dragArea = q('.draggable').getBoundingClientRect();
  const horizontalHeight = getHorizontalToolbarHeight();

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
      moveAreaLeftMargin: `0, ${Math.round(horizontalHeight)}, 0, ${Math.round(
        horizontalHeight
      )}`,
      moveAreaThickness: `${Math.round(dragArea.width)}, 0, 0, 0`,
    });
  }
}

// Keyboard Navigation
function handleKeyboardNavigation() {
  let currentItem;
  let mainList;

  function isFolderElement(e) {
    return e.matches('nav-item.folder');
  }

  function isAppElement(e) {
    return !!e.getAttribute('app-name');
  }

  function isLayoutElement(e) {
    return e.id === 'layout-menu-tool';
  }

  function getActiveNodeFolderName(node) {
    const folderName = node.getAttribute('folder-name');
    return qa(`.nav-item[folder-name="${folderName}"]`)[0];
  }

  function action() {
    if (currentItem) {
      const shouldClick =
        isAppElement(currentItem) || isFolderElement(currentItem);
      if (true) {
        if (isLayoutElement(currentItem)) {
          debugger;
          return;
          // currentItem.click();
        } else {
          currentItem.click();
          if (currentItem.matches('.folder.folder-open')) {
            currentItem = getActiveNodeFolderName(currentItem);
            currentItem.classList.remove('hover');
            currentItem = currentItem;
            mainList = currentItem.parentElement;
            currentItem.classList.add('hover');
          } else if (isAppElement(currentItem)) {
            // nothing
            console.log(`app ignore`);
          } else {
            if (currentItem.matches('.folder')) {
              mainList = currentItem.children[1];
            } else if (qa('.toggle-content:not(.hide)').length > 0) {
              const children = qa('.toggle-content:not(.hide)')[0].children; //.children[1];
              const firstUL = [...children].find(
                (el) => el.tagName && el.tagName.toLowerCase() == 'ul'
              );
              if (firstUL) {
                mainList = firstUL;
              } else {
                mainList = getStartingUL();
              }
            }
            currentItem.classList.remove('hover');
            currentItem = getNextElement(undefined, mainList);
            mainList = currentItem.parentElement;
            currentItem.classList.add('hover');
          }
        }
      }
    }
  }

  function upTo(el, tagName) {
    tagName = tagName.toLowerCase();

    while (el && el.parentNode) {
      el = el.parentNode;
      if (el.tagName && el.tagName.toLowerCase() == tagName) {
        return el;
      }
    }
    return null;
  }

  function upTo2(el, func) {
    while (el && el.parentNode) {
      el = el.parentNode;
      if (func(el)) {
        return el;
      }
    }
    return null;
  }

  function reset() {
    currentItem.classList.remove('hover');
    currentItem = undefined;
    mainList = undefined;
    document.removeEventListener('click', reset);
  }

  function listenBodyClicks() {
    document.addEventListener('click', reset);
  }

  function startKeyboardNavigation() {
    // listenBodyClicks();
    mainList = qa('.viewport .nav-tabs')[0];
    currentItem = getNextElement(currentItem, mainList);
    mainList = currentItem.parentElement;
    currentItem.classList.add('hover');
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
    if (!found) {
      debugger;
    }
    return found;
  }

  function getNextElement(item, ul) {
    // if we don't have item, get the first one
    let nextItem;
    if (!item) {
      nextItem = ul.children[0];
    } else {
      if (!item.isConnected) {
        item = getConnectedNode(item);
        ul = item.parentElement;
      }
      nextItem = item.nextElementSibling;
      if (!nextItem) {
        // go out from the fav and continue
        if (!item.isConnected) {
          if (ul.matches('.folder-content')) {
            const currentFolderElement = ul.parentElement;
            const activeNode = getActiveNodeFolderName(currentFolderElement);
            return getNextElement(activeNode, activeNode.parentElement);
          }
        }
        // get parent UL
        const parentUL = upTo(item.parentElement, 'UL');
        const element = parentUL ? item.parentElement.parentElement : undefined;
        return getNextElement(element, parentUL ?? ul);
      } else {
        if (nextItem.matches('.folder.folder-open')) {
          const ulNode = [...nextItem.children].find(
            (child) => child.nodeName === 'UL'
          );
          if (ulNode) {
            return getNextElement(undefined, ulNode);
          }
        }
      }
    }

    if (
      nextItem &&
      nextItem.matches('.nav-item') &&
      !nextItem.matches('.d-none')
    ) {
      // make sure that the found element is part of the main ul
      if (!ul.contains(nextItem)) {
        return;
      }
      if (!nextItem.isConnected) {
        if (ul.matches('.folder-content')) {
          nextItem = getConnectedNode(nextItem);
        }
      }
      return nextItem;
    }

    // if we have nested ul
    if (
      nextItem &&
      nextItem.children[0] &&
      nextItem.children[0].nodeName === 'UL'
    ) {
      return getNextElement(undefined, nextItem.children[0]);
    }

    return getNextElement(nextItem, ul);
  }

  function getPrevElement(item, ul) {
    // if we don't have item, get the first one
    let nextItem;
    if (!item) {
      nextItem = ul.children[ul.children.length - 1];
    } else {
      nextItem = item.previousElementSibling;
      if (!nextItem) {
        // go out from the fav and continue
        if (!item.isConnected) {
          if (ul.matches('.folder-content')) {
            const currentFolderElement = ul.parentElement;
            const activeNode = getActiveNodeFolderName(currentFolderElement);
            return getPrevElement(activeNode, activeNode.parentElement);
          }
        }

        const parentUL = upTo(item.parentElement, 'UL');
        const element = parentUL ? item.parentElement.parentElement : undefined;
        if (element && element.matches('.folder.folder-open')) {
          return element;
        }
        return getPrevElement(element, parentUL ?? ul);
      } else {
        if (nextItem.matches('.folder.folder-open')) {
          const ulNode = [...nextItem.children].find(
            (child) => child.nodeName === 'UL'
          );
          if (ulNode) {
            return getPrevElement(undefined, ulNode);
          }
        }
      }
    }

    if (
      nextItem &&
      nextItem.matches('.nav-item') &&
      !nextItem.matches('.d-none')
    ) {
      // make sure that the found element is part of the main ul
      if (!ul.contains(nextItem)) {
        return;
      }
      return nextItem;
    }

    // if we have nested ul
    if (
      nextItem &&
      nextItem.children[nextItem.children.length - 1] &&
      nextItem.children[nextItem.children.length - 1].nodeName === 'UL'
    ) {
      return getPrevElement(
        undefined,
        nextItem.children[nextItem.children.length - 1]
      );
    }

    return getPrevElement(nextItem, ul);
  }

  function addRemoveFavouriteApp() {
    const itemHasAddRemove = currentItem.querySelector('.add-favorite');

    if (itemHasAddRemove) {
      itemHasAddRemove.click();
    }
  }

  function getStartingUL() {
    return qa('.viewport .nav-tabs')[0];
  }

  function move(direction) {
    if (direction) {
      if (!currentItem) {
        mainList = getStartingUL();
        currentItem = getNextElement(currentItem, mainList);
        currentItem.classList.add('hover');
        mainList = currentItem.parentElement;
      } else {
        currentItem.classList.remove('hover');
        currentItem = getNextElement(currentItem, mainList);

        if (currentItem) {
          mainList = currentItem.parentElement;
          currentItem.classList.add('hover');
        } else {
          mainList = getStartingUL();
          currentItem = getNextElement(currentItem, mainList);
          mainList = currentItem.parentElement;
        }
      }
    } else {
      if (!currentItem) {
        mainList = getStartingUL();
        currentItem = getPrevElement(currentItem, mainList);
        currentItem.classList.add('hover');
        mainList = currentItem.parentElement;
      } else {
        currentItem.classList.remove('hover');
        currentItem = getPrevElement(currentItem, mainList);

        if (currentItem) {
          mainList = currentItem.parentElement;
          currentItem.classList.add('hover');
        } else {
          mainList = getStartingUL();
          currentItem = getPrevElement(currentItem, mainList);
          currentItem.classList.add('hover');
          mainList = currentItem.parentElement;
        }
      }
    }

    if (currentItem) {
      currentItem.scrollIntoViewIfNeeded();
    }
  }

  function leftRightArrowClicked(direction) {
    // right
    if (direction) {
      if (currentItem) {
        const inLayouts = () =>
          upTo2(currentItem, (el) => {
            return el.classList.contains('layout-menu-tool');
          });
        if (currentItem.matches('.layouts-nav') || inLayouts()) {
          // debugger;
          mainList = currentItem.querySelector('.layout-menu-tool');
          currentItem = getNextElement(undefined, mainList);
          mainList = currentItem.parentElement;
          currentItem.classList.add('hover');
        }

        const mainNavigation = upTo2(currentItem, (el) => {
          return el.id === 'applicationLauncher';
        });
        if (mainNavigation) {
          // go to the drawer navigation
          const content = qa('.toggle-content:not(.hide)');
          if (content.length > 0) {
            const children = qa('.toggle-content:not(.hide)')[0].children; //.children[1];
            const firstUL = [...children].find(
              (el) => el.tagName && el.tagName.toLowerCase() == 'ul'
            );
            if (firstUL) {
              mainList = firstUL;
            } else {
              mainList = getStartingUL();
            }
            currentItem.classList.remove('hover');
            currentItem = getNextElement(undefined, mainList);
            mainList = currentItem.parentElement;
            currentItem.scrollIntoViewIfNeeded();
            currentItem.classList.add('hover');
          }
        }
      }
    } else {
      if (currentItem) {
        const inLayouts = () =>
          upTo2(currentItem, (el) => {
            console.log(el, el.classList);
            return el.classList.contains('layout-menu-tool');
          });
        if (currentItem.matches('.layouts-nav') || inLayouts()) {
          // debugger;
          mainList = currentItem.querySelector('.layout-menu-tool');
          currentItem = getPrevElement(undefined, mainList);
          mainList = currentItem.parentElement;
          currentItem.classList.add('hover');
        }
        const inAppContent = upTo2(currentItem, (el) => {
          return el.id === 'app-content';
        });
        if (inAppContent) {
          // go to the main navigation
          mainList = getStartingUL();
          currentItem.classList.remove('hover');
          currentItem = getNextElement(undefined, mainList);
          currentItem.classList.add('hover');
          currentItem.scrollIntoViewIfNeeded();
          mainList = currentItem.parentElement;
        }
      }
    }
  }

  document.addEventListener('keydown', (e) => {
    q('.app').classList.add('expand-wrapper');
    q('.viewport').classList.add('expand');
    switch (e.key) {
      case 'Tab':
        break;
      case 'Escape':
        break;
      case 'Enter':
        action();
        break;
      case 'ArrowUp':
        move(false);
        break;
      case 'ArrowRight':
        leftRightArrowClicked(true);
        break;
      case 'ArrowDown':
        move(true);
        break;
      case 'ArrowLeft':
        leftRightArrowClicked(false);
        break;

      default:
        break;
    }
    // }
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
};
