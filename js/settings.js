import { gluePromise } from './glue-related.js';

let defaultSettings = {
  showHiddenApps: false,
  showTutorial: true,
  saveDefaultLayout: false,
  searchClients: true,
  searchInstruments: true,
  enableNotifications: true,
  enableToasts: true
};

let localStorageSettings;

try {
  localStorageSettings = JSON.parse(localStorage.getItem('toolbar-settings'));
} catch (er) {
  localStorageSettings = {};
}

let settings = Object.assign(defaultSettings, localStorageSettings);

init();

async function init() {
  const glue = await gluePromise;

  setInitialSettings();
  populateSettings();
  trackSettingsChange();
}

function setInitialSettings() {
  settings['showHiddenApps'] = false;
}

function populateSettings() {
  Object.keys(settings).forEach(settingName => {
    if (
      typeof settings[settingName] === 'boolean' &&
      q(`#settings-content [setting='${settingName}']`)
    ) {
      let checkbox = q(`#settings-content [setting='${settingName}']`);

      getSetting(settingName)
        ? checkbox.setAttribute('checked', true)
        : checkbox.removeAttribute('checked');
    }
  });
}

function trackSettingsChange() {
  const settings = getSettings();
  const changedSetting = {};

  q('#settings-content').addEventListener('change', e => {
    let settingElement = e.path.find(
      e => e && e.getAttribute && e.getAttribute('setting')
    );

    if (settingElement) {
      setSetting(
        settingElement.getAttribute('setting'),
        e.srcElement.checked
      );
    }

    changedSetting[e.target.getAttribute('setting')] =
      settings[e.target.getAttribute('setting')];

    updateAppPrefs(changedSetting);
  });
}

async function updateAppPrefs(setting) {
  await glue.prefs.update({ ...setting });
}

function setSetting(settingName, value) {
  settings[settingName] = value;
  saveSettings();
  console.info('set setting', settingName, value);
}

function getSetting(settingName) {
  return settings[settingName];
}

function getSettings() {
  return settings;
}

function saveSettings() {
  localStorage.setItem('toolbar-settings', JSON.stringify(settings));
}

export { setSetting, getSetting, getSettings };
