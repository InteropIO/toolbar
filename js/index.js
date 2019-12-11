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
import {favoriteApps, updateFavoriteApps, removeFavoriteApp} from './favorites.js';
import {filteredLayouts, layoutHTMLTemplate, handleLayoutClick, handleLayoutSave, noLayoutsHTML} from './layouts.js';
import {notificationsCountObs, openNotificationPanel, resizeWindowVisibleArea} from './glue-related.js';
import * as glueModule from './glue-related.js';
import * as utils from './utils.js';



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

  handleDropDownClicks();

  utils.handleNotificationClick();
  utils.handleOrientationChange();
  utils.populateAbouPage();
  utils.handleThemeChange();
  utils.handleAboutClick();
  utils.handleShutdownClick();
  utils.handleTopMenuClicks();
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
  filteredLayouts.subscribe(layouts => {
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
    let existingFavApps = favApps.filter(favApp => allApps.find(a => a.name === favApp));

    if (existingFavApps.length > 0) {
      existingFavApps.forEach(favApp => {
        let fullApp = allApps.find(a => a.name === favApp);
        if (fullApp) {
          favAppsHtml += favoriteApplicationHTMLTemplate(fullApp, {favoriteBtn: false})
        }
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


let topMenuVisibleObs = new rxjs.BehaviorSubject(false);
let layoutDropDownVisibleObs = new rxjs.BehaviorSubject(false);

function handleDropDownClicks() {
  document.addEventListener('click', (e) => {
    if (e.target.matches('[dropdown-button-id], [dropdown-button-id] *')) {
      //dropdown button click  - toggle dropdown
      let btnElement = e.path.find(e => e.getAttribute('dropdown-button-id'));
      let menuId = btnElement.getAttribute('dropdown-button-id');
      let menu = q(`[dropdown-id="${menuId}"]`);
      console.log(btnElement, menuId, menu);
      e.preventDefault(); e.stopImmediatePropagation(); e.stopPropagation();
      menu.classList.toggle('show');
      topMenuVisibleObs.next(menu.classList.contains('show'));
    } else {
      //click is not on dropdown button - close opened dropdowns
      qa(`[dropdown-id].show`).forEach(e => e.classList.remove('show'));
      topMenuVisibleObs.next(false)
    }
  })
}

q('.layouts-nav').addEventListener('mouseenter', (e) => {
  if (e.target.matches && e.target.matches('.horizontal .layouts-nav, .horizontal .layouts-nav *')) {
    console.log('layout ', true);
    layoutDropDownVisibleObs.next(true);
    setTimeout(() => {
      // console.log();
    }, 300)
  }
});

q('.layouts-nav').addEventListener('mouseleave', (e) => {
  if (e.target.matches && e.target.matches('.horizontal .layouts-nav, .horizontal .layouts-nav *')) {
    console.log('layout ', false);
    layoutDropDownVisibleObs.next(false);
  }
})

let appBoundsObs = new rxjs.BehaviorSubject({
  width: Math.round(q('.app').offsetWidth),
  height: Math.round(q('.app').offsetHeight)
});


function handleWidthChange() {
  const appBoundsObserver = new ResizeObserver((elements) => {
    appBoundsObs.next({
      width: Math.round(elements[0].contentRect.right),
      height: Math.round(elements[0].contentRect.bottom)
    })
  })

  appBoundsObserver.observe(q('.app'));
}

appBoundsObs
.pipe(rxjs.operators.combineLatest(topMenuVisibleObs, layoutDropDownVisibleObs))
// .pipe(rxjs.operators.combineLatest())
.subscribe(([appBounds, topMenuVisible, layoutDropDownVisible]) => {
  console.log(appBounds, topMenuVisible, layoutDropDownVisible);
  resizeVisibleArea(appBounds, topMenuVisible, layoutDropDownVisible)
})

function resizeVisibleArea(appBounds, topMenuVisible, layoutDropDownVisible) {
  let visibleAreas = [];
  visibleAreas.push({
    top: utils.windowMargin,
    left: utils.windowMargin,
    width: appBounds.width,
    height: appBounds.height
  });

  if (q('.view-port.horizontal') && topMenuVisible) {
    let {top, left, width, height} = q('#menu-top').getBoundingClientRect();
    // TODO
    top = Math.round(top);
    left = Math.round(left);
    width = Math.round(width);
    height = Math.round(height);
    visibleAreas.push({top, left, width, height});
  }

  if (layoutDropDownVisible) {
    // let {top, left, width, height} = q('.layout-menu-tool').getBoundingClientRect();
    // // TODO
    // top = Math.round(top);
    // left = Math.round(left);
    // width = Math.round(width);
    // height = Math.round(height);
    visibleAreas.push({top: 97, left: 169, width: 175, height: 96});
  }

  console.log(visibleAreas);

  resizeWindowVisibleArea(visibleAreas);
  // q('.modal').style.width = appBounds.width+ 'px';
}
