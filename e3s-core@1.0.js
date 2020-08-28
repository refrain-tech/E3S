/**
 * @overview e3s-core@1.0.js E3Sの制御プログラム
 * @author Refrain <refrain.tech@gmail.com>
 * @since 2020/8/27
 * @version 1.0
 * @copyright (c) Copyright 2020 Refrain All Rights Reserved.
 */
'use strict';
/** @type {HTMLElement} GUI部品を取得する */
const bC5BNbE0 = document.querySelector('#pickImmobileList');
const TZg6mWYC = document.querySelector('#pickHolidayList');
const H0jP0Xr4 = document.querySelector('#inputStart');
const UJNWVR0g = document.querySelector('#inputFinish');
const ZHgPpUJS = document.querySelector('#inputSpan');
const SlJmrB3l = document.querySelector('#clickImmobileListPicker');
const F8tWfFbD = document.querySelector('#clickHolidayListPicker');
const iophZzyF = document.querySelector('#inputYear');
const GFZYmEFU = document.querySelector('#inputMonth');
const QR0Oq3bL = document.querySelector('#inputDate');
const az1m1nnB = document.querySelector('#inputHour');
const NMQr9RMs = document.querySelector('#inputMinute');
const Dekkg8Z2 = document.querySelector('#runButton');
const dJLELTrV = document.querySelector('#copyButton');
const YR6JWQam = document.querySelector('#resultTable');
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
bC5BNbE0.addEventListener('change', onChange, false);
TZg6mWYC.addEventListener('change', onChange, false);
SlJmrB3l.addEventListener('click', onClick, false);
F8tWfFbD.addEventListener('click', onClick, false);
Dekkg8Z2.addEventListener('click', onClick, false);
dJLELTrV.addEventListener('click', onClick, false);
/**
 * @function onChange changeイベント用の関数
 * @argument {Event} event changeイベント
 * @this {HTMLElement} changeイベントの発生したHTML要素
 * @description 1. ファイルを読み込ませる
 *              2. 読み込んだデータの改行シーケンスから\rを削除する
 *              3. 改行シーケンスで区切った配列にする
 *              4. フォーマットに従ったデータだけを抽出する
 */
function onChange (event) {
  switch (this) {
    case bC5BNbE0:
      readFile(this.files[0]).then(result => {
        imList = result.replace(/\r/g, '')
                       .split('\n')
                       .filter(currentValue => IM_PATTERN.test(currentValue))
                       .map(currentValue => currentValue.split(/[~_]/));
      });
      break;
    case TZg6mWYC:
      readFile(this.files[0]).then(result => {
        hoList = result.replace(/\r/g, '')
                       .split('\n')
                       .filter(currentValue => HO_PATTERN.test(currentValue));
      });
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
    case SlJmrB3l:
      bC5BNbE0.click();
      break;
    case F8tWfFbD:
      TZg6mWYC.click();
      break;
    case Dekkg8Z2:
      initialize();
      while (main());
      break;
    case dJLELTrV:
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
  const text = [ ].map.call(YR6JWQam.rows, row => [ ].map.call(row.cells, cell => cell.textContent).join('\t')).join('\n');
  event.clipboardData.setData('text/plain', text);
  event.preventDefault();
  document.removeEventListener('copy', onCopy, false);
}
/**
 * @function readFile ファイルを読み込む
 * @argument {File} file 読み込む対象のFileオブジェクト
 * @return {Promise} 読み込みを実行するPromiseオブジェクト
 */
function readFile (file) {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.addEventListener('error', event => reject(fileReader.error), false);
    fileReader.addEventListener('load', event => resolve(fileReader.result), false);
    fileReader.readAsText(file, 'utf-8');
  });
}
/**
 * @function initialize 全データの初期化処理
 */
