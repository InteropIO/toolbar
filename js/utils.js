import {
  shutdown,
  gluePromise,
  startApp,
  getApp,
  getUserProperties,
  themeObs,
  orientationObs,
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
  //   isMinimizeAllowed,
  checkNotificationsConfigure,
  configureNotifications,
  openFeedbackForm,
  workAreaSizeObs,
} from './glue-related.js';
import {
  toolbarWidth,
  toolbarPadding,
  initialPosition,
  updateSetting,
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
let isVertical;

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
      updateSetting({ showHiddenApps: !getSetting('showHiddenApps') });
      refreshApps();
      return;
    }

    if (e.target.matches('[menu-button-id], [menu-button-id] *')) {
      //open selected drawer (apps, layouts)
      let topElement = e.path.find((e) => e.getAttribute('menu-button-id'));
      let menuId = topElement.getAttribute('menu-button-id');

      qa(`[menu-id]:not([menu-id="${menuId}"])`).forEach((menu) => {
        menu.classList.add('hide');
      });
      qa(`[menu-id]:not([menu-button-id="${menuId}"]) .chevron`).forEach(
        (menuBtnChevron) => {
          menuBtnChevron.classList.remove('chevron-rotate');
        }
      );

      let menuToToggle = q(`[menu-id="${menuId}"]`);

      // if (menuToToggle.classList.contains('hide')) {
      //   await applyOpenClasses();
      // }

      menuToToggle.addEventListener(
        'transitionend',
        focusMenuInputAfterTransition
      );
      menuToToggle.classList.toggle('hide');
      setDrawerOpenClass();

      toggleTopButtonState(menuId);

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

  //   isMinimizeAllowed().then(
  //     (allowed) => allowed && q('.minimize').classList.remove('d-none')
  //   );
}

