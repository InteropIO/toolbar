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
  noFavoriteAppsOrLayoutsHTML,
  getItemHTMLTemplate,
  favoriteLayoutHTMLTemplate,
} from './applications.js';
import * as favoritesModule from './favorites.js';
import {
  filteredLayouts,
  layoutHTMLTemplate,
  handleLayoutClick,
  handleLayoutSave,
  handleLayoutsSaveMenuItemClick,
  noLayoutsHTML,
} from './layouts.js';
import * as glueModule from './connect-related.js';
import * as utils from './utils.js';
import {
  clientHTMLTemplate,
  searchClients,
  searchInstruments,
  instrumentHTMLTemplate,
  handleClientAndInstrumentClicks,
} from './clients-and-instrument-search.js';
import { getSetting } from './settings.js';
import { populateSID } from './profile.js';
import handleScheduledShutdownRestart from './schedule-shutdown-restart.js';

const rxjs = window.rxjs;
let {
  map: rxMap,
  combineLatest: rxCombineLatest,
  distinctUntilChanged: rxDistinctUntilChanged,
} = rxjs.operators;

let refreshAppsObs = new rxjs.BehaviorSubject(true);

document.addEventListener('DOMContentLoaded', () => {
  init();
});

async function init() {
  await glueModule.getPrefs();
  await glueModule.getNotificationsConfiguration();
  await glueModule.trackNotificationsConfigurationChanged();
  favoritesModule.init();

  finishLoading();

  observeAppElement();

  console.log('window loaded');

  printApps();
  printRunningApps();
  printLayouts();
  printFavoriteApps();
  printNotificationCount();
  printInitialToastState();

  handleAppClick();
  handleSearchChange();
  utils.handleLayoutsHover();
  handleLayoutClick();
  handleLayoutSave();
  handleLayoutsSaveMenuItemClick();
  utils.handleDropDownClicks();
  handleClientAndInstrumentClicks();
  await handleScheduledShutdownRestart();

  utils.handleEvents();
  utils.startTutorial();
  glueModule.registerHotkey();
  glueModule.focusWindow(utils.focusInputAfterWindowRecover);

  populateSID();
  showFeedbackPanel();
  showProfilePanel();
}

function finishLoading() {
  document.body.classList.add('loaded');
}

function observeAppElement() {
  const app = document.querySelector('.app');
  const config = {
    attributeFilter: ['class'],
    attributeOldValue: true,
    attributes: true,
  };

  function callback(entries) {
    let newValue;

    entries.forEach((entry) => {
      newValue = entry.target.getAttribute(entry.attributeName);

      if (entry.type === 'attributes' && entry.attributeName === 'class') {
        if (newValue !== entry.oldValue) {
          utils.setDrawerOpenDirection();
          utils.setDrawerOpenClasses();
        }
      }
    });
  }

  utils.elementObserver(app, config, callback);
}

function printApps() {
  searchInputObs
    .pipe(rxCombineLatest(allApplicationsObs))
    .pipe(
      rxMap(([searchInput, apps]) => {
        let search = searchInput.toLowerCase().trim();
        const searchResults = [];

        apps.forEach((app) => {
          if ((app.title || app.name).toLowerCase().indexOf(search) >= 0) {
            searchResults.push(app);
          }

          if (app.keywords.length > 0) {
            app.keywords.forEach((keyword) => {
              if (keyword.toLowerCase().indexOf(search) >= 0) {
                searchResults.push(app);
              }
            });
          }
        });

        // Avoid duplicates if multiple keywords match on a single app
        const appNames = searchResults.map((app) => app.name);
        const filteredApps = searchResults.filter(
          ({ name }, index) => !appNames.includes(name, index + 1)
        );

        return {
          search,
          filteredApps,
        };
      })
    )
    .pipe(rxCombineLatest(refreshAppsObs.asObservable()))
    .subscribe(async ([{ search, filteredApps: apps }, refresh]) => {
      let newResultsHTML = '';

      if (search.trim().length > 1) {
        if (getSetting('searchClients')) {
          let clientsSearch = await searchClients(search);

          clientsSearch.entities.forEach((client) => {
            newResultsHTML += clientHTMLTemplate(client);
          });
        }

        if (getSetting('searchInstruments')) {
          let instrumentSearch = await searchInstruments(search);

          instrumentSearch.entities.forEach((instrument) => {
            newResultsHTML += instrumentHTMLTemplate(instrument);
          });
        }
      }

      newResultsHTML += buildAppHTML(apps, {
        favoriteBtn: true,
        hasSearch: search.trim().length > 1,
      });

      document.querySelector('#search-results').innerHTML =
        newResultsHTML || noApplicationsHTML;
      favoritesModule.updateFavoriteApps();
    });
}

function refreshApps() {
  refreshAppsObs.next();
}

function buildAppHTML(apps, options) {
  let structuredItems = buildFolderStructure(apps);
  let html = '';

  structuredItems
    .sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : b.type === 'folder' ? 1 : 0;
      }

      return 0;
    })
    .forEach((item) => {
      html += getItemHTMLTemplate(item, options);
    });

  return html;
}