function initialize () {
  total = 0;
  base = parseInt(H0jP0Xr4.value);
  limit = parseInt(UJNWVR0g.value);
  span = parseInt(ZHgPpUJS.value);
  loop = (base / span) | 0;
  disableTime = -7 * loop; // 開始時点で蓄積される停止時間を相殺する
  refDate = new Date(`${iophZzyF.value}/${GFZYmEFU.value}/${QR0Oq3bL.value} ${az1m1nnB.value}:${NMQr9RMs.value}`);
  baseMS = refDate.getTime();
  imList = [ ];
  hoList = [ ];
  CACHE_DATA.length = 0;
  YR6JWQam.querySelector('tbody').innerHTML = '';
}
/**
 * @function main 日程演算のメイン部
 * @description 1. refDateのデータを保存する
 *              2. 10時に設定する(標準的な停止時刻)
 *              3. 経過時間を更新し、経過時間がループ回数 x スパンに満たないか、休日判定であればrefDateを翌日に変更する
 *              4. 設備を停止させる日なら、trueを返して関数を抜け、親ループを継続する
 *              5. refDateのデータを保存する
 *              6. 経過時間と停止理由(停止させないので'')を保存する
 *              7. データをテーブルに出力する
 *              8. ループ回数を+1する
 *              9. 17時に設定する(標準的な再開時刻)
 *              10. 経過時間が上限に達していないならtrueを返し、親ループを継続する
 */
function main () {
  toCache();                                                           // 1
  setDate(10);                                                         // 2
  while ((total = getTotal()) < span * (loop + 1) || checkHoliday()) { // 3
    refDate.setDate(refDate.getDate() + 1);
    if (checkImmobile()) return true;                                  // 4
  }
  toCache();                                                           // 5
  CACHE_DATA.push(total, '');                                          // 6
  arr2table();                                                         // 7
  loop ++;                                                             // 8
  setDate(17);                                                         // 9
  return total < limit;                                                // 10
}
/**
 * @function toCache Dateオブジェクトの各値を保存する
 * @argument {Date} [date = refDate] 保存するDateオブジェクト
 */
function toCache (date = refDate) {
  CACHE_DATA.push(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes());
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
 * @function getTotal 経過時間を計算する
 * @return {Number} (現在時刻 - 開始時刻) - 7 x ループ回数 - 停止時間 + 初期時間
 * @description 開始～現在までの時間から、検査の為に取り出していた時間(7時間)と設備が停止していた時間を引き、
 *              開始時点で経過していた時間を足す
 */
function getTotal () {
  return ms2hr(refDate.getTime() - baseMS) - 7 * loop - disableTime + base;
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
 * @function checkHoliday 参照中の日時が休日(hoListに含まれるか土日)かを取得する
 * @return {Boolean} 参照中の日時が休日か否か
 */
function checkHoliday () {
  return hoList.includes(format()[0]) || refDate.isWeekend();
}
/**
 * @function checkImmobile imListに含まれる場合に計算を中断させる
 * @return {Boolean} 参照日時がimListに含まれていたか
 * @description 1. imListをfor...ofでループする
 *              2. 得られたデータをそれぞれの変数に代入する
 *              3. refDateの日付と停止日が一致しなければ、ループを再開する
 *              4. 停止日をDateオブジェクトにする
 *              5. stopDateのデータを保存する
 *              6. 経過時間を更新する
 *              7. refDateを再開日にする
 *              8. refDate - stopDateで停止させていた時間を取得する
 *              9. 経過時間と停止理由を保存する
 *              10. データをテーブルに出力する
 *              11. 経過時間がループ数 x スパンを超えている場合、ループ数を+1する
 *              12. trueを返し関数を終了し、親ループを終了する
 *              13. falseを返し関数を終了し、親ループを継続する
 */
function checkImmobile () {
  let stop, restart, reason;
  for (const item of imList) {                                    // 1
    [ stop, restart, reason ] = item;                             // 2
    if (format()[0] !== stop.split(' ')[0]) continue;             // 3
    const stopDate = new Date(stop);                              // 4
    toCache(stopDate);                                            // 5
    total = getTotal();                                           // 6
    refDate = new Date(restart);                                  // 7
    disableTime += ms2hr(refDate.getTime() - stopDate.getTime()); // 8
    CACHE_DATA.push(total, reason);                               // 9
    arr2table();                                                  // 10
    if (total >= (loop + 1) * span) loop ++;                      // 11
    return true;                                                  // 12
  }
  return false;                                                   // 13
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
  YR6JWQam.querySelector('tbody').appendChild(tr);
  CACHE_DATA.length = 0;
}
