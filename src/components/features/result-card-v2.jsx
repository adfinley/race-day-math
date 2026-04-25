import { formatTime12h, formatPeriod, formatMins } from '../../lib/time-utils';

const ShareIcon = () => (
  <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
    <path d="M21 12.054l-10.919 10.919a.75.75 0 0 1-1.061-1.06L19.949 11H13.753a.75.75 0 0 1 0-1.5h7.846c.513 0 .903.39.903.903V18.25a.75.75 0 0 1-1.5 0v-6.196z" fill="white"/>
  </svg>
);

const ExportIcon = () => (
  <svg width="20" height="20" viewBox="0 -960 960 960" fill="white">
    <path d="M761.92-254.69V-185q0 7.08 5.23 12.38 5.23 5.31 12.47 5.31 7.23 0 12.46-5.31 5.23-5.3 5.23-12.38v-111.92q0-7.23-5.43-12.66-5.42-5.42-12.65-5.42H667.31q-7.08 0-12.39 5.31-5.3 5.31-5.3 12.38 0 7.08 5.3 12.39 5.31 5.3 12.39 5.3H737l-94.15 94.16q-5.23 5.23-5.43 12.27-.19 7.04 5.43 12.65 5.37 5.23 12.53 5.23 7.16 0 12.39-5.23l94.15-94.15ZM212.31-140q-29.83 0-51.07-21.24Q140-182.48 140-212.31v-535.38q0-29.83 21.24-51.07Q182.48-820 212.31-820h535.38q29.83 0 51.07 21.24Q820-777.52 820-747.69v202.31q0 12.75-8.63 21.37-8.63 8.63-21.38 8.63-12.76 0-21.37-8.63-8.62-8.62-8.62-21.37v-202.31q0-4.62-3.85-8.46-3.84-3.85-8.46-3.85H212.31q-4.62 0-8.46 3.85-3.85 3.84-3.85 8.46v535.38q0 4.62 3.85 8.46 3.84 3.85 8.46 3.85h202.31q12.75 0 21.37 8.63 8.63 8.63 8.63 21.38 0 12.76-8.63 21.37-8.62 8.62-21.37 8.62H212.31ZM200-239.87V-200v-560 247.62-3 275.51Zm98.63-63.36q8.62 8.61 21.37 8.61h100.69q12.75 0 21.38-8.63 8.62-8.62 8.62-21.38 0-12.75-8.62-21.37-8.63-8.61-21.38-8.61H320q-12.75 0-21.37 8.62-8.63 8.63-8.63 21.39 0 12.75 8.63 21.37Zm0-155.39Q307.25-450 320-450h229.62q12.75 0 21.37-8.63 8.63-8.63 8.63-21.38 0-12.76-8.63-21.37-8.62-8.62-21.37-8.62H320q-12.75 0-21.37 8.63-8.63 8.63-8.63 21.38 0 12.76 8.63 21.37Zm0-155.38q8.62 8.61 21.37 8.61h320q12.75 0 21.37-8.62 8.63-8.63 8.63-21.39 0-12.75-8.63-21.37-8.62-8.61-21.37-8.61H320q-12.75 0-21.37 8.63-8.63 8.62-8.63 21.38 0 12.75 8.63 21.37ZM720-57.69q-74.92 0-127.46-52.54Q540-162.77 540-237.69q0-74.92 52.54-127.46 52.54-52.54 127.46-52.54 74.92 0 127.46 52.54Q900-312.61 900-237.69q0 74.92-52.54 127.46Q794.92-57.69 720-57.69Z"/>
  </svg>
);

export default function ResultCardV2({ timeline }) {
  const { steps, wakeUpTime, raceStartTime } = timeline;

  // Fuel up is inserted between bathroom-post-warmup and corral.
  // Find the corral step index and insert fuel just before it.
  // This preserves the section order built by buildTimeline rather than re-sorting.
  const displayRows = steps || [];

  const handleShare = async () => {
    const formatLine = (time, label, duration = '') => {
      const paddedTime = `${formatTime12h(time)} ${formatPeriod(time)}`.padEnd(8, ' ');
      return `${paddedTime}  ${label}${duration ? ` - ${duration}` : ''}`;
    };
    const lines = [formatLine(wakeUpTime, 'Wake up')];
    displayRows.forEach(r => lines.push(formatLine(r.startTime, r.label, r.minutes ? formatMins(r.minutes) : '')));
    lines.push(formatLine(raceStartTime, 'Race Start'));
    const text = `Race Day Schedule\n\n${lines.join('\n')}`;
    if (navigator.share) { try { await navigator.share({ title: 'Race Day Schedule', text }); return; } catch (err) {} }
    navigator.clipboard?.writeText(text).then(() => alert('Schedule copied!'));
  };

  const handleExport = () => {
    const tableHeader = ['| Time | Activity | Duration |', '| :--- | :------- | :------- |'];
    const fmtRow = (time, label = '', duration = '') => {
      const ts = `${formatTime12h(time)} ${formatPeriod(time)}`;
      return `| ${ts} | ${label} | ${duration} |`;
    };
    const tableLines = [fmtRow(wakeUpTime, 'Wake up', '')];
    displayRows.forEach(r => tableLines.push(fmtRow(r.startTime, r.label, r.minutes ? formatMins(r.minutes) : '')));
    tableLines.push(fmtRow(raceStartTime, 'Race Start', ''));
    const text = `### Race Day Schedule\n\n${tableHeader.join('\n')}\n${tableLines.join('\n')}`;
    navigator.clipboard?.writeText(text).then(() => alert('Markdown table copied!'));
  };

  return (
    <div className="rdm-results-outer">
      <div className="rdm-results-inner">

        <div className="rdm-results-header">
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 20, fontWeight: 800, color: 'var(--white)' }}>
            Schedule
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="rdm-share-btn" onClick={handleShare}><ShareIcon /> Share</button>
            <button className="rdm-export-btn" onClick={handleExport}><ExportIcon /> Export</button>
          </div>
        </div>

        {/* Wake-up row */}
        <ResultRow startTime={wakeUpTime} label="Wake up" isFirst />

        {/* All schedule rows — order is authoritative from buildTimeline */}
        {displayRows.map((s, i) => (
          <ResultRow key={i} startTime={s.startTime} label={s.label} minutes={s.minutes} />
        ))}

        {/* Race start — always final */}
        <div className="rdm-result-row">
          <div className="rdm-result-time">
            {formatTime12h(raceStartTime)}
            <span style={{ fontSize: 14, letterSpacing: 0 }}> {formatPeriod(raceStartTime)}</span>
          </div>
          <div className="rdm-result-label rdm-result-label--final">Race Start</div>
        </div>

      </div>
    </div>
  );
}

function ResultRow({ startTime, label, minutes, isFirst }) {
  return (
    <div className={`rdm-result-row${isFirst ? ' rdm-result-row--first' : ''}`}>
      <div className="rdm-result-time">
        {formatTime12h(startTime)}
        <span style={{ fontSize: 14, letterSpacing: 0 }}> {formatPeriod(startTime)}</span>
      </div>
      <div className="rdm-result-label" style={{ ...(isFirst ? { fontWeight: 600, letterSpacing: '-0.03em' } : {}) }}>
        {label}
        {minutes > 0 && (
          <span style={{ color: 'var(--grey-2)', fontWeight: 300, marginLeft: 8 }}>— {formatMins(minutes)}</span>
        )}
      </div>
    </div>
  );
}
