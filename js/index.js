// import {gluePromise} from './glue-related.js';
// import {applicationsObservable} from './applications.js';
console.log('js loaded');

import {applicationsObs, applicationHTMLTemplate, handleAppClick, handleSearchChange, runningApps, noRunningAppsHTML, noApplicationsHTML} from './applications.js';
import {allLayouts, layoutHTMLTemplate, handleLayoutClick, handleLayoutSave, noLayoutsHTML} from './layouts.js';
import {notificationsCountObs, openNotificationPanel} from './glue-related.js';

window.q = document.querySelector.bind(document);
window.qa = document.querySelectorAll.bind(document);

window.a = applicationsObs;

document.addEventListener('DOMContentLoaded', () => {
  console.log('window loaded');
  printApps();
  printRunningApps();
  printLayouts();
  // printFavoriteApps();
  printNotificationCount();

  handleWidthChange();
  handleAppClick();
  handleSearchChange()
  handleLayoutClick();
  handleLayoutSave();
  handleNotificationClick();
})

function printApps() {
  applicationsObs.subscribe(apps => {
    let newApplicationsHTML = '';
    if (apps.length > 0) {
      apps.forEach(app => newApplicationsHTML += applicationHTMLTemplate(app, {favorite: true}));
      q('#applications').innerHTML = newApplicationsHTML;
    } else {
      q('#applications').innerHTML = noApplicationsHTML;
    }
  })
}

function printRunningApps() {
  runningApps.subscribe((runningApps) => {
    let newRunningAppsHTML = '';
    if (runningApps.length > 0) {
      runningApps.forEach(runningApp => newRunningAppsHTML += applicationHTMLTemplate(runningApp, {favorite: false}));
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
  const widthObserver = new ResizeObserver((elements) => {
    resizeVisibleArea(elements[0].contentRect.right);
  })

  widthObserver.observe(q('body .app'));
}



function resizeVisibleArea(width) {
  // console.log(width);
}

