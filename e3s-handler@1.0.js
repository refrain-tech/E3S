/**
 * @overview e3s-handler@1.0.js E3Sのイベント系統の制御プログラム
 * @author Refrain <refrain.tech@gmail.com>
 * @since 2020/8/27
 * @version 1.0
 * @copyright (c) Copyright 2020 Refrain All Rights Reserved.
 */
'use strict';
/** @type {HTMLElement} GUI部品を取得する */
const TZg6mWYC = document.querySelector('#TZg6mWYC');
const H0jP0Xr4 = document.querySelector('#H0jP0Xr4');
const UJNWVR0g = document.querySelector('#UJNWVR0g');
const ZHgPpUJS = document.querySelector('#ZHgPpUJS');
const iophZzyF = document.querySelector('#iophZzyF');
const GFZYmEFU = document.querySelector('#GFZYmEFU');
const QR0Oq3bL = document.querySelector('#QR0Oq3bL');
const az1m1nnB = document.querySelector('#az1m1nnB');
const NMQr9RMs = document.querySelector('#NMQr9RMs');
const F8tWfFbD = document.querySelector('#F8tWfFbD');
const Dekkg8Z2 = document.querySelector('#Dekkg8Z2');
const dJLELTrV = document.querySelector('#dJLELTrV');
const YR6JWQam = document.querySelector('#YR6JWQam');
/** @summary イベントハンドラの登録 */
TZg6mWYC.addEventListener('change', onChange, false);
F8tWfFbD.addEventListener('click', onClick, false);
Dekkg8Z2.addEventListener('click', onClick, false);
dJLELTrV.addEventListener('click', onClick, false);
document.addEventListener('dragover', onDragover, false);
document.addEventListener('drop', onDrop, false);
/**
 * @function onChange changeイベント用の関数
 * @argument {Event} event changeイベント
 * @this {HTMLElement} イベントの発生したHTML要素
 */
function onChange (event) {
  switch (this) {
    case TZg6mWYC:
      loadConfig(this.files[0]);
      break;
    default:
      break;
  }
}
/**
 * @function onClick clickイベント用の関数
 * @argument {Event} event clickイベント
 * @this {HTMLElement} イベントの発生したHTML要素
 */
function onClick (event) {
  switch (this) {
    case F8tWfFbD:
      const date = Date.now();
      iophZzyF.value = date.getFullYear();
      GFZYmEFU.value = date.getMonth() + 1;
      QR0Oq3bL.value = date.getDate();
      az1m1nnB.value = date.getHours();
      NMQr9RMs.value = date.getMinutes();
      break;
    case Dekkg8Z2:
      init();
      while (main());
      break;
    case dJLELTrV:
      document.addEventListener('copy', onCopy, false);
      document.execCommand('copy');
      break;
    default:
      break;
  }
}
/**
 * @function onCopy copyイベント用の関数
 * @argument {Event} event copyイベント
 */
function onCopy (event) {
  const text = [ ].map.call(YR6JWQam.rows, row => [ ].map.call(row.cells, cell => cell.textContent).join('\t')).join('\n');
  event.clipboardData.setData('text/plain', text);
  event.preventDefault();
  document.removeEventListener('copy', onCopy, false);
}
/**
 * @function onDragover dragoverイベント用の関数
 * @argument {Event} event dragoverイベント
 * @this {HTMLElement} イベントの発生したHTML要素
 */
function onDragover (event) {
  switch (this) {
    case document:
      event.stopPropagation();
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
      break;
    default:
      break;
  }
}
/**
 * @function onDrop dropイベント用の関数
 * @argument {Event} event dropイベント
 * @this {HTMLElement} イベントの発生したHTML要素
 */
function onDrop (event) {
  switch (this) {
    case document:
      const file = event.dataTransfer.files[0];
      event.stopPropagation();
      event.preventDefault();
      loadConfig(file);
      break;
    default:
      break;
  }
}
