'use strict';
const pickImmobileList = document.querySelector('#pickImmobileList'),
      pickHolidayList = document.querySelector('#pickHolidayList'),
      inputStart = document.querySelector('#inputStart'),
      inputFinish = document.querySelector('#inputFinish'),
      inputSpan = document.querySelector('#inputSpan'),
      clickImmobileListPicker = document.querySelector('#clickImmobileListPicker'),
      clickHolidayListPicker = document.querySelector('#clickHolidayListPicker'),
      inputYear = document.querySelector('#inputYear'),
      inputMonth = document.querySelector('#inputMonth'),
      inputDate = document.querySelector('#inputDate'),
      inputHour = document.querySelector('#inputHour'),
      inputMinute = document.querySelector('#inputMinute'),
      runButton = document.querySelector('#runButton'),
      copyButton = document.querySelector('#copyButton'),
      resultTable = document.querySelector('#resultTable');
const CACHE_DATA = [ ];
const IM_PATTERN = /\d{4}\/\d{2}\/\d{2}\s\d{2}:\d{2}~\d{4}\/\d{2}\/\d{2}\s\d{2}:\d{2}_.+/;
const HO_PATTERN = /\d{4}\/\d{2}\/\d{2}/;
/** @type {Number} タスクの開始時点の時間(ミリ秒) */
let base;
/** @type {Number} タスクが実施されていない時間の総和(誤差補正に使用する) */
let dis;
/** @type {Number} タスクが終了する上限値 */
let finish;
/** @type {Number} タスクの行われた回数(誤差補正に使用する) */
let loop;
/** @type {Number} タスク毎の時間 */
let span;
/** @type {Number} タスクの開始時点での経過時間 */
let start;
/** @type {Date} 参照を続けるDateオブジェクト */
let temp;
/** @type {Number} タスクの経過時間 */
let total;
/** @type {Array<String>} 試験ができない(= 設備が動いていない)期間のリスト */
let imList = [ ];
/** @type {Array<String>} 対応ができない(= 設備が動いている)日付のリスト */
let hoList = [ ];
/** @summary イベントハンドラの登録 */
// pickImmobileList.addEventListener('change', onChange, false);
// pickHolidayList.addEventListener('change', onChange, false);
// clickImmobileListPicker.addEventListener('click', onClick, false);
// clickHolidayListPicker.addEventListener('click', onClick, false);
runButton.addEventListener('click', onClick, false);
copyButton.addEventListener('click', onClick, false);
/**
 * @function onChange HTML要素のchangeイベント用の関数
 * @argument {Event} event changeイベント
 * @this {HTMLElement} changeイベントの発生したHTML要素
 */
function onChange (event) {
  switch (this) {
    case pickImmobileList:
      fetch(this.files[0]).then(response => response.text())
                          .then(text => {
        imList = text.replace(/\r/g, '')
                     .split('\n')
                     .filter(currentValue => IM_PATTERN.test(currentValue))
                     .map(currentValue => currentValue.split(/[~_]/));
      });
      break;
    case pickHolidayList:
      fetch(this.files[0]).then(response => response.text())
                          .then(text => {
        hoList = text.replace(/\r/g, '')
                     .split('\n')
                     .filter(currentValue => HO_PATTERN.test(currentValue));
      });
      break;
  }
}
/**
 * @function onClick HTML要素のclickイベント用の関数
 * @argument {Event} event clickイベント
 * @this {HTMLElement} clickイベントの発生したHTML要素
 */
function onClick (event) {
  switch (this) {
    case clickImmobileListPicker:
      pickImmobileList.click();
      break;
    case clickHolidayListPicker:
      pickHolidayList.click();
      break;
    case runButton:
      initialize();
      while (main());
      break;
    case copyButton:
      copyElement(resultTable);
      break;
  }
}
/**
 * @function onClick 変数の初期化
 */
