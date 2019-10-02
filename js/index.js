// import {gluePromise} from './glue-related.js';
// import {applicationsObservable} from './applications.js';
console.log('js loaded');

import {applicationsObs} from './applications.js';

window.q = document.querySelector.bind(document);
window.qa = document.querySelectorAll.bind(document);

window.a = applicationsObs;

document.addEventListener('DOMContentLoaded', async () => {
  console.log('window loaded');
  console.log(applicationsObs);
  applicationsObs.subscribe(apps => {
    console.warn('apps changed');
    let newApplicationsHTML = '';
    q('#applications').innerHTML = '';
    apps.forEach(app => newApplicationsHTML += applicationHTMLTemplate(app));
    q('#applications').innerHTML = newApplicationsHTML;
  })

})


function applicationHTMLTemplate(app, isFavorite) {
  return `<li class="nav-item">
  <div class="nav-link action-menu">
    <!-- <i class="icon-interop "></i> -->
    <img src="${app.icon}" class="ml-2 mr-4" style="width:12px; height:12px"/>
    <span>${app.title || app.name}</span>
    ${app.instances.length > 0 ? '<span class="icon-size-24 active-app text-success"><i class="icon-dot mr-2 "></i></span>' : ''}
    <div class="action-menu-tool">
      <button class="btn btn-icon secondary" id="menu-tool-1">
        <i class="icon-ellipsis-vert"></i>
      </button>
      <div class="dropdown-menu" id="menu-div-1">
        ${isFavorite ? '<a class="dropdown-item" href="#">Add to Favorite</a>' : '<a class="dropdown-item" href="#">Remove from Favorite</a>'}
        <!-- <a class="dropdown-item" href="#">Settings</a> -->
      </div>
    </div>
  </div>
</li>`;
}