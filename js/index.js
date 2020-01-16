import {
  applicationsObs,
  allApplicationsObs,
  applicationHTMLTemplate,
  favoriteApplicationHTMLTemplate,
  handleAppClick,
  handleSearchChange,
  runningApps,
  noRunningAppsHTML,
  noApplicationsHTML,
  noFavoriteAppsHTML} from './applications.js';
import {favoriteApps, updateFavoriteApps} from './favorites.js';
import {filteredLayouts, layoutHTMLTemplate, handleLayoutClick, handleLayoutSave, noLayoutsHTML} from './layouts.js';
import * as glueModule from './glue-related.js';
import * as utils from './utils.js';
import {handleWidthChange, handleDropDownClicks} from './visible-area.js';



document.addEventListener('DOMContentLoaded', () => {
  console.log('window loaded');
  printApps();
  printRunningApps();
  printLayouts();
  printFavoriteApps();
  printNotificationCount();

  handleWidthChange();
  handleAppClick();
  handleSearchChange();
  handleLayoutClick();
  handleLayoutSave();

  handleDropDownClicks();

  utils.handleClicks();
  glueModule.registerHotkey();
});


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
  });
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
  });
}

function printLayouts() {
  filteredLayouts.subscribe(layouts => {
    let newLayoutsHTML = '';
    if (layouts.length > 0) {
      layouts.forEach(layout =>  newLayoutsHTML += layoutHTMLTemplate(layout));
      q('#layout-load>ul').innerHTML = newLayoutsHTML;
    } else {
      q('#layout-load>ul').innerHTML = noLayoutsHTML;
    }
  });
}

function printFavoriteApps() {
  favoriteApps
  .pipe(rxjs.operators.combineLatest(allApplicationsObs))
  .subscribe(([favApps, allApps]) => {
    let favAppsHtml = ``;
    let existingFavApps = favApps.filter(favApp => allApps.find(a => a.name === favApp));

    if (existingFavApps.length > 0) {
      existingFavApps.forEach(favApp => {
        let fullApp = allApps.find(a => a.name === favApp);
        if (fullApp) {
          favAppsHtml += favoriteApplicationHTMLTemplate(fullApp, {favoriteBtn: false});
        }
      });
    } else {
      favAppsHtml = noFavoriteAppsHTML;
    }

    q('#fav-apps').innerHTML = favAppsHtml;
  });
}

function printNotificationCount() {
  glueModule.notificationsCountObs.subscribe((count) => {
    if (count !== null) {
      q('#notifications-count').innerHTML = count;
      if (count === 0) {
        q('#notifications-count').classList.add('empty');
      } else {
        q('#notifications-count').classList.remove('empty');
      }
    }
  });
}

