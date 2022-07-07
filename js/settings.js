import { updatePrefs } from './glue-related.js';

let settings = {
  showTutorial: true,
  saveDefaultLayout: false,
  searchClients: true,
  searchInstruments: true,
  enableNotifications: true,
  enableToasts: true,
  showHiddenApps: false,
  vertical: true,
};

function init() {
  populateSettings();
  trackSettingsChange();
  glue.notifications.configure({
    enable: settings.enableNotifications,
    enableToasts: settings.enableToasts,
  });
}

function populateSettings() {
  for (const setting in settings) {
    if (
      typeof settings[setting] === 'boolean' &&
      q(`#settings-content [setting='${setting}']`)
    ) {
      let checkbox = q(`#settings-content [setting='${setting}']`);

      getSetting(setting)
        ? checkbox.setAttribute('checked', true)
        : checkbox.removeAttribute('checked');
    }
  }
}

function trackSettingsChange() {
  q('#settings-content').addEventListener('change', (e) => {
    let settingElement = e.path.find(
      (e) => e && e.getAttribute && e.getAttribute('setting')
    );

    if (settingElement) {
      const setting = {};

      setting[settingElement.getAttribute('setting')] = e.srcElement.checked;
      updateSetting(setting);

      if (
        e.target.getAttribute('setting') === 'enableNotifications' &&
        e.srcElement.checked === false
      ) {
        updateSetting({ enableNotifications: false, enableToasts: false });
      }
    }
  });
}

function setSettings(prefs) {
  settings = { ...settings, ...prefs };
  init();
}

function updateSetting(setting) {
  updatePrefs(setting);
}

function getSetting(setting) {
  return settings[setting];
}

function getSettings() {
  return settings;
}

export { setSettings, updateSetting, getSetting, getSettings };
