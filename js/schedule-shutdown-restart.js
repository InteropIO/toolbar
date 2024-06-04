import flatpickr from '../assets/flatpickr.js';
import { getSetting, setSetting } from './settings.js';
import { populateSettingsDropdown } from './utils.js';

const defaultConfig = {
  enableTime: true,
  noCalendar: true,
  dateFormat: 'H:i',
  defaultDate: '00:00',
  // minuteIncrement: 1,
};

const periodItems = {
  all: [
    { name: 'weekly', displayName: 'Weekly' },
    { name: 'daily', displayName: 'Daily' },
  ],
};

const intervalItems = {
  all: [
    { name: 'monday', displayName: 'Mon' },
    { name: 'tuesday', displayName: 'Tue' },
    { name: 'wednesday', displayName: 'Wed' },
    { name: 'thursday', displayName: 'Thu' },
    { name: 'friday', displayName: 'Fri' },
    { name: 'saturday', displayName: 'Sat' },
    { name: 'sunday', displayName: 'Sun' },
  ],
};

function initTimePicker(domElement, config) {
  return flatpickr(domElement, config);
}

function createInstance(input, config = defaultConfig) {
  const instance = initTimePicker(input, config);

  instance.config.onChange.push((selectedDates, dateStr, instance) => {
    console.log(selectedDates, dateStr, instance);
  });

  return instance;
}

function createScheduleInputs() {
  const shutdownInput = '#schedule-shutdown-time';
  const restartInput = '#schedule-restart-time';

  createInstance(document.querySelector(shutdownInput));
  createInstance(document.querySelector(restartInput));
}

function createDropdown(scheduleOption, scheduleType, dropdownItems) {
  const initialSetting = getSetting('schedule')[scheduleOption][scheduleType];

  dropdownItems.selected = {
    name: initialSetting,
    displayName: dropdownItems.all.find((el) => el.name === initialSetting)
      .displayName,
  };

  populateSettingsDropdown(
    document.querySelectorAll(
      `.${scheduleOption}-${scheduleType}-select .select_options`
    ),
    dropdownItems,
    `${scheduleOption}-${scheduleType}`
  );

  document
    .querySelector(`.${scheduleOption}-${scheduleType}-select .select_options`)
    .addEventListener('click', (e) => {
      const setting = getSetting('schedule');

      if (e.target.matches('input.select_input[type="radio"]')) {
        const selectedOption = e.target.getAttribute(
          `${scheduleOption}-${scheduleType}-name`
        );

        setSetting({
          schedule: {
            ...setting,
            ...{
              [scheduleOption]: {
                ...setting[scheduleOption],
                ...{ [scheduleType]: selectedOption },
              },
            },
          },
        });
      }
    });
}

function createScheduleDropdowns() {
  createDropdown('restart', 'period', periodItems);
  createDropdown('restart', 'interval', intervalItems);
  createDropdown('shutdown', 'period', periodItems);
  createDropdown('shutdown', 'interval', intervalItems);
}

export { createScheduleInputs, createScheduleDropdowns };
