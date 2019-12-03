import {layoutsObs, removeLayout, restoreLayout, saveLayout} from './glue-related.js';

let filteredLayouts;

init();
function init() {
  let allLayouts = layoutsObs
  .pipe(rxjs.operators.map((layouts) => {
    return layouts
      .map(l => ({name: l.name, type: l.type}))
      .filter(l => ['Global', 'Swimlane'].includes(l.type))
  }));

  const layoutSearch = rxjs.fromEvent(q('#layout-search'), 'keyup')
    .pipe(rxjs.operators.map(event => {
      return event.srcElement.value.toString().toLowerCase().trim();
    }))
    .pipe(rxjs.operators.distinctUntilChanged())
    .pipe(rxjs.operators.startWith(''))

  filteredLayouts = allLayouts
    .pipe(rxjs.operators.combineLatest(layoutSearch))
    .pipe(rxjs.operators.map(([layouts, search]) => {
      return layouts.filter(layout => {
        return layout.name.toLowerCase().includes(search);
      })
    }))
}

function handleLayoutClick() {
  q('#layout-load>ul').addEventListener('click', e => {
    const layoutElement = e.path.find(e => e.getAttribute && e.getAttribute('layout-name'));
    if (!layoutElement) {
      return;
    }
    const name = layoutElement.getAttribute('layout-name');
    const type = layoutElement.getAttribute('layout-type');

    if (e.target.matches('.delete-layout, .delete-layout *')) {
      layoutElement.classList.add('show-actions');
      layoutElement.classList.add('active');
    } else if(e.target.matches('.layout-menu-tool, .layout-menu-tool *')) {
      if (e.target.matches('.layout-menu-tool .delete')) {
        removeLayout(type, name);
      }

      layoutElement.classList.remove('show-actions');
      layoutElement.classList.remove('active');
    } else {
      restoreLayout(type, name);
    }
  })
}

function handleLayoutSave(){
  q('#layout-save-btn').addEventListener('click', saveCurrentLayout);
  q('#layout-save-name').addEventListener('keyup', (e) => e.key === 'Enter' ? saveCurrentLayout() : null);
}

function saveCurrentLayout() {
  saveLayout(q('#layout-save-name').value);
  q('#layout-save-name').value = '';
  q('#layout-content').classList.add('hide');
  q('#layout-load').classList.remove('hide');
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
    <div class="layout-menu-tool">
      <div class="delete">Delete</div>
      <div class="cancel">Cancel</div>
    </div>
  </li>

  `;
}

const noLayoutsHTML = `<li class="text-center w-100 pt-3">No Layouts Saved</li><li class="text-center w-100 pt-3"><button class="btn btn-secondary" menu-button-id="layout-save">Add Layouts</button></li>`;

export {
  filteredLayouts,
  layoutHTMLTemplate,
  handleLayoutClick,
  handleLayoutSave,
  noLayoutsHTML
}