import { useState, useEffect, useRef, useCallback } from 'react';
import { buildTimeline, formatTime12h, formatPeriod, formatMins } from '../../lib/time-utils';
import { C, SEC, TER } from '../../lib/colours';
import ResultCardV2 from './result-card-v2';
import AlarmWidget from './alarm-widget';


const MODE_OPTIONS = [
  { key:'Bike',      label:'Bike'      },
  { key:'Bus',       label:'Bus'       },
  { key:'Car',       label:'Drive'     },
  { key:'Ferry',     label:'Ferry'     },
  { key:'Rideshare', label:'Rideshare' },
  { key:'Run',       label:'Run'       },
  { key:'Streetcar', label:'Streetcar' },
  { key:'Subway',    label:'Subway'    },
  { key:'Train',     label:'Train'     },
  { key:'Walk',      label:'Walk'      },
];
const PUBLIC = ['Bus','Train','Subway','Streetcar'];

//  Icons 
const ChevronDown = ({ color = C.black, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M10 15L16 21L22 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ModeIcon = ({ mode, color = C.black, size = 32 }) => {
  const p = { fill: color };
  const icons = {
    Car:      <svg width={size} height={size} viewBox="0 0 32 32" fill="none"><path d="M7.484 24.667v1.256c0 .392-.137.725-.411 1a1.362 1.362 0 0 1-1 .41c-.392 0-.725-.137-.999-.41a1.362 1.362 0 0 1-.41-1v-9.405c0-.138.01-.277.027-.415a2.11 2.11 0 0 1 .09-.398l2.388-6.75a2.3 2.3 0 0 1 .87-1.171c.418-.3.888-.45 1.407-.45H22.55c.52 0 .988.15 1.408.45.42.3.709.69.868 1.17l2.388 6.75c.043.128.073.26.09.399.019.138.028.277.028.415v9.405c0 .392-.137.725-.412 1a1.363 1.363 0 0 1-1 .41c-.392 0-.725-.137-.999-.41a1.363 1.363 0 0 1-.41-1v-1.256H7.484Zm-.01-10.564H24.52l-1.579-4.5a.425.425 0 0 0-.154-.199.42.42 0 0 0-.244-.07H9.451a.42.42 0 0 0-.243.07.424.424 0 0 0-.154.199l-1.58 4.5Zm2.475 7.025c.485 0 .897-.17 1.234-.51.338-.339.507-.751.507-1.236s-.17-.897-.51-1.235a1.69 1.69 0 0 0-1.237-.506c-.485 0-.896.17-1.234.51a1.69 1.69 0 0 0-.507 1.237c0 .485.17.896.51 1.234.34.338.752.506 1.237.506Zm12.103 0c.485 0 .896-.17 1.234-.51.337-.339.506-.751.506-1.236s-.17-.897-.51-1.235a1.689 1.689 0 0 0-1.236-.506c-.485 0-.897.17-1.235.51a1.69 1.69 0 0 0-.506 1.237c0 .485.17.896.51 1.234.34.338.752.506 1.237.506Zm-15.388 1.54h18.667v-6.564H6.664v6.564Z" {...p}/></svg>,
    Bus:      <svg width={size} height={size} viewBox="0 0 32 32" fill="none"><path d="M10.513 24.667v1.256c0 .392-.138.725-.412.999a1.362 1.362 0 0 1-1 .411c-.392 0-.725-.137-.998-.411a1.362 1.362 0 0 1-.41-1v-2.22c-.418-.316-.804-.763-1.16-1.342A3.65 3.65 0 0 1 6 20.41V8c0-1.614.802-2.795 2.406-3.544C10.01 3.708 12.541 3.333 16 3.333c3.583 0 6.145.36 7.687 1.08C25.229 5.132 26 6.328 26 8v12.41a3.65 3.65 0 0 1-.533 1.95c-.356.579-.742 1.026-1.16 1.343v2.22c0 .392-.137.725-.411.999a1.363 1.363 0 0 1-1 .411 1.36 1.36 0 0 1-.999-.411 1.362 1.362 0 0 1-.41-1v-1.255H10.513ZM8 14h16V9.026H8V14Zm4.57 6.567c.338-.34.507-.752.507-1.237 0-.485-.17-.896-.51-1.234a1.688 1.688 0 0 0-1.237-.506c-.485 0-.896.17-1.234.51-.337.339-.506.751-.506 1.236s.17.897.51 1.234c.339.338.751.507 1.236.507s.897-.17 1.234-.51Zm9.334 0c.337-.34.506-.752.506-1.237 0-.485-.17-.896-.51-1.234a1.689 1.689 0 0 0-1.236-.506c-.485 0-.897.17-1.234.51-.338.339-.507.751-.507 1.236s.17.897.51 1.234c.34.338.752.507 1.237.507.485 0 .896-.17 1.234-.51ZM8.369 7.026h15.344c-.282-.532-.997-.947-2.144-1.245-1.147-.299-2.99-.448-5.528-.448-2.497 0-4.32.156-5.467.468-1.147.312-1.882.72-2.205 1.225Zm2.298 15.64h10.666c.734 0 1.361-.26 1.884-.783.522-.522.783-1.15.783-1.883v-4H8v4c0 .733.261 1.361.783 1.883.523.523 1.15.784 1.884.784Z" {...p}/></svg>,
    Train:    <svg width={size} height={size} viewBox="0 0 32 32" fill="none"><path d="M6 20.41V8c0-1.024.278-1.843.833-2.458.556-.614 1.297-1.083 2.225-1.407.927-.324 1.993-.539 3.198-.644A43.096 43.096 0 0 1 16 3.333c1.381 0 2.679.053 3.894.158 1.214.105 2.275.32 3.182.644s1.62.793 2.142 1.407C25.739 6.157 26 6.976 26 8v12.41c0 1.192-.412 2.199-1.235 3.022-.823.823-1.83 1.235-3.021 1.235l1.128 1.128c.292.292.362.622.209.988-.153.367-.437.55-.85.55a.956.956 0 0 1-.348-.064.846.846 0 0 1-.293-.192l-2.41-2.41h-6.36l-2.41 2.41a.846.846 0 0 1-.293.192.956.956 0 0 1-.348.064c-.4 0-.68-.183-.84-.55-.16-.366-.093-.696.2-.988l1.127-1.128c-1.191 0-2.198-.412-3.021-1.235C6.412 22.609 6 21.602 6 20.41ZM8 14h7V9.026H8V14Zm9 0h7V9.026h-7V14Zm-4.42 6.58c.332-.33.497-.746.497-1.247 0-.5-.165-.916-.496-1.247-.331-.331-.747-.496-1.248-.496-.5 0-.916.165-1.247.496-.33.33-.496.746-.496 1.247 0 .501.165.917.496 1.248.33.33.746.496 1.247.496.501 0 .917-.166 1.248-.496Zm9.334 0c.33-.33.496-.746.496-1.247 0-.5-.165-.916-.496-1.247-.33-.331-.746-.496-1.247-.496-.501 0-.917.165-1.248.496-.33.33-.496.746-.496 1.247 0 .501.165.917.496 1.248.331.33.747.496 1.248.496.5 0 .916-.166 1.247-.496Zm-11.658 2.087h11.488c.637 0 1.173-.217 1.606-.65.433-.434.65-.97.65-1.607V16H8v4.41c0 .638.217 1.173.65 1.607.433.433.969.65 1.606.65Z" {...p}/></svg>,
    Subway:   <svg width={size} height={size} viewBox="0 0 32 32" fill="none"><path d="M3.336 26.256V11.8c0-1.726.457-3.235 1.37-4.526.914-1.29 2.187-2.265 3.82-2.925 1.14-.441 2.37-.72 3.692-.839a42.611 42.611 0 0 1 3.785-.176c1.201 0 2.463.058 3.784.176 1.322.119 2.552.398 3.693.839 1.632.66 2.905 1.635 3.819 2.925.913 1.291 1.37 2.8 1.37 4.526v14.456c0 .665-.235 1.233-.706 1.704a2.324 2.324 0 0 1-1.704.707H5.746a2.323 2.323 0 0 1-1.704-.707 2.323 2.323 0 0 1-.706-1.704Zm6.667-8.768V12h12v5.488h-12Zm9.524 4.065a1.167 1.167 0 0 1-.345-.86c0-.344.115-.63.345-.86.23-.23.517-.345.86-.345.344 0 .63.114.86.344.23.23.345.517.345.86 0 .344-.115.63-.344.86-.23.23-.517.346-.86.346-.344 0-.631-.115-.861-.345Zm-8.77 0a1.168 1.168 0 0 1-.344-.86c0-.344.115-.63.345-.86.23-.23.516-.345.86-.345.343 0 .63.114.86.344.23.23.345.517.345.86 0 .344-.115.63-.345.86-.23.23-.517.346-.86.346-.344 0-.63-.115-.86-.345Zm-5.01 5.114h20.512a.4.4 0 0 0 .295-.116.4.4 0 0 0 .115-.294V11.8c0-1.333-.328-2.472-.983-3.417-.656-.944-1.639-1.672-2.95-2.183-.978-.378-2.061-.617-3.25-.716-1.189-.1-2.35-.15-3.483-.15-1.134 0-2.295.05-3.484.15-1.189.1-2.272.338-3.25.716-1.31.511-2.294 1.239-2.95 2.183-.655.945-.983 2.084-.983 3.417v14.456a.4.4 0 0 0 .115.296.4.4 0 0 0 .295.115Zm8.158-2.103h4.154l1.751 1.841a.76.76 0 0 0 .606.262c.367 0 .621-.17.762-.512.141-.34.086-.641-.165-.9l-.692-.758c.986-.133 1.778-.555 2.375-1.265.598-.71.896-1.565.896-2.565V12c0-1.502-.71-2.48-2.128-2.934-1.419-.454-3.24-.681-5.461-.681-2.023 0-3.793.227-5.312.68C9.172 9.52 8.413 10.498 8.413 12v8.667c0 1 .299 1.857.896 2.571.597.715 1.39 1.135 2.376 1.26l-.713.776c-.251.26-.306.557-.165.892.14.334.395.5.762.5a.73.73 0 0 0 .316-.066.97.97 0 0 0 .269-.195l1.751-1.84Zm-8.159 2.103a.4.4 0 0 1-.295-.116.4.4 0 0 1-.115-.294V11.8c0-1.333.328-2.472.983-3.417.656-.944 1.64-1.672 2.95-2.183.978-.378 2.061-.617 3.25-.716 1.19-.1 2.35-.15 3.484-.15 1.133 0 2.294.05 3.483.15 1.189.1 2.272.338 3.25.716 1.311.511 2.294 1.239 2.95 2.183.655.945.983 2.084.983 3.417v14.456a.4.4 0 0 1-.115.296.4.4 0 0 1-.295.115H5.746Z" {...p}/></svg>,
    Walk:     <svg width={size} height={size} viewBox="0 0 32 32" fill="none"><path d="m14.42 19.303-2.372 10.246a.93.93 0 0 1-.362.568 1.064 1.064 0 0 1-.659.216.994.994 0 0 1-.803-.365.934.934 0 0 1-.197-.845l3.58-17.82-3.17 1.266v3.418a.969.969 0 0 1-.287.713.969.969 0 0 1-.713.287.968.968 0 0 1-.712-.287.968.968 0 0 1-.287-.713V12.05c0-.241.065-.459.197-.653s.307-.342.526-.445l5.6-2.38c.31-.133.621-.212.932-.239.31-.026.608.003.893.089.286.085.55.217.794.396.243.178.45.41.62.696l1.127 1.8a9.589 9.589 0 0 0 1.126 1.446c.419.443.877.826 1.374 1.149.363.237.754.44 1.175.605.42.166.85.29 1.287.374.27.05.492.172.665.368.174.196.26.436.26.72a.889.889 0 0 1-.303.695.88.88 0 0 1-.73.217c-1.279-.203-2.43-.641-3.453-1.314a10.296 10.296 0 0 1-2.66-2.545l-1.025 5.1 2.49 2.485c.116.125.203.26.26.405.06.145.088.298.088.46v7.855a.967.967 0 0 1-.287.713.967.967 0 0 1-.713.287.967.967 0 0 1-.713-.287.967.967 0 0 1-.287-.713V22.09l-3.262-2.787Zm1.852-12.894c-.48-.48-.72-1.06-.72-1.742 0-.682.24-1.263.72-1.743.48-.48 1.06-.719 1.743-.719.681 0 1.262.24 1.742.72.48.479.72 1.06.72 1.742a2.37 2.37 0 0 1-.72 1.742c-.48.48-1.06.72-1.742.72-.683 0-1.263-.24-1.743-.72Z" {...p}/></svg>,
    Bike:     <svg width={size} height={size} viewBox="0 0 32 32" fill="none"><path d="M6.918 28.923c-1.732 0-3.207-.61-4.426-1.83-1.218-1.22-1.828-2.697-1.828-4.429 0-1.731.61-3.207 1.83-4.426 1.221-1.218 2.698-1.828 4.43-1.828 1.73 0 3.206.61 4.425 1.831 1.218 1.22 1.828 2.697 1.828 4.428 0 1.732-.61 3.207-1.83 4.426-1.221 1.219-2.697 1.828-4.429 1.828Zm3.015-3.24c.83-.827 1.244-1.832 1.244-3.013 0-1.182-.413-2.187-1.24-3.016-.828-.829-1.832-1.244-3.014-1.244-1.18 0-2.186.414-3.015 1.24-.83.828-1.244 1.832-1.244 3.014 0 1.181.414 2.187 1.24 3.016.828.829 1.832 1.243 3.013 1.243 1.182 0 2.187-.413 3.016-1.24Zm7.664-15.345-3.584 3.585 2.315 2.429c.219.218.385.47.499.756.113.285.17.584.17.897V24a.967.967 0 0 1-.287.712.968.968 0 0 1-.713.288.966.966 0 0 1-.712-.288.967.967 0 0 1-.288-.712v-5.628l-4.446-3.618a2.096 2.096 0 0 1-.53-.738 2.236 2.236 0 0 1-.18-.888c0-.31.064-.604.191-.88.127-.274.3-.521.52-.74l3.81-3.81a2.35 2.35 0 0 1 .807-.53 2.6 2.6 0 0 1 .961-.18c.336 0 .656.06.962.18.306.12.575.297.808.53l2.533 2.533a7.329 7.329 0 0 0 1.773 1.309 6.663 6.663 0 0 0 2.053.68c.284.05.508.185.672.406a.94.94 0 0 1 .171.756c-.05.284-.184.508-.405.672a.942.942 0 0 1-.756.172 9.181 9.181 0 0 1-5.046-2.59l-1.298-1.297Zm1.158-3.762a2.25 2.25 0 0 1-.68-1.653c0-.648.226-1.198.68-1.652a2.25 2.25 0 0 1 1.653-.681 2.25 2.25 0 0 1 1.652.68 2.25 2.25 0 0 1 .681 1.653 2.25 2.25 0 0 1-.68 1.653 2.25 2.25 0 0 1-1.653.68 2.25 2.25 0 0 1-1.653-.68Zm6.317 22.347c-1.732 0-3.207-.61-4.426-1.83-1.219-1.22-1.828-2.697-1.828-4.429 0-1.731.61-3.207 1.83-4.426 1.221-1.218 2.697-1.828 4.429-1.828 1.731 0 3.207.61 4.425 1.831 1.22 1.22 1.829 2.697 1.829 4.428 0 1.732-.61 3.207-1.83 4.426-1.222 1.219-2.698 1.828-4.43 1.828Zm3.015-3.24c.83-.827 1.244-1.832 1.244-3.013 0-1.182-.414-2.187-1.24-3.016-.828-.829-1.832-1.244-3.014-1.244-1.181 0-2.187.414-3.016 1.24-.829.828-1.243 1.832-1.243 3.014 0 1.181.413 2.187 1.24 3.016.828.829 1.832 1.243 3.013 1.243 1.182 0 2.187-.413 3.016-1.24Z" {...p}/></svg>,
    Rideshare:<svg width={size} height={size} viewBox="0 0 32 32" fill="none"><path d="M7.484 24.667v1.256c0 .392-.137.725-.411 1a1.362 1.362 0 0 1-1 .41c-.392 0-.725-.136-.999-.41a1.362 1.362 0 0 1-.41-1v-9.405c0-.138.01-.277.027-.415a2.11 2.11 0 0 1 .09-.398l2.388-6.75a2.3 2.3 0 0 1 .87-1.171c.418-.3.888-.45 1.407-.45h3.167V6.18c0-.342.115-.628.346-.859.231-.23.518-.346.86-.346h4.41c.34 0 .627.115.858.346.23.231.346.517.346.859v1.154h3.116c.52 0 .988.15 1.408.45.42.3.709.69.868 1.17l2.388 6.75c.043.128.073.26.09.399.019.138.028.277.028.415v9.405c0 .392-.137.725-.412 1a1.363 1.363 0 0 1-1 .41c-.392 0-.725-.136-.999-.41a1.362 1.362 0 0 1-.41-1v-1.256H7.484Zm-.01-10.564H24.52l-1.579-4.5a.425.425 0 0 0-.154-.199.42.42 0 0 0-.244-.07H9.451a.42.42 0 0 0-.243.07.424.424 0 0 0-.154.199l-1.58 4.5Zm2.475 7.026c.485 0 .897-.17 1.234-.51.338-.34.507-.752.507-1.237 0-.485-.17-.897-.51-1.234a1.69 1.69 0 0 0-1.237-.507c-.485 0-.896.17-1.234.51a1.69 1.69 0 0 0-.507 1.237c0 .485.17.896.51 1.234.34.338.752.507 1.237.507Zm12.103 0c.485 0 .896-.17 1.234-.51.337-.34.506-.752.506-1.237 0-.485-.17-.897-.51-1.234a1.69 1.69 0 0 0-1.236-.507c-.485 0-.897.17-1.235.51a1.69 1.69 0 0 0-.506 1.237c0 .485.17.896.51 1.234.34.338.752.507 1.237.507ZM6.664 22.667h18.667v-6.564H6.664v6.564Z" {...p}/></svg>,
    Run:      <svg width={size} height={size} viewBox="0 0 32 32" fill="none"><path d="M17.666 29.333v-6.782l-3.338-3.192-1.124 4.972c-.08.321-.255.568-.525.74-.27.171-.566.228-.887.17l-6.408-1.295a.992.992 0 0 1-.655-.432.98.98 0 0 1-.142-.77c.058-.276.202-.493.432-.653a.88.88 0 0 1 .757-.132l5.413 1.118 2.313-11.774-3.17 1.28V16a.967.967 0 0 1-.287.713.967.967 0 0 1-.712.287.967.967 0 0 1-.713-.287.967.967 0 0 1-.287-.713v-3.938c0-.241.068-.459.204-.653a1.32 1.32 0 0 1 .532-.445l4.556-1.933c.675-.282 1.172-.469 1.492-.56.32-.092.614-.138.882-.138.407 0 .785.108 1.134.322.348.215.632.5.85.858l1.334 2.133a7.38 7.38 0 0 0 1.926 2.057c.8.59 1.715.978 2.744 1.164.283.058.523.186.719.384a.99.99 0 0 1 .293.723.903.903 0 0 1-.293.696.823.823 0 0 1-.7.217 9.58 9.58 0 0 1-3.372-1.206c-1.083-.627-2.017-1.49-2.801-2.591l-.993 5.013 2.464 2.356c.125.125.217.262.275.412.058.15.087.304.087.465v7.997a.967.967 0 0 1-.287.713.967.967 0 0 1-.713.287.967.967 0 0 1-.713-.287.967.967 0 0 1-.287-.713ZM16.256 6.41a2.374 2.374 0 0 1-.718-1.742c0-.682.24-1.263.719-1.743a2.37 2.37 0 0 1 1.742-.719c.682 0 1.263.24 1.743.72.48.479.719 1.06.719 1.742a2.37 2.37 0 0 1-.72 1.742 2.37 2.37 0 0 1-1.742.72c-.682 0-1.262-.24-1.742-.72Z" {...p}/></svg>,
    Streetcar:<svg width={size} height={size} viewBox="0 0 32 32" fill="none"><path d="M5.664 26a.967.967 0 0 1-.712-.288.968.968 0 0 1-.288-.712c0-.284.096-.521.288-.713A.968.968 0 0 1 5.664 24h.333V8h-.333a.967.967 0 0 1-.712-.288A.968.968 0 0 1 4.664 7c0-.284.096-.521.288-.713A.967.967 0 0 1 5.664 6H8.88l.562-1.408c.089-.224.234-.404.436-.54a1.18 1.18 0 0 1 .677-.206h10.874c.25 0 .476.067.677.2.202.132.347.31.436.534L23.115 6h3.216c.283 0 .52.096.712.288.192.192.288.43.288.712a.966.966 0 0 1-.288.713.967.967 0 0 1-.712.287h-.334v16h.334c.283 0 .52.096.712.288.192.192.288.43.288.712a.966.966 0 0 1-.288.713.968.968 0 0 1-.712.287h-4.167c0 .326-.115.605-.345.835-.23.23-.508.344-.835.344H11.01c-.326 0-.604-.114-.834-.344A1.137 1.137 0 0 1 9.83 26H5.664Zm2.333-11.026h4.27v-4.846c0-.59-.207-1.093-.62-1.507A2.05 2.05 0 0 0 10.14 8c-.59 0-1.096.206-1.514.62a2.04 2.04 0 0 0-.629 1.507v4.846Zm5.86 0h4.269v-4.846c0-.59-.207-1.093-.62-1.507A2.05 2.05 0 0 0 15.998 8c-.59 0-1.096.206-1.514.62a2.04 2.04 0 0 0-.629 1.507v4.846Zm5.871 0h4.27v-4.846a2.04 2.04 0 0 0-.629-1.507A2.076 2.076 0 0 0 21.855 8a2.05 2.05 0 0 0-1.507.62c-.413.414-.62.916-.62 1.507v4.846ZM7.998 24h16v-7.026h-16V24Zm9.236-2.256c.338-.334.507-.743.507-1.228s-.17-.898-.51-1.237c-.34-.34-.752-.51-1.237-.51-.485 0-.896.17-1.234.51-.337.34-.506.752-.506 1.237 0 .485.17.894.51 1.228.339.333.751.5 1.236.5a1.69 1.69 0 0 0 1.234-.5Z" {...p}/></svg>,
    Ferry:    <svg width={24} height={24} viewBox="0 0 32 32" fill="none"><path d="M11.0332 25.0973C11.4794 25.3778 11.935 25.6257 12.3999 25.841C12.8647 26.0563 13.3467 26.2221 13.8459 26.3383V27.7793C13.3639 27.6682 12.8879 27.5302 12.4179 27.3653C11.9476 27.2004 11.481 27.0034 11.0179 26.7743C10.1545 27.1914 9.27885 27.5 8.39085 27.7C7.50285 27.9 6.59985 28 5.68185 28H5.33318V26.6667H5.68185C6.61185 26.6667 7.51741 26.5329 8.39852 26.2653C9.27985 25.9978 10.1581 25.6084 11.0332 25.0973ZM13.5125 4H18.3845V6.66667H22.4358C23.0323 6.66667 23.5404 6.87644 23.9602 7.296C24.3797 7.71578 24.5895 8.224 24.5895 8.82067V11.877C24.3775 11.8497 24.166 11.8291 23.9548 11.8153C23.7437 11.8018 23.5108 11.795 23.2562 11.795V8.718C23.2562 8.51289 23.1835 8.34189 23.0382 8.205C22.8931 8.06833 22.7178 8 22.5125 8H9.38452C9.17941 8 9.00418 8.06833 8.85885 8.205C8.71352 8.34189 8.64085 8.51289 8.64085 8.718V14.023L15.9485 11.795L17.8025 12.336C17.4759 12.4009 17.1553 12.5004 16.8409 12.6347C16.5264 12.7689 16.2324 12.9522 15.9588 13.1847L6.42552 16.123L7.83052 21.423C8.28007 21.1666 8.67963 20.8559 9.02918 20.491C9.37896 20.1261 9.72729 19.7444 10.0742 19.346L10.9792 18.3307C11.4083 18.8213 11.8605 19.315 12.3358 19.8117C12.811 20.3081 13.3143 20.7734 13.8459 21.2077V22.8923C13.3281 22.6119 12.8311 22.2563 12.3548 21.8257C11.8788 21.3948 11.4101 20.9059 10.9485 20.359C10.2238 21.147 9.56318 21.7692 8.96652 22.2257C8.36985 22.6821 7.70063 23.0504 6.95885 23.3307L4.97152 16.2563C4.89463 15.9812 4.92374 15.718 5.05885 15.4667C5.19396 15.2153 5.39907 15.0427 5.67418 14.9487L7.30752 14.4153V8.82067C7.30752 8.224 7.51741 7.71578 7.93718 7.296C8.35674 6.87644 8.86485 6.66667 9.46152 6.66667H13.5125V4ZM18.7178 28C18.5572 28 18.423 27.9461 18.3152 27.8383C18.2076 27.7308 18.1538 27.5967 18.1538 27.436V26.095C17.7998 25.9017 17.5233 25.6307 17.3242 25.282C17.1251 24.9333 17.0255 24.5573 17.0255 24.154V17.795C17.0255 16.8103 17.4648 16.094 18.3435 15.646C19.2222 15.1982 20.6034 14.9743 22.4872 14.9743C24.4427 14.9743 25.8504 15.1914 26.7102 15.6257C27.57 16.0599 27.9998 16.783 27.9998 17.795V24.154C27.9998 24.5522 27.9003 24.9227 27.7012 25.2653C27.5021 25.608 27.2255 25.8846 26.8715 26.095V27.436C26.8715 27.5967 26.8177 27.7308 26.7102 27.8383C26.6024 27.9461 26.4682 28 26.3075 28H25.4872C25.3263 28 25.1921 27.9461 25.0845 27.8383C24.9767 27.7308 24.9228 27.5967 24.9228 27.436V26.4103H20.1025V27.436C20.1025 27.5967 20.0486 27.7308 19.9408 27.8383C19.8331 27.9461 19.6989 28 19.5382 28H18.7178ZM20.0125 24.3847C20.2776 24.3847 20.4998 24.2949 20.6792 24.1153C20.8587 23.9358 20.9485 23.7136 20.9485 23.4487C20.9485 23.1838 20.8587 22.9616 20.6792 22.782C20.4998 22.6024 20.2776 22.5127 20.0125 22.5127C19.7476 22.5127 19.5254 22.6024 19.3458 22.782C19.1665 22.9616 19.0768 23.1838 19.0768 23.4487C19.0768 23.7084 19.1678 23.9294 19.3498 24.1117C19.5318 24.2937 19.7527 24.3847 20.0125 24.3847ZM25.0125 24.3847C25.2776 24.3847 25.4998 24.2949 25.6792 24.1153C25.8587 23.9358 25.9485 23.7136 25.9485 23.4487C25.9485 23.1838 25.8587 22.9616 25.6792 22.782C25.4998 22.6024 25.2776 22.5127 25.0125 22.5127C24.7476 22.5127 24.5254 22.6024 24.3458 22.782C24.1665 22.9616 24.0768 23.1838 24.0768 23.4487C24.0768 23.7084 24.1678 23.9294 24.3498 24.1117C24.5318 24.2937 24.7527 24.3847 25.0125 24.3847ZM18.2049 20.1027H26.8205V17.9487H18.2049V20.1027Z" fill={color}/></svg>,
  };
  return icons[mode] || icons['Car'];
};

const TIME_OPTIONS = (() => {
  const o = [];
  for (let h = 0; h < 24; h++) for (let m = 0; m < 60; m += 30) {
    const p = h < 12 ? 'AM' : 'PM', h12 = h % 12 === 0 ? 12 : h % 12;
    o.push({ value: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`, label: `${h12}:${String(m).padStart(2, '0')} ${p}` });
  }
  return o;
})();

//  Primitives 
const Sel = ({ value, onChange, options, width = 160 }) => (
  <div style={{ position: 'relative', display: 'inline-block', width }}>
    <select value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', height: 44, padding: '0 32px 0 16px', fontFamily: SEC, fontSize: 14, fontWeight: 500, color: C.black, background: 'transparent', border: `1px solid ${C.grey}`, borderRadius: 9, outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}>
      {options.map(o => <option key={o.value ?? o} value={o.value ?? o} style={{ color: C.black, background: C.white }}>{o.label ?? o}</option>)}
    </select>
    <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}>
      <ChevronDown color={C.black} size={32} />
    </span>
  </div>
);

const PrimaryLabel = ({ children }) => <div className="rdm-primary-label">{children}</div>;
const SecLabel     = ({ children }) => <div className="rdm-sec-label">{children}</div>;
const HelperText   = ({ children }) => <p className="rdm-helper">{children}</p>;
const RowDivider   = () => <hr className="row-divider" />;
const Sub          = ({ children }) => <div className="rdm-sub">{children}</div>;
const CalcRow      = ({ text }) => <div className="rdm-calc-row"><span>{text}</span></div>;

// Section header: label + optional mins
const SectionHeader = ({ label, totalMins }) => (
  <div className="rdm-section-header">
    {label}{totalMins != null && totalMins > 0 ? `: ${formatMins(totalMins)}` : ''}
  </div>
);

//  Toggle reveal hook 
const useToggleReveal = (open) => {
  const ref = useRef(null);
  const prevOpen = useRef(open);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open === prevOpen.current) return;
    prevOpen.current = open;
    const inner = el.querySelector('.rdm-reveal-inner');
    if (open) {
      el.style.overflow = 'hidden';
      el.style.pointerEvents = '';
      if (inner) { inner.style.transition = 'none'; inner.style.opacity = '0'; inner.style.transform = 'translateY(-8px)'; }
      el.style.height = 'auto';
      const h = el.scrollHeight;
      el.style.height = '0px';
      el.style.opacity = '0';
      requestAnimationFrame(() => {
        el.style.transition = 'height 310ms ease-out, opacity 310ms ease-out';
        el.style.height = h + 'px';
        el.style.opacity = '1';
        setTimeout(() => {
          if (inner) { inner.style.transition = 'opacity 310ms ease-out, transform 310ms ease-out'; inner.style.opacity = '1'; inner.style.transform = 'none'; }
        }, 20);
        setTimeout(() => { el.style.height = 'auto'; el.style.overflow = 'visible'; }, 350);
      });
    } else {
      const h = el.scrollHeight;
      el.style.height = h + 'px';
      el.style.overflow = 'hidden';
      el.style.pointerEvents = 'none';
      if (inner) {
        inner.style.transition = 'none';
        inner.style.opacity = '1';
        inner.style.transform = 'none';
      }
      requestAnimationFrame(() => {
        el.style.transition = 'height 310ms ease-out, opacity 310ms ease-out';
        el.style.height = '0px';
        el.style.opacity = '0';
        if (inner) {
          inner.style.transition = 'opacity 260ms ease-out, transform 260ms ease-out';
          inner.style.opacity = '0';
          inner.style.transform = 'translateY(-8px)';
        }
      });
    }
  }, [open]);
  return ref;
};

//  Toggle Reveal wrapper component 
// Note: no inline height/opacity/overflow — the hook owns those styles entirely
const ToggleReveal = ({ open, children }) => {
  const ref = useToggleReveal(open);
  return (
    <div
      ref={ref}
      className="rdm-reveal-wrap"
      style={{ height: '0px', opacity: 0, overflow: 'hidden', pointerEvents: 'none' }}
    >
      <div className="rdm-reveal-inner">{children}</div>
    </div>
  );
};

//  macOS Toggle 
const Toggle = ({ value, onChange }) => {
  const checked = value === 'yes';
  return (
    <label className="mac-toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked ? 'yes' : 'no')} />
      <div className="mac-toggle-track"><div className="mac-toggle-thumb" /></div>
    </label>
  );
};

//  macOS Segmented Control 
const SegControl = ({ value, onChange, options }) => {
  const btnRefs = useRef([]);
  const containerRef = useRef(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 2, width: 0 });

  const updateIndicator = useCallback(() => {
    const idx = Math.max(0, options.findIndex(o => o.toLowerCase() === value));
    const btn = btnRefs.current[idx];
    if (btn) setIndicatorStyle({ left: btn.offsetLeft, width: btn.offsetWidth });
  }, [value, options]);

  useEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(updateIndicator);
    ro.observe(container);
    return () => ro.disconnect();
  }, [updateIndicator]);

  return (
    <div className="seg-control" ref={containerRef}>
      <div className="seg-control-indicator" style={indicatorStyle} />
      {options.map((opt, i) => {
        const sel = opt.toLowerCase() === value;
        return (
          <button key={opt} ref={el => btnRefs.current[i] = el}
            className={`seg-control-btn${sel ? ' seg-control-btn--active' : ''}`}
            onClick={() => onChange(opt.toLowerCase())}
          >{opt}</button>
        );
      })}
    </div>
  );
};

const minOpts = (s, e, step) => Array.from({ length: Math.floor((e - s) / step) + 1 }, (_, i) => { const v = s + i * step; return { value: String(v), label: String(v) }; });

const AnchorIcon = ({ type, color = C.black, size = 24 }) => {
  if (type === 'Bus loading') return <svg width={24} height={24} viewBox="0 0 32 32" fill="none"><path d="M10.513 24.667v1.256c0 .392-.138.725-.412.999a1.362 1.362 0 0 1-1 .411c-.392 0-.725-.137-.998-.411a1.362 1.362 0 0 1-.41-1v-2.22c-.418-.316-.804-.763-1.16-1.342A3.65 3.65 0 0 1 6 20.41V8c0-1.614.802-2.795 2.406-3.544C10.01 3.708 12.541 3.333 16 3.333c3.583 0 6.145.36 7.687 1.08C25.229 5.132 26 6.328 26 8v12.41a3.65 3.65 0 0 1-.533 1.95c-.356.579-.742 1.026-1.16 1.343v2.22c0 .392-.137.725-.411.999a1.363 1.363 0 0 1-1 .411 1.36 1.36 0 0 1-.999-.411 1.362 1.362 0 0 1-.41-1v-1.255H10.513ZM8 14h16V9.026H8V14Zm4.57 6.567c.338-.34.507-.752.507-1.237 0-.485-.17-.896-.51-1.234a1.688 1.688 0 0 0-1.237-.506c-.485 0-.896.17-1.234.51-.337.339-.506.751-.506 1.236s.17.897.51 1.234c.339.338.751.507 1.236.507s.897-.17 1.234-.51Zm9.334 0c.337-.34.506-.752.506-1.237 0-.485-.17-.896-.51-1.234a1.689 1.689 0 0 0-1.236-.506c-.485 0-.897.17-1.234.51-.338.339-.507.751-.507 1.236s.17.897.51 1.234c.34.338.752.507 1.237.507.485 0 .896-.17 1.234-.51ZM8.369 7.026h15.344c-.282-.532-.997-.947-2.144-1.245-1.147-.299-2.99-.448-5.528-.448-2.497 0-4.32.156-5.467.468-1.147.312-1.882.72-2.205 1.225Zm2.298 15.64h10.666c.734 0 1.361-.26 1.884-.783.522-.522.783-1.15.783-1.883v-4H8v4c0 .733.261 1.361.783 1.883.523.523 1.15.784 1.884.784Z" fill={color}/></svg>;
  if (type === 'Ferry loading') return <svg width={24} height={24} viewBox="0 0 32 32" fill="none"><path d="M11.0332 25.0973C11.4794 25.3778 11.935 25.6257 12.3999 25.841C12.8647 26.0563 13.3467 26.2221 13.8459 26.3383V27.7793C13.3639 27.6682 12.8879 27.5302 12.4179 27.3653C11.9476 27.2004 11.481 27.0034 11.0179 26.7743C10.1545 27.1914 9.27885 27.5 8.39085 27.7C7.50285 27.9 6.59985 28 5.68185 28H5.33318V26.6667H5.68185C6.61185 26.6667 7.51741 26.5329 8.39852 26.2653C9.27985 25.9978 10.1581 25.6084 11.0332 25.0973ZM13.5125 4H18.3845V6.66667H22.4358C23.0323 6.66667 23.5404 6.87644 23.9602 7.296C24.3797 7.71578 24.5895 8.224 24.5895 8.82067V11.877C24.3775 11.8497 24.166 11.8291 23.9548 11.8153C23.7437 11.8018 23.5108 11.795 23.2562 11.795V8.718C23.2562 8.51289 23.1835 8.34189 23.0382 8.205C22.8931 8.06833 22.7178 8 22.5125 8H9.38452C9.17941 8 9.00418 8.06833 8.85885 8.205C8.71352 8.34189 8.64085 8.51289 8.64085 8.718V14.023L15.9485 11.795L17.8025 12.336C17.4759 12.4009 17.1553 12.5004 16.8409 12.6347C16.5264 12.7689 16.2324 12.9522 15.9588 13.1847L6.42552 16.123L7.83052 21.423C8.28007 21.1666 8.67963 20.8559 9.02918 20.491C9.37896 20.1261 9.72729 19.7444 10.0742 19.346L10.9792 18.3307C11.4083 18.8213 11.8605 19.315 12.3358 19.8117C12.811 20.3081 13.3143 20.7734 13.8459 21.2077V22.8923C13.3281 22.6119 12.8311 22.2563 12.3548 21.8257C11.8788 21.3948 11.4101 20.9059 10.9485 20.359C10.2238 21.147 9.56318 21.7692 8.96652 22.2257C8.36985 22.6821 7.70063 23.0504 6.95885 23.3307L4.97152 16.2563C4.89463 15.9812 4.92374 15.718 5.05885 15.4667C5.19396 15.2153 5.39907 15.0427 5.67418 14.9487L7.30752 14.4153V8.82067C7.30752 8.224 7.51741 7.71578 7.93718 7.296C8.35674 6.87644 8.86485 6.66667 9.46152 6.66667H13.5125V4ZM18.7178 28C18.5572 28 18.423 27.9461 18.3152 27.8383C18.2076 27.7308 18.1538 27.5967 18.1538 27.436V26.095C17.7998 25.9017 17.5233 25.6307 17.3242 25.282C17.1251 24.9333 17.0255 24.5573 17.0255 24.154V17.795C17.0255 16.8103 17.4648 16.094 18.3435 15.646C19.2222 15.1982 20.6034 14.9743 22.4872 14.9743C24.4427 14.9743 25.8504 15.1914 26.7102 15.6257C27.57 16.0599 27.9998 16.783 27.9998 17.795V24.154C27.9998 24.5522 27.9003 24.9227 27.7012 25.2653C27.5021 25.608 27.2255 25.8846 26.8715 26.095V27.436C26.8715 27.5967 26.8177 27.7308 26.7102 27.8383C26.6024 27.9461 26.4682 28 26.3075 28H25.4872C25.3263 28 25.1921 27.9461 25.0845 27.8383C24.9767 27.7308 24.9228 27.5967 24.9228 27.436V26.4103H20.1025V27.436C20.1025 27.5967 20.0486 27.7308 19.9408 27.8383C19.8331 27.9461 19.6989 28 19.5382 28H18.7178ZM20.0125 24.3847C20.2776 24.3847 20.4998 24.2949 20.6792 24.1153C20.8587 23.9358 20.9485 23.7136 20.9485 23.4487C20.9485 23.1838 20.8587 22.9616 20.6792 22.782C20.4998 22.6024 20.2776 22.5127 20.0125 22.5127C19.7476 22.5127 19.5254 22.6024 19.3458 22.782C19.1665 22.9616 19.0768 23.1838 19.0768 23.4487C19.0768 23.7084 19.1678 23.9294 19.3498 24.1117C19.5318 24.2937 19.7527 24.3847 20.0125 24.3847ZM25.0125 24.3847C25.2776 24.3847 25.4998 24.2949 25.6792 24.1153C25.8587 23.9358 25.9485 23.7136 25.9485 23.4487C25.9485 23.1838 25.8587 22.9616 25.6792 22.782C25.4998 22.6024 25.2776 22.5127 25.0125 22.5127C24.7476 22.5127 24.5254 22.6024 24.3458 22.782C24.1665 22.9616 24.0768 23.1838 24.0768 23.4487C24.0768 23.7084 24.1678 23.9294 24.3498 24.1117C24.5318 24.2937 24.7527 24.3847 25.0125 24.3847ZM18.2049 20.1027H26.8205V17.9487H18.2049V20.1027Z" fill={color}/></svg>;
  if (type === 'Gate closure') return <svg width={24} height={24} viewBox="0 0 32 32" fill="none"><rect x="5" y="4" width="22" height="24" rx="2" stroke={color} strokeWidth="1.5"/><path d="M5 4h22M5 28h22" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><circle cx="22" cy="16" r="2" fill={color}/><path d="M14 9v14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>;
  // Other / default — rocket icon
  return <svg width={24} height={24} viewBox="0 0 32 32" fill="none"><path d="M15.997 3.315c2.054 1.81 3.567 3.834 4.54 6.075.974 2.241 1.46 4.769 1.46 7.584 0 .07.003.136.007.199a1.22 1.22 0 0 1-.007.212l2.705 1.834c.296.185.528.432.697.74.168.307.252.633.252.978v7.46L19.671 26h-7.36l-5.967 2.397v-7.473c0-.345.082-.671.246-.978a1.94 1.94 0 0 1 .69-.74l2.717-1.834v-.398c0-2.815.487-5.343 1.46-7.584.973-2.24 2.487-4.266 4.54-6.075ZM14.458 21.206a2.1 2.1 0 0 0 1.54.63c.605 0 1.118-.21 1.539-.63.42-.421.63-.934.63-1.54a2.07 2.07 0 0 0-.63-1.54 2.094 2.094 0 0 0-1.54-.631c-.605 0-1.118.21-1.539.631-.421.42-.631.934-.631 1.54 0 .605.21 1.118.631 1.54ZM8.019 25.938l3.404-1.383a28.966 28.966 0 0 1-.748-2.604c-.21-.881-.375-1.77-.496-2.668L8.2 20.604a.385.385 0 0 0-.18.333v5.001Zm13.106 0 3.404-1.37a23.33 23.33 0 0 1-.716-2.483 28.77 28.77 0 0 1-.528-2.802l-1.98 1.321a.423.423 0 0 0-.18.346v4.988ZM13.105 24.325h5.785a23.947 23.947 0 0 0 1.048-3.712c.256-1.29.384-2.53.384-3.72 0-2.28-.337-4.327-1.01-6.14-.674-1.814-1.778-3.541-3.315-5.184-1.536 1.643-2.64 3.37-3.314 5.184-.674 1.813-1.01 3.86-1.01 6.14 0 1.19.128 2.43.384 3.72s.606 2.527 1.048 3.712Z" fill={color}/></svg>;
};


const DragHandle = () => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="10.5" cy="6" r="1.2" fill="#6F6F6F"/>
    <circle cx="16.5" cy="6" r="1.2" fill="#6F6F6F"/>
    <circle cx="10.5" cy="12" r="1.2" fill="#6F6F6F"/>
    <circle cx="16.5" cy="12" r="1.2" fill="#6F6F6F"/>
    <circle cx="10.5" cy="18" r="1.2" fill="#6F6F6F"/>
    <circle cx="16.5" cy="18" r="1.2" fill="#6F6F6F"/>
  </svg>
);

//  Segment Sheet Content 
const SegmentSheetContent = ({ leg, onSave, onRemove, onCancel, isEditing, isAnchorLinked, onAnchorModeChange }) => {
  const [mode, setMode] = useState(leg?.mode || 'Car');
  const [hours, setHours] = useState(leg?.hours ?? 1);
  const [minutes, setMinutes] = useState(leg?.minutes ?? 0);
  const [parkingTime, setParkingTime] = useState(leg?.parkingTime ?? 10);
  const [bikeLockTime, setBikeLockTime] = useState(leg?.bikeLockTime ?? 5);
  const [waitTime, setWaitTime] = useState(leg?.waitTime ?? 5);
  const isPublic = PUBLIC.includes(mode);
  const isCar = mode === 'Car' || mode === 'Rideshare';
  const isBike = mode === 'Bike';
  // Anchor-linked segments don't show wait time; Ferry gets its own wait time field
  const isFerry = mode === 'Ferry';
  const showWaitTime = (isPublic || isFerry) && !isAnchorLinked;

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (!isEditing) {
      if (['Run', 'Walk', 'Bike', 'Bus', 'Train', 'Subway', 'Streetcar', 'Ferry'].includes(newMode)) { setHours(0); setMinutes(30); }
      else { setHours(1); setMinutes(0); }
    }
    // If editing an anchor-linked segment and user changes mode, clear fixed departure
    if (isEditing && isAnchorLinked && onAnchorModeChange) {
      onAnchorModeChange(newMode);
    }
  };

  // Full custom name for display in mode dropdown when editing anchor-linked 'Other'
  const legDisplayLabel = leg?._anchorLabel || null;

  return (
    <div style={{ padding: '0 16px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '20px 0', position: 'relative' }}>
        <button onClick={onCancel} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', background: C.white, color: C.accent2, border: 'none', cursor: 'pointer', flexShrink: 0, padding: 0 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6L18 18"/></svg>
        </button>
        <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontFamily: TER, fontSize: 18, fontWeight: 600, color: C.black, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
          {isEditing ? 'Update segment' : 'Add segment'}
        </span>
        {isEditing && (
          <div style={{ marginLeft: 'auto', flexShrink: 0, display: 'flex', alignItems: 'center', background: C.white, padding: '4px 18px', borderRadius: '24px', height: 40 }}>
            <button onClick={onRemove} style={{ background: 'none', border: 'none', fontFamily: SEC, fontSize: 16, color: C.accent2, cursor: 'pointer', padding: 0, fontWeight: 500 }}>Remove</button>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <SecLabel>Mode</SecLabel>
          <div style={{ position: 'relative', display: 'inline-block', minWidth: '100%' }}>
            <select value={mode} onChange={e => handleModeChange(e.target.value)} style={{ width: '100%', height: 44, padding: '0 32px 0 16px', fontFamily: SEC, fontSize: 14, fontWeight: 500, color: C.black, background: 'transparent', border: `1px solid ${C.grey}`, borderRadius: 9, outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}>
              {legDisplayLabel
                ? <option value={mode} style={{ color: C.black, background: C.white }}>{legDisplayLabel}</option>
                : MODE_OPTIONS.map(m => <option key={m.key} value={m.key} style={{ color: C.black, background: C.white }}>{m.label}</option>)
              }
              {legDisplayLabel && MODE_OPTIONS.map(m => <option key={m.key} value={m.key} style={{ color: C.black, background: C.white }}>{m.label}</option>)}
            </select>
            <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}><ChevronDown color={C.black} size={32} /></span>
          </div>
        </div>
        <div>
          <SecLabel>Duration</SecLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sel value={String(hours)} onChange={v => setHours(parseInt(v))} options={Array.from({ length: 13 }, (_, j) => ({ value: String(j), label: String(j) }))} />
              <span style={{ fontFamily: SEC, fontSize: 14, fontWeight: 500, color: C.black }}>hr</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sel value={String(minutes)} onChange={v => setMinutes(parseInt(v))} options={minOpts(0, 55, 5)} />
              <span style={{ fontFamily: SEC, fontSize: 14, fontWeight: 500, color: C.black }}>min</span>
            </div>
          </div>
        </div>
        {isCar  && <div><SecLabel>Parking Time</SecLabel><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Sel value={String(parkingTime)} onChange={v => setParkingTime(parseInt(v))} options={minOpts(0, 60, 5)} /><span style={{ fontFamily: SEC, fontSize: 14, fontWeight: 500, color: C.black }}>min</span></div></div>}
        {isBike && <div><SecLabel>Time to lock bike</SecLabel><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Sel value={String(bikeLockTime)} onChange={v => setBikeLockTime(parseInt(v))} options={minOpts(0, 30, 5)} /><span style={{ fontFamily: SEC, fontSize: 14, fontWeight: 500, color: C.black }}>min</span></div></div>}
        {showWaitTime && <div><SecLabel>Wait time for {mode.toLowerCase()}</SecLabel><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Sel value={String(waitTime)} onChange={v => setWaitTime(parseInt(v))} options={minOpts(0, 60, 5)} /><span style={{ fontFamily: SEC, fontSize: 14, fontWeight: 500, color: C.black }}>min</span></div></div>}
        <button onClick={() => onSave({ mode, hours, minutes, parkingTime, bikeLockTime, waitTime })} style={{ width: '100%', height: 52, background: C.accent2, color: C.white, border: 'none', borderRadius: 64, fontFamily: TER, fontSize: 16, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = C.accent2Dark}
          onMouseLeave={e => e.currentTarget.style.background = C.accent2}
        >{isEditing ? 'Update segment' : '+ Add travel segment'}</button>
      </div>
    </div>
  );
};

const SegmentSheet = ({ leg, onSave, onRemove, onClose, isEditing, isAnchorLinked, onAnchorModeChange }) => {
  const [closing, setClosing] = useState(false);
  const close = () => { setClosing(true); setTimeout(onClose, 250); };
  return (
    <>
      <div className={`sheet-overlay${closing ? ' closing' : ''}`} onClick={close} />
      <div className={`sheet-panel${closing ? ' closing' : ''}`}>
        <SegmentSheetContent leg={leg} onSave={data => { onSave(data); close(); }} onRemove={() => { onRemove(); close(); }} onCancel={close} isEditing={isEditing} isAnchorLinked={isAnchorLinked} onAnchorModeChange={onAnchorModeChange} />
      </div>
    </>
  );
};


//  Icons for segment actions 
const PencilIcon = () => (
  <svg width={24} height={24} viewBox="0 0 32 32" fill="none">
    <path d="M9 23h1.261l10.237-10.236-1.262-1.262L9 21.738V23Zm-.596 1.5a.874.874 0 0 1-.644-.26.874.874 0 0 1-.26-.644v-1.733a1.8 1.8 0 0 1 .527-1.275L20.691 7.931a1.68 1.68 0 0 1 .5-.319 1.5 1.5 0 0 1 .575-.112c.2 0 .395.036.583.107.188.07.354.184.499.34l1.221 1.236c.155.145.266.311.332.5.066.188.099.377.099.565 0 .201-.034.393-.103.576-.069.183-.178.35-.328.501L11.412 23.973a1.8 1.8 0 0 1-1.276.527H8.405Zm11.452-12.356-.62-.642 1.262 1.261-.642-.62Z" fill={C.grey3}/>
  </svg>
);
const TrashIcon = () => (
  <svg width={24} height={24} viewBox="0 0 32 32" fill="none">
    <path d="M10.995 25.261c-.53 0-.984-.188-1.362-.566a1.857 1.857 0 0 1-.566-1.362V9.795H8.8a.773.773 0 0 1-.57-.23.774.774 0 0 1-.23-.57c0-.227.077-.417.23-.57a.774.774 0 0 1 .57-.23h4a.91.91 0 0 1 .276-.668.91.91 0 0 1 .667-.276h4.513a.91.91 0 0 1 .668.276.91.91 0 0 1 .276.668h4a.77.77 0 0 1 .57.23c.153.153.23.343.23.57a.773.773 0 0 1-.23.57.774.774 0 0 1-.57.23h-.267v13.538c0 .53-.189.984-.566 1.362a1.857 1.857 0 0 1-1.362.566h-10.01ZM21.333 9.795H10.667v13.538c0 .096.03.175.092.236a.32.32 0 0 0 .236.092h10.01a.32.32 0 0 0 .236-.092.32.32 0 0 0 .092-.236V9.795Zm-6.732 11.503a.776.776 0 0 0 .23-.57v-8a.774.774 0 0 0-.23-.57.774.774 0 0 0-.57-.23.774.774 0 0 0-.57.23.775.775 0 0 0-.23.57v8c0 .227.077.417.23.57.153.153.343.23.57.23a.774.774 0 0 0 .57-.23Zm3.938 0a.776.776 0 0 0 .23-.57v-8a.775.775 0 0 0-.23-.57.775.775 0 0 0-.57-.23.774.774 0 0 0-.57.23.775.775 0 0 0-.23.57v8c0 .227.077.417.23.57.154.153.344.23.57.23a.774.774 0 0 0 .57-.23Z" fill={C.grey3}/>
  </svg>
);

//  Segment Card 
// isFloating: rendered as the lifted drag clone (fixed position, elevated)
// isPlaceholder: renders an empty ghost space at the original position
const SegmentCard = ({ leg, isLast, total, isLocked, isFloating, isPlaceholder, onEdit, onRemove, onHandlePointerDown, canDrag, showRail, dotColor }) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const isPublic = PUBLIC.includes(leg.mode);
  const isCar = leg.mode === 'Car' || leg.mode === 'Rideshare';
  const isBike = leg.mode === 'Bike';
  const dispLabel = leg._displayLabel || (leg.mode === 'Car' ? 'Drive' : leg.mode);
  const legMins = (leg.hours || 0) * 60 + (leg.minutes || 0);
  const hrs = Math.floor(legMins / 60), mins = legMins % 60;

  // Total time = travel + any extras (parking, lock, wait)
  const extraMins = !isLocked
    ? (isCar ? (parseInt(leg.parkingTime) || 0) : 0)
      + (isBike ? (parseInt(leg.bikeLockTime) || 0) : 0)
      + ((isPublic || leg.mode === 'Ferry') && leg.waitTime && !leg._anchorLinked ? (parseInt(leg.waitTime) || 0) : 0)
    : 0;
  const totalMins = legMins + extraMins;
  const totalHrs  = Math.floor(totalMins / 60);
  const totalRem  = totalMins % 60;
  const totalLabel = totalMins > 0
    ? (totalHrs > 0 && totalRem > 0 ? `${totalHrs} hr ${totalRem} min`
      : totalHrs > 0 ? `${totalHrs} hr`
      : `${totalRem} min`)
    : null;

  const summaryParts = [];
  if (legMins > 0) summaryParts.push({ icon: 'time', text: hrs > 0 ? `${hrs} hr ${mins} min` : `${mins} min` });
  if (!isLocked) {
    if (isCar && leg.parkingTime > 0) summaryParts.push({ icon: 'parking', text: `${leg.parkingTime} min` });
    if (isBike && leg.bikeLockTime > 0) summaryParts.push({ icon: 'timeadd', text: `${leg.bikeLockTime} min` });
    if (isPublic && leg.waitTime > 0) summaryParts.push({ icon: 'timeadd', text: `${leg.waitTime} min` });
  }

  const lockedBtnStyle = isLocked ? {
    background: 'rgba(224,224,224,0.3)',
    border: `1px dashed ${C.grey}`,
    cursor: 'default',
  } : {};

  // Placeholder: just an invisible height-holder so the list doesn't collapse
  if (isPlaceholder) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {showRail && <div style={{ width: 8, flexShrink: 0, marginRight: 8 }} />}
        <div style={{ flex: 1, height: 44, borderRadius: 9, border: `2px dashed ${C.grey2}`, background: 'transparent', opacity: 0.5 }} />
        {canDrag && !isLocked && <div style={{ width: 28, flexShrink: 0 }} />}
      </div>
    );
  }

  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        // Floating = physical lift: scale up, shadow, full opacity, cursor grabbing
        ...(isFloating ? {
          transform: 'scale(1.04)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.12)',
          borderRadius: 12,
          cursor: 'grabbing',
          zIndex: 999,
          background: 'transparent',
        } : {}),
      }}>
        {/* Rail dot + line */}
        {showRail && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 8, flexShrink: 0, marginRight: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor || C.grey, flexShrink: 0, marginTop: -4 }} />
            {!isLast && (
              <div style={{ flex: 1, width: 1, borderLeft: `1px dashed ${C.grey}`, minHeight: 16, marginBottom: -56 }} />
            )}
          </div>
        )}

        {/* Segment button */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <button
            className="rdm-seg-btn locked"
            onClick={() => { if (!isLocked && !isFloating) setSheetOpen(true); }}
            style={{ ...lockedBtnStyle }}
          >
            <span className="rdm-seg-icon"><ModeIcon mode={leg.mode} color={C.black} size={24} /></span>
            <span className="rdm-seg-label" style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              {dispLabel}
              {totalLabel && (
                <span style={{ fontFamily: SEC, fontSize: 14, fontWeight: 400, color: C.grey, letterSpacing: 0 }}>
                  ({totalLabel})
                </span>
              )}
            </span>
            
            {!isLocked && (
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span
                  style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                  onClick={e => { e.stopPropagation(); if (!isFloating) setSheetOpen(true); }}
                  title="Edit"
                >
                  <PencilIcon />
                </span>
                <span
                  style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                  onClick={e => { e.stopPropagation(); if (!isFloating) onRemove(); }}
                  title="Remove"
                >
                  <TrashIcon />
                </span>
              </span>
            )}
          </button>
        </div>

        {/* Drag handle — pointer events only, outside the bar */}
        {canDrag && !isLocked && (
          <div
            onPointerDown={onHandlePointerDown}
            style={{
              cursor: isFloating ? 'grabbing' : 'grab',
              display: 'flex',
              alignItems: 'center',
              padding: '0 2px',
              flexShrink: 0,
              touchAction: 'none',
              userSelect: 'none',
            }}
          >
            <DragHandle />
          </div>
        )}
      </div>

      {!isLocked && sheetOpen && (
        <SegmentSheet
          leg={leg}
          isEditing={true}
          isAnchorLinked={false}
          onSave={data => { onEdit(data); setSheetOpen(false); }}
          onRemove={() => { onRemove(); setSheetOpen(false); }}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </>
  );
};

const AddSegmentButton = ({ onAdd }) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  return (
    <>
      <button className="rdm-add-seg-btn" onClick={() => setSheetOpen(true)}>+ Add travel segment</button>
      {sheetOpen && (
        <SegmentSheet leg={null} isEditing={false} onSave={data => { onAdd(data); setSheetOpen(false); }} onRemove={() => {}} onClose={() => setSheetOpen(false)} />
      )}
    </>
  );
};


//  Main 
export default function ScrollViewV2({ data, update, reset }) {
  //  Drag session — single atomic state to prevent flickering 
  // dragSession: null | { slots: Slot[], activeIdx: number }
  // Slot: { type:'free'|'block', legs: leg[], legIndices: number[] }
  const [dragSession, setDragSession] = useState(null);
  const [floatY, setFloatY] = useState(0);
  const dragSessionRef = useRef(null);  // mirrors dragSession for sync reads in event handlers
  const listRef = useRef(null);
  const leftColRef = useRef(null);
  const rightColRef = useRef(null);

  const legs     = data.transitLegs || [];
  const timeline = buildTimeline(data);

  //  Anchor-linked leg logic 
  const isFixedDep = data.raceSize === 'major' && data.doCustomDeadline === 'yes';
  const anchorType = data.customDeadlineType || 'Bus loading';
  const hasLinkedLeg = isFixedDep && (anchorType === 'Bus loading' || anchorType === 'Ferry loading' || anchorType === 'Other');
  const anchorDisplayLabel = (() => {
    if (!isFixedDep) return '';
    const t = data.customDeadlineTime || '05:00';
    const time = `${formatTime12h(t)} ${formatPeriod(t)}`;
    if (anchorType === 'Other') return `${data.customDeadlineName || 'Custom deadline'} at ${time}`;
    return `${anchorType} at ${time}`;
  })();

  const railTotal = legs.length + (isFixedDep ? 1 : 0);

  useEffect(() => {
    if (!leftColRef.current || !rightColRef.current) return;
    const ro = new ResizeObserver(() => {
      rightColRef.current.style.height = leftColRef.current.offsetHeight + 'px';
    });
    ro.observe(leftColRef.current);
    return () => ro.disconnect();
  }, []);

  const updateLeg = (i, patch) => { const n = [...legs]; n[i] = { ...n[i], ...patch }; update('transitLegs', n); };
  const removeLeg = i => update('transitLegs', legs.filter((_, idx) => idx !== i));
  const addLeg = legData => {
    const modeDefaults = (['Run', 'Walk', 'Bike', 'Bus', 'Train', 'Subway', 'Streetcar'].includes(legData.mode))
      ? { hours: 0, minutes: 30 } : { hours: 1, minutes: 0 };
    update('transitLegs', [...legs, { mode: 'Car', parkingTime: 10, waitTime: 5, bikeLockTime: 5, ...modeDefaults, ...legData }]);
  };

  //  Slot helpers 
  // Every leg gets its own slot.
  // Non-anchorLinked legs → free slot (draggable, can move above/below the fixed block).
  // The _anchorLinked leg → block slot (not draggable; renders anchor node + linked leg).
  // Drive is always a FREE slot — independent of the fixed block.
  const buildSlotsFromLegs = (legArr) => {
    if (!isFixedDep) {
      return legArr.map((leg, i) => ({ type: 'free', legs: [leg], legIndices: [i] }));
    }
    const anchorIdx = legArr.findIndex(l => l._anchorLinked);
    if (anchorIdx < 0) {
      return legArr.map((leg, i) => ({ type: 'free', legs: [leg], legIndices: [i] }));
    }
    return legArr.map((leg, i) => {
      if (i === anchorIdx) {
        // The fixed block: anchor node (visual) + this linked leg card
        return { type: 'block', legs: [leg], legIndices: [i] };
      }
      // Every other leg is a free, independently draggable slot
      return { type: 'free', legs: [leg], legIndices: [i] };
    });
  };

  const flattenSlots = (slotsArr) => {
    const out = [];
    slotsArr.forEach(s => out.push(...s.legs));
    return out;
  };

  const displaySlots = dragSession ? dragSession.slots : buildSlotsFromLegs(legs);
  const dragActive   = dragSession !== null;
  const dragSlotIdx  = dragSession?.activeIdx ?? null;
  // Can drag when there are ≥2 slots (block counts as 1)
  const canDragSlots = displaySlots.length > 1;

  //  Window-level pointer handlers (attached only while drag is active) 
  useEffect(() => {
    if (!dragActive) return;

    const onMove = (e) => {
      const clientY = e.clientY;
      const session = dragSessionRef.current;
      if (!session || !listRef.current) return;

      setFloatY(clientY);

      // Dead zone: don't reorder until cursor has moved ≥8px from grab point.
      // This prevents the immediate-swap flicker on first tiny movement.
      if (!session.moved && Math.abs(clientY - session.grabY) < 8) return;
      if (!session.moved) {
        // Mark moved without triggering a re-render (ref mutation only)
        dragSessionRef.current = { ...session, moved: true };
      }

      // CENTER-COUNTING: count how many non-grabbed slots have their
      // visual midpoint ABOVE the cursor. That count IS the correct
      // target insertion index — no midpoint-crossing bugs, no block-size issues.
      const slotEls = listRef.current.querySelectorAll('[data-slot]');
      let c = 0;
      for (const el of slotEls) {
        const i = parseInt(el.getAttribute('data-slot'));
        if (i === dragSessionRef.current.activeIdx) continue; // skip placeholder
        const { top, height } = el.getBoundingClientRect();
        if (top + height / 2 < clientY) c++;
      }

      const cur = dragSessionRef.current;
      if (c !== cur.activeIdx) {
        const next = [...cur.slots];
        const [moved] = next.splice(cur.activeIdx, 1);
        next.splice(c, 0, moved);
        const newSession = { ...cur, slots: next, activeIdx: c };
        dragSessionRef.current = newSession;
        setDragSession(newSession);
      }
    };

    const onUp = () => {
      const session = dragSessionRef.current;
      if (session) update('transitLegs', flattenSlots(session.slots));
      dragSessionRef.current = null;
      setDragSession(null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup',   onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup',   onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragActive]);  // only re-subscribe when dragActive changes, not on every move

  const handleHandlePointerDown = (slotIdx, e) => {
    if (!canDragSlots) return;
    e.preventDefault();
    e.stopPropagation();
    const snapshot = buildSlotsFromLegs(legs);
    // grabY: used for the dead zone check in onMove
    const session = { slots: snapshot, activeIdx: slotIdx, grabY: e.clientY, moved: false };
    dragSessionRef.current = session;
    setDragSession(session);
    setFloatY(e.clientY);
  };
  const preRaceMins = (() => {
    let t = 0;
    if (data.doSecurity === 'yes') t += parseInt(data.security) || 0;
    if (data.doBagCheck === 'yes') t += parseInt(data.bagCheck) || 0;
    if (data.doWarmup === 'yes') t += Math.round(((data.warmupPaceSeconds || 0) * parseFloat(data.warmupDistance || 0)) / 60);
    if (data.doWarmup === 'yes' && data.doBathroomPostWarmup === 'yes') t += ((parseInt(data.bathroomPostWarmup) || 0) + (parseInt(data.bathroomPostWarmupUseTime) || 0)) * (parseInt(data.bathroomPostWarmupCount) || 1);
    if (data.doBathroomPreRace === 'yes') t += ((parseInt(data.bathroomPreRace) || 0) + (parseInt(data.bathroomUseTime) || 0)) * (parseInt(data.bathroomCount) || 1);
    t += parseInt(data.coralTime) || 0;
    return t;
  })();
  const transitMins = (() => {
    let t = 0;
    legs.forEach(l => {
      t += (l.hours || 0) * 60 + (l.minutes || 0);
      if (l.mode === 'Car' || l.mode === 'Rideshare') t += parseInt(l.parkingTime) || 0;
      if (PUBLIC.includes(l.mode)) t += parseInt(l.waitTime) || 0;
      if (l.mode === 'Bike') t += parseInt(l.bikeLockTime) || 0;
    });
    if (data.weatherBuffer === 'yes') t += parseInt(data.weatherBufferMins) || 0;
    return t;
  })();
  const morningMins = (() => {
    let t = parseInt(data.bathroomHome) || 0;
    t += parseInt(data.getDressed) || 0;
    t += (data.doEat ?? 'no') === 'yes' ? (parseInt(data.eatTime) || 0) : 0;
    t += (data.doSlowMorning ?? 'no') === 'yes' ? (parseInt(data.slowMorningMins) || 0) : 0;
    if (data.doesSnooze === 'yes') t += (parseInt(data.snoozeMinutes) || 0) * (parseInt(data.snoozeCount) || 1);
    return t;
  })();

  const paceMin     = String(Math.floor((data.warmupPaceSeconds || 330) / 60));
  const paceSec     = String((data.warmupPaceSeconds || 330) % 60).padStart(2, '0');
  const distOpts    = Array.from({ length: 20 }, (_, i) => { const v = (0.5 + i * 0.5).toFixed(1); return { value: v, label: v }; });
  const paceMinOpts = Array.from({ length: 15 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));
  const paceSecOpts = Array.from({ length: 12 }, (_, i) => { const v = String(i * 5).padStart(2, '0'); return { value: v, label: v }; });

  // Warmup: pace stored as sec/km; convert distance to km if miles
  const warmupTotalSeconds = (() => {
    if (data.doWarmup !== 'yes') return 0;
    const dist = parseFloat(data.warmupDistance || 0);
    const pace = parseInt(data.warmupPaceSeconds || 0);
    const distKm = data.distanceUnit === 'mi' ? dist * 1.60934 : dist;
    return Math.round(pace * distKm);
  })();
  const warmupTotalMins    = Math.floor(warmupTotalSeconds / 60);
  const warmupRemSecs      = warmupTotalSeconds % 60;
  const warmupDisplayMins  = warmupRemSecs >= 55 ? warmupTotalMins + 1 : warmupTotalMins;
  const warmupDisplaySecs  = warmupRemSecs >= 55 ? 0 : warmupRemSecs;
  const warmupCalcText = warmupTotalSeconds > 0
    ? `${parseFloat(data.warmupDistance || 0).toFixed(1)} ${data.distanceUnit} @ ${paceMin}:${paceSec} min/${data.distanceUnit} = ${warmupDisplaySecs > 0 ? `${warmupDisplayMins} min ${warmupDisplaySecs} sec` : `${warmupDisplayMins} min`} total`
    : '';

  const snoozeTotalMins = data.doesSnooze === 'yes' ? (parseInt(data.snoozeMinutes) || 0) * (parseInt(data.snoozeCount) || 1) : 0;

  return (
    <div style={{ background: C.white, minHeight: '100vh' }}>

      

      {/*  Two-column layout  */}
      <div className="rdm-page-layout">

        {/* Left column: header + cards */}
        <div className="rdm-page-left" ref={leftColRef}>

          {/*  Page header  */}
          <header className="rdm-page-header" style={{justifyContent: 'space-between', paddingRight: 24}}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="rdm-page-header-text">Race Day Math</span>
            <svg width={24} height={24} viewBox="0 0 32 32" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M14.6672 18.6666V21.3333C14.6672 21.7111 14.795 22.0277 15.0505 22.2833C15.3061 22.5388 15.6227 22.6666 16.0005 22.6666C16.3783 22.6666 16.695 22.5388 16.9505 22.2833C17.2061 22.0277 17.3339 21.7111 17.3339 21.3333V18.6666H20.0005C20.3783 18.6666 20.695 18.5388 20.9505 18.2833C21.2061 18.0277 21.3339 17.7111 21.3339 17.3333C21.3339 16.9555 21.2061 16.6388 20.9505 16.3833C20.695 16.1277 20.3783 16 20.0005 16H17.3339V13.3333C17.3339 12.9555 17.2061 12.6388 16.9505 12.3833C16.695 12.1277 16.3783 12 16.0005 12C15.6227 12 15.3061 12.1277 15.0505 12.3833C14.795 12.6388 14.6672 12.9555 14.6672 13.3333V16H12.0005C11.6227 16 11.3061 16.1277 11.0505 16.3833C10.795 16.6388 10.6672 16.9555 10.6672 17.3333C10.6672 17.7111 10.795 18.0277 11.0505 18.2833C11.3061 18.5388 11.6227 18.6666 12.0005 18.6666H14.6672ZM11.3172 28.3833C9.86163 27.7499 8.59497 26.8944 7.51719 25.8166C6.43941 24.7388 5.58385 23.4722 4.95052 22.0166C4.31719 20.5611 4.00052 19 4.00052 17.3333C4.00052 15.6666 4.31719 14.1055 4.95052 12.65C5.58385 11.1944 6.43941 9.92773 7.51719 8.84995C8.59497 7.77217 9.86163 6.91662 11.3172 6.28328C12.7727 5.64995 14.3339 5.33328 16.0005 5.33328C17.6672 5.33328 19.2283 5.64995 20.6839 6.28328C22.1394 6.91662 23.4061 7.77217 24.4839 8.84995C25.5616 9.92773 26.4172 11.1944 27.0505 12.65C27.6839 14.1055 28.0005 15.6666 28.0005 17.3333C28.0005 19 27.6839 20.5611 27.0505 22.0166C26.4172 23.4722 25.5616 24.7388 24.4839 25.8166C23.4061 26.8944 22.1394 27.7499 20.6839 28.3833C19.2283 29.0166 17.6672 29.3333 16.0005 29.3333C14.3339 29.3333 12.7727 29.0166 11.3172 28.3833ZM2.73385 9.73328C2.48941 9.48884 2.36719 9.17773 2.36719 8.79995C2.36719 8.42217 2.48941 8.11106 2.73385 7.86662L6.53385 4.06662C6.7783 3.82217 7.08941 3.69995 7.46719 3.69995C7.84497 3.69995 8.15608 3.82217 8.40052 4.06662C8.64497 4.31106 8.76719 4.62217 8.76719 4.99995C8.76719 5.37773 8.64497 5.68884 8.40052 5.93328L4.60052 9.73328C4.35608 9.97773 4.04497 10.1 3.66719 10.1C3.28941 10.1 2.9783 9.97773 2.73385 9.73328ZM29.2672 9.73328C29.0227 9.97773 28.7116 10.1 28.3339 10.1C27.9561 10.1 27.645 9.97773 27.4005 9.73328L23.6005 5.93328C23.3561 5.68884 23.2339 5.37773 23.2339 4.99995C23.2339 4.62217 23.3561 4.31106 23.6005 4.06662C23.845 3.82217 24.1561 3.69995 24.5339 3.69995C24.9116 3.69995 25.2227 3.82217 25.4672 4.06662L29.2672 7.86662C29.5116 8.11106 29.6339 8.42217 29.6339 8.79995C29.6339 9.17773 29.5116 9.48884 29.2672 9.73328ZM16.0005 26.6666C18.6005 26.6666 20.8061 25.7611 22.6172 23.9499C24.4283 22.1388 25.3339 19.9333 25.3339 17.3333C25.3339 14.7333 24.4283 12.5277 22.6172 10.7166C20.8061 8.90551 18.6005 7.99995 16.0005 7.99995C13.4005 7.99995 11.195 8.90551 9.38385 10.7166C7.57274 12.5277 6.66719 14.7333 6.66719 17.3333C6.66719 19.9333 7.57274 22.1388 9.38385 23.9499C11.195 25.7611 13.4005 26.6666 16.0005 26.6666Z" fill={C.black}/>
            </svg>
            </div>
          </header>

          {/*  Card 1: Race Details  */}
          <div className="rdm-card">
            <SectionHeader label="Race Details" />
            <div>
              <PrimaryLabel>When does your race start?</PrimaryLabel>
              <div style={{ marginTop: 8, position: 'relative', display: 'inline-block' }}>
                <select value={data.raceStartTime || '08:00'} onChange={e => update('raceStartTime', e.target.value)} style={{ height: 44, padding: '0 40px 0 16px', fontFamily: SEC, fontSize: 14, fontWeight: 500, color: C.black, background: 'transparent', border: `1px solid ${C.grey}`, borderRadius: 9, outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', minWidth: 160 }}>
                  {TIME_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ color: C.black, background: C.white }}>{o.label}</option>)}
                </select>
                <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}><ChevronDown color={C.black} size={32} /></span>
              </div>
            </div>
            <RowDivider />
            <div>
              <PrimaryLabel>What is the size of your race?</PrimaryLabel>
              <SegControl
                value={data.raceSize || 'local'}
                onChange={v => {
                  const bufferDefaults = { local: 0, city: 10, major: 20 };
                  update('raceSize', v);
                  update('raceBuffer', bufferDefaults[v] ?? 0);
                  if (v !== 'major') {
                    update('doCustomDeadline', 'no');
                    // Remove any anchor-linked leg when leaving Major
                    const cleaned = (data.transitLegs || []).filter(l => !l._anchorLinked);
                    update('transitLegs', cleaned);
                  }
                }}
                options={['Local', 'City', 'Major']}
              />
              <div style={{marginTop:16, marginBottom:16}}>
                <SecLabel>Additional time buffer</SecLabel>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <Sel value={String(data.raceBuffer ?? 0)} onChange={v => update('raceBuffer', parseInt(v))} options={minOpts(0, 60, 5)} width={120} />
                  <span style={{ fontFamily: SEC, fontSize: 14, fontWeight: 500, color: C.black }}>min</span>
                </div>
              </div>

              <HelperText>
                {data.raceSize === 'city'  && 'Expect road closures and standard bathroom lines. A 10-minute buffer helps account for urban transit friction.'}
                {data.raceSize === 'major' && 'High-security events with massive crowds. This accounts for long security screenings and the walk to far-away corrals.'}
                {(!data.raceSize || data.raceSize === 'local') && 'Small fields with easy parking. Usually no extra buffer needed for security or long walk-to-start times.'}
              </HelperText>
            </div>
            
          </div>

          {/*  Card 2: Getting Ready  */}
          <div className="rdm-card">
            <SectionHeader label="Getting Ready" totalMins={morningMins} />
            <div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <PrimaryLabel>Snooze your alarm?</PrimaryLabel>
                <Toggle value={data.doesSnooze} onChange={v => update('doesSnooze', v)} />
              </div>
              <ToggleReveal open={data.doesSnooze === 'yes'}>
                <Sub>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ marginBottom: 8 }}><SecLabel>How long to snooze for?</SecLabel><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Sel value={String(data.snoozeMinutes || 5)} onChange={v => update('snoozeMinutes', parseInt(v))} options={minOpts(1, 30, 1)} /><span style={{ fontFamily: SEC, fontSize: 14, fontWeight: 500, color: C.black }}>min</span></div></div>
                    <div><SecLabel>How many times typically?</SecLabel><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Sel value={String(data.snoozeCount || 1)} onChange={v => update('snoozeCount', parseInt(v))} options={Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))} /><span style={{ fontFamily: SEC, fontSize: 14, fontWeight: 500, color: C.black }}>{(data.snoozeCount || 1) === 1 ? 'time' : 'times'}</span></div></div>
                    {snoozeTotalMins > 0 && <div style={{ display: 'flex' }}><CalcRow text={`${data.snoozeCount || 1} snooze @ ${data.snoozeMinutes || 5} min = ${snoozeTotalMins} min total`} /></div>}
                  </div>
                </Sub>
              </ToggleReveal>
            </div>
            <RowDivider />
            <div><PrimaryLabel>How long to use the bathroom?</PrimaryLabel><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}><Sel value={String(data.bathroomHome)} onChange={v => update('bathroomHome', parseInt(v))} options={minOpts(0, 55, 5)} /><span style={{ fontFamily: SEC, fontSize: 14, fontWeight: 500, color: C.black }}>min</span></div><HelperText>Brushing teeth, poop, shower, etc.</HelperText></div>
            <RowDivider />
            <div><PrimaryLabel>How long to get dressed?</PrimaryLabel><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}><Sel value={String(data.getDressed)} onChange={v => update('getDressed', parseInt(v))} options={minOpts(0, 55, 5)} /><span style={{ fontFamily: SEC, fontSize: 14, fontWeight: 500, color: C.black }}>min</span></div><HelperText>Prep your gear ahead of time</HelperText></div>
            <RowDivider />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <PrimaryLabel>Eating breakfast?</PrimaryLabel>
                <Toggle value={data.doEat ?? 'no'} onChange={v => update('doEat', v)} />
              </div>
              <ToggleReveal open={(data.doEat ?? 'no') === 'yes'}>
                <Sub>
                  <SecLabel>How long to eat?</SecLabel>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sel value={String(data.eatTime)} onChange={v => update('eatTime', parseInt(v))} options={minOpts(0, 55, 5)} />
                    <span style={{ fontFamily: SEC, fontSize: 14, fontWeight: 500, color: C.black }}>min</span>
                  </div>
                  <HelperText>Plan your meal beforehand</HelperText>
                </Sub>
              </ToggleReveal>
            </div>
            <RowDivider />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <PrimaryLabel>Slow in the morning?</PrimaryLabel>
                <Toggle value={data.doSlowMorning ?? 'no'} onChange={v => update('doSlowMorning', v)} />
              </div>
              <ToggleReveal open={(data.doSlowMorning ?? 'no') === 'yes'}>
                <Sub>
                  <SecLabel>Extra time needed</SecLabel>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sel value={String(data.slowMorningMins ?? 15)} onChange={v => update('slowMorningMins', parseInt(v))} options={minOpts(0, 60, 5)} />
                    <span style={{ fontFamily: SEC, fontSize: 14, fontWeight: 500, color: C.black }}>min</span>
                  </div>
                </Sub>
              </ToggleReveal>
            </div>
          </div>

          {/*  Card 3: Transit  */}
          <div className="rdm-card">
            <SectionHeader label="Transit" totalMins={transitMins} />

            {/* Fixed departure toggle — Major only */}
            <ToggleReveal open={data.raceSize === 'major'}>
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap:24 }}>
                  <PrimaryLabel>Is there a fixed departure time?</PrimaryLabel>
                  <Toggle
                    value={data.doCustomDeadline}
                    onChange={v => {
                      update('doCustomDeadline', v);
                      if (v === 'yes') {
                        // Inject linked leg at index 1 (after Drive)
                        const type = data.customDeadlineType || 'Bus loading';
                        const linkedLeg = type === 'Ferry loading'
                          ? { mode: 'Ferry', hours: 0, minutes: 30, _anchorLinked: true, _displayLabel: 'Ferry' }
                          : type === 'Other'
                            ? { mode: 'Bus', hours: 1, minutes: 0, _anchorLinked: true, _isOtherType: true, _displayLabel: data.customDeadlineName || 'Custom segment' }
                            : type === 'Gate closure'
                              ? { mode: 'Car', hours: 0, minutes: 0, _anchorLinked: true, _isGateClosure: true }
                              : { mode: 'Bus', hours: 1, minutes: 0, _anchorLinked: true, _displayLabel: 'Bus shuttle' };
                        const cur = data.transitLegs || [];
                        const without = cur.filter(l => !l._anchorLinked);
                        if (linkedLeg) {
                          update('transitLegs', [...without, linkedLeg]);
                        } else {
                          update('transitLegs', without);
                        }
                      } else {
                        // Remove anchor-linked leg
                        update('transitLegs', (data.transitLegs || []).filter(l => !l._anchorLinked));
                      }
                    }}
                  />
                </div>
                
                <ToggleReveal open={data.doCustomDeadline === 'yes'}>
                  <Sub>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Sel
                        value={data.customDeadlineType || 'Bus loading'}
                        onChange={v => {
                          update('customDeadlineType', v);
                          // Update the linked leg to match new type
                          const linkedLeg = v === 'Ferry loading'
                            ? { mode: 'Ferry', hours: 0, minutes: 30, _anchorLinked: true, _displayLabel: 'Ferry' }
                            : (v === 'Bus loading')
                              ? { mode: 'Bus', hours: 1, minutes: 0, _anchorLinked: true, _displayLabel: 'Bus shuttle' }
                              : (v === 'Other')
                                ? { mode: 'Bus', hours: 1, minutes: 0, _anchorLinked: true, _isOtherType: true, _displayLabel: data.customDeadlineName || 'Custom segment' }
                                : (v === 'Gate closure')
                                  ? { mode: 'Car', hours: 0, minutes: 0, _anchorLinked: true, _isGateClosure: true }
                                  : null;
                          const cur = data.transitLegs || [];
                          const without = cur.filter(l => !l._anchorLinked);
                          if (linkedLeg) {
                            update('transitLegs', [...without, linkedLeg]);
                          } else {
                            update('transitLegs', without);
                          }
                        }}
                        options={['Bus loading', 'Ferry loading', 'Gate closure', 'Other'].map(v => ({ value: v, label: v }))}
                        width={190}
                      />
                      <span style={{ fontFamily: SEC, fontSize: 14, fontWeight: 500, color: C.black }}>at</span>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <select value={data.customDeadlineTime || '05:00'} onChange={e => update('customDeadlineTime', e.target.value)} style={{ height: 44, padding: '0 36px 0 16px', fontFamily: SEC, fontSize: 14, fontWeight: 500, color: C.black, background: 'transparent', border: `1px solid ${C.grey}`, borderRadius: 9, outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', minWidth: 130 }}>
                          {TIME_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ color: C.black, background: C.white }}>{o.label}</option>)}
                        </select>
                        <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}><ChevronDown color={C.black} size={32} /></span>
                      </div>
                    </div>
                    <ToggleReveal open={data.customDeadlineType === 'Other'}>
                      <Sub>
                        <input type="text" placeholder="e.g. Shuttle bus" value={data.customDeadlineName || ''} onChange={e => {
                          const name = e.target.value;
                          update('customDeadlineName', name);
                          // Keep the _displayLabel on the Other-type linked leg in sync
                          const updated = (data.transitLegs || []).map(l =>
                            l._anchorLinked && l._isOtherType ? { ...l, _displayLabel: name || 'Custom segment' } : l
                          );
                          update('transitLegs', updated);
                        }} style={{ width: '100%', height: 44, padding: '0 12px', fontFamily: SEC, fontSize: 14, fontWeight: 500, color: C.black, background: 'transparent', border: `1px solid ${C.grey}`, borderRadius: 9, outline: 'none', boxSizing: 'border-box', display: 'block' }} />
                        <HelperText>Add a custom name to your deadline.</HelperText>
                      </Sub>
                    </ToggleReveal>
                  </Sub>
                </ToggleReveal>
                <div style={{marginTop:16}}>{data.customDeadlineType !== 'Other' && <HelperText>Use this if you have a specific bus, ferry, or shuttle departure that your morning is anchored to</HelperText>}</div>
              </div>
              <RowDivider />
            </ToggleReveal>
            
            {/* Segment list */}
            <div>
              <PrimaryLabel>How are you getting there?</PrimaryLabel>
              <div ref={listRef} style={{ display: 'flex', flexDirection: 'column' }}>
                {(() => {
                  const isGateClosure = isFixedDep && anchorType === 'Gate closure';
                  // Show the rail whenever there is more than one visual row in the list
                  const showRail = displaySlots.length > 1;

                  return displaySlots.map((slot, slotIdx) => {
                    const isThisSlotDragging = dragActive && dragSlotIdx === slotIdx;
                    const isLastSlot = slotIdx === displaySlots.length - 1;

                    //  BLOCK SLOT: anchor node + linked leg (Bus shuttle / Ferry / Other) 
                    // The block is NEVER draggable — it is a fixed reference point.
                    // Only the free slots above/below it move.
                    if (slot.type === 'block') {
                      const linkedLeg = slot.legs[0]; // the _anchorLinked leg
                      // Block is never "dragging" (canDrag=false), but handle the theoretical case
                      return (
                        <div key="block" data-slot={slotIdx}>
                          {/* Anchor node row */}
                          <div style={{ display: 'flex', marginTop: 16 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 8, flexShrink: 0, marginRight: 13 }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.accent2, flexShrink: 0, marginTop: 16 }} />
                              {!isGateClosure && (
                                <div style={{ flex: 1, width: 2, borderLeft: `2px solid ${C.accent2}`, minHeight: 16, marginBottom: -34 }} />
                              )}
                            </div>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', height: 44, padding: '0 12px', background: 'rgba(224,224,224,0.3)', border: `1px dashed ${C.grey}`, borderRadius: 9 }}>
                              <span style={{ marginRight: 8, display: 'flex', alignItems: 'center' }}><AnchorIcon type={anchorType} color={C.black} size={20} /></span>
                              <span style={{ fontFamily: SEC, fontSize: 14, fontWeight: 500, color: C.black }}>{anchorDisplayLabel}</span>
                            </div>
                          </div>
                          {/* Linked leg card (Bus shuttle / Ferry / Other-type) — not shown for Gate closure */}
                          {!isGateClosure && (
                            <div style={{ marginTop: 16 }}>
                              <SegmentCard
                                leg={linkedLeg}
                                isLast={isLastSlot}
                                showRail={showRail}
                                isLocked={true}
                                dotColor={C.accent2}
                                canDrag={false}
                                onHandlePointerDown={() => {}}
                                onEdit={() => {}}
                                onRemove={() => {}}
                              />
                            </div>
                          )}
                        </div>
                      );
                    }

                    //  FREE SLOT 
                    const leg     = slot.legs[0];
                    const origIdx = slot.legIndices[0];

                    if (isThisSlotDragging) {
                      return (
                        <div key={`free-${slotIdx}`} data-slot={slotIdx} style={{ marginTop: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {showRail && <div style={{ width: 8, flexShrink: 0, marginRight: 8 }} />}
                            <div style={{ flex: 1, height: 44, borderRadius: 9, border: `2px dashed ${C.grey2}`, opacity: 0.45 }} />
                            {canDragSlots && <div style={{ width: 28, flexShrink: 0 }} />}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={`free-${slotIdx}`} data-slot={slotIdx} style={{ marginTop: 16 }}>
                        <SegmentCard
                          leg={leg}
                          isLast={isLastSlot}
                          showRail={showRail}
                          isLocked={false}
                          dotColor={C.grey}
                          canDrag={canDragSlots}
                          onHandlePointerDown={e => handleHandlePointerDown(slotIdx, e)}
                          onEdit={p => updateLeg(origIdx, p)}
                          onRemove={() => removeLeg(origIdx)}
                        />
                      </div>
                    );
                  });
                })()}
              </div>
              <AddSegmentButton onAdd={legData => addLeg(legData)} />
            </div>

            {/* Floating drag clone — fixed position, follows pointer, no interaction */}
            {dragActive && dragSession && dragSlotIdx !== null && listRef.current && (() => {
              const floatingSlot = dragSession.slots[dragSlotIdx];
              if (!floatingSlot) return null;
              const listRect = listRef.current.getBoundingClientRect();
              const isGateClosure = isFixedDep && anchorType === 'Gate closure';

              const renderFloatContent = () => {
                // Only free slots are ever dragged — block is never draggable
                const leg = floatingSlot.legs[0];
                return <SegmentCard leg={leg} isLast showRail={false} isLocked={false} isFloating canDrag={false} dotColor={C.grey} onHandlePointerDown={() => {}} onEdit={() => {}} onRemove={() => {}} />;
              };

              return (
                <div className="rdm-dragbar" style={{
                  position: 'fixed',
                  left: (listRect.left)+29,
                  width: listRect.width,
                  top: floatY - 22,
                  zIndex: 1000,
                  pointerEvents: 'none',
                  transform: 'scale(1.00)',
                  transformOrigin: 'center top',
                  filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.10)) drop-shadow(0 2px 4px rgba(0,0,0,0.12))',
                }}>
                  {renderFloatContent()}
                </div>
              );
            })()}
            <RowDivider />
            
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <PrimaryLabel>Adjust for weather?</PrimaryLabel>
                <Toggle value={data.weatherBuffer} onChange={v => update('weatherBuffer', v)} />
              </div>
              <ToggleReveal open={data.weatherBuffer === 'yes'}>
                <Sub>
                  <SecLabel>How much extra time?</SecLabel>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sel value={String(data.weatherBufferMins || 5)} onChange={v => update('weatherBufferMins', parseInt(v))} options={minOpts(5, 60, 5)} />
                    <span style={{ fontFamily: SEC, fontSize: 14, fontWeight: 500, color: C.black }}>min</span>
                  </div>
                </Sub>
              </ToggleReveal>
            </div>
          </div>

          {/*  Card 4: Pre-Race  */}
          <div className="rdm-card">
            <SectionHeader label="Pre-Race" totalMins={preRaceMins} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <PrimaryLabel>Going through security?</PrimaryLabel>
                <Toggle value={data.doSecurity} onChange={v => update('doSecurity', v)} />
              </div>
              <ToggleReveal open={data.doSecurity === 'yes'}>
                <Sub><SecLabel>Lineup time</SecLabel><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Sel value={String(data.security)} onChange={v => update('security', parseInt(v))} options={minOpts(0, 60, 5)} /><span style={{ fontFamily: SEC, fontSize: 14, fontWeight: 500, color: C.black }}>min</span></div></Sub>
              </ToggleReveal>
            </div>
            <RowDivider />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <PrimaryLabel>Bag check?</PrimaryLabel>
                <Toggle value={data.doBagCheck} onChange={v => update('doBagCheck', v)} />
              </div>
              <ToggleReveal open={data.doBagCheck === 'yes'}>
                <Sub><SecLabel>Lineup time</SecLabel><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Sel value={String(data.bagCheck)} onChange={v => update('bagCheck', parseInt(v))} options={minOpts(0, 60, 5)} /><span style={{ fontFamily: SEC, fontSize: 14, fontWeight: 500, color: C.black }}>min</span></div></Sub>
              </ToggleReveal>
            </div>
            <RowDivider />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <PrimaryLabel>Bathroom pre-race?</PrimaryLabel>
                <Toggle value={data.doBathroomPreRace} onChange={v => update('doBathroomPreRace', v)} />
              </div>
              <ToggleReveal open={data.doBathroomPreRace === 'yes'}>
                <Sub>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
                    <div style={{ marginBottom: 8 }}><SecLabel>Lineup time</SecLabel><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Sel value={String(data.bathroomPreRace)} onChange={v => update('bathroomPreRace', parseInt(v))} options={minOpts(0, 55, 5)} /><span style={{ fontFamily: SEC, fontSize: 14, fontWeight: 500, color: C.black }}>min</span></div></div>
                    <div style={{ marginBottom: 8 }}><SecLabel>How long to use</SecLabel><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Sel value={String(data.bathroomUseTime || 5)} onChange={v => update('bathroomUseTime', parseInt(v))} options={minOpts(0, 15, 1)} /><span style={{ fontFamily: SEC, fontSize: 14, fontWeight: 500, color: C.black }}>min</span></div></div>
                    <div><SecLabel>Number of times</SecLabel><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Sel value={String(data.bathroomCount || 1)} onChange={v => update('bathroomCount', parseInt(v))} options={Array.from({ length: 5 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))} /><span style={{ fontFamily: SEC, fontSize: 14, fontWeight: 500, color: C.black }}>{(data.bathroomCount || 1) === 1 ? 'time' : 'times'}</span></div></div>
                    {(() => {
                      const wait = parseInt(data.bathroomPreRace) || 0;
                      const use  = parseInt(data.bathroomUseTime) || 0;
                      const count = parseInt(data.bathroomCount) || 1;
                      const total = (wait + use) * count;
                      if (total === 0) return null;
                      const expr = count > 1 ? `(${wait} + ${use}) × ${count} = ${total} min total` : `${wait} + ${use} = ${total} min total`;
                      return <div style={{ display: 'flex' }}><CalcRow text={expr} /></div>;
                    })()}
                  </div>
                </Sub>
              </ToggleReveal>
            </div>
            <RowDivider />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <PrimaryLabel>Warm up?</PrimaryLabel>
                <Toggle value={data.doWarmup} onChange={v => update('doWarmup', v)} />
              </div>
              <ToggleReveal open={data.doWarmup === 'yes'}>
                <Sub>
                  <div style={{ marginBottom: 24 }}>
                    <SecLabel>How far is your warm up?</SecLabel>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Sel value={String(parseFloat(data.warmupDistance || 0.5).toFixed(1))} onChange={v => update('warmupDistance', parseFloat(v))} options={distOpts} />
                      <Sel value={data.distanceUnit} onChange={v => update('distanceUnit', v)} options={['km', 'mi']} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <SecLabel>What is your warm up pace?</SecLabel>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                      <Sel value={paceMin} onChange={v => update('warmupPaceSeconds', parseInt(v) * 60 + parseInt(paceSec))} options={paceMinOpts} />
                      <span style={{ fontFamily: SEC, fontSize: 18, color: C.grey, margin: '0 4px' }}>:</span>
                      <Sel value={paceSec} onChange={v => update('warmupPaceSeconds', parseInt(paceMin) * 60 + parseInt(v))} options={paceSecOpts} />
                      <span style={{ fontFamily: SEC, fontSize: 14, fontWeight: 500, color: C.black, marginLeft: 8 }}>min/{data.distanceUnit}</span>
                    </div>
                  </div>
                  {warmupTotalMins > 0 && <CalcRow text={warmupCalcText} />}
                </Sub>
              </ToggleReveal>
            </div>
            <ToggleReveal open={data.doWarmup === 'yes'}>
              <div style={{ marginTop: 16 }}>
                <RowDivider />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <PrimaryLabel>Bathroom post warm up?</PrimaryLabel>
                    <Toggle value={data.doBathroomPostWarmup ?? 'no'} onChange={v => update('doBathroomPostWarmup', v)} />
                  </div>
                  <ToggleReveal open={(data.doBathroomPostWarmup ?? 'no') === 'yes'}>
                    <Sub>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
                        <div><SecLabel>Lineup time</SecLabel><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Sel value={String(data.bathroomPostWarmup ?? 5)} onChange={v => update('bathroomPostWarmup', parseInt(v))} options={minOpts(0, 55, 5)} /><span style={{ fontFamily: SEC, fontSize: 14, fontWeight: 500, color: C.black }}>min</span></div></div>
                        <div><SecLabel>How long to use</SecLabel><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Sel value={String(data.bathroomPostWarmupUseTime ?? 5)} onChange={v => update('bathroomPostWarmupUseTime', parseInt(v))} options={minOpts(0, 15, 1)} /><span style={{ fontFamily: SEC, fontSize: 14, fontWeight: 500, color: C.black }}>min</span></div></div>
                        <div><SecLabel>Number of times</SecLabel><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Sel value={String(data.bathroomPostWarmupCount ?? 1)} onChange={v => update('bathroomPostWarmupCount', parseInt(v))} options={Array.from({ length: 5 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))} /><span style={{ fontFamily: SEC, fontSize: 14, fontWeight: 500, color: C.black }}>{(data.bathroomPostWarmupCount ?? 1) === 1 ? 'time' : 'times'}</span></div></div>
                        {(() => {
                          const wait = parseInt(data.bathroomPostWarmup) || 0;
                          const use  = parseInt(data.bathroomPostWarmupUseTime) || 0;
                          const count = parseInt(data.bathroomPostWarmupCount) || 1;
                          const total = (wait + use) * count;
                          if (total === 0) return null;
                          const expr = count > 1 ? `(${wait} + ${use}) × ${count} = ${total} min total` : `${wait} + ${use} = ${total} min total`;
                          return <div style={{ display: 'flex' }}><CalcRow text={expr} /></div>;
                        })()}
                      </div>
                    </Sub>
                  </ToggleReveal>
                </div>
              </div>
            </ToggleReveal>
            <RowDivider />
            <div>
              <PrimaryLabel>Find your corral</PrimaryLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <Sel value={String(data.coralTime)} onChange={v => update('coralTime', parseInt(v))} options={minOpts(5, 30, 5)} />
                <span style={{ fontFamily: SEC, fontSize: 14, fontWeight: 500, color: C.black }}>min</span>
              </div>
              <HelperText>Consider security checks and crowd size.</HelperText>
            </div>
          </div>

          {/* XS sticky alarm — inside rdm-page-left so sticky has a tall parent to travel within */}
          <div className="sticky bottom-2 left-0 z-[200] w-full pointer-events-auto pb-2 sm:hidden">
            <AlarmWidget wakeUpTime={timeline.wakeUpTime} raceDate={data.raceDate} visible={true} isXsInline={true} />
          </div>

          <ResultCardV2 timeline={timeline} />

        </div>{/* end rdm-page-left */}

        {/* Right column: alarm widget sticky (XL only) */}
          <div
            ref={rightColRef}
            className="hidden sm:block"
            style={{
              flex: '0 0 auto',
              width: 'auto',
              position: 'relative',
            }}
          >
            <AlarmWidget wakeUpTime={timeline.wakeUpTime} raceDate={data.raceDate} visible={true} isXlCol={true} />
          </div>

      </div>{/* end rdm-page-layout */}

    </div>
  );
}
