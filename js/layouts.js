import {layoutsObs, removeLayout, restoreLayout, glueAppsObs} from './glue-related.js';


const allLayouts = layoutsObs
  .pipe(rxjs.operators.map((layouts) => {
    return layouts
      .map(l => ({name: l.name, type: l.type}))
      .filter(l => ['Global', 'Swimlane'].includes(l.type))
  }))

function handleLayoutClick() {
  q('#layout-load>ul').addEventListener('click', e => {
    const layoutElement = e.path.find(e => e.getAttribute('layout-name'));
    const name = layoutElement.getAttribute('layout-name');
    const type = layoutElement.getAttribute('layout-type');

    if (e.target.matches('.delete-layout, .delete-layout *')) {
      removeLayout(type, name);
    } else {
      restoreLayout(type, name);
    }
  })
}

function layoutHTMLTemplate(layout) {
  return `
  <li class="nav-item" layout-name="${layout.name}" layout-type="${layout.type}">
    <div class="nav-link action-menu">
      <i class="icon-03-context-viewer ml-2 mr-4"></i>
      <span>${layout.name}${layout.type === 'Swimlane' ? ' (Swimlane)': ''}</span>
      <div class="action-menu-tool delete-layout">
        <button class="btn btn-icon secondary" id="menu-tool-4">
          <i class="icon-trash-empty"></i>
        </button>
      </div>
    </div>
  </li>`;
}

export {
  allLayouts,
  layoutHTMLTemplate,
  handleLayoutClick
}