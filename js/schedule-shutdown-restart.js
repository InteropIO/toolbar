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
    { name: 'Weekly', displayName: 'Weekly' },
    { name: 'Daily', displayName: 'Daily' },
  ],
};

const intervalItems = {
  all: [
    { name: 'Monday', displayName: 'Mon' },
    { name: 'Tuesday', displayName: 'Tue' },
    { name: 'Wednesday', displayName: 'Wed' },
    { name: 'Thursday', displayName: 'Thu' },
    { name: 'Friday', displayName: 'Fri' },
    { name: 'Saturday', displayName: 'Sat' },
    { name: 'Sunday', displayName: 'Sun' },
  ],
};

function initTimePicker(domElement, config) {
  return flatpickr(domElement, config);
}

function createInstance(input, config = defaultConfig) {
  const instance = initTimePicker(input, config);

  instance.config.onChange.push((selectedDates, time, instance) => {
    const option = input.id.split('-')[1];
    const prevSetting = getSetting('schedule');
    const obj = {
      time,
      period: prevSetting[option].period,
      interval: prevSetting[option].interval,
    };

    const parsedString = parseScheduleToString(obj);

    setSetting({
      schedule: {
        ...prevSetting,
        ...{
          [option]: {
            ...prevSetting[option],
            time,
          },
        },
      },
    });

    setSchedule(option, parsedString);
  });

  return instance;
}

function createDropdown(option, scheduleType, dropdownItems) {
  const initialSetting = getSetting('schedule')[option]?.[scheduleType];

  if (!initialSetting) {
    return;
  }

  dropdownItems.selected = {
    name: initialSetting,
    displayName: dropdownItems.all.find((el) => {
      const name = el.name;

      if (name === initialSetting) {
        return el.displayName;
      }
    }),
  };

  populateSettingsDropdown(
    document.querySelectorAll(
      `.${option}-${scheduleType}-select .select_options`
    ),
    dropdownItems,
    `${option}-${scheduleType}`
  );

  document
    .querySelector(`.${option}-${scheduleType}-select .select_options`)
    .addEventListener('click', (e) => {
      const setting = getSetting('schedule');

      if (e.target.matches('input.select_input[type="radio"]')) {
        const selectedOption = e.target.getAttribute(
          `${option}-${scheduleType}-name`
        );

        const intervalDropdown = document.querySelector(
          `.${option}-interval-select`
        );

        if (selectedOption === 'Daily') {
          intervalDropdown.classList.add('d-none');
        } else {
          intervalDropdown.classList.remove('d-none');
        }

        setSetting({
          schedule: {
            ...setting,
            ...{
              [option]: {
                ...setting[option],
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
    ...{ defaultDate: getSetting('schedule')['restart']['time'] ?? '00:00' },
  });
  createInstance(shutdownInput, {
    ...defaultConfig,
    ...{ defaultDate: getSetting('schedule')['shutdown']['time'] ?? '00:00' },
  });
}

async function getSchedule(scheduleOption) {
  const schedule = await io.interop.invoke('T42.GD.Execute', {
    command: `get-schedule-${scheduleOption}`,
  });

  return schedule.returned.cronTime;
}

async function setSchedule(option, scheduleString) {
  await io.interop.invoke('T42.GD.Execute', {
    command: `schedule-${option}`,
    args: {
      cronTime: scheduleString,
    },
  });
}

async function cancelSchedule(option) {
  const schedule = await getSchedule(option);

  if (!schedule) {
    return;
  }

  await io.interop.invoke('T42.GD.Execute', {
    command: `cancel-${option}`,
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

function parseScheduleToString(option) {
  const minute = option.time.split(':')[1];
  const hour = option.time.split(':')[0];
  const day = '*';
  const month = '*';
  const dayOfWeek =
    option.period === 'Weekly' ? daysOfTheWeek.indexOf(option.interval) : '*';

  return `${minute} ${hour} ${day} ${month} ${dayOfWeek}`;
}

async function getInitialSettings(scheduleOptions) {
  const currentSettings = getSetting('schedule');

  const settings = scheduleOptions.map(async (option) => {
    const schedule = await getSchedule(option);

    if (!schedule) {
      return;
    }

    const { minute, hour, day, month, dayOfWeek } =
      parseScheduleToObj(schedule);

    const setting = {};

    if (daysOfTheWeek !== '*' && day === '*' && month === '*') {
      setting.period = 'Weekly';
      setting.interval = dayOfWeek;
    }

    if (day === '*' && month === '*' && dayOfWeek === '*') {
      setting.period = 'Daily';
    }

    setting.time = `${hour}:${minute}`;

    return {
      [option]: {
        ...currentSettings[option],
        ...{
          enable: true,
          ...setting,
        },
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

function setInitialDropdownStates() {
  const scheduleSettings = getSetting('schedule');
  const scheduleOptions = ['shutdown', 'restart'];

  scheduleOptions.forEach((option) => {
    const periodDropdown = document.querySelector(`.${option}-period-select`);
    const intervalDropdown = document.querySelector(
      `.${option}-interval-select`
    );

    if (!scheduleSettings[option].enable) {
      periodDropdown.classList.add('disabled');
      intervalDropdown.classList.add('disabled');
    }

    if (scheduleSettings[option].period === 'Daily') {
      intervalDropdown.classList.add('d-none');
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
    cancelSchedule(option);
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
      setInitialDropdownStates();
      await handleScheduleToggleClick();
    })
    .catch(console.error);
}

export default handleScheduledShutdownRestart;
