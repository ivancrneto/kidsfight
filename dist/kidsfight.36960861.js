// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

(function (
  modules,
  entry,
  mainEntry,
  parcelRequireName,
  externals,
  distDir,
  publicUrl,
  devServer
) {
  /* eslint-disable no-undef */
  var globalObject =
    typeof globalThis !== 'undefined'
      ? globalThis
      : typeof self !== 'undefined'
      ? self
      : typeof window !== 'undefined'
      ? window
      : typeof global !== 'undefined'
      ? global
      : {};
  /* eslint-enable no-undef */

  // Save the require from previous bundle to this closure if any
  var previousRequire =
    typeof globalObject[parcelRequireName] === 'function' &&
    globalObject[parcelRequireName];

  var importMap = previousRequire.i || {};
  var cache = previousRequire.cache || {};
  // Do not use `require` to prevent Webpack from trying to bundle this call
  var nodeRequire =
    typeof module !== 'undefined' &&
    typeof module.require === 'function' &&
    module.require.bind(module);

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        if (externals[name]) {
          return externals[name];
        }
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire =
          typeof globalObject[parcelRequireName] === 'function' &&
          globalObject[parcelRequireName];
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error("Cannot find module '" + name + "'");
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = (cache[name] = new newRequire.Module(name));

      modules[name][0].call(
        module.exports,
        localRequire,
        module,
        module.exports,
        globalObject
      );
    }

    return cache[name].exports;

    function localRequire(x) {
      var res = localRequire.resolve(x);
      return res === false ? {} : newRequire(res);
    }

    function resolve(x) {
      var id = modules[name][1][x];
      return id != null ? id : x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.require = nodeRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.distDir = distDir;
  newRequire.publicUrl = publicUrl;
  newRequire.devServer = devServer;
  newRequire.i = importMap;
  newRequire.register = function (id, exports) {
    modules[id] = [
      function (require, module) {
        module.exports = exports;
      },
      {},
    ];
  };

  // Only insert newRequire.load when it is actually used.
  // The code in this file is linted against ES5, so dynamic import is not allowed.
  function $parcel$resolve(url) {  url = importMap[url] || url;  return import.meta.resolve(distDir + url);}newRequire.resolve = $parcel$resolve;

  Object.defineProperty(newRequire, 'root', {
    get: function () {
      return globalObject[parcelRequireName];
    },
  });

  globalObject[parcelRequireName] = newRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (mainEntry) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(mainEntry);

    // CommonJS
    if (typeof exports === 'object' && typeof module !== 'undefined') {
      module.exports = mainExports;

      // RequireJS
    } else if (typeof define === 'function' && define.amd) {
      define(function () {
        return mainExports;
      });
    }
  }
})({"io2N8":[function(require,module,exports,__globalThis) {
var global = arguments[3];
var HMR_HOST = null;
var HMR_PORT = null;
var HMR_SERVER_PORT = 1234;
var HMR_SECURE = false;
var HMR_ENV_HASH = "439701173a9199ea";
var HMR_USE_SSE = false;
module.bundle.HMR_BUNDLE_ID = "ba2beaa036960861";
"use strict";
/* global HMR_HOST, HMR_PORT, HMR_SERVER_PORT, HMR_ENV_HASH, HMR_SECURE, HMR_USE_SSE, chrome, browser, __parcel__import__, __parcel__importScripts__, ServiceWorkerGlobalScope */ /*::
import type {
  HMRAsset,
  HMRMessage,
} from '@parcel/reporter-dev-server/src/HMRServer.js';
interface ParcelRequire {
  (string): mixed;
  cache: {|[string]: ParcelModule|};
  hotData: {|[string]: mixed|};
  Module: any;
  parent: ?ParcelRequire;
  isParcelRequire: true;
  modules: {|[string]: [Function, {|[string]: string|}]|};
  HMR_BUNDLE_ID: string;
  root: ParcelRequire;
}
interface ParcelModule {
  hot: {|
    data: mixed,
    accept(cb: (Function) => void): void,
    dispose(cb: (mixed) => void): void,
    // accept(deps: Array<string> | string, cb: (Function) => void): void,
    // decline(): void,
    _acceptCallbacks: Array<(Function) => void>,
    _disposeCallbacks: Array<(mixed) => void>,
  |};
}
interface ExtensionContext {
  runtime: {|
    reload(): void,
    getURL(url: string): string;
    getManifest(): {manifest_version: number, ...};
  |};
}
declare var module: {bundle: ParcelRequire, ...};
declare var HMR_HOST: string;
declare var HMR_PORT: string;
declare var HMR_SERVER_PORT: string;
declare var HMR_ENV_HASH: string;
declare var HMR_SECURE: boolean;
declare var HMR_USE_SSE: boolean;
declare var chrome: ExtensionContext;
declare var browser: ExtensionContext;
declare var __parcel__import__: (string) => Promise<void>;
declare var __parcel__importScripts__: (string) => Promise<void>;
declare var globalThis: typeof self;
declare var ServiceWorkerGlobalScope: Object;
*/ var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;
function Module(moduleName) {
    OldModule.call(this, moduleName);
    this.hot = {
        data: module.bundle.hotData[moduleName],
        _acceptCallbacks: [],
        _disposeCallbacks: [],
        accept: function(fn) {
            this._acceptCallbacks.push(fn || function() {});
        },
        dispose: function(fn) {
            this._disposeCallbacks.push(fn);
        }
    };
    module.bundle.hotData[moduleName] = undefined;
}
module.bundle.Module = Module;
module.bundle.hotData = {};
var checkedAssets /*: {|[string]: boolean|} */ , disposedAssets /*: {|[string]: boolean|} */ , assetsToDispose /*: Array<[ParcelRequire, string]> */ , assetsToAccept /*: Array<[ParcelRequire, string]> */ , bundleNotFound = false;
function getHostname() {
    return HMR_HOST || (typeof location !== 'undefined' && location.protocol.indexOf('http') === 0 ? location.hostname : 'localhost');
}
function getPort() {
    return HMR_PORT || (typeof location !== 'undefined' ? location.port : HMR_SERVER_PORT);
}
// eslint-disable-next-line no-redeclare
let WebSocket = globalThis.WebSocket;
if (!WebSocket && typeof module.bundle.root === 'function') try {
    // eslint-disable-next-line no-global-assign
    WebSocket = module.bundle.root('ws');
} catch  {
// ignore.
}
var hostname = getHostname();
var port = getPort();
var protocol = HMR_SECURE || typeof location !== 'undefined' && location.protocol === 'https:' && ![
    'localhost',
    '127.0.0.1',
    '0.0.0.0'
].includes(hostname) ? 'wss' : 'ws';
// eslint-disable-next-line no-redeclare
var parent = module.bundle.parent;
if (!parent || !parent.isParcelRequire) {
    // Web extension context
    var extCtx = typeof browser === 'undefined' ? typeof chrome === 'undefined' ? null : chrome : browser;
    // Safari doesn't support sourceURL in error stacks.
    // eval may also be disabled via CSP, so do a quick check.
    var supportsSourceURL = false;
    try {
        (0, eval)('throw new Error("test"); //# sourceURL=test.js');
    } catch (err) {
        supportsSourceURL = err.stack.includes('test.js');
    }
    var ws;
    if (HMR_USE_SSE) ws = new EventSource('/__parcel_hmr');
    else try {
        // If we're running in the dev server's node runner, listen for messages on the parent port.
        let { workerData, parentPort } = module.bundle.root('node:worker_threads') /*: any*/ ;
        if (workerData !== null && workerData !== void 0 && workerData.__parcel) {
            parentPort.on('message', async (message)=>{
                try {
                    await handleMessage(message);
                    parentPort.postMessage('updated');
                } catch  {
                    parentPort.postMessage('restart');
                }
            });
            // After the bundle has finished running, notify the dev server that the HMR update is complete.
            queueMicrotask(()=>parentPort.postMessage('ready'));
        }
    } catch  {
        if (typeof WebSocket !== 'undefined') try {
            ws = new WebSocket(protocol + '://' + hostname + (port ? ':' + port : '') + '/');
        } catch (err) {
            // Ignore cloudflare workers error.
            if (err.message && !err.message.includes('Disallowed operation called within global scope')) console.error(err.message);
        }
    }
    if (ws) {
        // $FlowFixMe
        ws.onmessage = async function(event /*: {data: string, ...} */ ) {
            var data /*: HMRMessage */  = JSON.parse(event.data);
            await handleMessage(data);
        };
        if (ws instanceof WebSocket) {
            ws.onerror = function(e) {
                if (e.message) console.error(e.message);
            };
            ws.onclose = function() {
                console.warn("[parcel] \uD83D\uDEA8 Connection to the HMR server was lost");
            };
        }
    }
}
async function handleMessage(data /*: HMRMessage */ ) {
    checkedAssets = {} /*: {|[string]: boolean|} */ ;
    disposedAssets = {} /*: {|[string]: boolean|} */ ;
    assetsToAccept = [];
    assetsToDispose = [];
    bundleNotFound = false;
    if (data.type === 'reload') fullReload();
    else if (data.type === 'update') {
        // Remove error overlay if there is one
        if (typeof document !== 'undefined') removeErrorOverlay();
        let assets = data.assets;
        // Handle HMR Update
        let handled = assets.every((asset)=>{
            return asset.type === 'css' || asset.type === 'js' && hmrAcceptCheck(module.bundle.root, asset.id, asset.depsByBundle);
        });
        // Dispatch a custom event in case a bundle was not found. This might mean
        // an asset on the server changed and we should reload the page. This event
        // gives the client an opportunity to refresh without losing state
        // (e.g. via React Server Components). If e.preventDefault() is not called,
        // we will trigger a full page reload.
        if (handled && bundleNotFound && assets.some((a)=>a.envHash !== HMR_ENV_HASH) && typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') handled = !window.dispatchEvent(new CustomEvent('parcelhmrreload', {
            cancelable: true
        }));
        if (handled) {
            console.clear();
            // Dispatch custom event so other runtimes (e.g React Refresh) are aware.
            if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') window.dispatchEvent(new CustomEvent('parcelhmraccept'));
            await hmrApplyUpdates(assets);
            hmrDisposeQueue();
            // Run accept callbacks. This will also re-execute other disposed assets in topological order.
            let processedAssets = {};
            for(let i = 0; i < assetsToAccept.length; i++){
                let id = assetsToAccept[i][1];
                if (!processedAssets[id]) {
                    hmrAccept(assetsToAccept[i][0], id);
                    processedAssets[id] = true;
                }
            }
        } else fullReload();
    }
    if (data.type === 'error') {
        // Log parcel errors to console
        for (let ansiDiagnostic of data.diagnostics.ansi){
            let stack = ansiDiagnostic.codeframe ? ansiDiagnostic.codeframe : ansiDiagnostic.stack;
            console.error("\uD83D\uDEA8 [parcel]: " + ansiDiagnostic.message + '\n' + stack + '\n\n' + ansiDiagnostic.hints.join('\n'));
        }
        if (typeof document !== 'undefined') {
            // Render the fancy html overlay
            removeErrorOverlay();
            var overlay = createErrorOverlay(data.diagnostics.html);
            // $FlowFixMe
            document.body.appendChild(overlay);
        }
    }
}
function removeErrorOverlay() {
    var overlay = document.getElementById(OVERLAY_ID);
    if (overlay) {
        overlay.remove();
        console.log("[parcel] \u2728 Error resolved");
    }
}
function createErrorOverlay(diagnostics) {
    var overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    let errorHTML = '<div style="background: black; opacity: 0.85; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; font-family: Menlo, Consolas, monospace; z-index: 9999;">';
    for (let diagnostic of diagnostics){
        let stack = diagnostic.frames.length ? diagnostic.frames.reduce((p, frame)=>{
            return `${p}
<a href="${protocol === 'wss' ? 'https' : 'http'}://${hostname}:${port}/__parcel_launch_editor?file=${encodeURIComponent(frame.location)}" style="text-decoration: underline; color: #888" onclick="fetch(this.href); return false">${frame.location}</a>
${frame.code}`;
        }, '') : diagnostic.stack;
        errorHTML += `
      <div>
        <div style="font-size: 18px; font-weight: bold; margin-top: 20px;">
          \u{1F6A8} ${diagnostic.message}
        </div>
        <pre>${stack}</pre>
        <div>
          ${diagnostic.hints.map((hint)=>"<div>\uD83D\uDCA1 " + hint + '</div>').join('')}
        </div>
        ${diagnostic.documentation ? `<div>\u{1F4DD} <a style="color: violet" href="${diagnostic.documentation}" target="_blank">Learn more</a></div>` : ''}
      </div>
    `;
    }
    errorHTML += '</div>';
    overlay.innerHTML = errorHTML;
    return overlay;
}
function fullReload() {
    if (typeof location !== 'undefined' && 'reload' in location) location.reload();
    else if (typeof extCtx !== 'undefined' && extCtx && extCtx.runtime && extCtx.runtime.reload) extCtx.runtime.reload();
    else try {
        let { workerData, parentPort } = module.bundle.root('node:worker_threads') /*: any*/ ;
        if (workerData !== null && workerData !== void 0 && workerData.__parcel) parentPort.postMessage('restart');
    } catch (err) {
        console.error("[parcel] \u26A0\uFE0F An HMR update was not accepted. Please restart the process.");
    }
}
function getParents(bundle, id) /*: Array<[ParcelRequire, string]> */ {
    var modules = bundle.modules;
    if (!modules) return [];
    var parents = [];
    var k, d, dep;
    for(k in modules)for(d in modules[k][1]){
        dep = modules[k][1][d];
        if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) parents.push([
            bundle,
            k
        ]);
    }
    if (bundle.parent) parents = parents.concat(getParents(bundle.parent, id));
    return parents;
}
function updateLink(link) {
    var href = link.getAttribute('href');
    if (!href) return;
    var newLink = link.cloneNode();
    newLink.onload = function() {
        if (link.parentNode !== null) // $FlowFixMe
        link.parentNode.removeChild(link);
    };
    newLink.setAttribute('href', // $FlowFixMe
    href.split('?')[0] + '?' + Date.now());
    // $FlowFixMe
    link.parentNode.insertBefore(newLink, link.nextSibling);
}
var cssTimeout = null;
function reloadCSS() {
    if (cssTimeout || typeof document === 'undefined') return;
    cssTimeout = setTimeout(function() {
        var links = document.querySelectorAll('link[rel="stylesheet"]');
        for(var i = 0; i < links.length; i++){
            // $FlowFixMe[incompatible-type]
            var href /*: string */  = links[i].getAttribute('href');
            var hostname = getHostname();
            var servedFromHMRServer = hostname === 'localhost' ? new RegExp('^(https?:\\/\\/(0.0.0.0|127.0.0.1)|localhost):' + getPort()).test(href) : href.indexOf(hostname + ':' + getPort());
            var absolute = /^https?:\/\//i.test(href) && href.indexOf(location.origin) !== 0 && !servedFromHMRServer;
            if (!absolute) updateLink(links[i]);
        }
        cssTimeout = null;
    }, 50);
}
function hmrDownload(asset) {
    if (asset.type === 'js') {
        if (typeof document !== 'undefined') {
            let script = document.createElement('script');
            script.src = asset.url + '?t=' + Date.now();
            if (asset.outputFormat === 'esmodule') script.type = 'module';
            return new Promise((resolve, reject)=>{
                var _document$head;
                script.onload = ()=>resolve(script);
                script.onerror = reject;
                (_document$head = document.head) === null || _document$head === void 0 || _document$head.appendChild(script);
            });
        } else if (typeof importScripts === 'function') {
            // Worker scripts
            if (asset.outputFormat === 'esmodule') return import(asset.url + '?t=' + Date.now());
            else return new Promise((resolve, reject)=>{
                try {
                    importScripts(asset.url + '?t=' + Date.now());
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });
        }
    }
}
async function hmrApplyUpdates(assets) {
    global.parcelHotUpdate = Object.create(null);
    let scriptsToRemove;
    try {
        // If sourceURL comments aren't supported in eval, we need to load
        // the update from the dev server over HTTP so that stack traces
        // are correct in errors/logs. This is much slower than eval, so
        // we only do it if needed (currently just Safari).
        // https://bugs.webkit.org/show_bug.cgi?id=137297
        // This path is also taken if a CSP disallows eval.
        if (!supportsSourceURL) {
            let promises = assets.map((asset)=>{
                var _hmrDownload;
                return (_hmrDownload = hmrDownload(asset)) === null || _hmrDownload === void 0 ? void 0 : _hmrDownload.catch((err)=>{
                    // Web extension fix
                    if (extCtx && extCtx.runtime && extCtx.runtime.getManifest().manifest_version == 3 && typeof ServiceWorkerGlobalScope != 'undefined' && global instanceof ServiceWorkerGlobalScope) {
                        extCtx.runtime.reload();
                        return;
                    }
                    throw err;
                });
            });
            scriptsToRemove = await Promise.all(promises);
        }
        assets.forEach(function(asset) {
            hmrApply(module.bundle.root, asset);
        });
    } finally{
        delete global.parcelHotUpdate;
        if (scriptsToRemove) scriptsToRemove.forEach((script)=>{
            if (script) {
                var _document$head2;
                (_document$head2 = document.head) === null || _document$head2 === void 0 || _document$head2.removeChild(script);
            }
        });
    }
}
function hmrApply(bundle /*: ParcelRequire */ , asset /*:  HMRAsset */ ) {
    var modules = bundle.modules;
    if (!modules) return;
    if (asset.type === 'css') reloadCSS();
    else if (asset.type === 'js') {
        let deps = asset.depsByBundle[bundle.HMR_BUNDLE_ID];
        if (deps) {
            if (modules[asset.id]) {
                // Remove dependencies that are removed and will become orphaned.
                // This is necessary so that if the asset is added back again, the cache is gone, and we prevent a full page reload.
                let oldDeps = modules[asset.id][1];
                for(let dep in oldDeps)if (!deps[dep] || deps[dep] !== oldDeps[dep]) {
                    let id = oldDeps[dep];
                    let parents = getParents(module.bundle.root, id);
                    if (parents.length === 1) hmrDelete(module.bundle.root, id);
                }
            }
            if (supportsSourceURL) // Global eval. We would use `new Function` here but browser
            // support for source maps is better with eval.
            (0, eval)(asset.output);
            // $FlowFixMe
            let fn = global.parcelHotUpdate[asset.id];
            modules[asset.id] = [
                fn,
                deps
            ];
        }
        // Always traverse to the parent bundle, even if we already replaced the asset in this bundle.
        // This is required in case modules are duplicated. We need to ensure all instances have the updated code.
        if (bundle.parent) hmrApply(bundle.parent, asset);
    }
}
function hmrDelete(bundle, id) {
    let modules = bundle.modules;
    if (!modules) return;
    if (modules[id]) {
        // Collect dependencies that will become orphaned when this module is deleted.
        let deps = modules[id][1];
        let orphans = [];
        for(let dep in deps){
            let parents = getParents(module.bundle.root, deps[dep]);
            if (parents.length === 1) orphans.push(deps[dep]);
        }
        // Delete the module. This must be done before deleting dependencies in case of circular dependencies.
        delete modules[id];
        delete bundle.cache[id];
        // Now delete the orphans.
        orphans.forEach((id)=>{
            hmrDelete(module.bundle.root, id);
        });
    } else if (bundle.parent) hmrDelete(bundle.parent, id);
}
function hmrAcceptCheck(bundle /*: ParcelRequire */ , id /*: string */ , depsByBundle /*: ?{ [string]: { [string]: string } }*/ ) {
    checkedAssets = {};
    if (hmrAcceptCheckOne(bundle, id, depsByBundle)) return true;
    // Traverse parents breadth first. All possible ancestries must accept the HMR update, or we'll reload.
    let parents = getParents(module.bundle.root, id);
    let accepted = false;
    while(parents.length > 0){
        let v = parents.shift();
        let a = hmrAcceptCheckOne(v[0], v[1], null);
        if (a) // If this parent accepts, stop traversing upward, but still consider siblings.
        accepted = true;
        else if (a !== null) {
            // Otherwise, queue the parents in the next level upward.
            let p = getParents(module.bundle.root, v[1]);
            if (p.length === 0) {
                // If there are no parents, then we've reached an entry without accepting. Reload.
                accepted = false;
                break;
            }
            parents.push(...p);
        }
    }
    return accepted;
}
function hmrAcceptCheckOne(bundle /*: ParcelRequire */ , id /*: string */ , depsByBundle /*: ?{ [string]: { [string]: string } }*/ ) {
    var modules = bundle.modules;
    if (!modules) return;
    if (depsByBundle && !depsByBundle[bundle.HMR_BUNDLE_ID]) {
        // If we reached the root bundle without finding where the asset should go,
        // there's nothing to do. Mark as "accepted" so we don't reload the page.
        if (!bundle.parent) {
            bundleNotFound = true;
            return true;
        }
        return hmrAcceptCheckOne(bundle.parent, id, depsByBundle);
    }
    if (checkedAssets[id]) return null;
    checkedAssets[id] = true;
    var cached = bundle.cache[id];
    if (!cached) return true;
    assetsToDispose.push([
        bundle,
        id
    ]);
    if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
        assetsToAccept.push([
            bundle,
            id
        ]);
        return true;
    }
    return false;
}
function hmrDisposeQueue() {
    // Dispose all old assets.
    for(let i = 0; i < assetsToDispose.length; i++){
        let id = assetsToDispose[i][1];
        if (!disposedAssets[id]) {
            hmrDispose(assetsToDispose[i][0], id);
            disposedAssets[id] = true;
        }
    }
    assetsToDispose = [];
}
function hmrDispose(bundle /*: ParcelRequire */ , id /*: string */ ) {
    var cached = bundle.cache[id];
    bundle.hotData[id] = {};
    if (cached && cached.hot) cached.hot.data = bundle.hotData[id];
    if (cached && cached.hot && cached.hot._disposeCallbacks.length) cached.hot._disposeCallbacks.forEach(function(cb) {
        cb(bundle.hotData[id]);
    });
    delete bundle.cache[id];
}
function hmrAccept(bundle /*: ParcelRequire */ , id /*: string */ ) {
    // Execute the module.
    bundle(id);
    // Run the accept callbacks in the new version of the module.
    var cached = bundle.cache[id];
    if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
        let assetsToAlsoAccept = [];
        cached.hot._acceptCallbacks.forEach(function(cb) {
            let additionalAssets = cb(function() {
                return getParents(module.bundle.root, id);
            });
            if (Array.isArray(additionalAssets) && additionalAssets.length) assetsToAlsoAccept.push(...additionalAssets);
        });
        if (assetsToAlsoAccept.length) {
            let handled = assetsToAlsoAccept.every(function(a) {
                return hmrAcceptCheck(a[0], a[1]);
            });
            if (!handled) return fullReload();
            hmrDisposeQueue();
        }
    }
}

},{}],"bNJxx":[function(require,module,exports,__globalThis) {
// Parcel image imports for Phaser asset loading
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
var _scenario1PngUrl = require("./scenario1.png?url");
var _scenario1PngUrlDefault = parcelHelpers.interopDefault(_scenario1PngUrl);
var _spritesBento3PngUrl = require("./sprites-bento3.png?url");
var _spritesBento3PngUrlDefault = parcelHelpers.interopDefault(_spritesBento3PngUrl);
var _spritesDavir3PngUrl = require("./sprites-davir3.png?url");
var _spritesDavir3PngUrlDefault = parcelHelpers.interopDefault(_spritesDavir3PngUrl);
// Import pure utilities for testability
var _gameUtils = require("./gameUtils");
// Dynamically set game size based on viewport, accounting for mobile browser UI
const GAME_WIDTH = window.innerWidth;
const GAME_HEIGHT = window.innerHeight;
const PLAYER_SIZE = 192;
const PLAYER_SPEED = 200;
const JUMP_VELOCITY = -400;
const GRAVITY = 900;
const ATTACK_RANGE = 100;
const ATTACK_COOLDOWN = 500;
const MAX_HEALTH = 100;
const ROUND_TIME = 60;
// import PlayerSelectScene from './player_select_scene.js';
class KidsFightScene extends Phaser.Scene {
    // --- EFFECTS: Special Effect Helper (Phaser 3.60+ workaround) ---
    showSpecialEffect(x, y, count = 30) {
        if (!this.specialEffect) return;
        this.specialEffect.clear();
        this.specialEffect.setVisible(true);
        this.specialEffect.setAlpha(1);
        this.specialEffect.setScale(1);
        this.specialEffect.lineStyle(8, 0x00eaff, 0.7);
        this.specialEffect.strokeCircle(x, y, 20);
        this.tweens.add({
            targets: this.specialEffect,
            alpha: 0,
            scaleX: 2,
            scaleY: 2,
            duration: 350,
            onComplete: ()=>{
                this.specialEffect.clear();
                this.specialEffect.setVisible(false);
                this.specialEffect.setAlpha(1);
                this.specialEffect.setScale(1);
            }
        });
    }
    constructor(){
        super('KidsFightScene');
        this.lastAttackTime = [
            0,
            0
        ];
        this.attackCount = [
            0,
            0
        ]; // Counts normal attacks landed by each player
        this.lungeTimer = [
            0,
            0
        ]; // Initialize lunge timers for both players
        this.timeLeft = 60;
        this.player1State = 'idle';
        // console.log('[DEBUG] player1State set to:', this.player1State); // 'idle', 'down', 'attack', 'special'
        this.player2State = 'idle';
    // // console.log('[constructor] timeLeft:', this.timeLeft, 'ROUND_TIME:', typeof ROUND_TIME !== 'undefined' ? ROUND_TIME : 'undefined');
    }
    init(data) {
        this.selected = data || {
            p1: 0,
            p2: 1
        };
    }
    preload() {
        // Debug: Print imported image URLs and types
        // console.log('scenario1Img', scenario1Img, typeof scenario1Img);
        // console.log('player1RawImg', player1RawImg, typeof player1RawImg);
        // console.log('player2RawImg', player2RawImg, typeof player2RawImg);
        // Load player sprite sheets (256x256)
        this.load.image('player1_raw', (0, _spritesBento3PngUrlDefault.default));
        this.load.image('player2_raw', (0, _spritesDavir3PngUrlDefault.default));
        // Load scenario background
        this.load.image('scenario1', (0, _scenario1PngUrlDefault.default));
    // Load particle spritesheet for effects
    //this.load.atlas('flares', 'flares.png', 'flares.json');
    }
    create() {
        // --- RESET ALL GAME STATE ON RESTART ---
        this.gameOver = false;
        this.player1State = 'idle';
        this.player2State = 'idle';
        this.lastAttackTime = [
            0,
            0
        ];
        this.attackCount = [
            0,
            0
        ];
        this.lungeTimer = [
            0,
            0
        ];
        this.timeLeft = 60;
        // console.log('[DEBUG] create() this:', this, 'scene key:', this.sys && this.sys.settings && this.sys.settings.key);
        // --- CREATE CUSTOM SPRITESHEETS FIRST ---
        // Player 1
        if (!this.textures.exists('player1')) {
            const frameWidths = [
                300,
                300,
                400,
                460,
                500,
                440,
                440,
                440
            ];
            const frameHeight = 512;
            const player1Texture = this.textures.get('player1_raw').getSourceImage();
            this.textures.addSpriteSheet('player1', player1Texture, {
                frameWidth: 430,
                frameHeight: frameHeight,
                startFrame: 0,
                endFrame: 6
            });
            const tex = this.textures.get('player1');
            tex.frames = {
                __BASE: tex.frames['__BASE']
            };
            let x = 0;
            for(let i = 0; i < frameWidths.length; i++){
                tex.add(i, 0, x, 0, frameWidths[i], frameHeight);
                x += frameWidths[i];
            }
        }
        // Player 2
        if (!this.textures.exists('player2')) {
            const frameWidths2 = [
                300,
                300,
                400,
                460,
                500,
                400,
                400,
                400
            ];
            const frameHeight2 = 512;
            const player2Texture = this.textures.get('player2_raw').getSourceImage();
            this.textures.addSpriteSheet('player2', player2Texture, {
                frameWidth: 400,
                frameHeight: frameHeight2,
                startFrame: 0,
                endFrame: frameWidths2.length - 1
            });
            const tex2 = this.textures.get('player2');
            tex2.frames = {
                __BASE: tex2.frames['__BASE']
            };
            let x2 = 0;
            for(let i = 0; i < frameWidths2.length; i++){
                tex2.add(i, 0, x2, 0, frameWidths2[i], frameHeight2);
                x2 += frameWidths2[i];
            }
        }
        // Add background image
        const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'scenario1').setOrigin(0.5, 0.5);
        bg.displayWidth = GAME_WIDTH;
        bg.displayHeight = GAME_HEIGHT;
        // Ensure world and camera bounds match the visible area (for mobile/responsive)
        const cam = this.cameras.main;
        if (this.isTouch) {
            // Decrease bounds by 10% on each side for mobile
            const padX = cam.width * 0.1;
            const padY = cam.height * 0.05;
            this.physics.world.setBounds(padX, padY, cam.width - 2 * padX, cam.height - 2 * padY);
            this.cameras.main.setBounds(padX, padY, cam.width - 2 * padX, cam.height - 2 * padY);
        } else {
            this.physics.world.setBounds(0, 0, cam.width, cam.height);
            this.cameras.main.setBounds(0, 0, cam.width, cam.height);
        }
        // --- TOUCH CONTROLS ---
        this.touchControls = {
            p1: {},
            p2: {}
        };
        // Robust touch detection (works on iOS and all browsers)
        const debugAlwaysShowTouch = false; // set to true to force show for debugging
        this.isTouch = debugAlwaysShowTouch || typeof window !== 'undefined' && (navigator.maxTouchPoints && navigator.maxTouchPoints > 0 || 'ontouchstart' in window);
        if (this.isTouch) {
            const cam = this.cameras.main;
            const w = cam.width;
            const h = cam.height;
            // Player 1 (left side) - relative positions
            this.touchControls.p1.left = this.add.rectangle(0, 0, 48, 48, 0x444444, 0.7).setInteractive().setDepth(9999);
            this.touchControls.p1.right = this.add.rectangle(0, 0, 48, 48, 0x444444, 0.7).setInteractive().setDepth(9999);
            this.touchControls.p1.jump = this.add.rectangle(0, 0, 48, 48, 0x888888, 0.7).setInteractive().setDepth(9999);
            this.touchControls.p1.down = this.add.rectangle(0, 0, 48, 48, 0x888888, 0.7).setInteractive().setDepth(9999);
            this.touchControls.p1.attack = this.add.circle(0, 0, 30, 0xff4444, 0.8).setInteractive().setDepth(9999);
            this.touchControls.p1.special = this.add.circle(0, 0, 30, 0xffd700, 0.8).setInteractive().setDepth(9999);
            // Player 2 (right side) - relative positions
            this.touchControls.p2.left = this.add.rectangle(0, 0, 48, 48, 0x444444, 0.7).setInteractive().setDepth(9999);
            this.touchControls.p2.right = this.add.rectangle(0, 0, 48, 48, 0x444444, 0.7).setInteractive().setDepth(9999);
            this.touchControls.p2.jump = this.add.rectangle(0, 0, 48, 48, 0x888888, 0.7).setInteractive().setDepth(9999);
            this.touchControls.p2.down = this.add.rectangle(0, 0, 48, 48, 0x888888, 0.7).setInteractive().setDepth(9999);
            this.touchControls.p2.attack = this.add.circle(0, 0, 30, 0x44aaff, 0.8).setInteractive().setDepth(9999);
            this.touchControls.p2.special = this.add.circle(0, 0, 30, 0xffd700, 0.8).setInteractive().setDepth(9999);
            // Touch flags
            this.touchFlags = {
                p1: {
                    left: false,
                    right: false,
                    jump: false,
                    down: false,
                    attack: false,
                    special: false
                },
                p2: {
                    left: false,
                    right: false,
                    jump: false,
                    down: false,
                    attack: false,
                    special: false
                }
            };
            // Setup touch events for all buttons
            const setupBtn = (btn, flagObj, flag)=>{
                btn.on('pointerdown', ()=>{
                    flagObj[flag] = true;
                });
                btn.on('pointerup', ()=>{
                    flagObj[flag] = false;
                });
                btn.on('pointerout', ()=>{
                    flagObj[flag] = false;
                });
                btn.on('pointerupoutside', ()=>{
                    flagObj[flag] = false;
                });
            };
            Object.entries(this.touchControls.p1).forEach(([k, btn])=>setupBtn(btn, this.touchFlags.p1, k));
            Object.entries(this.touchControls.p2).forEach(([k, btn])=>setupBtn(btn, this.touchFlags.p2, k));
            // Add icons/labels (also relative)
            this.touchLabels = [];
            this.touchLabels.push(this.add.text(0, 0, '<', {
                fontSize: '24px',
                color: '#fff'
            }).setDepth(10000));
            this.touchLabels.push(this.add.text(0, 0, '>', {
                fontSize: '24px',
                color: '#fff'
            }).setDepth(10000));
            this.touchLabels.push(this.add.text(0, 0, '^', {
                fontSize: '24px',
                color: '#fff'
            }).setDepth(10000));
            this.touchLabels.push(this.add.text(0, 0, 'v', {
                fontSize: '24px',
                color: '#fff'
            }).setDepth(10000));
            this.touchLabels.push(this.add.text(0, 0, 'A', {
                fontSize: '24px',
                color: '#fff'
            }).setDepth(10000));
            this.touchLabels.push(this.add.text(0, 0, 'S', {
                fontSize: '24px',
                color: '#222'
            }).setDepth(10000));
            this.touchLabels.push(this.add.text(0, 0, '<', {
                fontSize: '24px',
                color: '#fff'
            }).setDepth(10000));
            this.touchLabels.push(this.add.text(0, 0, '>', {
                fontSize: '24px',
                color: '#fff'
            }).setDepth(10000));
            this.touchLabels.push(this.add.text(0, 0, '^', {
                fontSize: '24px',
                color: '#fff'
            }).setDepth(10000));
            this.touchLabels.push(this.add.text(0, 0, 'v', {
                fontSize: '24px',
                color: '#fff'
            }).setDepth(10000));
            this.touchLabels.push(this.add.text(0, 0, 'A', {
                fontSize: '24px',
                color: '#fff'
            }).setDepth(10000));
            this.touchLabels.push(this.add.text(0, 0, 'S', {
                fontSize: '24px',
                color: '#222'
            }).setDepth(10000));
            // Immediately position all touch labels
            this.updateControlPositions();
        }
        // --- EFFECTS ---
        // Hit flash effect for attacks
        this.hitFlash = this.add.graphics({
            x: 0,
            y: 0
        }).setDepth(999);
        this.hitFlash.setVisible(false);
        // Particle system and emitter for special attacks
        // Simple custom effect for special attacks (Phaser 3.60+ workaround)
        this.specialEffect = this.add.graphics({
            x: 0,
            y: 0
        }).setDepth(998);
        this.specialEffect.setVisible(false);
        // --- EFFECTS ---
        // --- PLAYER SPAWN LOGIC (moved from orphaned code) ---
        const playerSprites = [
            'player1',
            'player2'
        ];
        const scale = 0.4;
        const frameHeight = 512;
        const player1FrameWidths = [
            300,
            300,
            430,
            580,
            580,
            440,
            440,
            440
        ];
        // Align player feet to the ground (bottom of the screen)
        const frameWidth = player1FrameWidths[0];
        const bodyWidth = frameWidth * scale;
        const bodyHeight = frameHeight * scale;
        // player.y is the center, so set: playerY = GAME_HEIGHT - (this.textures.get('player1').getSourceImage().height * scale) / 2;
        // But we can use the actual sprite height after creation for precision
        let playerY;
        // We'll set playerY after creating the sprite and scaling it.
        const PLATFORM_Y = 230;
        const PLATFORM_HEIGHT = 20;
        // Add background image
        bg.displayWidth = GAME_WIDTH;
        bg.displayHeight = GAME_HEIGHT;
        // Draw the platform rectangle above the background
        const platformRect = this.add.rectangle(GAME_WIDTH / 2, PLATFORM_Y + PLATFORM_HEIGHT / 2, GAME_WIDTH, PLATFORM_HEIGHT, 0x8B5A2B).setDepth(2).setVisible(false);
        // Add static physics body for the platform
        const platform = this.physics.add.staticGroup();
        platform.create(GAME_WIDTH / 2, PLATFORM_Y + PLATFORM_HEIGHT / 2, null).setDisplaySize(GAME_WIDTH, PLATFORM_HEIGHT).setVisible(false).refreshBody();
        // --- DEFENSIVE: Ensure valid selected and sprite keys ---
        const playerSpritesSafe = [
            'player1',
            'player2'
        ];
        const selectedSafe = this.selected && typeof this.selected.p1 === 'number' && typeof this.selected.p2 === 'number' ? this.selected : {
            p1: 0,
            p2: 1
        };
        const p1Key = playerSpritesSafe[selectedSafe.p1] || 'player1';
        const p2Key = playerSpritesSafe[selectedSafe.p2] || 'player2';
        const PLAYER_PLATFORM_OFFSET = 20;
        this.player1 = this.physics.add.sprite(200, PLATFORM_Y + PLAYER_PLATFORM_OFFSET, p1Key, 0);
        this.player1.setScale(scale);
        this.player1.setOrigin(0.5, 1); // bottom center
        this.player1.body.setSize(this.player1.displayWidth, this.player1.displayHeight);
        this.player1.body.setOffset(0, 0);
        // Enable collision with platform
        this.physics.add.collider(this.player1, platform);
        this.player1.setCollideWorldBounds(true);
        this.player1.setBounce(0.1);
        this.player1.health = MAX_HEALTH;
        this.player1.facing = 1;
        this.player2 = this.physics.add.sprite(600, PLATFORM_Y + PLAYER_PLATFORM_OFFSET, p2Key, 0);
        this.player2.setScale(scale);
        this.player2.setOrigin(0.5, 1); // bottom center
        this.player2.body.setSize(this.player2.displayWidth, this.player2.displayHeight);
        this.player2.body.setOffset(0, 0);
        // Enable collision with platform
        this.physics.add.collider(this.player2, platform);
        this.player2.setCollideWorldBounds(true);
        this.player2.setBounce(0.1);
        this.player2.health = MAX_HEALTH;
        this.player2.facing = -1;
        this.player2.setFlipX(true); // Invert horizontally
        // Player 1 Animations (custom frames)
        if (!this.anims.exists('p1_idle')) this.anims.create({
            key: 'p1_idle',
            frames: [
                {
                    key: 'player1',
                    frame: 0
                }
            ],
            frameRate: 1,
            repeat: -1
        });
        if (!this.anims.exists('p1_walk')) this.anims.create({
            key: 'p1_walk',
            frames: [
                {
                    key: 'player1',
                    frame: 1
                },
                {
                    key: 'player1',
                    frame: 2
                }
            ],
            frameRate: 6,
            repeat: -1
        });
        if (!this.anims.exists('p1_attack')) this.anims.create({
            key: 'p1_attack',
            frames: [
                {
                    key: 'player1',
                    frame: 4
                }
            ],
            frameRate: 1,
            repeat: 0,
            duration: 200 // Show hit frame for 200ms
        });
        if (!this.anims.exists('p1_special')) this.anims.create({
            key: 'p1_special',
            frames: [
                {
                    key: 'player1',
                    frame: 6
                }
            ],
            frameRate: 1,
            repeat: 0,
            duration: 900 // Show special frame for 900ms
        });
        // Down/crouch animations
        if (!this.anims.exists('p1_down')) this.anims.create({
            key: 'p1_down',
            frames: [
                {
                    key: 'player1',
                    frame: 5
                }
            ],
            frameRate: 1,
            repeat: -1
        });
        // Animations
        if (!this.anims.exists('p2_idle')) this.anims.create({
            key: 'p2_idle',
            frames: [
                {
                    key: 'player2',
                    frame: 0
                }
            ],
            frameRate: 1,
            repeat: -1
        });
        if (!this.anims.exists('p2_walk')) this.anims.create({
            key: 'p2_walk',
            frames: [
                {
                    key: 'player2',
                    frame: 0
                },
                {
                    key: 'player2',
                    frame: 1
                }
            ],
            frameRate: 6,
            repeat: -1
        });
        if (!this.anims.exists('p2_attack')) this.anims.create({
            key: 'p2_attack',
            frames: [
                {
                    key: 'player2',
                    frame: 4
                }
            ],
            frameRate: 1,
            repeat: 0,
            duration: 200 // Show hit frame for 200ms
        });
        if (!this.anims.exists('p2_down')) this.anims.create({
            key: 'p2_down',
            frames: [
                {
                    key: 'player2',
                    frame: 5
                }
            ],
            frameRate: 1,
            repeat: -1
        });
        if (!this.anims.exists('p2_special')) this.anims.create({
            key: 'p2_special',
            frames: [
                {
                    key: 'player2',
                    frame: 6
                }
            ],
            frameRate: 1,
            repeat: 0,
            duration: 900 // Show special frame for 900ms
        });
        this.player1.play('p1_idle');
        this.player1.angle = 0;
        this.player2.angle = 0;
        // Reset loser y offset (in case of rematch)
        this.playerY = playerY; // Store globally for use in endGame
        if (!this.gameOver) this.player2.play('p2_idle');
        // Store original Y for laying down math
        this.player1._originalY = this.player1.y;
        this.player2._originalY = this.player2.y;
        // Animation complete: return to idle after attack
        // (Replaced by manual timer for attack/special)
        // this.player1.on('animationcomplete', ...)
        // this.player2.on('animationcomplete', ...)
        // Collisions
        this.physics.add.collider(this.player1, this.floatPlatform);
        this.physics.add.collider(this.player2, this.floatPlatform);
        // Controls
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            a: 'A',
            d: 'D',
            w: 'W',
            v: 'V',
            b: 'B',
            n: 'N',
            s: 'S',
            k: 'K',
            l: 'L',
            semicolon: 'SEMICOLON'
        });
        // Defensive: ensure all keys exist even if not mapped
        const keyList = [
            'a',
            'd',
            'w',
            'v',
            'b',
            'n',
            's',
            'k',
            'l',
            'semicolon'
        ];
        for (const k of keyList)if (!this.keys[k]) this.keys[k] = {
            isDown: false
        };
        // Debug: log at end of create()
        // console.log('[DEBUG] create() called, this.keys:', this.keys);
        // Global keydown debug (disable for touch)
        if (!this.isTouch) window.addEventListener('keydown', function(e) {
        // console.log('[GLOBAL] Key pressed:', e.key, 'code:', e.code);
        });
        // Health bars
        this.healthBar1Border = this.add.rectangle(200, 30, 204, 24, 0xffffff).setOrigin(0.5);
        this.healthBar2Border = this.add.rectangle(600, 30, 204, 24, 0xffffff).setOrigin(0.5);
        this.healthBar1Border.setStrokeStyle(2, 0x000000);
        this.healthBar2Border.setStrokeStyle(2, 0x000000);
        this.healthBar1 = this.add.rectangle(200, 30, 200, 20, 0xff4444);
        this.healthBar2 = this.add.rectangle(600, 30, 200, 20, 0x44aaff);
        this.healthBar1.setOrigin(0.5);
        this.healthBar2.setOrigin(0.5);
        this.children.bringToTop(this.healthBar1);
        this.children.bringToTop(this.healthBar2);
        // --- SPECIAL HIT CIRCLES (PIPS) ---
        // Player 1 special pips (left, above health bar)
        this.specialPips1 = [];
        for(let i = 0; i < 3; i++){
            const pip = this.add.circle(140 + i * 30, 16, 10, 0x888888, 0.8).setStrokeStyle(2, 0x000).setDepth(10);
            pip.setVisible(true);
            this.specialPips1.push(pip);
        }
        // Player 2 special pips (right, above health bar)
        this.specialPips2 = [];
        for(let i = 0; i < 3; i++){
            const pip = this.add.circle(540 + i * 30, 16, 10, 0x888888, 0.8).setStrokeStyle(2, 0x000).setDepth(10);
            pip.setVisible(true);
            this.specialPips2.push(pip);
        }
        // Ensure all pips are reset to gray and visible
        this.specialPips1.forEach((pip)=>pip.setFillStyle(0x888888).setVisible(true));
        this.specialPips2.forEach((pip)=>pip.setFillStyle(0x888888).setVisible(true));
        // Hide special ready circles
        if (this.specialReady1) this.specialReady1.setVisible(false);
        if (this.specialReadyText1) this.specialReadyText1.setVisible(false);
        if (this.specialReady2) this.specialReady2.setVisible(false);
        if (this.specialReadyText2) this.specialReadyText2.setVisible(false);
        // --- SPECIAL READY CIRCLE (BIG S) ---
        // Player 1
        this.specialReady1 = this.add.circle(200, 60, 22, 0xffd700, 0.93).setStrokeStyle(3, 0x000).setDepth(15).setVisible(false);
        this.specialReadyText1 = this.add.text(200, 60, 'S', {
            fontSize: '26px',
            color: '#000',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(16).setVisible(false);
        // Player 2
        this.specialReady2 = this.add.circle(600, 60, 22, 0xffd700, 0.93).setStrokeStyle(3, 0x000).setDepth(15).setVisible(false);
        this.specialReadyText2 = this.add.text(600, 60, 'S', {
            fontSize: '26px',
            color: '#000',
            fontFamily: 'monospace',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(16).setVisible(false);
        // Timer text display
        this.timerText = this.add.text(GAME_WIDTH / 2, 50, Math.ceil(this.timeLeft), {
            fontSize: '32px',
            color: '#fff',
            fontFamily: 'monospace',
            align: 'center',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);
        // --- FORCE RESIZE after scene (re)start ---
        if (typeof resizeGame === 'function') resizeGame(this.game);
        // Update all scene layout to match new size
        this.updateSceneLayout();
        // Listen for Phaser's resize event and re-apply CSS AND update layout
        this.scale.on('resize', ()=>{
            if (typeof (0, _gameUtils.applyGameCss) === 'function') (0, _gameUtils.applyGameCss)();
            if (typeof this.updateSceneLayout === 'function') this.updateSceneLayout();
        });
    }
    update(time, delta) {
        if (this.gameOver) return;
        // --- SPECIAL PIPS UPDATE LOGIC ---
        // Helper: update special pips and indicators for a player
        const updateSpecialPips = (playerIdx)=>{
            const attackCount = this.attackCount?.[playerIdx] || 0;
            const pips = playerIdx === 0 ? this.specialPips1 : this.specialPips2;
            const specialReady = playerIdx === 0 ? this.specialReady1 : this.specialReady2;
            const specialReadyText = playerIdx === 0 ? this.specialReadyText1 : this.specialReadyText2;
            // Show yellow for each attack landed, up to 3, but hide all after 3
            if (attackCount >= 3) {
                // Hide all pips
                for(let i = 0; i < 3; i++)if (pips[i]) pips[i].setVisible(false);
                if (specialReady) specialReady.setVisible(true);
                if (specialReadyText) specialReadyText.setVisible(true);
            } else {
                for(let i = 0; i < 3; i++)if (pips[i]) pips[i].setFillStyle(i < attackCount ? 0xffd700 : 0x888888).setVisible(true);
                if (specialReady) specialReady.setVisible(false);
                if (specialReadyText) specialReadyText.setVisible(false);
            }
        };
        // Call for both players
        updateSpecialPips(0);
        updateSpecialPips(1);
        // console.log('[DEBUG] update() this:', this, 'scene key:', this.sys && this.sys.settings && this.sys.settings.key);
        if (!this.keys || !this.keys.v) // console.log('[DEBUG] this.keys or this.keys.v is undefined in update()');
        return;
        // Debug: confirm update is running
        // console.log('[DEBUG] Update running');
        // --- TOUCH CONTROLS: map to key states ---
        // --- TOUCH CONTROLS: custom justPressed for attack/special ---
        if (this.isTouch && this.touchFlags) {
            // Setup justPressed logic for attack/special
            if (!this._touchWasDownP1A && this.touchFlags.p1.attack) this._touchJustPressedP1A = true;
            this._touchWasDownP1A = this.touchFlags.p1.attack;
            if (!this._touchWasDownP1S && this.touchFlags.p1.special) this._touchJustPressedP1S = true;
            this._touchWasDownP1S = this.touchFlags.p1.special;
            if (!this._touchWasDownP2A && this.touchFlags.p2.attack) this._touchJustPressedP2A = true;
            this._touchWasDownP2A = this.touchFlags.p2.attack;
            if (!this._touchWasDownP2S && this.touchFlags.p2.special) this._touchJustPressedP2S = true;
            this._touchWasDownP2S = this.touchFlags.p2.special;
            // Map movement keys from touch to key states
            this.keys.a.isDown = this.touchFlags.p1.left;
            this.keys.d.isDown = this.touchFlags.p1.right;
            this.keys.w.isDown = this.touchFlags.p1.jump;
            this.keys.s.isDown = this.touchFlags.p1.down;
            this.cursors.left.isDown = this.touchFlags.p2.left;
            this.cursors.right.isDown = this.touchFlags.p2.right;
            this.cursors.up.isDown = this.touchFlags.p2.jump;
            this.cursors.down.isDown = this.touchFlags.p2.down;
        }
        // On desktop, do not overwrite keyboard input
        // Timer logic (regressive)
        if (!this.gameOver) {
            if (typeof this.lastTimerUpdate !== 'number' || isNaN(this.lastTimerUpdate)) this.lastTimerUpdate = time;
            if (typeof this.timeLeft !== 'number' || isNaN(this.timeLeft)) this.timeLeft = ROUND_TIME;
            const timerElapsed = Math.floor((time - this.lastTimerUpdate) / 1000);
            if (timerElapsed > 0) {
                this.timeLeft = Math.max(0, this.timeLeft - timerElapsed);
                this.lastTimerUpdate += timerElapsed * 1000;
            }
        }
        // Update timer display
        if (this.timerText) this.timerText.setText(Math.ceil(this.timeLeft));
        // Check win/lose by health
        // Health-based win detection
        if (!this.gameOver && this.player1 && this.player2) {
            if (this.player1.health <= 0) {
                this.endGame('Davi R Venceu!');
                return;
            } else if (this.player2.health <= 0) {
                this.endGame('Bento Venceu!');
                return;
            }
        }
        if (this.timeLeft === 0) {
            if (this.player1.health > this.player2.health) this.endGame('Bento Venceu!');
            else if (this.player2.health > this.player1.health) this.endGame('Davi R Venceu!');
            else this.endGame('Empate!');
            return;
        }
        // Timer logic (regressive)
        if (this.timeLeft <= 0 && !this.gameOver) {
            this.endGame("Tempo Esgotado! Empate!");
            return;
        }
        // Player 1 movement
        let p1Moving = false;
        if (this.player1 && this.player1.body) {
            const p1 = this.player1.body;
            if (this.lungeTimer[0] > 0) this.lungeTimer[0] -= delta;
            else {
                p1.setVelocityX(0);
                if (this.keys.a.isDown) {
                    p1.setVelocityX(-PLAYER_SPEED);
                    p1Moving = true;
                }
                if (this.keys.d.isDown) {
                    p1.setVelocityX(PLAYER_SPEED);
                    p1Moving = true;
                }
                if (this.keys.w.isDown && p1.onFloor()) p1.setVelocityY(JUMP_VELOCITY);
            }
            // Player 1 walk animation
            if (this.player1State === 'idle' && p1Moving && p1.onFloor() && !this.gameOver) {
                if (this.player1.anims.currentAnim?.key !== 'p1_walk') this.player1.play('p1_walk', true);
            } else if (this.player1State === 'idle' && this.player1.anims.currentAnim?.key === 'p1_walk' && !this.gameOver) {
                if (!this.gameOver) this.player1.play('p1_idle', true);
            }
        }
        // Player 2 movement
        let p2Moving = false;
        if (this.player2 && this.player2.body) {
            const p2 = this.player2.body;
            if (this.lungeTimer[1] > 0) this.lungeTimer[1] -= delta;
            else {
                p2.setVelocityX(0);
                if (this.cursors.left.isDown) {
                    p2.setVelocityX(-PLAYER_SPEED);
                    p2Moving = true;
                }
                if (this.cursors.right.isDown) {
                    p2.setVelocityX(PLAYER_SPEED);
                    p2Moving = true;
                }
                if (this.cursors.up.isDown && p2.onFloor()) p2.setVelocityY(JUMP_VELOCITY);
            }
            // Player 2 walk animation
            if (this.player2State === 'idle' && p2Moving && p2.onFloor() && !this.gameOver) {
                if (this.player2.anims.currentAnim?.key !== 'p2_walk') this.player2.play('p2_walk', true);
            } else if (this.player2State === 'idle' && this.player2.anims.currentAnim?.key === 'p2_walk' && !this.gameOver) {
                if (!this.gameOver) this.player2.play('p2_idle', true);
            }
        }
        // Player 1 crouch (S or N key)
        if (!this.gameOver) {
            if (this.player1State === 'attack' || this.player1State === 'special') ;
            else if (this.keys && (this.keys.n && this.keys.n.isDown || this.keys.s && this.keys.s.isDown)) {
                if (this.player1State !== 'down') {
                    this.player1.play('p1_down', true);
                    this.player1State = 'down';
                }
            } else if (this.player1State !== 'idle') {
                // Only play idle if game is not over
                if (!this.gameOver) this.player1.play('p1_idle', true);
                this.player1State = 'idle';
            // console.log('[DEBUG] player1State set to:', this.player1State);
            }
        }
        // Player 2 crouch (Down arrow or ; key)
        if (!this.gameOver) {
            if (this.player2State === 'attack' || this.player2State === 'special') ;
            else if (this.cursors && this.cursors.down && this.cursors.down.isDown || this.keys && this.keys.semicolon && this.keys.semicolon.isDown) {
                if (this.player2State !== 'down') {
                    this.player2.play('p2_down', true);
                    this.player2.setFlipX(true);
                    this.player2State = 'down';
                }
            } else if (this.player2State !== 'idle') {
                // Only play idle if game is not over
                if (!this.gameOver) this.player2.play('p2_idle', true);
                this.player2.setFlipX(true);
                this.player2State = 'idle';
            }
        }
        // Debug: log V key state and player1State
        this.keys && this.keys.v;
        // console.log('[DEBUG] player1State:', this.player1State);
        // Debug: check if we reach attack check
        // console.log('[DEBUG] Before attack check');
        // Use isDown + cooldown for V key
        const now = time;
        const attackCondition = this.keys && this.keys.v && this.keys.v.isDown && now > (this.lastAttackTime?.[0] || 0) + ATTACK_COOLDOWN && this.player1State !== 'attack' && this.player1State !== 'special' || this._touchJustPressedP1A && this.player1State !== 'attack' && this.player1State !== 'special';
        // console.log('[DEBUG] Attack condition:', attackCondition, 'isDown:', this.keys.v.isDown, 'lastAttackTime:', this.lastAttackTime?.[0], 'now:', now, '_touchJustPressedP1A:', this._touchJustPressedP1A);
        // Player 1 attack (V key or touch)
        if (attackCondition) {
            this._touchJustPressedP1A = false;
            // console.log('[DEBUG] Attack block entered, player1:', this.player1);
            // Now always allowed to attack here, no further state check needed
            // console.log('[DEBUG] Triggering attack animation');
            // console.log('[DEBUG] Anim exists:', this.anims.exists('p1_attack'));
            this.player1.play('p1_attack', true);
            this.player1State = 'attack';
            // console.log('[DEBUG] player1State set to:', this.player1State);
            // Deal damage to player2 if in range
            (0, _gameUtils.tryAttack)(this, 0, this.player1, this.player2, now, false);
            // Update health bar for player2
            const healthRatio = Math.max(0, this.player2.health / MAX_HEALTH);
            this.healthBar2.width = 200 * healthRatio;
            // Manually switch to idle after 400ms
            this.time.delayedCall(400, ()=>{
                if (this.player1State === 'attack' && !this.gameOver) {
                    this.player1.play('p1_idle', true);
                    this.player1State = 'idle';
                // console.log('[DEBUG] player1State set to:', this.player1State);
                }
            });
        }
        // Player 1 special (B key or touch)
        const specialConditionP1 = this.keys && this.keys.b && this.keys.b.isDown && this.player1State !== 'attack' && this.player1State !== 'special' && this.attackCount[0] >= 3 || this._touchJustPressedP1S && this.player1State !== 'attack' && this.player1State !== 'special' && this.attackCount[0] >= 3;
        if (specialConditionP1) {
            this._touchJustPressedP1S = false;
            this.player1.play('p1_special', true);
            this.player1State = 'special';
            (0, _gameUtils.tryAttack)(this, 0, this.player1, this.player2, now, true);
            const healthRatio = Math.max(0, this.player2.health / MAX_HEALTH);
            this.healthBar2.width = 200 * healthRatio;
            this.showSpecialEffect(this.player1.x, this.player1.y - 60);
            this.time.delayedCall(700, ()=>{
                if (this.player1State === 'special' && !this.gameOver) {
                    this.player1.play('p1_idle', true);
                    this.player1State = 'idle';
                    // Reset special pips after special is used
                    this.attackCount[0] = 0;
                }
            });
        }
        // Player 2 attack (; key or K key or touch)
        const attackConditionP2 = this.keys && (this.keys.semicolon && this.keys.semicolon.isDown || this.keys.k && this.keys.k.isDown) && now > (this.lastAttackTime?.[1] || 0) + ATTACK_COOLDOWN && this.player2State !== 'attack' && this.player2State !== 'special' || this._touchJustPressedP2A && this.player2State !== 'attack' && this.player2State !== 'special';
        if (attackConditionP2) {
            this._touchJustPressedP2A = false;
            this.player2.play('p2_attack', true);
            this.player2State = 'attack';
            (0, _gameUtils.tryAttack)(this, 1, this.player2, this.player1, now, false);
            const healthRatio1 = Math.max(0, this.player1.health / MAX_HEALTH);
            this.healthBar1.width = 200 * healthRatio1;
            this.time.delayedCall(400, ()=>{
                if (this.player2State === 'attack' && !this.gameOver) {
                    this.player2.play('p2_idle', true);
                    this.player2State = 'idle';
                }
            });
        }
        // Player 2 special (L key or touch)
        const specialConditionP2 = this.keys && this.keys.l && this.keys.l.isDown && this.player2State !== 'attack' && this.player2State !== 'special' && this.attackCount[1] >= 3 || this._touchJustPressedP2S && this.player2State !== 'attack' && this.player2State !== 'special' && this.attackCount[1] >= 3;
        if (specialConditionP2) {
            this._touchJustPressedP2S = false;
            this.player2.play('p2_special', true);
            this.player2State = 'special';
            (0, _gameUtils.tryAttack)(this, 1, this.player2, this.player1, now, true);
            const healthRatio1 = Math.max(0, this.player1.health / MAX_HEALTH);
            this.healthBar1.width = 200 * healthRatio1;
            this.showSpecialEffect(this.player2.x, this.player2.y - 60);
            this.time.delayedCall(700, ()=>{
                if (this.player2State === 'special' && !this.gameOver) {
                    this.player2.play('p2_idle', true);
                    this.player2State = 'idle';
                    // Reset special pips after special is used
                    this.attackCount[1] = 0;
                }
            });
        }
    }
    updateSceneLayout() {
        return (0, _gameUtils.updateSceneLayout)(this);
    }
    // --- GAME OVER HANDLER ---
    endGame(phrase) {
        if (this.gameOver) return;
        this.gameOver = true;
        // Centered winning phrase
        const winText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, phrase, {
            fontSize: '48px',
            color: '#fff',
            fontFamily: 'monospace',
            stroke: '#000',
            strokeThickness: 8,
            align: 'center',
            backgroundColor: 'rgba(0,0,0,0.35)',
            padding: {
                left: 24,
                right: 24,
                top: 16,
                bottom: 16
            }
        }).setOrigin(0.5).setDepth(10001);
        // Optionally, fade in the text
        winText.setAlpha(0);
        this.tweens.add({
            targets: winText,
            alpha: 1,
            duration: 400
        });
        // --- Add 'Jogar Novamente' button ---
        const btnY = this.cameras.main.height / 2 + 90;
        const playAgainBtn = this.add.text(this.cameras.main.width / 2, btnY, 'Jogar Novamente', {
            fontSize: '32px',
            color: '#fff',
            backgroundColor: '#44aaff',
            fontFamily: 'monospace',
            padding: {
                left: 32,
                right: 32,
                top: 12,
                bottom: 12
            },
            align: 'center',
            stroke: '#000',
            strokeThickness: 6,
            borderRadius: 16,
            fixedWidth: 320
        }).setOrigin(0.5).setDepth(10002).setAlpha(0).setInteractive({
            useHandCursor: true
        });
        this.tweens.add({
            targets: playAgainBtn,
            alpha: 1,
            duration: 400,
            delay: 200
        });
        playAgainBtn.on('pointerdown', ()=>{
            winText.destroy();
            playAgainBtn.destroy();
            this.scene.restart();
        });
        // Winner celebrates, loser lays down
        if (this.player1 && this.player2) {
            const p1Dead = this.player1.health <= 0;
            const p2Dead = this.player2.health <= 0;
            if (p1Dead && !p2Dead) {
                // Player 2 wins
                this.player2.setFrame(3); // Winner celebrates
                this.player2.setFlipX(true);
                this.player2.setAngle(0);
                this.player1.setFrame(4); // Loser lays down (frame 4)
                this.player1.setFlipX(false);
                this.player1.setAngle(270);
                this.showSpecialEffect(this.player1.x, this.player1.y);
            } else if (p2Dead && !p1Dead) {
                // Player 1 wins
                this.player1.setFrame(3); // Winner celebrates
                this.player1.setFlipX(false);
                this.player1.setAngle(0);
                this.player2.setFrame(4); // Loser lays down (frame 4)
                this.player2.setFlipX(true);
                this.player2.setAngle(270);
                this.showSpecialEffect(this.player2.x, this.player2.y);
            } else {
                // Draw or both dead: both use frame 5
                this.player1.setFrame(5); // Both use frame 5 for draw
                this.player1.setFlipX(false);
                // No rotation for draw
                this.player2.setFrame(5);
                this.player2.setFlipX(true);
                // No rotation for draw
                this.showSpecialEffect(this.player1.x, this.player1.y);
                this.showSpecialEffect(this.player2.x, this.player2.y);
            }
        }
        if (this.player1 && this.player1.anims) this.player1.anims.stop();
        if (this.player2 && this.player2.anims) this.player2.anims.stop();
        // Freeze winner in frame 3 (celebration) after win
        if (this.player1.frame.name === 3) this.player1.setFrame(3);
        if (this.player2.frame.name === 3) this.player2.setFrame(3);
    // Do not remove input listeners; rely on this.gameOver = true to block input after game over.
    // This avoids breaking keyboard input after scene restart.
    }
}
function resizeGame(game) {
    // Use window.innerWidth/innerHeight for true viewport size (accounts for mobile browser UI)
    const w = window.innerWidth;
    const h = window.innerHeight;
    game.scale.resize(w, h);
    (0, _gameUtils.applyGameCss)();
}
// --- Responsive Touch Controls Positioning ---
KidsFightScene.prototype.updateControlPositions = function() {
    if (!this.isTouch || !this.touchControls || !this.cameras || !this.cameras.main) return;
    const cam = this.cameras.main;
    const w = cam.width;
    const h = cam.height;
    // Player 1
    this.touchControls.p1.left.setPosition(w * 0.08, h * 0.85);
    this.touchControls.p1.right.setPosition(w * 0.18, h * 0.85);
    this.touchControls.p1.jump.setPosition(w * 0.13, h * 0.7);
    this.touchControls.p1.down.setPosition(w * 0.13, h * 0.97);
    this.touchControls.p1.attack.setPosition(w * 0.28, h * 0.89);
    this.touchControls.p1.special.setPosition(w * 0.36, h * 0.89);
    // Player 2
    this.touchControls.p2.left.setPosition(w * 0.82, h * 0.85);
    this.touchControls.p2.right.setPosition(w * 0.92, h * 0.85);
    this.touchControls.p2.jump.setPosition(w * 0.87, h * 0.7);
    this.touchControls.p2.down.setPosition(w * 0.87, h * 0.97);
    this.touchControls.p2.attack.setPosition(w * 0.72, h * 0.89);
    this.touchControls.p2.special.setPosition(w * 0.64, h * 0.89);
    // Labels (order must match creation)
    if (this.touchLabels && this.touchLabels.length === 12) {
        this.touchLabels[0].setPosition(w * 0.06, h * 0.83);
        this.touchLabels[1].setPosition(w * 0.16, h * 0.83);
        this.touchLabels[2].setPosition(w * 0.11, h * 0.68);
        this.touchLabels[3].setPosition(w * 0.11, h * 0.95);
        this.touchLabels[4].setPosition(w * 0.25, h * 0.87);
        this.touchLabels[5].setPosition(w * 0.33, h * 0.87);
        this.touchLabels[6].setPosition(w * 0.79, h * 0.83);
        this.touchLabels[7].setPosition(w * 0.89, h * 0.83);
        this.touchLabels[8].setPosition(w * 0.84, h * 0.68);
        this.touchLabels[9].setPosition(w * 0.84, h * 0.95);
        this.touchLabels[10].setPosition(w * 0.69, h * 0.87);
        this.touchLabels[11].setPosition(w * 0.61, h * 0.87);
    }
};
// Phaser Game Config (must be after KidsFightScene is defined)
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#222',
    parent: 'game-container',
    scene: KidsFightScene,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {
                y: GRAVITY
            },
            debug: false
        }
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};
window.onload = ()=>{
    // Set initial size to fit screen
    config.width = window.innerWidth;
    config.height = window.innerHeight;
    config.scale.width = window.innerWidth;
    config.scale.height = window.innerHeight;
    const game = new Phaser.Game(config);
    // Initial resize to account for mobile browser UI
    resizeGame(game);
    // Helper: double-resize to fix mobile browser chrome issues
    function resizeWithDelay() {
        resizeGame(game);
        setTimeout(()=>resizeGame(game), 250); // Second resize after browser chrome settles
    }
    window.addEventListener('resize', resizeWithDelay);
    window.addEventListener('orientationchange', resizeWithDelay);
};

},{"./scenario1.png?url":"eRKIU","./sprites-bento3.png?url":"eWn0D","./sprites-davir3.png?url":"li0YK","./gameUtils":"hkDGA","@parcel/transformer-js/src/esmodule-helpers.js":"jnFvT"}],"eRKIU":[function(require,module,exports,__globalThis) {
module.exports = module.bundle.resolve("scenario1.b5742409.png") + "?" + Date.now();

},{}],"eWn0D":[function(require,module,exports,__globalThis) {
module.exports = module.bundle.resolve("sprites-bento3.f7d6d963.png") + "?" + Date.now();

},{}],"li0YK":[function(require,module,exports,__globalThis) {
module.exports = module.bundle.resolve("sprites-davir3.db13ced6.png") + "?" + Date.now();

},{}],"hkDGA":[function(require,module,exports,__globalThis) {
// Pure game logic utilities for KidsFightScene
// Layout update logic for scene objects
function updateSceneLayout(scene) {
    const w = scene.scale.width;
    const h = scene.scale.height;
    // Background
    if (scene.children && scene.children.list) {
        const bg = scene.children.list.find((obj)=>obj.texture && obj.texture.key === 'scenario1');
        if (bg) {
            bg.setPosition(w / 2, h / 2);
            bg.displayWidth = w;
            bg.displayHeight = h;
        }
    }
    // Platform
    if (scene.children && scene.children.list) {
        const platformRect = scene.children.list.find((obj)=>obj.type === 'Rectangle' && obj.fillColor === 0x8B5A2B);
        if (platformRect) {
            platformRect.setPosition(w / 2, 240);
            platformRect.displayWidth = w;
        }
    }
    // Camera and world bounds
    if (scene.cameras && scene.cameras.main && scene.physics && scene.physics.world) {
        scene.cameras.main.setBounds(0, 0, w, h);
        scene.physics.world.setBounds(0, 0, w, h);
    }
    // Touch controls
    if (typeof scene.updateControlPositions === 'function') scene.updateControlPositions();
    // Timer text
    if (scene.timerText) scene.timerText.setPosition(w / 2, 50);
}
// CSS application logic for game canvas and parent
function applyGameCss() {
    const canvas = document.querySelector('canvas');
    const parent = document.getElementById('game-container');
    if (canvas) {
        canvas.style.position = 'fixed';
        canvas.style.left = 'env(safe-area-inset-left, 0px)';
        canvas.style.top = 'env(safe-area-inset-top, 0px)';
        canvas.style.width = 'calc(100vw - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px))';
        canvas.style.height = 'calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))';
        canvas.style.maxWidth = '100vw';
        canvas.style.maxHeight = '100vh';
        canvas.style.objectFit = 'contain';
        canvas.style.background = '#222';
    }
    if (parent) {
        parent.style.position = 'fixed';
        parent.style.left = 'env(safe-area-inset-left, 0px)';
        parent.style.top = 'env(safe-area-inset-top, 0px)';
        parent.style.width = '100vw';
        parent.style.height = '100vh';
        parent.style.background = '#222';
        parent.style.overflow = 'hidden';
    }
}
// tryAttack logic (simplified for testability)
function tryAttack(scene, playerIdx, attacker, defender, now, special) {
    if (!attacker || !defender) return;
    const ATTACK_RANGE = 100;
    const ATTACK_COOLDOWN = 500;
    if (!scene.lastAttackTime) scene.lastAttackTime = [
        0,
        0
    ];
    if (!scene.attackCount) scene.attackCount = [
        0,
        0
    ];
    if (now - scene.lastAttackTime[playerIdx] < ATTACK_COOLDOWN) // console.log('[DEBUG] tryAttack: Attack on cooldown for player', playerIdx);
    return;
    if (Math.abs(attacker.x - defender.x) > ATTACK_RANGE) // console.log('[DEBUG] tryAttack: Out of range. Attacker x:', attacker.x, 'Defender x:', defender.x);
    return;
    scene.lastAttackTime[playerIdx] = now;
    scene.attackCount[playerIdx]++;
    defender.health -= special ? 30 : 10;
    // console.log('[DEBUG] tryAttack: Defender health after attack:', defender.health);
    if (scene.cameras && scene.cameras.main && typeof scene.cameras.main.shake === 'function') scene.cameras.main.shake(special ? 250 : 100, special ? 0.03 : 0.01);
}
module.exports = {
    updateSceneLayout,
    applyGameCss,
    tryAttack
};

},{}],"jnFvT":[function(require,module,exports,__globalThis) {
exports.interopDefault = function(a) {
    return a && a.__esModule ? a : {
        default: a
    };
};
exports.defineInteropFlag = function(a) {
    Object.defineProperty(a, '__esModule', {
        value: true
    });
};
exports.exportAll = function(source, dest) {
    Object.keys(source).forEach(function(key) {
        if (key === 'default' || key === '__esModule' || Object.prototype.hasOwnProperty.call(dest, key)) return;
        Object.defineProperty(dest, key, {
            enumerable: true,
            get: function() {
                return source[key];
            }
        });
    });
    return dest;
};
exports.export = function(dest, destName, get) {
    Object.defineProperty(dest, destName, {
        enumerable: true,
        get: get
    });
};

},{}]},["io2N8","bNJxx"], "bNJxx", "parcelRequire7a4b", {}, "./", "/")

//# sourceMappingURL=kidsfight.36960861.js.map
