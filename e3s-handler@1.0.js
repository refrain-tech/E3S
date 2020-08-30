/**
 * @overview e3s-handler@1.0.js E3Sの制御プログラム
 * @author Refrain <refrain.tech@gmail.com>
 * @since 2020/8/27
 * @version 1.0
 * @copyright (c) Copyright 2020 Refrain All Rights Reserved.
 */
'use strict';
/** @type {HTMLElement} GUI部品を取得する */
const bC5BNbE0 = document.querySelector('#bC5BNbE0');
const TZg6mWYC = document.querySelector('#TZg6mWYC');
const H0jP0Xr4 = document.querySelector('#H0jP0Xr4');
const UJNWVR0g = document.querySelector('#UJNWVR0g');
const ZHgPpUJS = document.querySelector('#ZHgPpUJS');
const SlJmrB3l = document.querySelector('#SlJmrB3l');
const F8tWfFbD = document.querySelector('#F8tWfFbD');
const iophZzyF = document.querySelector('#iophZzyF');
const GFZYmEFU = document.querySelector('#GFZYmEFU');
const QR0Oq3bL = document.querySelector('#QR0Oq3bL');
const az1m1nnB = document.querySelector('#az1m1nnB');
const NMQr9RMs = document.querySelector('#NMQr9RMs');
const Dekkg8Z2 = document.querySelector('#Dekkg8Z2');
const dJLELTrV = document.querySelector('#dJLELTrV');
const YR6JWQam = document.querySelector('#YR6JWQam');
/** @summary イベントハンドラの登録 */
bC5BNbE0.addEventListener('change', onChange, false);
TZg6mWYC.addEventListener('change', onChange, false);
SlJmrB3l.addEventListener('click', onClick, false);
F8tWfFbD.addEventListener('click', onClick, false);
Dekkg8Z2.addEventListener('click', onClick, false);
dJLELTrV.addEventListener('click', onClick, false);
SlJmrB3l.addEventListener('dragover', onDragover, false);
F8tWfFbD.addEventListener('dragover', onDragover, false);
SlJmrB3l.addEventListener('drop', onDrop, false);
F8tWfFbD.addEventListener('drop', onDrop, false);
/**
 * @function onChange changeイベント用の関数
 * @argument {Event} event changeイベント
 * @this {HTMLElement} イベントの発生したHTML要素
 */
function onChange (event) {
  switch (this) {
    case bC5BNbE0:
      loadImList(this.files[0]);
      break;
    case TZg6mWYC:
      loadHoList(this.files[0]);
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
    case SlJmrB3l:
      bC5BNbE0.click();
      break;
    case F8tWfFbD:
      TZg6mWYC.click();
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
    case SlJmrB3l:
    case F8tWfFbD:
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
    case SlJmrB3l:
    case F8tWfFbD:
      const file = event.dataTransfer.files[0];
      event.stopPropagation();
      event.preventDefault();
      this === SlJmrB3l ? loadImList(file) : loadHoList(file);
      break;
    default:
      break;
  }
}