function toggleTopButtonState(id) {
  qa(`[menu-button-id="${id}"] .chevron`).forEach((chevron) =>
    chevron.classList.toggle('chevron-rotate')
  );
  qa(`[menu-button-id="${id}"] > a`).forEach((chevron) =>
    chevron.classList.toggle('active')
  );
  qa(`[menu-button-id]:not([menu-button-id="${id}"]) .chevron`).forEach(
    (chevron) => chevron.classList.remove('chevron-rotate')
  );
  qa(`[menu-button-id]:not([menu-button-id="${id}"]) > a`).forEach((chevron) =>
    chevron.classList.remove('active')
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
    updateSetting({ showTutorial: false });
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

function handleToolbarAppRowsChange() {
  isVertical = orientationObs.value;
  const numberOfRows = getSetting('toolbarAppRows');
  const app = q('.app');
  const appSelectOptions = {
    all: [
      { name: '8', displayName: '8 Items' },
      { name: '10', displayName: '10 Items (Default)' },
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

      updateSetting({ toolbarAppRows: selectedLength });

      if (!isVertical) {
        qa('.toggle-content').forEach((toggle) => {
          toggle.classList.add('hide');
        });
        app.classList.remove('open-top');
      }
    }
  });
}

function setToolbarSize(appRows) {
  isVertical = orientationObs.value;
  const appLancher = q('.viewport-header');
  const appContentHeader = q('.app-content-header');
  const appRowsNumber = appRows || getSetting('toolbarAppRows');
  const navItem = q('.content-items .nav-item');
  const contentItems = q('.content-items');

  appLancher.style.height = `${appLancher.offsetHeight}px`;
  appContentHeader.style.height = `${appContentHeader.offsetHeight}px`;
  contentItems.style.height = `${navItem.offsetHeight * appRowsNumber}px`;

  if (isVertical) {
    moveMyWindow({
      width: toolbarWidth.vertical + toolbarPadding.vertical * 2,
      height:
        appContentHeader.offsetHeight + navItem.offsetHeight * appRowsNumber,
    });
  } else {
    moveMyWindow({
      width: toolbarWidth.horizontal,
      height:
        appLancher.offsetHeight +
        (appContentHeader.offsetHeight + navItem.offsetHeight * appRowsNumber) *
          2,
    });
  }
}

function setVisibleArea(topMenuVisible, layoutDropDownVisible) {
  isVertical = orientationObs.value;
  const visibleAreas = [];

  // visibleAreas.push(buildVisibleArea(q('.viewport')));

  // if (isVertical) {
  //   visibleAreas.push(buildVisibleArea(q('.app')));
  // } else {
  //   const toggles = qa('.toggle-content');

  //   toggles.forEach((toggle) => {
  //     if (!toggle.classList.contains('hide')) {
  //       visibleAreas.push(buildVisibleArea(toggle));
  //     }
  //   });

  //   if (topMenuVisible) {
  //     visibleAreas.push(buildVisibleArea(q('#menu-top')));
  //   }

  //   if (layoutDropDownVisible) {
  //     visibleAreas.push(buildVisibleArea(q('.layout-menu-tool')));
  //   }
  // }

  resizeWindowVisibleArea(visibleAreas);
}

function buildVisibleArea(element) {
  isVertical = orientationObs.value;
  const { top, left, width, height } = element.getBoundingClientRect();

  return {
    top: Math.round(top),
    left: Math.round(left),
    width: Math.round(width),
    height: Math.round(height),
  };
}

// async function setToolbarPosition(appRows) {
//   const windowBounds = await getWindowBounds();
//   const appContentHeader = q('.app-content-header');
//   const navItem = q('.nav-item');
//   const appRowsNumber = appRows || getSetting('toolbarAppRows');

//   console.log('my winodw bounds are:', windowBounds);

//   if (!isVertical) {
//     console.log('tuk');
//     moveMyWindow({
//       top:
//         windowBounds.top -
//         (appContentHeader.offsetHeight + navItem.offsetHeight * appRowsNumber),
//       left: windowBounds.left,
//     });
//   }
// }

async function setDrawerOpenClass() {
  isVertical = orientationObs.value;
  const workArea = workAreaSizeObs.value;
  const windowBounds = await getWindowBounds();
  const app = q('.app');
  const appLancher = q('.viewport-header');
  const toggleContent = qa('.toggle-content');
  const toolbarOffset = toolbarPadding.vertical + toolbarWidth.vertical;
  const appContentHeader = q('.app-content-header');
  const appRowsNumber = getSetting('toolbarAppRows');
  const navItem = q('.content-items .nav-item');

  if (isVertical) {
    if (windowBounds.left + windowBounds.width > workArea.offsetWidth) {
      app.classList.add('open-left');
      toggleContent.forEach((toggle) => {
        toggle.style.right = `${toolbarOffset}px`;
        toggle.style.left = 'auto';
        toggle.style.transform = 'translateX(0)';
      });
    } else {
      app.classList.remove('open-left');
      toggleContent.forEach((toggle) => {
        toggle.style.right = 'auto';
        toggle.style.left = 0;
        toggle.style.transform = `translateX(${toolbarOffset}px)`;
      });
    }
  } else {
    if (windowBounds.top + windowBounds.height > workArea.offsetHeight) {
      app.classList.add('open-top');
      toggleContent.forEach((toggle) => {
        toggle.style.top = 'auto';
        toggle.style.bottom = 0;
        toggle.style.transform = 'translateY(0)';
      });
    } else {
      app.classList.remove('open-top');
      toggleContent.forEach((toggle) => {
        toggle.style.top = 0;
        toggle.style.bottom = 'auto';
        toggle.style.transform = `translateY(${
          appLancher.offsetHeight +
          (appContentHeader.offsetHeight + navItem.offsetHeight * appRowsNumber)
        }px)`;
      });
    }
  }
}

function setToolbarOrientation(isVertical) {
  const app = q('.app');
  const viewport = q('.viewport');
  const appContentHeader = q('.app-content-header');
  const appRowsNumber = getSetting('toolbarAppRows');
  const navItem = q('.content-items .nav-item');

  q('#toggle .mode').innerHTML = isVertical ? 'horizontal' : 'vertical';
  app.classList.add(isVertical ? 'vertical' : 'horizontal');
  app.classList.remove(isVertical ? 'horizontal' : 'vertical');
  viewport.style.transform = isVertical
    ? `translateX(${toolbarPadding.vertical}px)`
    : `translateY(${
        appContentHeader.offsetHeight + navItem.offsetHeight * appRowsNumber
      }px)`;

  qa('[column]').forEach((col) => {
    isVertical
      ? col.classList.add('flex-column')
      : col.classList.remove('flex-column');
  });
}

async function handleToolbarOrientationChange() {
  q('#toggle').addEventListener('click', () => {
    const app = q('.app');
    isVertical = orientationObs.value;
    isVertical = !isVertical;

    updateSetting({ vertical: isVertical });

    if (isVertical) {
      app.classList.remove('open-top');
      // moveMyWindow({
      //   top: initialPosition.top,
      //   left: initialPosition.left - toolbarPadding.vertical,
      // });
    } else {
      app.classList.remove('open-left');
      // moveMyWindow({
      //   top: initialPosition.top - windowBounds.height,
      //   left: initialPosition.left,
      // });
    }
  });
}

async function fixWindowPosition(isVertical, appRows) {
  const workArea = workAreaSizeObs.value;
  const windowBounds = await getWindowBounds();
  const appContentHeader = q('.app-content-header');
  const navItem = q('.nav-item');
  const appRowsNumber = appRows || getSetting('toolbarAppRows');

  console.log('window bounds:', windowBounds);
  console.log('work area:', workArea);

  if (isVertical) {
    // if toolbar position is outside of top monitor working area
    if (windowBounds.top < workArea.top) {
      moveMyWindow({
        top: initialPosition.top,
      });
    }

    // if toolbar position is outside of left monitor working area
    if (windowBounds.left + toolbarPadding.vertical < workArea.left) {
      moveMyWindow({
        left: initialPosition.left - toolbarPadding.vertical,
      });
    }
  } else {
    // if toolbar position is outside of top monitor working area
    if (
      windowBounds.top +
        (appContentHeader.offsetHeight + navItem.offsetHeight * appRowsNumber) <
        workArea.top ||
      windowBounds.top ===
        -(appContentHeader.offsetHeight + navItem.offsetHeight * appRowsNumber)
    ) {
      moveMyWindow({
        top:
          initialPosition.top -
          (appContentHeader.offsetHeight +
            navItem.offsetHeight * appRowsNumber),
      });
    }

    // if toolbar position is outside of left monitor working area
    if (windowBounds.left < workArea.left) {
      moveMyWindow({
        left: initialPosition.left,
      });
    }
  }

  console.warn('Window left the boundries of the monitor. Repositioning.');
}

async function setWindowMoveArea(isVertical) {
  const dragArea = q('.draggable').getBoundingClientRect();

  if (isVertical) {
    configureMyWindow({
      moveAreaTopMargin: `${toolbarPadding.vertical}, 0, ${
        toolbarWidth.vertical +
        toolbarPadding.vertical -
        Math.round(dragArea.width)
      }, 0`,
      moveAreaThickness: `0, ${Math.round(dragArea.height)}, 0, 0`,
    });
  } else {
    configureMyWindow({
      // moveAreaLeftMargin: `0, ${Math.round(
      //   toggleContent.height
      // )}, 0, ${Math.round(toggleContent.height)}`,
      moveAreaLeftMargin: '0, 0, 0, 0',
      moveAreaThickness: `${Math.round(dragArea.width)}, 0, 0, 0`,
    });
  }
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
  setVisibleArea,
  setToolbarSize,
  setWindowMoveArea,
  focusInputAfterWindowRecover,
  windowMargin,
  startTutorial,
  // clearSearch,
  escapeHtml,
  getAppIcon,
  openDrawer,
  fixWindowPosition,
};