function initialize () {
  start = parseInt(inputStart.value);
  finish = parseInt(inputFinish.value);
  span = parseInt(inputSpan.value);
  total = 0;
  loop = Math.floor(start/span);
  dis = 0;
  temp = new Date(`${inputYear.value}/${inputMonth.value}/${inputDate.value} ${inputHour.value}:${inputMinute.value}`);
  base = temp.getTime();
  CACHE_DATA.length = 0;
  resultTable.querySelector('tbody').innerHTML = '';
}
/**
 * @function main 日程演算のメイン部
 */
function main () {
  save();
  update(10);
  while ((total = parse(temp.getTime() - base) - 7 * loop - dis + start) < span * (loop + 1) || checkHoliday(temp)) {
    temp.setDate(temp.getDate() + 1);
    if (checkImmobile()) return true;
  }
  save();
  CACHE_DATA.push(total);
  CACHE_DATA.push('');
  output();
  loop ++;
  update(17);
  return total < finish;
}
/**
 * @function update Dateオブジェクトを任意の時間に設定する(指定時間が参照時間より前なら、翌日に補正する)
 * @argument {Number} hour 設定する時間(0 ~ 23に変換される)
 */
function update (hour) {
  hour %= 24;
  if (temp.getHours() > hour) temp.setDate(temp.getDate() + 1);
  temp.setHours(hour);
}
/**
 * @function parse ミリ秒を時間に変換する
 * @argument {Number} millisecond 変換するミリ秒
 * @return {Number} 変換後の時間
 */
function parse (millisecond) {
  return (millisecond / 3600000) | 0;
}
/**
 * @function checkImmobile imListに含まれる場合に計算を中断させる
 * @return {Boolean} 参照日時がimListに含まれていたか
 */
function checkImmobile () {
  let flag = false, stop, restart, reason;
  imList.forEach(currentValue => {
    [ stop, restart, reason ] = currentValue;
    if (format()[0] === stop.split(' ')[0]) {
      const stopDate = new Date(stop);
      save(stopDate);
      total = parse(stopDate.getTime() - base) - 7 * loop - dis + start;
      temp = new Date(restart);
      dis += parse(temp.getTime() - stopDate.getTime());
      flag = true;
      CACHE_DATA.push(total);
      CACHE_DATA.push(reason);
      output();
      if (total >= (loop + 1) * span) loop ++;
    }
  });
  return flag;
}
/**
 * @function format 参照中のDateオブジェクトを任意の形式に変換する
 * @return {Array<String>} 指定形式([ YYYY/MM/DD, hh:mm ])に変換された日時
 */
function format () {
  return [
    `${temp.getFullYear()}/${temp.getMonth() + 1}/${temp.getDate()}`,
    `${temp.getHours()}:${temp.getMinutes()}`
  ];
}
/**
 * @function save Dateオブジェクトの各値を保存する
 * @argument {Date} [date = temp] 保存するDateオブジェクト
 */
function save (date = temp) {
  CACHE_DATA.push(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes());
}
/**
 * @function output 得られた日程データをテーブルに出力する
 */
function output () {
  const tr = document.createElement('tr');
  let td;
  CACHE_DATA.forEach(currentValue => {
    td = document.createElement('td');
    td.textContent = currentValue;
    tr.appendChild(td);
  });
  resultTable.querySelector('tbody').appendChild(tr);
  CACHE_DATA.length = 0;
}
/**
 * @function checkHoliday 参照中の日時が休日(hoListに含まれるか土日)かを取得する
 * @return {Boolean} 参照中の日時が休日か否か
 */
function checkHoliday () {
  return hoList.includes(format()[0]) || temp.getDay() % 6 === 0;
}
/**
 * @function copyElement HTML要素をクリップボードにコピーする
 * @argument {HTMLElement} element コピーするHTML要素
 */
function copyElement (element) {
  const range = document.createRange();
  range.selectNode(element);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  document.execCommand('copy');
  selection.removeRange(range);
}
