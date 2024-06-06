import flatpickr from '../assets/flatpickr.js';
import { getSetting, setSetting } from './settings.js';
import { populateSettingsDropdown } from './utils.js';

const daysOfTheWeek = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const monthsOfTheYear = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

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
    // console.log(selectedDates, dateStr, instance);
    console.log(dateStr);
  });

  return instance;
}

function createDropdown(scheduleOption, scheduleType, dropdownItems) {
  const initialSetting = getSetting('schedule')[scheduleOption]?.[scheduleType];

  if (!initialSetting) {
    return;
  }

  dropdownItems.selected = {
    name: initialSetting.toLowerCase(),
    displayName: dropdownItems.all.find((el) => {
      const name = el.name.toLowerCase();

      if (name === initialSetting) {
        return el.displayName;
      }
    }),
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

function createScheduleInputs() {
  const restartInput = document.querySelector('#schedule-restart-time');
  const shutdownInput = document.querySelector('#schedule-shutdown-time');

  createInstance(restartInput, {
    ...defaultConfig,
    ...{ defaultDate: getSetting('schedule')['restart']['time'] },
  });
  createInstance(shutdownInput, {
    ...defaultConfig,
    ...{ defaultDate: getSetting('schedule')['shutdown']['time'] },
  });
}

async function getSchedule(scheduleOption) {
  const schedule = await io.interop.invoke('T42.GD.Execute', {
    command: `get-schedule-${scheduleOption}`,
  });

  return schedule.returned.cronTime;
}

async function cancelShutdownSchedule() {
  const schedule = await getSchedule('shutdown');

  if (!schedule) {
    return;
  }

  await io.interop.invoke('T42.GD.Execute', {
    command: 'cancel-shutdown',
  });
}

async function cancelRestartSchedule() {
  const schedule = await getSchedule('shutdown');

  if (!schedule) {
    return;
  }

  await io.interop.invoke('T42.GD.Execute', {
    command: 'cancel-restart',
  });
}

function parseScheduleToObj(scheduleString) {
  const schedule = scheduleString.split(' ');

  const scheduleObj = {
    minute: schedule[0] === '0' ? '00' : schedule[0],
    hour: schedule[1] === '0' ? '00' : schedule[1],
    day: schedule[2],
    month: schedule[3] === '*' ? '*' : monthsOfTheYear[schedule[3]],
    dayOfWeek: schedule[4] === '*' ? '*' : daysOfTheWeek[schedule[4]],
  };

  return scheduleObj;
}

function parseScheduleToString(scheduleObj) {
  return `${scheduleObj.minute} ${scheduleObj.hour} ${scheduleObj.day} ${scheduleObj.month} ${scheduleObj.dayOfWeek}`;
}

async function getInitialSettings(scheduleOptions) {
  const currentSettings = getSetting('schedule');

  const settings = scheduleOptions.map(async (scheduleOption) => {
    const schedule = await getSchedule(scheduleOption);

    if (!schedule) {
      return;
    }

    const { minute, hour, day, month, dayOfWeek } =
      parseScheduleToObj(schedule);

    const setting = {};

    if (day === '*' && month === '*' && dayOfWeek === '*') {
      setting.period = 'Daily';
    }

    if (daysOfTheWeek !== '*' && day === '*' && month === '*') {
      setting.period = 'Weekly';
      setting.interval = dayOfWeek;
    }

    setting.time = `${hour}:${minute}`;

    return {
      [scheduleOption]: {
        ...currentSettings[scheduleOption],
        ...setting,
      },
    };
  });

  const settingsObj = await Promise.all(settings).then((res) => {
    return res.reduce((acc, val) => {
      return { ...acc, ...val };
    }, {});
  });

  setSetting({
    schedule: {
      ...currentSettings,
      ...settingsObj,
    },
  });
}

function setInitialToggleStates() {
  const scheduleSettings = getSetting('schedule');

  document.querySelector('#schedule-restart').checked =
    scheduleSettings.restart.enable;
  document.querySelector('#schedule-shutdown').checked =
    scheduleSettings.shutdown.enable;
}

function setInitialInputStates() {
  const scheduleSettings = getSetting('schedule');
  const scheduleOptions = ['shutdown', 'restart'];

  scheduleOptions.forEach((option) => {
    if (!scheduleSettings[option].enable) {
      document.querySelector(`#schedule-${option}-time`).disabled = true;
      document
        .querySelector(`.settings-system-schedule-${option}`)
        .classList.add('d-none');
    }
  });
}

async function setInputStatesOnChange(option, checked) {
  const input = document.querySelector(`#schedule-${option}-time`);
  const periodDropdown = document.querySelector(`.${option}-period-select`);
  const intervalDropdown = document.querySelector(`.${option}-interval-select`);
  const container = document.querySelector(
    `.settings-system-schedule-${option}`
  );

  if (!checked) {
    if (option === 'restart') {
      await cancelRestartSchedule();
    } else if (option === 'shutdown') {
      await cancelShutdownSchedule();
    }
  }

  if (checked) {
    input.disabled = false;
    periodDropdown.classList.remove('disabled');
    intervalDropdown.classList.remove('disabled');
    container.classList.remove('d-none');
  } else {
    input.disabled = true;
    periodDropdown.classList.add('disabled');
    intervalDropdown.classList.add('disabled');
    container.classList.add('d-none');
  }
}

async function handleScheduleToggleClick() {
  const scheduleOptions = ['shutdown', 'restart'];

  scheduleOptions.forEach(async (option) => {
    document
      .querySelector(`#schedule-${option}`)
      .addEventListener('click', async (e) => {
        const prevSettings = getSetting('schedule');

        if (e.target.matches('input[type="checkbox"]')) {
          const checked = e.target.checked;

          await setInputStatesOnChange(option, checked);

          setSetting({
            schedule: {
              ...prevSettings,
              ...{
                [option]: {
                  ...prevSettings[option],
                  ...{ enable: checked },
                },
              },
            },
          });
        }
      });
  });
}

async function handleScheduledShutdownRestart() {
  const scheduleOptions = ['shutdown', 'restart'];

  await getInitialSettings(scheduleOptions)
    .then(async () => {
      createScheduleInputs();
      createScheduleDropdowns();
      setInitialToggleStates();
      setInitialInputStates();
      await handleScheduleToggleClick();
    })
    .catch(console.error);
}

export default handleScheduledShutdownRestart;
