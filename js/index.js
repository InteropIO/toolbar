import {
  allApplicationsObs,
  searchInputObs,
  applicationHTMLTemplate,
  favoriteApplicationHTMLTemplate,
  handleAppClick,
  handleSearchChange,
  runningApps,
  noRunningAppsHTML,
  noApplicationsHTML,
  noFavoriteAppsHTML,

} from './applications.js';
import {favoriteApps, updateFavoriteApps} from './favorites.js';
import {filteredLayouts, layoutHTMLTemplate, handleLayoutClick, handleLayoutSave, noLayoutsHTML} from './layouts.js';
import * as glueModule from './glue-related.js';
import * as utils from './utils.js';
import {handleWidthChange, handleDropDownClicks} from './visible-area.js';
import {gssPromise} from './gss.js';
import { clientHTMLTemplate, searchClients, searchInstruments, instrumentHTMLTemplate, handleClientAndInstrumentClicks } from './clients-and-instrument-search.js';
import { getSetting } from './settings.js';

let {
  map: rxMap,
  combineLatest: rxCombineLatest,
  distinctUntilChanged: rxDistinctUntilChanged
} = rxjs.operators;

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
  handleClientAndInstrumentClicks();

  utils.handleClicks();
  utils.startTutorial();
  glueModule.registerHotkey();
});


function printApps() {
  searchInputObs
    .pipe(rxCombineLatest(allApplicationsObs))
    .pipe(rxMap(([searchInput, apps]) => {
      let search = searchInput.toLowerCase().trim();
      return {
        search,
        filteredApps: apps.filter(app => app.title.toLowerCase().indexOf(search) >= 0)
      };
    }))
    // .subscribe(([apps, clients, instruments]) => {
    .subscribe(async ({search, filteredApps: apps}) => {
      let newResultsHTML = '';

      if (search.trim().length > 1) {
        if (getSetting('searchClients')) {
          let clientsSearch = await searchClients(search);
          clientsSearch.entities.forEach(client => {
            newResultsHTML += clientHTMLTemplate(client);
          });
        }

        if (getSetting('searchInstruments')) {
          let instrumentSearch = await searchInstruments(search);
          instrumentSearch.entities.forEach(instrument => {
            newResultsHTML += instrumentHTMLTemplate(instrument);
          });
        }
      }

      apps.forEach(app => newResultsHTML += applicationHTMLTemplate(app, {favoriteBtn: true}));
      q('#applications').innerHTML = newResultsHTML || noApplicationsHTML;
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
    // console.log(layouts);
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

