/**
 * @overview e3s-core@1.0.js E3Sの制御プログラム
 * @author Refrain <refrain.tech@gmail.com>
 * @since 2020/8/27
 * @version 1.0
 * @copyright (c) Copyright 2020 Refrain All Rights Reserved.
 */
'use strict';
/** @type {Array<Number | String>} 走査中に得られたデータの保存先 */
const CACHE_DATA = [ ];
/** @type {Array<String>} 試験ができない(= 設備が動いていない)期間のリスト */
const IM_LIST = [ ];
/** @type {Array<String>} 対応ができない(= 設備が動いている)日付のリスト */
const HO_LIST = [ ];
/** @type {RegExp} フォーマット確認用の正規表現 */
const IM_PATTERN = /^\d{4}\/\d{2}\/\d{2}\s\d{2}:\d{2}~\d{4}\/\d{2}\/\d{2}\s\d{2}:\d{2}_.+$/;
/** @type {RegExp} フォーマット確認用の正規表現 */
const HO_PATTERN = /^\d{4}\/\d{2}\/\d{2}$/;
/** @type {Date} タスクの開始時点のDateオブジェクト */
let baseDate;
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
/**
 * @function loadConfig コンフィグファイルの読み込み
 * @argument {File} file 読み込み対象のファイル
 */
function loadConfig (file) {
  IM_LIST.length = 0;
  HO_LIST.length = 0;
  readFile(file).then(result => {
    result.replace(/\r/g, '').split('\n').forEach(value => {
      switch (true) {
        case IM_PATTERN.test(value):
          IM_LIST.push(value.split(/[~_]/));
          break;
        case HO_PATTERN.test(value):
          HO_LIST.push(value);
          break;
        default:
          break;
      }
    });
    window.alert('読み込みが完了しました。');
  }).catch(error => {
    window.alert('読み込みに失敗しました。');
    console.error(error);
  });
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
 * @function init 全データの初期化処理
 */
function init () {
  total = 0;
  base = parseInt(H0jP0Xr4.value);
  limit = parseInt(UJNWVR0g.value);
  span = parseInt(ZHgPpUJS.value);
  loop = (base / span) | 0;
  disableTime = -7 * loop; // 開始時点で蓄積される停止時間を相殺する
  baseDate = new Date(`${iophZzyF.value}/${GFZYmEFU.value}/${QR0Oq3bL.value} ${az1m1nnB.value}:${NMQr9RMs.value}`);
  refDate = new Date(baseDate); // オブジェクトは参照渡しになるので、baseDateを引数に作成する
  CACHE_DATA.length = 0;
  YR6JWQam.querySelector('tbody').innerHTML = '';
}
/**
 * @function main 日程演算のメイン部
 * @description 1. refDateのデータを保存する
 *              2. 10時に設定する(標準的な停止時刻)
 *              3. 経過時間を更新し、経過時間 < ループ回数 x スパンか、休日判定であればrefDateを翌日に変更する
 *              4. 設備を停止させる日なら、trueを返して関数を抜け、親ループを継続する
 *              5. refDateのデータを保存する
 *              6. 経過時間と停止理由(停止させないので'')を保存する
 *              7. データをテーブルに出力する
 *              8. ループ回数を+1する
 *              9. 17時に設定する(標準的な再開時刻)
 *              10. 経過時間が上限に達しているかを返し、親ループを制御する
 */
function main () {
  toCache();                                                           // 1
  setDate(10);                                                         // 2
  while ((total = getTotal()) < span * (loop + 1) || checkHoliday()) { // 3
    refDate.setDate(refDate.getDate() + 1);
    if (checkImmobile()) return true;                                  // 4
  }
  toCache();                                                           // 5
  CACHE_DATA.push(total, total - total % span);                        // 6
  arr2table();                                                         // 7
  loop ++;                                                             // 8
  setDate(17);                                                         // 9
  return total < limit;                                                // 10
}
/**
 * @function toCache refDateの各値を保存する
 */
function toCache () {
  CACHE_DATA.push(refDate.getFullYear(), refDate.getMonth() + 1, refDate.getDate(), refDate.getHours(), refDate.getMinutes());
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
 * @description 開始～現在までの時間から、7時間と設備が停止していた時間を引き、開始時点で経過していた時間を足す
 */
function getTotal () {
  return ms2hr(refDate.getTime() - baseDate.getTime()) - 7 * loop - disableTime + base;
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
  return HO_LIST.includes(format()[0]) || refDate.isWeekend();
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
 *              7. 経過時間と停止理由を保存する
 *              8. データをテーブルに出力する
 *              9. refDateを再開日にする
 *              10. refDate - stopDateで停止させていた時間を取得する
 *              11. trueを返し関数を終了し、親ループを終了する
 *              12. falseを返し関数を終了し、親ループを継続する
 */
function checkImmobile () {
  let stop, restart, reason;
  for (const item of IM_LIST) {                               // 1
    [ stop, restart, reason ] = item;                         // 2
    if (format()[0] !== stop.split(' ')[0]) continue;         // 3
    refDate = new Date(stop);                                 // 4
    toCache();                                                // 5
    total = getTotal();                                       // 6
    CACHE_DATA.push(total, reason);                           // 7
    arr2table();                                              // 8
    const temp = new Date(restart);                           // 9
    disableTime += ms2hr(temp.getTime() - refDate.getTime()); // 10
    refDate = temp;
    return true;                                              // 11
  }
  return false;                                               // 12
}
/**
 * @function format 参照中のDateオブジェクトを任意の形式に変換する
 * @return {Array<String>} 指定形式([ YYYY/MM/DD, hh:mm ])に変換されたrefDate
 */
function format () {
  return [
    `${refDate.getFullYear()}/${pad0(refDate.getMonth() + 1, 2)}/${pad0(refDate.getDate(), 2)}`,
    `${pad0(refDate.getHours(), 2)}:${pad0(refDate.getMinutes(), 2)}`
  ];
}
/**
 * @function pad0 数値の先頭を0で埋め、指定の桁数で返す
 * @argument {Number} value 0で埋める値
 * @argument {Number} length 切り取る桁数
 * @return {String} 0で埋めて切り取られた文字列
 */
function pad0 (value, length) {
  return ('0'.repeat(length) + value).slice(-length);
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
