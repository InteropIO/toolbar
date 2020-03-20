
let defaultSettings = {
  showHiddenApps: false,
  showTutorial: true,
  searchClients: true,
  searchInstruments: true
}

let localStorageSettings;

try {
  localStorageSettings = JSON.parse(localStorage.getItem('toolbar-settings'));
} catch(er) {
  localStorageSettings = {};
}

let settings = Object.assign(defaultSettings, localStorageSettings);

init();
function init() {
  setInitialSettings();
  populateSettings();
  trackSettingsChange();
}

function setInitialSettings() {
  settings['showHiddenApps'] = false;
}

function populateSettings() {
  Object.keys(settings).forEach(settingName => {
    if ((typeof settings[settingName] === 'boolean') && q(`#settings-content [setting="${settingName}"]`)) {
      let checkbox = q(`#settings-content [setting="${settingName}"]`);
      getSetting(settingName) ? checkbox.setAttribute('checked', true) : checkbox.removeAttribute('checked');
    }
  });

}

function trackSettingsChange() {
  q('#settings-content ').addEventListener('change', (e) => {
    let settingElement = e.path.find(e => e && e.getAttribute && e.getAttribute('setting'));
    if (settingElement) {
      setSetting(settingElement.getAttribute('setting'), e.srcElement.checked);
    }
  });
}

function setSetting(settingName, value) {
  console.info('set setting', settingName, value);
  settings[settingName] = value;
  saveSettings();
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

export {
  setSetting,
  getSetting,
  getSettings
}