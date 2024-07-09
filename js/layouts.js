import {
  layoutsObs,
  removeLayout,
  restoreLayout,
  saveLayout,
  defaultLayout,
  activeLayout,
  clearDefaultLayout,
  setDefaultGlobal,
} from './connect-related.js';
import { escapeHtml } from './utils.js';
import { getSetting } from './settings.js';

let filteredLayouts;

init();

function init() {
  let allLayouts = layoutsObs.pipe(
    rxjs.operators.map((layouts) => {
      return layouts
        .toReversed()
        .map((l) => ({ name: l.name, type: l.type }))
        .filter((l) => ['Global', 'Swimlane', 'Workspace'].includes(l.type));
    })
  );

  const layoutSearch = rxjs
    .fromEvent(q('#layout-search'), 'keyup')
    .pipe(
      rxjs.operators.map((event) => {
        return event.target.value.toString().toLowerCase().trim();
      })
    )
    .pipe(rxjs.operators.distinctUntilChanged())
    .pipe(rxjs.operators.startWith(''));

  filteredLayouts = allLayouts
    .pipe(
      rxjs.operators.combineLatest(layoutSearch, defaultLayout, activeLayout)
    )
    .pipe(
      rxjs.operators.map(([layouts, search, defaultLayout, activeLayout]) => {
        defaultLayout = defaultLayout || {};
        return layouts
          .filter((layout) => {
            return layout.name.toLowerCase().includes(search);
          })
          .map((layout) => {
            layout.isDefault =
              layout.name === defaultLayout.name &&
              layout.type === defaultLayout.type;
            layout.isActive =
              layout.name === activeLayout.name &&
              layout.type === activeLayout.type;
            return layout;
          });
      })
    );
}

function handleLayoutClick() {
  q('#layout-load>ul').addEventListener('click', (e) => {
    const layoutElement = e
      .composedPath()
      .find((e) => e.getAttribute && e.getAttribute('layout-name'));

    if (!layoutElement) {
      return;
    }

    const name = layoutElement.getAttribute('layout-name');
    const type = layoutElement.getAttribute('layout-type');

    if (e.target.matches('.delete-layout, .delete-layout *')) {
      layoutElement.classList.add('show-actions');
      layoutElement.classList.add('active');
    } else if (e.target.matches('.set-default, .set-default *')) {
      const isDefault = layoutElement.classList.contains('default-layout');

      if (isDefault) {
        clearDefaultLayout();
      } else {
        setDefaultGlobal(name);
      }
    } else if (e.target.matches('.layout-menu-tool, .layout-menu-tool *')) {
      if (e.target.matches('.layout-menu-tool .delete')) {
        removeLayout(type, name);
      }

      layoutElement.classList.remove('show-actions');
      layoutElement.classList.remove('active');
    } else {
      restoreLayout(type, name);
    }
  });
}

function handleLayoutsSaveMenuItemClick() {
  q('#save').addEventListener('click', () => {
    q('#layout-save-name').value = activeLayout._value.name;
  });
}

function handleLayoutSave() {
  q('#layout-save-btn').addEventListener('click', saveCurrentLayout);
  q('#layout-save-name').addEventListener('keyup', (e) =>
    e.key === 'Enter' && e.target.value.length > 0 ? saveCurrentLayout() : null
  );
}

function saveCurrentLayout() {
  saveLayout(escapeHtml(q('#layout-save-name').value));
  // q('#layout-save-name').value = '';
  // q('#layout-content').classList.add('hide');
  // q('#layout-load').classList.remove('hide');
}

function layoutHTMLTemplate(layout) {
  return (
    `
  <li class="nav-item ${layout.isActive ? 'app-active' : ''} ${
      layout.isDefault ? 'default-layout' : ''
    }" layout-name="${escapeHtml(layout.name)}" layout-type="${layout.type}">
    <div class="nav-link action-menu">
      <i class="icon-03-context-viewer ml-2 mr-4"></i>
      <span>${layout.name} ${layout.type === 'Swimlane' ? ' (Swimlane)' : ''} ${
      layout.type === 'Workspace' ? ' (Workspace)' : ''
    }</span>
      <div class="action-menu-tool">` +
    (layout.type === 'Global' && !getSetting('saveDefaultLayout')
      ? `<button class="btn btn-icon secondary set-default ${
          layout.isDefault ? 'text-primary' : ''
        }" id="menu-tool-4">
          <i class="icon-asterisk"></i>
        </button>`
      : '') +
    `<button class="btn btn-icon secondary delete-layout" id="menu-tool-4">
          <i class="icon-trash-empty"></i>
        </button>
      </div>
    </div>
    <ul class="layout-menu-tool">
      <li class="nav-item delete">Delete</li>
      <li class="nav-item cancel">Cancel</li>
    </ul>
  </li>
  `
  );
}

const noLayoutsHTML = `<li class="text-center w-100 pt-3">No Layouts Saved</li><li class="text-center w-100 pt-3"><button class="btn btn-secondary" menu-button-id="layout-save">Add Layouts</button></li>`;

export {
  filteredLayouts,
  layoutHTMLTemplate,
  handleLayoutClick,
  handleLayoutSave,
  handleLayoutsSaveMenuItemClick,
  noLayoutsHTML,
};
