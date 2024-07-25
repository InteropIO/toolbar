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
import { escapeHtml, renderAlert } from './utils.js';
import { getSetting } from './settings.js';
import { addFavoriteLayout, favoriteLayouts, removeFavoriteLayout } from './favorites.js';

const rxjs = window.rxjs;
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
    .fromEvent(document.querySelector('#layout-search'), 'keyup')
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
  document.querySelector('#layout-load>ul').addEventListener('click', (e) => {
    const layoutElement = e
      .composedPath()
      .find((e) => e.getAttribute?.('layout-name'));

    if (!layoutElement) {
      return;
    }

    const layoutName = layoutElement.getAttribute('layout-name');
    const type = layoutElement.getAttribute('layout-type');

    if (e.target.matches('.delete-layout, .delete-layout *')) {
      layoutElement.classList.add('show-actions');
      layoutElement.classList.add('active');
    } else if (e.target.matches('.set-default, .set-default *')) {
      const isDefault = layoutElement.classList.contains('default-layout');

      if (isDefault) {
        clearDefaultLayout();
      } else {
        setDefaultGlobal(layoutName);
      }
    } else if (e.target.matches('.add-favorite, .add-favorite *')) {
      let isLayoutFavorite = favoriteLayouts.value.includes(layoutName);

      if (isLayoutFavorite) {
        removeFavoriteLayout(layoutName);
      } else {
        addFavoriteLayout(layoutName);
      }
    } else if (e.target.matches('.layout-menu-tool, .layout-menu-tool *')) {
      if (e.target.matches('.layout-menu-tool .delete')) {
        removeLayout(type, layoutName);
      }

      layoutElement.classList.remove('show-actions');
      layoutElement.classList.remove('active');
    } else {
      restoreLayout(type, layoutName);
    }
  });
}

function handleLayoutsSaveMenuItemClick() {
  document.querySelector('#save').addEventListener('click', () => {
    document.querySelector('#layout-save-name').value =
      activeLayout._value.name || defaultLayout._value.name;
  });
}

function handleLayoutSave() {
  document
    .querySelector('#layout-save-btn')
    .addEventListener('click', saveCurrentLayout);
  document
    .querySelector('#layout-save-name')
    .addEventListener('keyup', (e) =>
      e.key === 'Enter' && e.target.value.length > 0
        ? saveCurrentLayout()
        : null
    );
}

async function saveCurrentLayout() {
  const alertElement = document.querySelector('#layout-save-alert');
  const loaderElement = document.querySelector('#layout-save-loader');
  const layoutName = document.querySelector('#layout-save-name').value;

  if (!layoutName || !alertElement) {
    return;
  }

  loaderElement.classList.add('show');

  try {
    await saveLayout(escapeHtml(layoutName));

    renderAlert(
      alertElement,
      'success',
      `Layout ${layoutName} has been saved successfully`
    );
  } catch (error) {
    const inputString = error.message;
    const stringLimiter = ', type:';
    const endIndex = inputString.indexOf(stringLimiter);
    const errorMessage = inputString.substring(0, endIndex);

    console.error('error:', error);
    renderAlert(
      alertElement,
      'warning',
      `Failed to save the layout. ${errorMessage}`
    );
  }

  loaderElement.classList.remove('show');
}

function layoutHTMLTemplate(layout) {
  const textColor = layout.isDefault ? 'text-primary' : '';

  return (
    `<li class="nav-item${layout.isActive ? ' layout-active' : ''}${
      layout.isDefault ? ' default-layout' : ''
    }" layout-name="${escapeHtml(layout.name)}" layout-type="${layout.type}">
    <div class="nav-link action-menu">
      <i class="icon-03-context-viewer ml-2 mr-4"></i>
      <span>${layout.name} ${layout.type === 'Swimlane' ? ' (Swimlane)' : ''} ${
      layout.type === 'Workspace' ? ' (Workspace)' : ''
    }</span>
      <div class="action-menu-tool">` +
    (layout.type === 'Global' && !getSetting('saveDefaultLayout')
      ? `<button class="btn btn-icon secondary set-default ${textColor}" id="menu-tool-4">
          <i class="icon-asterisk"></i>
        </button>`
      : '') +
    `<button class="btn btn-icon secondary add-favorite">
          <i class="icon-star-empty-1" draggable="false"></i>
          <i class="icon-star-full" draggable="false"></i>
          </button>
    <button class="btn btn-icon secondary delete-layout" id="menu-tool-4">
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
