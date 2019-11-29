import {
  applicationsObs,
  applicationHTMLTemplate,
  favoriteApplicationHTMLTemplate,
  handleAppClick,
  handleSearchChange,
  runningApps,
  noRunningAppsHTML,
  noApplicationsHTML,
  noFavoriteAppsHTML} from './applications.js';
import {favoriteApps, updateFavoriteApps} from './favorites.js';
import {allLayouts, layoutHTMLTemplate, handleLayoutClick, handleLayoutSave, noLayoutsHTML} from './layouts.js';
import {notificationsCountObs, openNotificationPanel, resizeWindowVisibleArea} from './glue-related.js';
import * as glueModule from './glue-related.js';
import * as utils from './utils.js';

window.q = document.querySelector.bind(document);
window.qa = document.querySelectorAll.bind(document);

document.addEventListener('DOMContentLoaded', () => {
  console.log('window loaded');
  printApps();
  printRunningApps();
  printLayouts();
  printFavoriteApps();
  printNotificationCount();

  handleWidthChange();
  handleAppClick();
  handleSearchChange()
  handleLayoutClick();
  handleLayoutSave();
  handleNotificationClick();
  utils.handleThemeChange();
  utils.handleAboutClick();
  utils.handleShutdownClick();
  utils.handleTopMenuClicks();
  utils.handleDropDownClicks();
  utils.handleMouseHover();
  utils.handleModalClose();
  glueModule.registerHotkey();
})


function printApps() {
  applicationsObs.subscribe(apps => {
    let newApplicationsHTML = '';
    if (apps.length > 0) {
      apps.forEach(app => newApplicationsHTML += applicationHTMLTemplate(app, {favoriteBtn: true}));
      q('#applications').innerHTML = newApplicationsHTML;
    } else {
      q('#applications').innerHTML = noApplicationsHTML;
    }

    updateFavoriteApps();
  })
}

function printRunningApps() {
  runningApps.subscribe((runningApps) => {
    let newRunningAppsHTML = '';
    if (runningApps.length > 0) {
      runningApps.forEach(runningApp => newRunningAppsHTML += applicationHTMLTemplate(runningApp, {favoriteBtn: false}));
      q('#running-apps').innerHTML = newRunningAppsHTML;
    } else {
      q('#running-apps').innerHTML = noRunningAppsHTML;
    }
  })
}

function printLayouts() {
  allLayouts.subscribe(layouts => {
    let newLayoutsHTML = '';
    if (layouts.length > 0) {
      layouts.forEach(layout =>  newLayoutsHTML += layoutHTMLTemplate(layout))
      q('#layout-load>ul').innerHTML = newLayoutsHTML;
    } else {
      q('#layout-load>ul').innerHTML = noLayoutsHTML;
    }
  });
}

function printFavoriteApps() {
  favoriteApps
  .pipe(rxjs.operators.combineLatest(applicationsObs))
  .subscribe(([favApps, allApps]) => {
    let favAppsHtml = ``;

    if (favApps.length > 0) {
      favApps.forEach(favApp => {
        let fullApp = allApps.find(a => a.name === favApp);
        favAppsHtml += favoriteApplicationHTMLTemplate(fullApp, {favoriteBtn: false})
      });

    } else {
      favAppsHtml = noFavoriteAppsHTML;
    }

    q('#fav-apps').innerHTML = favAppsHtml;
  })
}

function printNotificationCount() {
  notificationsCountObs.subscribe((count) => {
    if (count !== null) {
      q('#notifications-count').innerHTML = count;
    }
  })
}

function handleNotificationClick() {
  q('#notification-panel').addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    openNotificationPanel();
  })
}

function handleWidthChange() {
  resizeVisibleArea(q('body .app').offsetWidth);
  const widthObserver = new ResizeObserver((elements) => {
    resizeVisibleArea(elements[0].contentRect.right);
  })

  widthObserver.observe(q('body .app'));
}



function resizeVisibleArea(width) {
  width = Math.round(width);
  resizeWindowVisibleArea(width);
  q('.modal').style.width = width+ 'px';
}

function expandWindow() {
  window.glue.agm.invoke("T42.Wnd.Execute", {
    command: "updateVisibleAreas",
    windowId: glue.windows.my().id,
    options: {
      areas: [{
        top: 0,
        left: 0,
        width: 500,
        height: 800
      }]
    }
  })
}

window.expandWindow = expandWindow;

