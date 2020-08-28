/**
 * @overview e3s-core@1.0.js E3Sの制御プログラム
 * @author Refrain <refrain.tech@gmail.com>
 * @since 2020/8/27
 * @version 1.0
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
let baseMS;
/** @type {Number} タスクが実施されていない時間の総和(誤差補正に使用する) */
let disableTime;
/** @type {Number} タスクが終了する上限値 */
let limit;
/** @type {Number} タスクの行われた回数(誤差補正に使用する) */
let loop;
/** @type {Number} タスク毎の時間 */
let span;
/** @type {Number} タスクの開始時点での経過時間 */
let base;
/** @type {Date} 参照を続けるDateオブジェクト */
let refDate;
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
 * @function onChange changeイベント用の関数
 * @argument {Event} event changeイベント
 * @this {HTMLElement} changeイベントの発生したHTML要素
 * @description 1. ファイルを読み込ませる
 *              2. 読み込んだデータの改行シーケンスから\rを削除する
 *              3. 改行シーケンスで区切った配列にする
 *              4. フォーマットに従ったデータだけを抽出する
 * @todo ローカルファイルはfetch出来ない(fakepathになる)ので、FileReaderを使用する
 */
function onChange (event) {
  switch (this) {
    case pickImmobileList:
      fetch(this.files[0]).then(response => response.text()).then(text => (imList = text.replace(/\r/g, '').split('\n').filter(currentValue => IM_PATTERN.test(currentValue)).map(currentValue => currentValue.split(/[~_]/))));
      break;
    case pickHolidayList:
      fetch(this.files[0]).then(response => response.text()).then(text => (hoList = text.replace(/\r/g, '').split('\n').filter(currentValue => HO_PATTERN.test(currentValue))));
      break;
  }
}
/**
 * @function onClick clickイベント用の関数
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
      document.addEventListener('copy', onCopy, false);
      document.execCommand('copy');
      break;
  }
}
/**
 * @function onCopy copyイベント用の関数
 * @argument {Event} event clickイベント
 * @description 1. テーブルのセルの値を\tと\nで結合する
 *              2. データをclipboardDataに渡す
 *              3. イベントをキャンセルする
 *              4. イベントハンドラを削除する
 */
function onCopy (event) {
  const text = [ ].map.call(resultTable.rows, row => [ ].map.call(row.cells, cell => cell.textContent).join('\t')).join('\n');
  event.clipboardData.setData('text/plain', text);
  event.preventDefault();
  document.removeEventListener('copy', onCopy, false);
}
/**
 * @function initialize 全データの初期化処理
 */
function initialize () {
  total = 0;
  disableTime = 0;
  base = parseInt(inputStart.value);
  limit = parseInt(inputFinish.value);
  span = parseInt(inputSpan.value);
  loop = (base / span) | 0;
  refDate = new Date(`${inputYear.value}/${inputMonth.value}/${inputDate.value} ${inputHour.value}:${inputMinute.value}`);
  baseMS = refDate.getTime();
  imList = [ ];
  hoList = [ ];
  CACHE_DATA.length = 0;
  resultTable.querySelector('tbody').innerHTML = '';
}
/**
 * @function main 日程演算のメイン部
 * @description 1. refDateのデータを保存する
 *              2. 10時に設定する(標準的な停止時刻)
 *              3. 経過時間がループ回数 x スパンに満たないか、休日判定であればrefDateを翌日に変更する
 *              4. 設備を停止させる日なら、trueを返して関数を抜け、親ループを継続する
 *              5. refDateのデータを保存する
 *              6. 経過時間と停止理由(停止させないので'')を保存する
 *              7. データをテーブルに出力する
 *              8. ループ回数を加算する
 *              9. 17時に設定する(標準的な再開時刻)
 *              10. 経過時間が上限に達していないならtrueを返し、親ループを継続する
 */
function main () {
  toCache();
  setDate(10);
  while ((total = getTotal()) < span * (loop + 1) || checkHoliday()) {
    refDate.setDate(refDate.getDate() + 1);
    if (checkImmobile()) return true;
  }
  toCache();
  CACHE_DATA.push(total);
  CACHE_DATA.push('');
  arr2table();
  loop ++;
  setDate(17);
  return total < limit;
}
/**
 * @function getTotal 経過時間を計算する
 * @return {Number} (現在時刻 - 開始時刻) - 7 x ループ回数 - 停止時間 + 初期時間
 * @description 開始～現在までの時間から、検査の為に取り出していた時間(7時間)と設備が停止していた時間を引き、
 *              開始時点で経過していた時間を足す
 */
function getTotal () {
  return ms2hr(refDate.getTime() - baseMS) - 7 * loop - disableTime + base;
}
/**
 * @function setDate refDateを任意の時間に設定する(指定時間が参照時間より前なら、翌日に補正する)
 * @argument {Number} hour 設定する時間(0 ~ 23に変換される)
 */
function setDate (hour) {
  hour %= 24;
  if (refDate.getHours() > hour) refDate.setDate(refDate.getDate() + 1);
  refDate.setHours(hour);
}
/**
 * @function ms2hr ミリ秒を時間に変換する
 * @argument {Number} ms 変換するミリ秒
 * @return {Number} 変換後の時間
 */
function ms2hr (ms) {
  return (ms / 3600000) | 0;
}
/**
 * @function checkImmobile imListに含まれる場合に計算を中断させる
 * @return {Boolean} 参照日時がimListに含まれていたか
 * @description
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
      toCache(stopDate);
      // 経過時間の総和を更新する
      total = getTotal();
      // 再開させる日時からDateオブジェクトを生成する
      refDate = new Date(restart);
      // 停止させていた時間を加算する
      disableTime += ms2hr(refDate.getTime() - stopDate.getTime());
      // データを保存
      CACHE_DATA.push(total);
      // データを保存
      CACHE_DATA.push(reason);
      // データを吐き出す
      arr2table();
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
 * @return {Array<String>} 指定形式([ YYYY/MM/DD, hh:mm ])に変換されたrefDate
 */
function format () {
  return [
    `${refDate.getFullYear()}/${refDate.getMonth() + 1}/${refDate.getDate()}`,
    `${refDate.getHours()}:${refDate.getMinutes()}`
  ];
}
/**
 * @function toCache Dateオブジェクトの各値を保存する
 * @argument {Date} [date = refDate] 保存するDateオブジェクト
 */
function toCache (date = refDate) {
  CACHE_DATA.push(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes());
}
/**
 * @function arr2table 得られた日程データをテーブルに出力する
 */
function arr2table () {
  const tr = document.createElement('tr');
  let td;
  for (const data of CACHE_DATA) {
    td = document.createElement('td');
    td.textContent = data;
    tr.appendChild(td);
  }
  resultTable.querySelector('tbody').appendChild(tr);
  CACHE_DATA.length = 0;
}
/**
 * @function checkHoliday 参照中の日時が休日(hoListに含まれるか土日)かを取得する
 * @return {Boolean} 参照中の日時が休日か否か
 */
function checkHoliday () {
  return hoList.includes(format()[0]) || refDate.isWeekend();
}
