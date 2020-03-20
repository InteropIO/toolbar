
import { glueAppsObs, startApp} from './glue-related.js';
import { favoriteApps, addFavoriteApp, removeFavoriteApp } from './favorites.js';
import {getSetting, getSettings} from './settings.js';
import { clearSearch, getAppIcon } from './utils.js';

const searchInputObs = new rxjs.BehaviorSubject('');

let {
  filter: rxFilter,
  map: rxMap,
  distinctUntilChanged: rxDistinctUntilChanged,
  combineLatest: rxCombineLatest
} = rxjs.operators;

const allApplicationsObs = glueAppsObs
  .pipe(rxFilter(apps => apps.length > 0))
  .pipe(rxDistinctUntilChanged(undefined, (apps) => {
    // distinct apps have changed by creating a "hash" containing app titles + instance ids
    return apps.map(app => app.title +
      JSON.stringify(app.userProperties.appManagerOrder) +
      JSON.stringify(app.userProperties.consumes) +
      app.instances.map(i => i.id).join()).join() +
      JSON.stringify(getSettings());
  }))
  .pipe(rxMap(allApps => allApps.filter(app => shouldAppBeVisible(app))))
  .pipe(rxMap(allApps => {
    return allApps;
  }))
  .pipe(rxMap(apps => apps.sort(orderApps)));

const runningApps = allApplicationsObs
  .pipe(rxMap((apps) => {
    return apps.filter(app => app.instances.length > 0)
  }));

function shouldAppBeVisible(app) {
  let shouldBeVisible = true;
  if (!getSetting('showHiddenApps') && (app.hidden || app.autoStart)) {
    shouldBeVisible = false;
  }

  return shouldBeVisible;
}

function orderApps(a, b) {
  let aOrder = a.userProperties.appManagerOrder;
  let bOrder = b.userProperties.appManagerOrder;

  if (typeof aOrder === 'number' && typeof bOrder !== 'number') {
    return -1;
  } else if (typeof aOrder !== 'number' && typeof bOrder !== 'number') {
    return 1;
  } else if ((typeof aOrder === 'number') && (typeof bOrder === 'number') && (aOrder !== bOrder)) {
    return aOrder - bOrder;
  } else {
    return a.title.localeCompare(b.title);
  }
}

function handleAppClick() {
  q('#applications').addEventListener('click', (e) => {
    let appName = e.path.reduce((name, el) => {
      return (el.getAttribute && el.getAttribute('app-name')) ? el.getAttribute('app-name') : name;
    }, '');

    if (e.target.matches('.add-favorite, .add-favorite *')) {
      let isAppFavorite = favoriteApps.value.includes(appName);
      if (isAppFavorite) {
        removeFavoriteApp(appName);
      } else {
        addFavoriteApp(appName);
      }
    } else if (e.target.matches('[app-name], [app-name] *')) {
      startApp(appName);
      if (!e.ctrlKey) {
        clearSearch();
      }
    }
  });
}

function handleSearchChange() {
  q('#app-search').addEventListener('keyup', (event) => {
    searchInputObs.next(event.target.value);
  });
}

function applicationHTMLTemplate(app, options = {}) {
  let {favoriteBtn} = options;

  return `
    <li class="nav-item ${app.instances.length > 0 ? 'app-active' : ''}"" app-name="${app.name}">
      <div class="nav-link action-menu">
        ${getAppIcon(app)}
        ${app.instances.length > 0 ? '<!--<span class="icon-size-24 active-app text-success"><i class="icon-dot mr-2 "></i></span>-->' : ''}
        <span class="title-app">${app.title || app.name}</span>` +
        (favoriteBtn ? `
        <div class="action-menu-tool">
          <button class="btn btn-icon secondary add-favorite">
          <i class="icon-star-empty-1" draggable="false"></i>
          <i class="icon-star-full" draggable="false"></i>
          </button>
        </div>` : '') +
      `</div>
    </li>`;
}

function favoriteApplicationHTMLTemplate(app) {

  if (!app) {
    return '';
  }
  return `
  <li class="nav-item ${app.instances.length > 0 ? 'app-active' : ''}" app-name="${app.name}">
    <a class="nav-link" href="#" draggable="false" title="${app.title}">
      ${getAppIcon(app)}
      <span class="text-animation">${app.title}</span>
    </a>
  </li>
  `;
}


const noApplicationsHTML = `<li class="text-center pt-3">No applications</li>`;
const noRunningAppsHTML =  `<li class="text-center pt-3">No running applications</li><li class="text-center pt-3"><button class="btn btn-secondary" menu-button-id="apps">Start application</button></li>`;
const noFavoriteAppsHTML = `<li class="text-center pt-3">No favorite apps</li>`;

export {
  // applicationsObs,
  searchInputObs,
  allApplicationsObs,
  applicationHTMLTemplate,
  favoriteApplicationHTMLTemplate,
  handleAppClick,
  handleSearchChange,
  runningApps,
  noApplicationsHTML,
  noRunningAppsHTML,
  noFavoriteAppsHTML
};
