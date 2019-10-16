
import { glueAppsObs, startApp} from './glue-related.js';
import { favoriteApps, addFavoriteApp, removeFavoriteApp } from './favorites.js';

const searchInputObs = new rxjs.BehaviorSubject('');
// const favoriteAppsObs = new rxjs.BehaviorSubject([]);

let {
  filter: rxFilter,
  map: rxMap,
  distinctUntilChanged: rxDistinctUntilChanged,
  combineLatest: rxCombineLatest
} = rxjs.operators;

const allApps = glueAppsObs
  .pipe(rxFilter(apps => apps.length > 0))
  .pipe(rxMap(allApps => allApps.filter(app => shouldAppBeVisible(app))))
  .pipe(rxDistinctUntilChanged(undefined, (apps) => {
    // distinct apps have changed by creating a "hash" containing app titles + instance ids
    return apps.map(app => app.title + app.instances.map(i => i.id).join()).join();
  }))
  // .pipe(rxMap(apps => []));
  .pipe(rxMap(apps => apps.sort(orderApps)));

const applicationsObs = allApps
  .pipe(rxCombineLatest(searchInputObs))
  .pipe(rxMap(([apps, searchInput]) => {
    let search = searchInput.toLowerCase().trim();
    return apps.filter(app => app.title.toLowerCase().indexOf(search) >= 0);
  }));

const runningApps = allApps
  .pipe(rxMap((apps) => {
    return apps.filter(app => app.instances.length > 0)
  }))


function shouldAppBeVisible(app) {
  let shouldBeVisible = true;
  if (app.hidden || app.autoStart) {
    shouldBeVisible = false;
  }

  return shouldBeVisible;
}

function orderApps(a, b) {
  let aOrder = a.userProperties.appManagerOrder;
  let bOrder = b.userProperties.appManagerOrder;

  if (aOrder && !bOrder) {
    return -1;
  } else if (!aOrder && bOrder) {
    return 1;
  } else if (aOrder && bOrder) {
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
      console.log(isAppFavorite, favoriteApps.value, appName);
      if (isAppFavorite) {
        console.log('remove from favorite');
        removeFavoriteApp(appName);
      } else {
        console.log('add to favorite ', appName);
        addFavoriteApp(appName);
      }
    } else {
      startApp(appName);
      console.log(e);
      if (e.ctrlKey) {
        return;
      } else {
        searchInputObs.next('');
        q('#app-search').value = '';
      }
    }
  })
}

function handleSearchChange() {
  q('#app-search').addEventListener('keyup', (event) => {
    searchInputObs.next(event.target.value);
  })
}

function applicationHTMLTemplate(app, options = {}) {
  let {favoriteBtn} = options;

  return `
    <li class="nav-item ${app.instances.length > 0 ? 'app-active' : ''}"" app-name="${app.name}">
      <div class="nav-link action-menu">
        <!-- <i class="icon-interop ml-2 mr-4"></i> -->
        ${getAppIcon(app)}
        ${app.instances.length > 0 ? '<!--<span class="icon-size-24 active-app text-success"><i class="icon-dot mr-2 "></i></span>-->' : ''}
        <span>${app.title || app.name}</span>` +
        (favoriteBtn ? `
        <div class="action-menu-tool">
          <button class="btn btn-icon secondary add-favorite">
          <i class="icon-star-empty-1"></i>
          </button>
        </div>` : '') +
      `</div>
    </li>`;
}

function favoriteApplicationHTMLTemplate(app) {
  return `
  <li class="nav-item ${app.instances.length > 0 ? 'app-active' : ''}">
    <a class="nav-link" href="#">
      ${getAppIcon(app, {marginRight: 2, marginLeft: 1})}
      <span class="text-animation mx-2">${app.title}</span>
    </a>
  </li>
  `;
}

function getAppIcon(app, options = {}) {
  let {
    marginRight = 4,
    marginLeft = 2} = options;

  if (app.icon) {
    return `<img src="${app.icon}" class="ml-${marginLeft} mr-${marginRight}" style="width:12px; height:12px"/>`;
  } else {
    return `<span class="icon-size-14 ml-${marginLeft} mr-${marginRight}">
    <i class="icon-tick42-icon-monochrome"></i>
  </span>`;
  }
}

const noApplicationsHTML = `<li class="text-center w-100 pt-3">No applications</li>`;
const noRunningAppsHTML =  `<li class="text-center w-100 pt-3">No running applications</li><li class="text-center w-100 pt-3"><button class="btn btn-secondary">Add applications</button></li>`;
const noFavoriteAppsHTML = `<li class="text-center w-100 pt-3">No favorite apps</li>`;

export {
  applicationsObs,
  applicationHTMLTemplate,
  favoriteApplicationHTMLTemplate,
  handleAppClick,
  handleSearchChange,
  runningApps,
  noApplicationsHTML,
  noRunningAppsHTML,
  noFavoriteAppsHTML
}