// import {gluePromise} from './glue-related.js';
// import {applicationsObservable} from './applications.js';
console.log('js loaded');

import {applicationsObs, applicationHTMLTemplate} from './applications.js';
import {startApp} from './glue-related.js';

window.q = document.querySelector.bind(document);
window.qa = document.querySelectorAll.bind(document);

window.a = applicationsObs;

document.addEventListener('DOMContentLoaded', async () => {
  console.log('window loaded');
  console.log(applicationsObs);
  applicationsObs.subscribe(apps => {
    console.warn('apps changed', apps.length);
    let newApplicationsHTML = '';
    q('#applications').innerHTML = '';
    apps.forEach(app => newApplicationsHTML += applicationHTMLTemplate(app));
    q('#applications').innerHTML = newApplicationsHTML;
  })

  trackWidth();
  trackAppClick();

})


function trackWidth() {
  let menuWidth = 0, contentWidth = 0;

  const menuWidthObserver = new ResizeObserver((elements) => {
    menuWidth = elements[0].contentRect.right;
    console.log(menuWidth, contentWidth, 1);
    resizeVisibleArea(menuWidth + contentWidth);
  })

  menuWidthObserver.observe(q('.view-port'));

  const toggleContentsObserve = new ResizeObserver((elements) => {
    console.debug(menuWidth, contentWidth, 2);
    if (elements.length > 1) {
      return;
    }

    contentWidth = elements[0].contentRect.width;
    resizeVisibleArea(menuWidth + contentWidth);
  });

  qa('.toggle-content').forEach(content => {
    toggleContentsObserve.observe(content);
  })
}

function trackAppClick() {
  q('#applications').addEventListener('click', (e) => {
    let appName = e.path.reduce((name, el) => {
      return (el.getAttribute && el.getAttribute('app-name')) ? el.getAttribute('app-name') : name;
    }, '');

    if (e.target.matches('.add-favorite, .add-favorite *')) {
      console.log('add to favorite ', appName);
    } else {
      startApp(appName);
    }
  })
}

function resizeVisibleArea(width) {
  // if (!window.glue) {
  //   return;
  // }
  // console.log(width);
  // document.body.style.width = `${width/2}px`;
  // glue.windows.my().moveResize({width: width+2});
}

