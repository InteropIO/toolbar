
import { glueAppsObs, startApp} from './glue-related.js';

const searchInputObs = new rxjs.BehaviorSubject('');
const favoriteAppsObs = new rxjs.BehaviorSubject([]);

let {
  filter: rxFilter,
  map: rxMap,
  distinctUntilChanged: rxDistinctUntilChanged,
  combineLatest: rxCombineLatest
} = rxjs.operators;

const applicationsObs = glueAppsObs
  .pipe(rxFilter(apps => apps.length > 0))
  .pipe(rxMap(allApps => allApps.filter(app => shouldAppBeVisible(app))))
  .pipe(rxDistinctUntilChanged(undefined, (apps) => {
    // distinct apps have changed by creating a "hash" containing app titles + instance ids
    return apps.map(app => app.title + app.instances.map(i => i.id).join()).join();
  }))
  .pipe(rxMap(apps => apps.sort(orderApps)))
  .pipe(rxCombineLatest(searchInputObs))
  .pipe(rxMap(([apps, searchInput]) => {
    let search = searchInput.toLowerCase().trim();
    return apps.filter(app => app.title.toLowerCase().indexOf(search) >= 0);
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
      console.log('add to favorite ', appName);
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

function applicationHTMLTemplate(app, isFavorite) {
  return `
    <li class="nav-item" app-name="${app.name}">
      <div class="nav-link action-menu">
        <!-- <i class="icon-interop ml-2 mr-4"></i> -->
        ${app.icon ? '<img src="' + app.icon + '" class="ml-2 mr-4" style="width:12px; height:12px"/>' : ''}
        ${app.instances.length > 0 ? '<span class="icon-size-24 active-app text-success"><i class="icon-dot mr-2 "></i></span>' : ''}
        <span>${app.title || app.name}</span>
        <div class="action-menu-tool">
          <button class="btn btn-icon secondary add-favorite">
            <i class="icon-star-empty-1"></i>
          </button>
        </div>
      </div>
    </li>`;
}

function extendAppInfo(app) {
  return {
    app,
    isFavorite: false,
  };
}



export {
  applicationsObs,
  favoriteAppsObs,
  applicationHTMLTemplate,
  handleAppClick,
  handleSearchChange
}