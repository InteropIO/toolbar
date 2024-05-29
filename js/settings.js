import { updatePrefs } from './connect-related.js';

let settings = {
  showTutorial: true,
  saveDefaultLayout: false,
  searchClients: true,
  searchInstruments: true,
  enableNotifications: true,
  enableToasts: true,
  toolbarAppRows: '8',
  showHiddenApps: false,
  vertical: true,
};
const toolbarWidth = {
  vertical: 200,
  horizontal: 540,
};
const toolbarDrawerSize = {
  vertical: 300,
  horizontal: 550,
};
const initialPosition = 20;

async function init() {
  populateSettings();
  trackSettingsChange();
}

function populateSettings() {
  const settingsContainer = document.querySelector('#settings-content');

  for (const setting in settings) {
    const settingElement = settingsContainer.querySelector(
      `[data-setting='${setting}']`
    );

    if (!settingElement) {
      continue;
    }

    if (typeof settings[setting] === 'boolean') {
      getSetting(setting)
        ? settingElement.setAttribute('checked', true)
        : settingElement.removeAttribute('checked');
    }
  }
}

function trackSettingsChange() {
  const settingsContainer = document.querySelector('#settings-content');

  settingsContainer.addEventListener('change', (e) => {
    const settingDropdown =
      e.target.getAttribute('name') === 'theme' ||
      e.target.getAttribute('name') === 'length';

    if (settingDropdown) {
      return;
    }

    let settingElement = e
      .composedPath()
      .find((el) => el && el.dataset.setting);

    if (settingElement) {
      const setting = {};

      setting[settingElement.dataset.setting] = e.target.checked;
      setSetting(setting);

      if (
        e.target.dataset.setting === 'enableNotifications' &&
        e.target.checked === false
      ) {
        setSetting({ enableNotifications: false, enableToasts: false });
      }
    }
  });
}

function getSettings() {
  return settings;
}

function setSettings(prefs) {
  settings = { ...settings, ...prefs };
  init();
}

function getSetting(setting) {
  return settings[setting];
}

function setSetting(setting) {
  Object.assign(settings, setting);

  if (Object.keys(setting).includes('showHiddenApps')) {
    return;
  }

  updatePrefs(setting);
}

export {
  toolbarWidth,
  toolbarDrawerSize,
  initialPosition,
  setSettings,
  setSetting,
  getSetting,
  getSettings,
};
