export const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

export const minutesToTime = (totalMinutes) => {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const formatTime12h = (timeStr) => {
  if (!timeStr) return '--:--';
  const [h, m] = timeStr.split(':').map(Number);
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')}`;
};

export const formatPeriod = (timeStr) => {
  if (!timeStr) return '';
  const [h] = timeStr.split(':').map(Number);
  return h >= 12 ? 'PM' : 'AM';
};

export const addMinutes = (timeStr, minutes) => {
  const total = timeToMinutes(timeStr) + minutes;
  return minutesToTime(total);
};

export const subtractMinutes = (timeStr, minutes) => {
  const total = timeToMinutes(timeStr) - minutes;
  return minutesToTime(total);
};

export const formatMins = (mins) => {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
};

export const MODE_LABEL = {
  Car: 'Drive', Rideshare: 'Rideshare', Bus: 'Bus', Train: 'Train',
  Subway: 'Subway', Streetcar: 'Streetcar', Bike: 'Bike', Walk: 'Walk', Run: 'Run',
  Ferry: 'Ferry',
};

const MODE_EMOJI = {
  Car: '🚗', Bus: '🚌', Train: '🚆', Subway: '🚇',
  Walk: '🚶', Bike: '🚲', Rideshare: '🚕', Streetcar: '🚃', Run: '🏃', Ferry: '⛴️',
};

const PUBLIC_MODES = ['Bus', 'Train', 'Subway', 'Streetcar'];
const KM_PER_MI = 1.60934;

// ─────────────────────────────────────────────────────────────────
// buildTimeline — bi-directional split calculation
//
// Standard flow (no fixed departure):
//   All steps count backward from raceStartTime
//
// Fixed departure flow:
//   Part 1 (backward from anchorTime):
//     Morning prep → transit segments ABOVE anchor → departure time
//   Part 2 (forward from anchorTime):
//     Transit segments BELOW anchor → arrival at site
//   Gap = (raceStartTime - raceBuffer) - arrivalAtSite → "Wait at start area"
//   If arrival > (raceStartTime - raceBuffer): mark as late
// ─────────────────────────────────────────────────────────────────
export const buildTimeline = (formData) => {
  const {
    raceStartTime, raceBuffer,
    raceSize, doCustomDeadline, customDeadlineTime, customDeadlineType, customDeadlineName,
    doWarmup, warmupDistance, warmupPaceSeconds, distanceUnit,
    doBagCheck, bagCheck,
    doSecurity, security,
    doBathroomPreRace, bathroomPreRace, bathroomUseTime, bathroomCount,
    doBathroomPostWarmup, bathroomPostWarmup, bathroomPostWarmupUseTime, bathroomPostWarmupCount,
    transitLegs, weatherBuffer, weatherBufferMins,
    bathroomHome, getDressed, doEat, eatTime, doSlowMorning, slowMorningMins,
    doesSnooze, snoozeCount, snoozeMinutes,
    coralTime,
  } = formData;

  const startTime  = raceStartTime || '08:00';
  const weatherAdd = weatherBuffer === 'yes' ? (parseInt(weatherBufferMins) || 0) : 0;
  const bufferMins = parseInt(raceBuffer) || 0;

  // ── Fixed departure detection ──────────────────────────────────
  const isFixed    = raceSize === 'major' && doCustomDeadline === 'yes' && !!customDeadlineTime;
  const anchorTime = isFixed ? customDeadlineTime : null;
  const anchorLabel = isFixed
    ? (customDeadlineType === 'Other' && customDeadlineName ? customDeadlineName : customDeadlineType || 'Fixed departure')
    : null;

  // ── Warmup duration (km/mi aware) ────────────────────────────
  const warmupMins = (() => {
    if (doWarmup !== 'yes') return 0;
    const dist = parseFloat(warmupDistance || 0);
    const pace = parseInt(warmupPaceSeconds || 0);
    const distKm = distanceUnit === 'mi' ? dist * KM_PER_MI : dist;
    const totalSecs = Math.round(pace * distKm);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return secs >= 55 ? mins + 1 : mins;
  })();

  const steps = [];
  let lateArrival = false;

  const fuelTime = subtractMinutes(startTime, 15);

  if (!isFixed) {
    // ── STANDARD FLOW: count backward from race start ────────────
    let cursor = startTime;

    const push = (label, minutes, note = '', emoji = '', type = '') => {
      if (!minutes || minutes <= 0) return;
      cursor = subtractMinutes(cursor, minutes);
      steps.push({ label, minutes, startTime: cursor, endTime: addMinutes(cursor, minutes), note, emoji, type });
    };

    // Pre-race (counts backward from race start)
    // Push order is REVERSE of chronological — each push subtracts from cursor.
    // Chronological order we want: warm up → bathroom post warmup → bathroom pre → ...
    // So push order must be: corral → bathroom-post-warmup → warm up → ...
    // (bathroom-post-warmup pushed before warm up = it gets a later start time = appears after warm up)
    push('Get in the corral', (coralTime || 0) + bufferMins, 'Find your position', '🐰', 'corral');
    if (doWarmup === 'yes' && doBathroomPostWarmup === 'yes') {
      const w = parseInt(bathroomPostWarmup)||0, u = parseInt(bathroomPostWarmupUseTime)||0, c = parseInt(bathroomPostWarmupCount)||1;
      const tot = (w + u) * c;
      if (tot > 0) push('Bathroom (post warm up)', tot, c===1?`${w}+${u} min`:`(${w}+${u})×${c}`, '💩', 'bathroom-post-warmup');
    }
    if (doWarmup === 'yes' && warmupMins > 0) push('Warm up', warmupMins, 'Nice and easy', '🏃', 'warmup');
    if (doBathroomPreRace === 'yes') {
      const w = parseInt(bathroomPreRace)||0, u = parseInt(bathroomUseTime)||0, c = parseInt(bathroomCount)||1;
      const tot = (w + u) * c;
      if (tot > 0) push('Bathroom (pre-race)', tot, c===1?`${w}+${u} min`:`(${w}+${u})×${c}`, '💩', 'bathroom-pre');
    }
    if (doBagCheck === 'yes' && bagCheck) push('Bag check', parseInt(bagCheck)||0, '', '🎒', 'bagcheck');
    if (doSecurity === 'yes' && security) push('Go through security', parseInt(security)||0, '', '🔒', 'security');

    // Transit (counts backward)
    const legs = transitLegs || [];
    const allWalk = legs.length > 0 && legs.every(l => l.mode === 'Walk');
    if (allWalk) {
      const tot = legs.reduce((s, l) => s + (l.hours||0)*60 + (l.minutes||0), 0);
      push('Walk', tot, '', '🚶', 'transit');
      if (weatherAdd > 0) push('Weather buffer', weatherAdd, '', '🌧️', 'weather');
    } else {
      const legsRev = [...legs].reverse();
      legsRev.forEach((leg, idx) => {
        const legMins = (leg.hours||0)*60 + (leg.minutes||0);
        const isPublic = PUBLIC_MODES.includes(leg.mode);
        const isCar = leg.mode === 'Car' || leg.mode === 'Rideshare';
        const isBike = leg.mode === 'Bike';
        if (isCar) {
          if (leg.parkingTime) push('Find parking', parseInt(leg.parkingTime)||0, '', '🅿️', 'parking');
          if (legMins) push(MODE_LABEL[leg.mode]||leg.mode, legMins, '', MODE_EMOJI[leg.mode]||'🚗', 'transit');
        } else if (isPublic) {
          if (legMins) push(leg._displayLabel || MODE_LABEL[leg.mode]||leg.mode, legMins, '', MODE_EMOJI[leg.mode]||'🚌', 'transit');
          if (leg.waitTime && !leg._anchorLinked) push(`Wait for ${leg.mode.toLowerCase()}`, parseInt(leg.waitTime)||0, '', '⏱', 'transit-wait');
        } else if (isBike) {
          if (leg.bikeLockTime) push('Lock bike', parseInt(leg.bikeLockTime)||0, '', '🔒', 'bike-lock');
          if (legMins) push(MODE_LABEL[leg.mode]||leg.mode, legMins, '', MODE_EMOJI[leg.mode]||'🚲', 'transit');
        } else {
          if (legMins) push(leg._displayLabel || MODE_LABEL[leg.mode]||leg.mode, legMins, '', MODE_EMOJI[leg.mode]||'🚗', 'transit');
        }
        // Weather buffer pushed AFTER the first chrono leg (last in reversed order)
        // so it gets an earlier startTime than all transit legs → appears first
        if (idx === legsRev.length - 1 && weatherAdd > 0) push('Weather buffer', weatherAdd, '', '🌧️', 'weather');
      });
    }

    // Morning prep
    if (doEat === 'yes') push('Eat breakfast', parseInt(eatTime)||0, '', '🥯', 'eat');
    if (doSlowMorning === 'yes') push('Extra morning time', parseInt(slowMorningMins)||0, '', '🥱', 'slow-morning');
    push('Get dressed', parseInt(getDressed)||0, 'Prep gear the night before!', '🎽', 'dressed');
    if (bathroomHome) push('Bathroom (at home)', parseInt(bathroomHome)||0, 'Brushing teeth, poop, shower, etc.', '🚽', 'bathroom-home');
    if (doesSnooze === 'yes' && snoozeCount > 0 && snoozeMinutes > 0) {
      const cnt = parseInt(snoozeCount)||1;
      for (let i = cnt; i >= 1; i--) push(cnt>1?`Snooze ${i}`:'Snooze', parseInt(snoozeMinutes)||0, '', '🥱', 'snooze');
    }

    // steps are in reverse-chronological push order — reverse to get chronological order
    const sorted = [...steps].reverse();
    const wakeUpTime = subtractMinutes(cursor, 5);
    return { steps: sorted, wakeUpTime, fuelTime, raceStartTime: startTime, deadlineTime: null, deadlineLabel: null, isLate: false };
  }

  // ── FIXED DEPARTURE FLOW: bi-directional split ───────────────
  //
  // The transit legs array has a flag: leg._anchorLinked === true marks the
  // "post-anchor" segment (Bus shuttle / Ferry). All legs before this are
  // "pre-anchor" (user travels TO the anchor). All legs after (including the
  // linked leg) are "post-anchor" (depart FROM anchor to race site).
  //
  // Visually in the list the order is:
  //   [Drive] [Anchor node] [Bus shuttle / Ferry] [Walk] ...
  // In transitLegs: index 0 = Drive, index 1 = Bus shuttle (_anchorLinked), index 2+ = others

  const legs = transitLegs || [];
  const anchorLinkedIdx = legs.findIndex(l => l._anchorLinked);
  // Pre-anchor legs: before the anchor-linked leg (not including it)
  const preLegs  = anchorLinkedIdx >= 0 ? legs.slice(0, anchorLinkedIdx) : legs;
  // Post-anchor legs: the linked leg and anything after it
  const postLegs = anchorLinkedIdx >= 0 ? legs.slice(anchorLinkedIdx) : [];

  // ── PART 1: Morning prep + pre-anchor transit (backward from anchorTime) ──
  {
    let cursor = anchorTime;

    const push = (label, minutes, note = '', emoji = '', type = '') => {
      if (!minutes || minutes <= 0) return;
      cursor = subtractMinutes(cursor, minutes);
      steps.push({ label, minutes, startTime: cursor, endTime: addMinutes(cursor, minutes), note, emoji, type });
    };

    // Pre-anchor transit (reversed so earliest leg is first after sort)
    const allWalk = preLegs.length > 0 && preLegs.every(l => l.mode === 'Walk');
    if (allWalk) {
      const tot = preLegs.reduce((s, l) => s + (l.hours||0)*60 + (l.minutes||0), 0);
      push('Walk to anchor', tot, '', '🚶', 'transit');
      if (weatherAdd > 0) push('Weather buffer', weatherAdd, '', '🌧️', 'weather');
    } else {
      const rev = [...preLegs].reverse();
      rev.forEach((leg, idx) => {
        const legMins = (leg.hours||0)*60 + (leg.minutes||0);
        const isPublic = PUBLIC_MODES.includes(leg.mode);
        const isCar = leg.mode === 'Car' || leg.mode === 'Rideshare';
        const isBike = leg.mode === 'Bike';
        if (isCar) {
          if (leg.parkingTime) push('Find parking', parseInt(leg.parkingTime)||0, '', '🅿️', 'parking');
          if (legMins) push(MODE_LABEL[leg.mode]||leg.mode, legMins, '', MODE_EMOJI[leg.mode]||'🚗', 'transit');
        } else if (isPublic) {
          if (legMins) push(leg._displayLabel||MODE_LABEL[leg.mode]||leg.mode, legMins, '', MODE_EMOJI[leg.mode]||'🚌', 'transit');
          if (leg.waitTime && !leg._anchorLinked) push(`Wait for ${leg.mode.toLowerCase()}`, parseInt(leg.waitTime)||0, '', '⏱', 'transit-wait');
        } else if (isBike) {
          if (leg.bikeLockTime) push('Lock bike', parseInt(leg.bikeLockTime)||0, '', '🔒', 'bike-lock');
          if (legMins) push(MODE_LABEL[leg.mode]||leg.mode, legMins, '', MODE_EMOJI[leg.mode]||'🚲', 'transit');
        } else {
          if (legMins) push(leg._displayLabel||MODE_LABEL[leg.mode]||leg.mode, legMins, '', MODE_EMOJI[leg.mode]||'🚗', 'transit');
        }
        // Weather buffer pushed AFTER the first chrono leg (last in reversed order)
        // so it gets an earlier startTime than all transit legs → appears first
        if (idx === rev.length - 1 && weatherAdd > 0) push('Weather buffer', weatherAdd, '', '🌧️', 'weather');
      });
    }

    // Morning prep (backward from departure time)
    if (doEat === 'yes') push('Eat breakfast', parseInt(eatTime)||0, '', '🥯', 'eat');
    if (doSlowMorning === 'yes') push('Extra morning time', parseInt(slowMorningMins)||0, '', '🥱', 'slow-morning');
    push('Get dressed', parseInt(getDressed)||0, 'Prep gear the night before!', '🎽', 'dressed');
    if (bathroomHome) push('Bathroom (at home)', parseInt(bathroomHome)||0, '', '🚽', 'bathroom-home');
    if (doesSnooze === 'yes' && snoozeCount > 0 && snoozeMinutes > 0) {
      const cnt = parseInt(snoozeCount)||1;
      for (let i = cnt; i >= 1; i--) push(cnt>1?`Snooze ${i}`:'Snooze', parseInt(snoozeMinutes)||0, '', '🥱', 'snooze');
    }
  }

  // ── PART 2: Post-anchor transit (forward from anchorTime) ─────
  let arrivalAtSite = anchorTime;
  {
    let cursor = anchorTime;
    postLegs.forEach(leg => {
      const legMins = (leg.hours||0)*60 + (leg.minutes||0);
      if (legMins <= 0) return;
      const stepStart = cursor;
      cursor = addMinutes(cursor, legMins);
      steps.push({
        label: leg._displayLabel || MODE_LABEL[leg.mode] || leg.mode,
        minutes: legMins,
        startTime: stepStart,
        endTime: cursor,
        emoji: MODE_EMOJI[leg.mode] || '🚌',
        type: 'transit',
        note: '',
        isLate: false,
      });
    });
    arrivalAtSite = cursor;
  }

  // ── Pre-race venue steps (backward from race start) ────────────
  {
    let cursor = startTime;
    const push = (label, minutes, note = '', emoji = '', type = '') => {
      if (!minutes || minutes <= 0) return;
      cursor = subtractMinutes(cursor, minutes);
      steps.push({ label, minutes, startTime: cursor, endTime: addMinutes(cursor, minutes), note, emoji, type });
    };
    push('Get in the corral', parseInt(coralTime)||0, 'Find your position', '🐰', 'corral');
    if (doWarmup === 'yes' && doBathroomPostWarmup === 'yes') {
      const w = parseInt(bathroomPostWarmup)||0, u = parseInt(bathroomPostWarmupUseTime)||0, c = parseInt(bathroomPostWarmupCount)||1;
      const tot = (w + u) * c;
      if (tot > 0) push('Bathroom (post warm up)', tot, '', '💩', 'bathroom-post-warmup');
    }
    if (doWarmup === 'yes' && warmupMins > 0) push('Warm up', warmupMins, '', '🏃', 'warmup');
    if (doBathroomPreRace === 'yes') {
      const w = parseInt(bathroomPreRace)||0, u = parseInt(bathroomUseTime)||0, c = parseInt(bathroomCount)||1;
      const tot = (w + u) * c;
      if (tot > 0) push('Bathroom (pre-race)', tot, '', '💩', 'bathroom-pre');
    }
    if (doBagCheck === 'yes' && bagCheck) push('Bag check', parseInt(bagCheck)||0, '', '🎒', 'bagcheck');
    if (doSecurity === 'yes' && security) push('Go through security', parseInt(security)||0, '', '🔒', 'security');
  }

  // ── Gap: arrival at site → buffer goal ─────────────────────────
  // Buffer goal = raceStartTime - bufferMins
  const bufferGoalMins = timeToMinutes(startTime) - bufferMins;
  const arrivalMins    = timeToMinutes(arrivalAtSite);
  lateArrival = arrivalMins > bufferGoalMins;

  const waitMins = Math.max(0, bufferGoalMins - arrivalMins);
  if (waitMins > 0) {
    steps.push({
      label: `Wait at start area`,
      minutes: waitMins,
      startTime: arrivalAtSite,
      endTime: minutesToTime(bufferGoalMins),
      emoji: '⏳',
      type: 'wait',
      note: '',
      isLate: false,
    });
  }

  // Split steps into three zones by time position, sort each zone independently,
  // then concatenate to preserve logical section boundaries.
  // This prevents morning-prep items from shuffling into transit positions due to
  // time arithmetic coincidences (e.g. overnight, long transit durations).
  const anchorMins    = timeToMinutes(anchorTime);
  const arrivalMins_  = timeToMinutes(arrivalAtSite);
  const stepsZoneA    = steps.filter(s => timeToMinutes(s.startTime) <  anchorMins);
  const stepsZoneB    = steps.filter(s => timeToMinutes(s.startTime) >= anchorMins && timeToMinutes(s.startTime) < arrivalMins_);
  const stepsZoneC    = steps.filter(s => timeToMinutes(s.startTime) >= arrivalMins_);
  const sortAsc = arr => arr.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  const sorted = [...sortAsc(stepsZoneA), ...sortAsc(stepsZoneB), ...sortAsc(stepsZoneC)];

  // Wake-up = 5 min before first step
  const firstStep = sorted[0];
  const wakeUpTime = firstStep ? subtractMinutes(firstStep.startTime, 0) : subtractMinutes(anchorTime, 120);

  return {
    steps: sorted,
    wakeUpTime,
    fuelTime,
    raceStartTime: startTime,
    deadlineTime: anchorTime,
    deadlineLabel: anchorLabel,
    arrivalAtSite,
    isLate: lateArrival,
    doesSnooze,
    snoozeCount: parseInt(snoozeCount)||1,
    snoozeMinutes: parseInt(snoozeMinutes)||0,
  };
};
