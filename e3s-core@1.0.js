/**
 * @overview e3s-core@1.0.js E3Sの制御プログラム
 * @author Refrain <refrain.tech@gmail.com>
 * @since 2020/8/27
 * @copyright (c) Copyright 2020 Refrain All Rights Reserved.
 */
'use strict';
/** @type {HTMLElement} GUI部品を取得する */
// const pickImmobileList = document.querySelector('#pickImmobileList');
// const pickHolidayList = document.querySelector('#pickHolidayList');
const inputStart = document.querySelector('#inputStart');
const inputFinish = document.querySelector('#inputFinish');
const inputSpan = document.querySelector('#inputSpan');
// const clickImmobileListPicker = document.querySelector('#clickImmobileListPicker');
// const clickHolidayListPicker = document.querySelector('#clickHolidayListPicker');
const inputYear = document.querySelector('#inputYear');
const inputMonth = document.querySelector('#inputMonth');
const inputDate = document.querySelector('#inputDate');
const inputHour = document.querySelector('#inputHour');
const inputMinute = document.querySelector('#inputMinute');
const runButton = document.querySelector('#runButton');
const copyButton = document.querySelector('#copyButton');
const resultTable = document.querySelector('#resultTable');
/** @type {Array<Number | String>} 走査中に得られたデータの保存先 */
const CACHE_DATA = [ ];
/** @type {RegExp} フォーマット確認用の正規表現 */
const IM_PATTERN = /\d{4}\/\d{2}\/\d{2}\s\d{2}:\d{2}~\d{4}\/\d{2}\/\d{2}\s\d{2}:\d{2}_.+/;
/** @type {RegExp} フォーマット確認用の正規表現 */
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
let imList;
/** @type {Array<String>} 対応ができない(= 設備が動いている)日付のリスト */
let hoList;
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
 * @function onClick 全データの初期化処理
 */
function initialize () {
  start = parseInt(inputStart.value);
  span = parseInt(inputSpan.value);
  total = 0;
  base = temp.getTime();
  dis = 0;
  finish = parseInt(inputFinish.value);
  loop = (start / span) | 0;
  temp = new Date(`${inputYear.value}/${inputMonth.value}/${inputDate.value} ${inputHour.value}:${inputMinute.value}`);
  imList = [ ];
  hoList = [ ];
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
  let stop, restart, reason;
  // imListを走査する
  for (const item of imList) {
    // 停止させる日時、再開させる日時、停止させる理由を取得する
    [ stop, restart, reason ] = item;
    // 参照中の日付が停止させる日付と一致した場合
    if (format()[0] === stop.split(' ')[0]) {
      // 停止させる日時からDateオブジェクトを生成する
      const stopDate = new Date(stop);
      // データを保存
      save(stopDate);
      // 経過時間の総和を更新する
      // 経過時間の総和 = 停止させた時間 - 最初の開始時間 - 7(10時から17時までの7時間) x 実施回数 - 停止させる時間 + 開始時点で経過している時間
      total = parse(stopDate.getTime() - base) - 7 * loop - dis + start;
      // 再開させる日時からDateオブジェクトを生成する
      temp = new Date(restart);
      // 停止させていた時間を加算する
      dis += parse(temp.getTime() - stopDate.getTime());
      // データを保存
      CACHE_DATA.push(total);
      // データを保存
      CACHE_DATA.push(reason);
      // データを吐き出す
      output();
      // 経過時間の総和が実施回数 x タスク毎の時間を超えていた場合、回数を+1する
      // t時間で停止させるのに2t時間が経過していた場合、ループ回数の修正が必要
      if (total >= (loop + 1) * span) loop ++;
      // 走査を終了する
      return true;
    }
  }
  return false;
}
/**
 * @function format 参照中のDateオブジェクトを任意の形式に変換する
 * @return {Array<String>} 指定形式([ YYYY/MM/DD, hh:mm ])に変換されたDateオブジェクト
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
  // 全データを<td>要素として出力する
  CACHE_DATA.forEach(currentValue => {
    td = document.createElement('td');
    td.textContent = currentValue;
    tr.appendChild(td);
  });
  // テーブル上に出力する
  resultTable.querySelector('tbody').appendChild(tr);
  // データの破棄
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
