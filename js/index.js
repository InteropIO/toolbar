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
    console.log(layouts);
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
  // let menuWidth = 0, contentWidth = 0;

  // const menuWidthObserver = new ResizeObserver((elements) => {
  //   menuWidth = elements[0].contentRect.right;
  //   console.log(menuWidth, contentWidth, 1);
  //   resizeVisibleArea(menuWidth + contentWidth);
  // })

  // menuWidthObserver.observe(q('.view-port'));

  // const toggleContentsObserve = new ResizeObserver((elements) => {
  //   console.debug(menuWidth, contentWidth, 2);
  //   if (elements.length > 1) {
  //     return;
  //   }

  //   contentWidth = elements[0].contentRect.width;
  //   resizeVisibleArea(menuWidth + contentWidth);
  // });

  // qa('.toggle-content').forEach(content => {
  //   toggleContentsObserve.observe(content);
  // })
}



function resizeVisibleArea(width) {
  // if (!window.glue) {
  //   return;
  // }
  // console.log(width);
  // document.body.style.width = `${width/2}px`;
  // glue.windows.my().moveResize({width: width+2});
}