function buildFolderStructure(apps) {
  let results = [];

  apps.forEach((app) => {
    let appFolder = app.userProperties.folder || '';
    let appFolderSplit = appFolder.split('/').filter((f) => f);
    let currentFolder = [];

    appFolderSplit.forEach((folder) => {
      currentFolder.push(folder);
      createFolder(currentFolder, results);
    });

    insertInFolder(appFolderSplit, app, results);
  });

  return results;
}

function createFolder(folderPath, root) {
  if (folderPath.length < 1) {
    return;
  }

  let nextFolderName = folderPath[0];
  let folderExists = root.find(
    (item) => item.type === 'folder' && item.item === nextFolderName
  );

  if (!folderExists) {
    root.push({ type: 'folder', item: nextFolderName, children: [] });
  }

  createFolder(
    folderPath.slice(1),
    root.find((item) => item.type === 'folder' && item.item === nextFolderName)
      .children
  );
}

function insertInFolder(appFolder, app, results) {
  let currentFolder = results;

  appFolder = appFolder || [];
  appFolder.forEach((folder) => {
    currentFolder = currentFolder.find(
      (item) => item.type === 'folder' && item.item === folder
    );

    if (currentFolder) {
      currentFolder = currentFolder.children;
    }
  });

  currentFolder.push({ type: 'app', item: app });
}

function printRunningApps() {
  runningApps.subscribe((runningApps) => {
    let newRunningAppsHTML = '';

    if (runningApps.length > 0) {
      runningApps.forEach(
        (runningApp) =>
          (newRunningAppsHTML += applicationHTMLTemplate(runningApp, {
            favoriteBtn: false,
          }))
      );
      document.querySelector('#running-apps').innerHTML = newRunningAppsHTML;
    } else {
      document.querySelector('#running-apps').innerHTML = noRunningAppsHTML;
    }
  });
}

function printLayouts() {
  filteredLayouts.subscribe((layouts) => {
    let newLayoutsHTML = '';

    if (layouts.length > 0) {
      layouts.forEach(
        (layout) => (newLayoutsHTML += layoutHTMLTemplate(layout))
      );
      document.querySelector('#layout-load>ul').innerHTML = newLayoutsHTML;
    } else {
      document.querySelector('#layout-load>ul').innerHTML = noLayoutsHTML;
    }
    
    favoritesModule.updateFavoriteLayouts();
  });
}

function printFavoriteApps() {
  favoritesModule.favoriteApps
    .pipe(rxjs.operators.combineLatest(allApplicationsObs, favoritesModule.favoriteLayouts, glueModule.layoutsObs, glueModule.activeLayout))
    .subscribe(([favApps, allApps, favLayoutNames, allLayouts, currentlyActiveLayout]) => {
      let favAppsHtml = ``;
      let favLayoutsHtml = ``;
      let existingFavApps = favApps.filter((favApp) =>
        allApps.find((a) => a.name === favApp)
      );

      if (existingFavApps.length > 0 || favLayoutNames.length > 0) {
        existingFavApps.forEach((favApp) => {
          let fullApp = allApps.find((a) => a.name === favApp);

          if (fullApp) {
            favAppsHtml += favoriteApplicationHTMLTemplate(fullApp, {
              favoriteBtn: false,
            });
          }
        });

        favLayoutNames.forEach((favLayoutName) => {
          let fullLayout = allLayouts.find((l) => l.name === favLayoutName);

          if (fullLayout) {
            favLayoutsHtml += favoriteLayoutHTMLTemplate(fullLayout, currentlyActiveLayout);
          }
        });
      } else {
        favAppsHtml = noFavoriteAppsOrLayoutsHTML;
      }

      document.querySelector('#fav-apps').innerHTML = favAppsHtml;
      // put the new favLayoutsHtml in place of the old one
      document.querySelector('#fav-layouts').innerHTML = favLayoutsHtml;
    });
}

function printNotificationCount() {
  glueModule.notificationsCountObs.subscribe((count) => {
    if (count !== null) {
      document.querySelector('#notifications-count').innerHTML = count;

      if (count === 0) {
        document.querySelector('#notifications-count').classList.add('empty');
      } else {
        document
          .querySelector('#notifications-count')
          .classList.remove('empty');
      }
    }
  });
}

function printInitialToastState() {
  const notificationsEnabled = getSetting('enableNotifications');
  const enableToasts = document.querySelector('#enable-toasts');

  if (!notificationsEnabled) {
    enableToasts.checked = false;
    enableToasts.disabled = true;
  }
}

async function showFeedbackPanel() {
  const userProperties = await glueModule.getUserProperties();
  const hideFeedback = userProperties.hideFeedbackButton;

  if (!hideFeedback) {
    document.querySelector('#feedback-panel').classList.remove('d-none');
  }
}

async function showProfilePanel() {
  const userProperties = await glueModule.getUserProperties();
  const hideProfile = userProperties.hideProfileButton;

  if (hideProfile === true) {
    document.querySelector('#profile-panel').classList.add('d-none');
  }
}

export { refreshApps };
