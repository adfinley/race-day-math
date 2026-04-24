import { useState } from 'react';

const getDefaultDate = () => new Date(Date.now() + 7 * 86400000).toISOString();

export const FIELD_DEFAULTS = {
  // Race details
  raceDate: null,
  raceStartTime: '08:00',
  raceSize: 'local',
  raceBuffer: 0,
  doCustomDeadline: 'no',
  customDeadlineType: 'Bus loading',
  customDeadlineTime: '05:00',
  customDeadlineName: '',

  // Pre-race
  doSecurity: 'no',
  security: 10,
  doBagCheck: 'no',
  bagCheck: 10,
  doWarmup: 'no',
  warmupDistance: 3.0,
  warmupPaceSeconds: 330,
  distanceUnit: 'km',
  doBathroomPreRace: 'no',
  bathroomPreRace: 5,
  bathroomUseTime: 5,
  bathroomCount: 1,
  // Bathroom after warm up
  doBathroomPostWarmup: 'no',
  bathroomPostWarmup: 5,
  bathroomPostWarmupUseTime: 5,
  bathroomPostWarmupCount: 1,
  coralTime: 5,

  // Transit
  transitLegs: [
    {
      mode: 'Car',
      hours: 1,
      minutes: 0,
      parkingTime: 10,
      waitTime: 5,
      bikeLockTime: 5,
    },
  ],
  weatherBuffer: 'no',
  weatherBufferMins: 5,

  // Getting ready
  bathroomHome: 15,
  getDressed: 5,
  doEat: 'no',
  eatTime: 10,
  doSlowMorning: 'no',
  slowMorningMins: 15,
  doesSnooze: 'no',
  snoozeMinutes: 5,
  snoozeCount: 1,
};

export const useFormData = () => {
  const [data, setData] = useState({ ...FIELD_DEFAULTS, raceDate: getDefaultDate() });
  const update = (key, value) => setData((prev) => ({ ...prev, [key]: value }));
  const reset = () => setData({ ...FIELD_DEFAULTS, raceDate: getDefaultDate() });
  return { data, update, reset };
};
