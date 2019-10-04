
import { glueAppsObs} from './glue-related.js';

const favoriteAppsObs = new rxjs.BehaviorSubject([]);

let {
  filter: rxFilter,
  map: rxMap,
  distinctUntilChanged: rxDistinctUntilChanged
} = rxjs.operators;

const applicationsObs = glueAppsObs
  .pipe(rxFilter(apps => apps.length > 0))
  .pipe(rxMap(allApps => allApps.filter(app => shouldAppBeVisible(app))))
  .pipe(rxDistinctUntilChanged(undefined, (apps) => {
    // distinct apps have changed by creating a "hash" containing app titles + instance ids
    return apps.map(app => app.title + app.instances.map(i => i.id).join()).join();
  }))
  .pipe(rxMap(apps => apps.sort(orderApps)));

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
  applicationHTMLTemplate
}