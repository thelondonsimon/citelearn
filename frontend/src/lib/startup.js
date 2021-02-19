function isCompatible(ua) {
    return !!((function() {
        'use strict';
        return !this && Function.prototype.bind && window.JSON;
    }()) && 'querySelector'in document && 'localStorage'in window && 'addEventListener'in window && !ua.match(/MSIE 10|NetFront|Opera Mini|S40OviBrowser|MeeGo|Android.+Glass|^Mozilla\/5\.0 .+ Gecko\/$|googleweblight|PLAYSTATION|PlayStation/));
}
if (!isCompatible(navigator.userAgent)) {
    document.documentElement.className = document.documentElement.className.replace(/(^|\s)client-js(\s|$)/, '$1client-nojs$2');
    while (window.NORLQ && NORLQ[0]) {
        NORLQ.shift()();
    }
    NORLQ = {
        push: function(fn) {
            fn();
        }
    };
    RLQ = {
        push: function() {}
    };
} else {
    if (window.performance && performance.mark) {
        performance.mark('mwStartup');
    }
    (function() {
        'use strict';
        var mw, StringSet, log, hasOwn = Object.hasOwnProperty, console = window.console;
        function fnv132(str) {
            var hash = 0x811C9DC5
              , i = 0;
            for (; i < str.length; i++) {
                hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
                hash ^= str.charCodeAt(i);
            }
            hash = (hash >>> 0).toString(36).slice(0, 5);
            while (hash.length < 5) {
                hash = '0' + hash;
            }
            return hash;
        }
        function defineFallbacks() {
            StringSet = window.Set || function() {
                var set = Object.create(null);
                return {
                    add: function(value) {
                        set[value] = !0;
                    },
                    has: function(value) {
                        return value in set;
                    }
                };
            }
            ;
        }
        function setGlobalMapValue(map, key, value) {
            map.values[key] = value;
            log.deprecate(window, key, value, map === mw.config && 'Use mw.config instead.');
        }
        function logError(topic, data) {
            var msg, e = data.exception;
            if (console && console.log) {
                msg = (e ? 'Exception' : 'Error') + ' in ' + data.source + (data.module ? ' in module ' + data.module : '') + (e ? ':' : '.');
                console.log(msg);
                if (e && console.warn) {
                    console.warn(e);
                }
            }
        }
        function Map(global) {
            this.values = Object.create(null);
            if (global === true) {
                this.set = function(selection, value) {
                    var s;
                    if (arguments.length > 1) {
                        if (typeof selection === 'string') {
                            setGlobalMapValue(this, selection, value);
                            return true;
                        }
                    } else if (typeof selection === 'object') {
                        for (s in selection) {
                            setGlobalMapValue(this, s, selection[s]);
                        }
                        return true;
                    }
                    return false;
                }
                ;
            }
        }
        Map.prototype = {
            constructor: Map,
            get: function(selection, fallback) {
                var results, i;
                fallback = arguments.length > 1 ? fallback : null;
                if (Array.isArray(selection)) {
                    results = {};
                    for (i = 0; i < selection.length; i++) {
                        if (typeof selection[i] === 'string') {
                            results[selection[i]] = selection[i]in this.values ? this.values[selection[i]] : fallback;
                        }
                    }
                    return results;
                }
                if (typeof selection === 'string') {
                    return selection in this.values ? this.values[selection] : fallback;
                }
                if (selection === undefined) {
                    results = {};
                    for (i in this.values) {
                        results[i] = this.values[i];
                    }
                    return results;
                }
                return fallback;
            },
            set: function(selection, value) {
                var s;
                if (arguments.length > 1) {
                    if (typeof selection === 'string') {
                        this.values[selection] = value;
                        return true;
                    }
                } else if (typeof selection === 'object') {
                    for (s in selection) {
                        this.values[s] = selection[s];
                    }
                    return true;
                }
                return false;
            },
            exists: function(selection) {
                return typeof selection === 'string' && selection in this.values;
            }
        };
        defineFallbacks();
        log = function() {}
        ;
        log.warn = console && console.warn ? Function.prototype.bind.call(console.warn, console) : function() {}
        ;
        log.error = console && console.error ? Function.prototype.bind.call(console.error, console) : function() {}
        ;
        log.deprecate = function(obj, key, val, msg, logName) {
            var stacks;
            function maybeLog() {
                var name = logName || key
                  , trace = new Error().stack;
                if (!stacks) {
                    stacks = new StringSet();
                }
                if (!stacks.has(trace)) {
                    stacks.add(trace);
                    if (logName || obj === window) {
                        mw.track('mw.deprecate', name);
                    }
                    mw.log.warn('Use of "' + name + '" is deprecated.' + (msg ? ' ' + msg : ''));
                }
            }
            try {
                Object.defineProperty(obj, key, {
                    configurable: !0,
                    enumerable: !0,
                    get: function() {
                        maybeLog();
                        return val;
                    },
                    set: function(newVal) {
                        maybeLog();
                        val = newVal;
                    }
                });
            } catch (err) {
                obj[key] = val;
            }
        }
        ;
        mw = {
            redefineFallbacksForTest: window.QUnit && defineFallbacks,
            now: function() {
                var perf = window.performance
                  , navStart = perf && perf.timing && perf.timing.navigationStart;
                mw.now = navStart && perf.now ? function() {
                    return navStart + perf.now();
                }
                : Date.now;
                return mw.now();
            },
            trackQueue: [],
            track: function(topic, data) {
                mw.trackQueue.push({
                    topic: topic,
                    data: data
                });
            },
            trackError: function(topic, data) {
                mw.track(topic, data);
                logError(topic, data);
            },
            Map: Map,
            config: new Map(false),
            messages: new Map(),
            templates: new Map(),
            log: log,
            loader: (function() {
                var registry = Object.create(null), sources = Object.create(null), handlingPendingRequests = !1, pendingRequests = [], queue = [], jobs = [], willPropagate = !1, errorModules = [], baseModules = ["jquery", "mediawiki.base"], marker = document.querySelector('meta[name="ResourceLoaderDynamicStyles"]'), lastCssBuffer, rAF = window.requestAnimationFrame || setTimeout;
                function newStyleTag(text, nextNode) {
                    var el = document.createElement('style');
                    el.appendChild(document.createTextNode(text));
                    if (nextNode && nextNode.parentNode) {
                        nextNode.parentNode.insertBefore(el, nextNode);
                    } else {
                        document.head.appendChild(el);
                    }
                    return el;
                }
                function flushCssBuffer(cssBuffer) {
                    var i;
                    if (cssBuffer === lastCssBuffer) {
                        lastCssBuffer = null;
                    }
                    newStyleTag(cssBuffer.cssText, marker);
                    for (i = 0; i < cssBuffer.callbacks.length; i++) {
                        cssBuffer.callbacks[i]();
                    }
                }
                function addEmbeddedCSS(cssText, callback) {
                    if (!lastCssBuffer || cssText.slice(0, '@import'.length) === '@import') {
                        lastCssBuffer = {
                            cssText: '',
                            callbacks: []
                        };
                        rAF(flushCssBuffer.bind(null, lastCssBuffer));
                    }
                    lastCssBuffer.cssText += '\n' + cssText;
                    lastCssBuffer.callbacks.push(callback);
                }
                function getCombinedVersion(modules) {
                    var hashes = modules.reduce(function(result, module) {
                        return result + registry[module].version;
                    }, '');
                    return fnv132(hashes);
                }
                function allReady(modules) {
                    var i = 0;
                    for (; i < modules.length; i++) {
                        if (mw.loader.getState(modules[i]) !== 'ready') {
                            return false;
                        }
                    }
                    return true;
                }
                function allWithImplicitReady(module) {
                    return allReady(registry[module].dependencies) && (baseModules.indexOf(module) !== -1 || allReady(baseModules));
                }
                function anyFailed(modules) {
                    var state, i = 0;
                    for (; i < modules.length; i++) {
                        state = mw.loader.getState(modules[i]);
                        if (state === 'error' || state === 'missing') {
                            return true;
                        }
                    }
                    return false;
                }
                function doPropagation() {
                    var errorModule, baseModuleError, module, i, failed, job, didPropagate = !0;
                    do {
                        didPropagate = !1;
                        while (errorModules.length) {
                            errorModule = errorModules.shift();
                            baseModuleError = baseModules.indexOf(errorModule) !== -1;
                            for (module in registry) {
                                if (registry[module].state !== 'error' && registry[module].state !== 'missing') {
                                    if (baseModuleError && baseModules.indexOf(module) === -1) {
                                        registry[module].state = 'error';
                                        didPropagate = !0;
                                    } else if (registry[module].dependencies.indexOf(errorModule) !== -1) {
                                        registry[module].state = 'error';
                                        errorModules.push(module);
                                        didPropagate = !0;
                                    }
                                }
                            }
                        }
                        for (module in registry) {
                            if (registry[module].state === 'loaded' && allWithImplicitReady(module)) {
                                execute(module);
                                didPropagate = !0;
                            }
                        }
                        for (i = 0; i < jobs.length; i++) {
                            job = jobs[i];
                            failed = anyFailed(job.dependencies);
                            if (failed || allReady(job.dependencies)) {
                                jobs.splice(i, 1);
                                i -= 1;
                                try {
                                    if (failed && job.error) {
                                        job.error(new Error('Failed dependencies'), job.dependencies);
                                    } else if (!failed && job.ready) {
                                        job.ready();
                                    }
                                } catch (e) {
                                    mw.trackError('resourceloader.exception', {
                                        exception: e,
                                        source: 'load-callback'
                                    });
                                }
                                didPropagate = !0;
                            }
                        }
                    } while (didPropagate);willPropagate = !1;
                }
                function requestPropagation() {
                    if (willPropagate) {
                        return;
                    }
                    willPropagate = !0;
                    mw.requestIdleCallback(doPropagation, {
                        timeout: 1
                    });
                }
                function setAndPropagate(module, state) {
                    registry[module].state = state;
                    if (state === 'loaded' || state === 'ready' || state === 'error' || state === 'missing') {
                        if (state === 'ready') {
                            mw.loader.store.add(module);
                        } else if (state === 'error' || state === 'missing') {
                            errorModules.push(module);
                        }
                        requestPropagation();
                    }
                }
                function sortDependencies(module, resolved, unresolved) {
                    var i, skip, deps;
                    if (!(module in registry)) {
                        throw new Error('Unknown module: ' + module);
                    }
                    if (typeof registry[module].skip === 'string') {
                        skip = (new Function(registry[module].skip)());
                        registry[module].skip = !!skip;
                        if (skip) {
                            registry[module].dependencies = [];
                            setAndPropagate(module, 'ready');
                            return;
                        }
                    }
                    if (!unresolved) {
                        unresolved = new StringSet();
                    }
                    deps = registry[module].dependencies;
                    unresolved.add(module);
                    for (i = 0; i < deps.length; i++) {
                        if (resolved.indexOf(deps[i]) === -1) {
                            if (unresolved.has(deps[i])) {
                                throw new Error('Circular reference detected: ' + module + ' -> ' + deps[i]);
                            }
                            sortDependencies(deps[i], resolved, unresolved);
                        }
                    }
                    resolved.push(module);
                }
                function resolve(modules) {
                    var resolved = baseModules.slice()
                      , i = 0;
                    for (; i < modules.length; i++) {
                        sortDependencies(modules[i], resolved);
                    }
                    return resolved;
                }
                function resolveStubbornly(modules) {
                    var saved, resolved = baseModules.slice(), i = 0;
                    for (; i < modules.length; i++) {
                        saved = resolved.slice();
                        try {
                            sortDependencies(modules[i], resolved);
                        } catch (err) {
                            resolved = saved;
                            mw.log.warn('Skipped unresolvable module ' + modules[i]);
                            if (modules[i]in registry) {
                                mw.trackError('resourceloader.exception', {
                                    exception: err,
                                    source: 'resolve'
                                });
                            }
                        }
                    }
                    return resolved;
                }
                function resolveRelativePath(relativePath, basePath) {
                    var prefixes, prefix, baseDirParts, relParts = relativePath.match(/^((?:\.\.?\/)+)(.*)$/);
                    if (!relParts) {
                        return null;
                    }
                    baseDirParts = basePath.split('/');
                    baseDirParts.pop();
                    prefixes = relParts[1].split('/');
                    prefixes.pop();
                    while ((prefix = prefixes.pop()) !== undefined) {
                        if (prefix === '..') {
                            baseDirParts.pop();
                        }
                    }
                    return (baseDirParts.length ? baseDirParts.join('/') + '/' : '') + relParts[2];
                }
                function makeRequireFunction(moduleObj, basePath) {
                    return function require(moduleName) {
                        var fileName, fileContent, result, moduleParam, scriptFiles = moduleObj.script.files;
                        fileName = resolveRelativePath(moduleName, basePath);
                        if (fileName === null) {
                            return mw.loader.require(moduleName);
                        }
                        if (!hasOwn.call(scriptFiles, fileName)) {
                            throw new Error('Cannot require undefined file ' + fileName);
                        }
                        if (hasOwn.call(moduleObj.packageExports, fileName)) {
                            return moduleObj.packageExports[fileName];
                        }
                        fileContent = scriptFiles[fileName];
                        if (typeof fileContent === 'function') {
                            moduleParam = {
                                exports: {}
                            };
                            fileContent(makeRequireFunction(moduleObj, fileName), moduleParam);
                            result = moduleParam.exports;
                        } else {
                            result = fileContent;
                        }
                        moduleObj.packageExports[fileName] = result;
                        return result;
                    }
                    ;
                }
                function addScript(src, callback) {
                    var script = document.createElement('script');
                    script.src = src;
                    script.onload = script.onerror = function() {
                        if (script.parentNode) {
                            script.parentNode.removeChild(script);
                        }
                        if (callback) {
                            callback();
                            callback = null;
                        }
                    }
                    ;
                    document.head.appendChild(script);
                }
                function queueModuleScript(src, moduleName, callback) {
                    pendingRequests.push(function() {
                        if (moduleName !== 'jquery') {
                            window.require = mw.loader.require;
                            window.module = registry[moduleName].module;
                        }
                        addScript(src, function() {
                            delete window.module;
                            callback();
                            if (pendingRequests[0]) {
                                pendingRequests.shift()();
                            } else {
                                handlingPendingRequests = !1;
                            }
                        });
                    });
                    if (!handlingPendingRequests && pendingRequests[0]) {
                        handlingPendingRequests = !0;
                        pendingRequests.shift()();
                    }
                }
                function addLink(url, media, nextNode) {
                    var el = document.createElement('link');
                    el.rel = 'stylesheet';
                    if (media) {
                        el.media = media;
                    }
                    el.href = url;
                    if (nextNode && nextNode.parentNode) {
                        nextNode.parentNode.insertBefore(el, nextNode);
                    } else {
                        document.head.appendChild(el);
                    }
                }
                function domEval(code) {
                    var script = document.createElement('script');
                    if (mw.config.get('wgCSPNonce') !== false) {
                        script.nonce = mw.config.get('wgCSPNonce');
                    }
                    script.text = code;
                    document.head.appendChild(script);
                    script.parentNode.removeChild(script);
                }
                function enqueue(dependencies, ready, error) {
                    if (allReady(dependencies)) {
                        if (ready !== undefined) {
                            ready();
                        }
                        return;
                    }
                    if (anyFailed(dependencies)) {
                        if (error !== undefined) {
                            error(new Error('One or more dependencies failed to load'), dependencies);
                        }
                        return;
                    }
                    if (ready !== undefined || error !== undefined) {
                        jobs.push({
                            dependencies: dependencies.filter(function(module) {
                                var state = registry[module].state;
                                return state === 'registered' || state === 'loaded' || state === 'loading' || state === 'executing';
                            }),
                            ready: ready,
                            error: error
                        });
                    }
                    dependencies.forEach(function(module) {
                        if (registry[module].state === 'registered' && queue.indexOf(module) === -1) {
                            queue.push(module);
                        }
                    });
                    mw.loader.work();
                }
                function execute(module) {
                    var key, value, media, i, urls, cssHandle, siteDeps, siteDepErr, runScript, cssPending = 0;
                    if (registry[module].state !== 'loaded') {
                        throw new Error('Module in state "' + registry[module].state + '" may not execute: ' + module);
                    }
                    registry[module].state = 'executing';
                    runScript = function() {
                        var script, markModuleReady, nestedAddScript, mainScript;
                        script = registry[module].script;
                        markModuleReady = function() {
                            setAndPropagate(module, 'ready');
                        }
                        ;
                        nestedAddScript = function(arr, callback, i) {
                            if (i >= arr.length) {
                                callback();
                                return;
                            }
                            queueModuleScript(arr[i], module, function() {
                                nestedAddScript(arr, callback, i + 1);
                            });
                        }
                        ;
                        try {
                            if (Array.isArray(script)) {
                                nestedAddScript(script, markModuleReady, 0);
                            } else if (typeof script === 'function' || (typeof script === 'object' && script !== null)) {
                                if (typeof script === 'function') {
                                    if (module === 'jquery') {
                                        script();
                                    } else {
                                        script(window.$, window.$, mw.loader.require, registry[module].module);
                                    }
                                } else {
                                    mainScript = script.files[script.main];
                                    if (typeof mainScript !== 'function') {
                                        throw new Error('Main file in module ' + module + ' must be a function');
                                    }
                                    mainScript(makeRequireFunction(registry[module], script.main), registry[module].module);
                                }
                                markModuleReady();
                            } else if (typeof script === 'string') {
                                domEval(script);
                                markModuleReady();
                            } else {
                                markModuleReady();
                            }
                        } catch (e) {
                            setAndPropagate(module, 'error');
                            mw.trackError('resourceloader.exception', {
                                exception: e,
                                module: module,
                                source: 'module-execute'
                            });
                        }
                    }
                    ;
                    if (registry[module].messages) {
                        mw.messages.set(registry[module].messages);
                    }
                    if (registry[module].templates) {
                        mw.templates.set(module, registry[module].templates);
                    }
                    cssHandle = function() {
                        cssPending++;
                        return function() {
                            var runScriptCopy;
                            cssPending--;
                            if (cssPending === 0) {
                                runScriptCopy = runScript;
                                runScript = undefined;
                                runScriptCopy();
                            }
                        }
                        ;
                    }
                    ;
                    if (registry[module].style) {
                        for (key in registry[module].style) {
                            value = registry[module].style[key];
                            media = undefined;
                            if (key !== 'url' && key !== 'css') {
                                if (typeof value === 'string') {
                                    addEmbeddedCSS(value, cssHandle());
                                } else {
                                    media = key;
                                    key = 'bc-url';
                                }
                            }
                            if (Array.isArray(value)) {
                                for (i = 0; i < value.length; i++) {
                                    if (key === 'bc-url') {
                                        addLink(value[i], media, marker);
                                    } else if (key === 'css') {
                                        addEmbeddedCSS(value[i], cssHandle());
                                    }
                                }
                            } else if (typeof value === 'object') {
                                for (media in value) {
                                    urls = value[media];
                                    for (i = 0; i < urls.length; i++) {
                                        addLink(urls[i], media, marker);
                                    }
                                }
                            }
                        }
                    }
                    if (module === 'user') {
                        try {
                            siteDeps = resolve(['site']);
                        } catch (e) {
                            siteDepErr = e;
                            runScript();
                        }
                        if (siteDepErr === undefined) {
                            enqueue(siteDeps, runScript, runScript);
                        }
                    } else if (cssPending === 0) {
                        runScript();
                    }
                }
                function sortQuery(o) {
                    var key, sorted = {}, a = [];
                    for (key in o) {
                        a.push(key);
                    }
                    a.sort();
                    for (key = 0; key < a.length; key++) {
                        sorted[a[key]] = o[a[key]];
                    }
                    return sorted;
                }
                function buildModulesString(moduleMap) {
                    var p, prefix, str = [], list = [];
                    function restore(suffix) {
                        return p + suffix;
                    }
                    for (prefix in moduleMap) {
                        p = prefix === '' ? '' : prefix + '.';
                        str.push(p + moduleMap[prefix].join(','));
                        list.push.apply(list, moduleMap[prefix].map(restore));
                    }
                    return {
                        str: str.join('|'),
                        list: list
                    };
                }
                function resolveIndexedDependencies(modules) {
                    var i, j, deps;
                    function resolveIndex(dep) {
                        return typeof dep === 'number' ? modules[dep][0] : dep;
                    }
                    for (i = 0; i < modules.length; i++) {
                        deps = modules[i][2];
                        if (deps) {
                            for (j = 0; j < deps.length; j++) {
                                deps[j] = resolveIndex(deps[j]);
                            }
                        }
                    }
                }
                function makeQueryString(params) {
                    return Object.keys(params).map(function(key) {
                        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
                    }).join('&');
                }
                function batchRequest(batch) {
                    var reqBase, splits, b, bSource, bGroup, source, group, i, modules, sourceLoadScript, currReqBase, currReqBaseLength, moduleMap, currReqModules, l, lastDotIndex, prefix, suffix, bytesAdded;
                    function doRequest() {
                        var query = Object.create(currReqBase)
                          , packed = buildModulesString(moduleMap);
                        query.modules = packed.str;
                        query.version = getCombinedVersion(packed.list);
                        query = sortQuery(query);
                        addScript(sourceLoadScript + '?' + makeQueryString(query));
                    }
                    if (!batch.length) {
                        return;
                    }
                    batch.sort();
                    reqBase = {
                        "lang": "en",
                        "skin": "vector"
                    };
                    splits = Object.create(null);
                    for (b = 0; b < batch.length; b++) {
                        bSource = registry[batch[b]].source;
                        bGroup = registry[batch[b]].group;
                        if (!splits[bSource]) {
                            splits[bSource] = Object.create(null);
                        }
                        if (!splits[bSource][bGroup]) {
                            splits[bSource][bGroup] = [];
                        }
                        splits[bSource][bGroup].push(batch[b]);
                    }
                    for (source in splits) {
                        sourceLoadScript = sources[source];
                        for (group in splits[source]) {
                            modules = splits[source][group];
                            currReqBase = Object.create(reqBase);
                            if (group === 0 && mw.config.get('wgUserName') !== null) {
                                currReqBase.user = mw.config.get('wgUserName');
                            }
                            currReqBaseLength = makeQueryString(currReqBase).length + 23;
                            l = currReqBaseLength;
                            moduleMap = Object.create(null);
                            currReqModules = [];
                            for (i = 0; i < modules.length; i++) {
                                lastDotIndex = modules[i].lastIndexOf('.');
                                prefix = modules[i].substr(0, lastDotIndex);
                                suffix = modules[i].slice(lastDotIndex + 1);
                                bytesAdded = moduleMap[prefix] ? suffix.length + 3 : modules[i].length + 3;
                                if (currReqModules.length && l + bytesAdded > mw.loader.maxQueryLength) {
                                    doRequest();
                                    l = currReqBaseLength;
                                    moduleMap = Object.create(null);
                                    currReqModules = [];
                                    mw.track('resourceloader.splitRequest', {
                                        maxQueryLength: mw.loader.maxQueryLength
                                    });
                                }
                                if (!moduleMap[prefix]) {
                                    moduleMap[prefix] = [];
                                }
                                l += bytesAdded;
                                moduleMap[prefix].push(suffix);
                                currReqModules.push(modules[i]);
                            }
                            if (currReqModules.length) {
                                doRequest();
                            }
                        }
                    }
                }
                function asyncEval(implementations, cb) {
                    if (!implementations.length) {
                        return;
                    }
                    mw.requestIdleCallback(function() {
                        try {
                            domEval(implementations.join(';'));
                        } catch (err) {
                            cb(err);
                        }
                    });
                }
                function getModuleKey(module) {
                    return module in registry ? (module + '@' + registry[module].version) : null;
                }
                function splitModuleKey(key) {
                    var index = key.indexOf('@');
                    if (index === -1) {
                        return {
                            name: key,
                            version: ''
                        };
                    }
                    return {
                        name: key.slice(0, index),
                        version: key.slice(index + 1)
                    };
                }
                function registerOne(module, version, dependencies, group, source, skip) {
                    if (module in registry) {
                        throw new Error('module already registered: ' + module);
                    }
                    registry[module] = {
                        module: {
                            exports: {}
                        },
                        packageExports: {},
                        version: String(version || ''),
                        dependencies: dependencies || [],
                        group: typeof group === 'undefined' ? null : group,
                        source: typeof source === 'string' ? source : 'local',
                        state: 'registered',
                        skip: typeof skip === 'string' ? skip : null
                    };
                }
                return {
                    moduleRegistry: registry,
                    maxQueryLength: 2000,
                    addStyleTag: newStyleTag,
                    enqueue: enqueue,
                    resolve: resolve,
                    work: function() {
                        var q, module, implementation, storedImplementations = [], storedNames = [], requestNames = [], batch = new StringSet();
                        mw.loader.store.init();
                        q = queue.length;
                        while (q--) {
                            module = queue[q];
                            if (module in registry && registry[module].state === 'registered') {
                                if (!batch.has(module)) {
                                    registry[module].state = 'loading';
                                    batch.add(module);
                                    implementation = mw.loader.store.get(module);
                                    if (implementation) {
                                        storedImplementations.push(implementation);
                                        storedNames.push(module);
                                    } else {
                                        requestNames.push(module);
                                    }
                                }
                            }
                        }
                        queue = [];
                        asyncEval(storedImplementations, function(err) {
                            var failed;
                            mw.loader.store.stats.failed++;
                            mw.loader.store.clear();
                            mw.trackError('resourceloader.exception', {
                                exception: err,
                                source: 'store-eval'
                            });
                            failed = storedNames.filter(function(module) {
                                return registry[module].state === 'loading';
                            });
                            batchRequest(failed);
                        });
                        batchRequest(requestNames);
                    },
                    addSource: function(ids) {
                        var id;
                        for (id in ids) {
                            if (id in sources) {
                                throw new Error('source already registered: ' + id);
                            }
                            sources[id] = ids[id];
                        }
                    },
                    register: function(modules) {
                        var i;
                        if (typeof modules === 'object') {
                            resolveIndexedDependencies(modules);
                            for (i = 0; i < modules.length; i++) {
                                registerOne.apply(null, modules[i]);
                            }
                        } else {
                            registerOne.apply(null, arguments);
                        }
                    },
                    implement: function(module, script, style, messages, templates) {
                        var split = splitModuleKey(module)
                          , name = split.name
                          , version = split.version;
                        if (!(name in registry)) {
                            mw.loader.register(name);
                        }
                        if (registry[name].script !== undefined) {
                            throw new Error('module already implemented: ' + name);
                        }
                        if (version) {
                            registry[name].version = version;
                        }
                        registry[name].script = script || null;
                        registry[name].style = style || null;
                        registry[name].messages = messages || null;
                        registry[name].templates = templates || null;
                        if (registry[name].state !== 'error' && registry[name].state !== 'missing') {
                            setAndPropagate(name, 'loaded');
                        }
                    },
                    load: function(modules, type) {
                        if (typeof modules === 'string' && /^(https?:)?\/?\//.test(modules)) {
                            if (type === 'text/css') {
                                addLink(modules);
                            } else if (type === 'text/javascript' || type === undefined) {
                                addScript(modules);
                            } else {
                                throw new Error('Invalid type ' + type);
                            }
                        } else {
                            modules = typeof modules === 'string' ? [modules] : modules;
                            enqueue(resolveStubbornly(modules), undefined, undefined);
                        }
                    },
                    state: function(states) {
                        var module, state;
                        for (module in states) {
                            state = states[module];
                            if (!(module in registry)) {
                                mw.loader.register(module);
                            }
                            setAndPropagate(module, state);
                        }
                    },
                    getState: function(module) {
                        return module in registry ? registry[module].state : null;
                    },
                    getModuleNames: function() {
                        return Object.keys(registry);
                    },
                    require: function(moduleName) {
                        var state = mw.loader.getState(moduleName);
                        if (state !== 'ready') {
                            throw new Error('Module "' + moduleName + '" is not loaded');
                        }
                        return registry[moduleName].module.exports;
                    },
                    store: {
                        enabled: null,
                        MODULE_SIZE_MAX: 1e5,
                        items: {},
                        queue: [],
                        stats: {
                            hits: 0,
                            misses: 0,
                            expired: 0,
                            failed: 0
                        },
                        toJSON: function() {
                            return {
                                items: mw.loader.store.items,
                                vary: mw.loader.store.vary,
                                asOf: Math.ceil(Date.now() / 1e7)
                            };
                        },
                        key: "MediaWikiModuleStore:mediawiki",
                        vary: "vector:1:en",
                        init: function() {
                            var raw, data;
                            if (this.enabled !== null) {
                                return;
                            }
                            if (!true || /Firefox/.test(navigator.userAgent)) {
                                this.clear();
                                this.enabled = !1;
                                return;
                            }
                            try {
                                raw = localStorage.getItem(this.key);
                                this.enabled = !0;
                                data = JSON.parse(raw);
                                if (data && typeof data.items === 'object' && data.vary === this.vary && Date.now() < (data.asOf * 1e7) + 259e7) {
                                    this.items = data.items;
                                    return;
                                }
                            } catch (e) {}
                            if (raw === undefined) {
                                this.enabled = !1;
                            }
                        },
                        get: function(module) {
                            var key;
                            if (this.enabled) {
                                key = getModuleKey(module);
                                if (key in this.items) {
                                    this.stats.hits++;
                                    return this.items[key];
                                }
                                this.stats.misses++;
                            }
                            return false;
                        },
                        add: function(module) {
                            if (this.enabled) {
                                this.queue.push(module);
                                this.requestUpdate();
                            }
                        },
                        set: function(module) {
                            var key, args, src, encodedScript, descriptor = mw.loader.moduleRegistry[module];
                            key = getModuleKey(module);
                            if (key in this.items || !descriptor || descriptor.state !== 'ready' || !descriptor.version || descriptor.group === 1 || descriptor.group === 0 || [descriptor.script, descriptor.style, descriptor.messages, descriptor.templates].indexOf(undefined) !== -1) {
                                return;
                            }
                            try {
                                if (typeof descriptor.script === 'function') {
                                    encodedScript = String(descriptor.script);
                                } else if (typeof descriptor.script === 'object' && descriptor.script && !Array.isArray(descriptor.script)) {
                                    encodedScript = '{' + 'main:' + JSON.stringify(descriptor.script.main) + ',' + 'files:{' + Object.keys(descriptor.script.files).map(function(key) {
                                        var value = descriptor.script.files[key];
                                        return JSON.stringify(key) + ':' + (typeof value === 'function' ? value : JSON.stringify(value));
                                    }).join(',') + '}}';
                                } else {
                                    encodedScript = JSON.stringify(descriptor.script);
                                }
                                args = [JSON.stringify(key), encodedScript, JSON.stringify(descriptor.style), JSON.stringify(descriptor.messages), JSON.stringify(descriptor.templates)];
                            } catch (e) {
                                mw.trackError('resourceloader.exception', {
                                    exception: e,
                                    source: 'store-localstorage-json'
                                });
                                return;
                            }
                            src = 'mw.loader.implement(' + args.join(',') + ');';
                            if (src.length > this.MODULE_SIZE_MAX) {
                                return;
                            }
                            this.items[key] = src;
                        },
                        prune: function() {
                            var key, module;
                            for (key in this.items) {
                                module = key.slice(0, key.indexOf('@'));
                                if (getModuleKey(module) !== key) {
                                    this.stats.expired++;
                                    delete this.items[key];
                                } else if (this.items[key].length > this.MODULE_SIZE_MAX) {
                                    delete this.items[key];
                                }
                            }
                        },
                        clear: function() {
                            this.items = {};
                            try {
                                localStorage.removeItem(this.key);
                            } catch (e) {}
                        },
                        requestUpdate: (function() {
                            var hasPendingWrites = !1;
                            function flushWrites() {
                                var data, key;
                                mw.loader.store.prune();
                                while (mw.loader.store.queue.length) {
                                    mw.loader.store.set(mw.loader.store.queue.shift());
                                }
                                key = mw.loader.store.key;
                                try {
                                    localStorage.removeItem(key);
                                    data = JSON.stringify(mw.loader.store);
                                    localStorage.setItem(key, data);
                                } catch (e) {
                                    mw.trackError('resourceloader.exception', {
                                        exception: e,
                                        source: 'store-localstorage-update'
                                    });
                                }
                                hasPendingWrites = !1;
                            }
                            function onTimeout() {
                                mw.requestIdleCallback(flushWrites);
                            }
                            return function() {
                                if (!hasPendingWrites) {
                                    hasPendingWrites = !0;
                                    setTimeout(onTimeout, 2000);
                                }
                            }
                            ;
                        }())
                    }
                };
            }())
        };
        window.mw = window.mediaWiki = mw;
    }());
    mw.requestIdleCallbackInternal = function(callback) {
        setTimeout(function() {
            var start = mw.now();
            callback({
                didTimeout: !1,
                timeRemaining: function() {
                    return Math.max(0, 50 - (mw.now() - start));
                }
            });
        }, 1);
    }
    ;
    mw.requestIdleCallback = window.requestIdleCallback ? window.requestIdleCallback.bind(window) : mw.requestIdleCallbackInternal;
    (function() {
        var queue;
        mw.loader.addSource({
            "local": "/mediawiki/load.php"
        });
        mw.loader.register([["site", "1iwgg", [1]], ["site.styles", "mc0ao", [], 2], ["noscript", "r22l1", [], 3], ["filepage", "1yjvh"], ["user", "k1cuu", [], 0], ["user.styles", "8fimp", [], 0], ["user.defaults", "7wxa9"], ["user.options", "1hzgi", [6], 1], ["mediawiki.skinning.elements", "jlsmg"], ["mediawiki.skinning.content", "jlsmg"], ["mediawiki.skinning.interface", "jlsmg"], ["jquery.makeCollapsible.styles", "dm1ye"], ["mediawiki.skinning.content.parsoid", "wzt6l"], ["mediawiki.skinning.content.externallinks", "1ck2b"], ["jquery", "yntai"], ["es6-promise", "1eg94", [], null, null, "return typeof Promise==='function'\u0026\u0026Promise.prototype.finally;"], ["mediawiki.base", "h4yyh", [14]], ["jquery.chosen", "1l80o"], ["jquery.client", "fwvev"], ["jquery.color", "dcjsx"], ["jquery.confirmable", "11aay", [111]], ["jquery.cookie", "13ckt"], ["jquery.form", "1wtf2"], ["jquery.fullscreen", "1xq4o"], ["jquery.highlightText", "1tsxs", [84]], ["jquery.hoverIntent", "1aklr"], ["jquery.i18n", "29w1w", [110]], ["jquery.lengthLimit", "1llrz", [67]], ["jquery.makeCollapsible", "m3jia", [11]], ["jquery.mw-jump", "r425l"], ["jquery.spinner", "16kkr", [31]], ["jquery.spinner.styles", "o62ui"], ["jquery.jStorage", "1ccp7"], ["jquery.suggestions", "9e98z", [24]], ["jquery.tablesorter", "1v038", [35, 112, 84]], ["jquery.tablesorter.styles", "14xq3"], ["jquery.textSelection", "152er", [18]], ["jquery.throttle-debounce", "xl0tk"], ["jquery.tipsy", "2xdg6"], ["jquery.ui", "zspg3"], ["moment", "d6rz2", [108, 84]], ["vue", "5urmd"], ["vuex", "c4upc", [15, 41]], ["mediawiki.template", "xae8l"], ["mediawiki.template.mustache", "nyt38", [43]], ["mediawiki.apipretty", "1cr6m"], ["mediawiki.api", "1evse", [72, 111]], ["mediawiki.content.json", "10enp"], ["mediawiki.confirmCloseWindow", "1khkw"], ["mediawiki.debug", "refdk", [201]], ["mediawiki.diff.styles", "xag6l"], ["mediawiki.feedback", "qp6e7", [308, 209]], ["mediawiki.feedlink", "8g6pw"], ["mediawiki.filewarning", "1wclm", [201, 213]], ["mediawiki.ForeignApi", "191mv", [55]], ["mediawiki.ForeignApi.core", "sdvbu", [81, 46, 197]], ["mediawiki.helplink", "jfrm0"], ["mediawiki.hlist", "1sovj"], ["mediawiki.htmlform", "1ionw", [27, 84]], ["mediawiki.htmlform.ooui", "j0ifc", [201]], ["mediawiki.htmlform.styles", "16h2d"], ["mediawiki.htmlform.ooui.styles", "jpu41"], ["mediawiki.icon", "1qkk5"], ["mediawiki.inspect", "f3swb", [67, 84]], ["mediawiki.notification", "1b6k9", [84, 91]], ["mediawiki.notification.convertmessagebox", "3la3s", [64]], ["mediawiki.notification.convertmessagebox.styles", "wj24b"], ["mediawiki.String", "15280"], ["mediawiki.pager.tablePager", "y4rld"], ["mediawiki.pulsatingdot", "tj1mg"], ["mediawiki.searchSuggest", "17a22", [33, 46]], ["mediawiki.storage", "187em"], ["mediawiki.Title", "1xq07", [67, 84]], ["mediawiki.Upload", "f21ph", [46]], ["mediawiki.ForeignUpload", "u99il", [54, 73]], ["mediawiki.ForeignStructuredUpload", "mi56z", [74]], ["mediawiki.Upload.Dialog", "issxg", [77]], ["mediawiki.Upload.BookletLayout", "aoh3y", [73, 82, 194, 40, 204, 209, 214, 215]], ["mediawiki.ForeignStructuredUpload.BookletLayout", "cpmmk", [75, 77, 115, 180, 174]], ["mediawiki.toc", "ckf9m", [88, 80]], ["mediawiki.toc.styles", "1bhdc"], ["mediawiki.Uri", "sqmr8", [84]], ["mediawiki.user", "93pz6", [46, 88]], ["mediawiki.userSuggest", "18k7y", [33, 46]], ["mediawiki.util", "ycw8t", [18]], ["mediawiki.viewport", "1vq57"], ["mediawiki.checkboxtoggle", "2yuhf"], ["mediawiki.checkboxtoggle.styles", "15kl9"], ["mediawiki.cookie", "aekkw", [21]], ["mediawiki.experiments", "hufn5"], ["mediawiki.editfont.styles", "ykswf"], ["mediawiki.visibleTimeout", "8jus4"], ["mediawiki.action.delete", "13i9y", [27, 201]], ["mediawiki.action.delete.file", "1s4gm", [27, 201]], ["mediawiki.action.edit", "8n13s", [36, 95, 46, 90, 176]], ["mediawiki.action.edit.styles", "11o6q"], ["mediawiki.action.edit.collapsibleFooter", "mu8ur", [28, 62, 71]], ["mediawiki.action.edit.preview", "st02b", [30, 36, 50, 82, 201]], ["mediawiki.action.history", "vgbiv", [28]], ["mediawiki.action.history.styles", "lghjl"], ["mediawiki.action.view.metadata", "1h3zt", [107]], ["mediawiki.action.view.categoryPage.styles", "1w0av"], ["mediawiki.action.view.postEdit", "1u8fz", [111, 64]], ["mediawiki.action.view.redirect", "q8iik", [18]], ["mediawiki.action.view.redirectPage", "15xbx"], ["mediawiki.action.edit.editWarning", "1gdkg", [36, 48, 111]], ["mediawiki.action.edit.watchlistExpiry", "8bngb", [201]], ["mediawiki.action.view.filepage", "u0gl5"], ["mediawiki.language", "1pxls", [109]], ["mediawiki.cldr", "erqtv", [110]], ["mediawiki.libs.pluralruleparser", "pvwvv"], ["mediawiki.jqueryMsg", "1qlbp", [108, 84, 7]], ["mediawiki.language.months", "1mcng", [108]], ["mediawiki.language.names", "v7814", [108]], ["mediawiki.language.specialCharacters", "omeh4", [108]], ["mediawiki.libs.jpegmeta", "c4xwo"], ["mediawiki.page.gallery", "1lzpw", [37, 117]], ["mediawiki.page.gallery.styles", "1aadm"], ["mediawiki.page.gallery.slideshow", "164d3", [46, 204, 223, 225]], ["mediawiki.page.ready", "1hbrf", [46]], ["mediawiki.page.startup", "cljv6"], ["mediawiki.page.watch.ajax", "pae5s", [46]], ["mediawiki.page.image.pagination", "1hhs1", [30, 84]], ["mediawiki.rcfilters.filters.base.styles", "q6208"], ["mediawiki.rcfilters.highlightCircles.seenunseen.styles", "etog4"], ["mediawiki.rcfilters.filters.dm", "169v1", [81, 82, 197]], ["mediawiki.rcfilters.filters.ui", "dpsii", [28, 125, 171, 210, 217, 219, 220, 221, 223, 224]], ["mediawiki.interface.helpers.styles", "1udi8"], ["mediawiki.special", "bo1tu"], ["mediawiki.special.apisandbox", "1gop0", [28, 81, 171, 177, 200, 215, 220]], ["mediawiki.special.block", "1sg1p", [58, 174, 189, 181, 190, 187, 215, 217]], ["mediawiki.misc-authed-ooui", "1dvz9", [59, 171, 176]], ["mediawiki.misc-authed-pref", "r18bc", [7]], ["mediawiki.misc-authed-curate", "18ydi", [20, 30, 46]], ["mediawiki.special.changeslist", "ofrub"], ["mediawiki.special.changeslist.enhanced", "19caq"], ["mediawiki.special.changeslist.legend", "pyumk"], ["mediawiki.special.changeslist.legend.js", "ntrpi", [28, 88]], ["mediawiki.special.contributions", "wcllz", [28, 111, 174, 200]], ["mediawiki.special.edittags", "13amk", [17, 27]], ["mediawiki.special.import", "o75mv"], ["mediawiki.special.preferences.ooui", "1pcv5", [48, 90, 65, 71, 181, 176]], ["mediawiki.special.preferences.styles.ooui", "wzxdo"], ["mediawiki.special.recentchanges", "13ytr", [171]], ["mediawiki.special.revisionDelete", "1f1rs", [27]], ["mediawiki.special.search", "1cmha", [192]], ["mediawiki.special.search.commonsInterwikiWidget", "1s9x8", [81, 46]], ["mediawiki.special.search.interwikiwidget.styles", "18y6q"], ["mediawiki.special.search.styles", "15lsy"], ["mediawiki.special.undelete", "19ytf", [171, 176]], ["mediawiki.special.unwatchedPages", "urar8", [46]], ["mediawiki.special.upload", "10jzw", [30, 46, 48, 115, 128, 43]], ["mediawiki.special.userlogin.common.styles", "qv6nr"], ["mediawiki.special.userlogin.login.styles", "15u1i"], ["mediawiki.special.createaccount", "ixosp", [46]], ["mediawiki.special.userlogin.signup.styles", "1de6p"], ["mediawiki.special.userrights", "z5m70", [27, 65]], ["mediawiki.special.watchlist", "smj4z", [46, 201, 220]], ["mediawiki.special.version", "1qu9b"], ["mediawiki.legacy.config", "1k3w5"], ["mediawiki.legacy.commonPrint", "1n3q6"], ["mediawiki.legacy.protect", "kpmwo", [27]], ["mediawiki.legacy.shared", "jlsmg"], ["mediawiki.legacy.oldshared", "1ojmo"], ["mediawiki.ui", "3xgmo"], ["mediawiki.ui.checkbox", "1x4k6"], ["mediawiki.ui.radio", "r14ir"], ["mediawiki.ui.anchor", "w5in5"], ["mediawiki.ui.button", "8et71"], ["mediawiki.ui.input", "g1bok"], ["mediawiki.ui.icon", "9ya1p"], ["mediawiki.widgets", "pj1sh", [46, 172, 204, 214]], ["mediawiki.widgets.styles", "rqacs"], ["mediawiki.widgets.AbandonEditDialog", "1n79q", [209]], ["mediawiki.widgets.DateInputWidget", "1b2lr", [175, 40, 204, 225]], ["mediawiki.widgets.DateInputWidget.styles", "2oyu8"], ["mediawiki.widgets.visibleLengthLimit", "1wyjs", [27, 201]], ["mediawiki.widgets.datetime", "slpz4", [84, 201, 224, 225]], ["mediawiki.widgets.expiry", "19dtp", [177, 40, 204]], ["mediawiki.widgets.CheckMatrixWidget", "12na7", [201]], ["mediawiki.widgets.CategoryMultiselectWidget", "tfu5z", [54, 204]], ["mediawiki.widgets.SelectWithInputWidget", "oe83m", [182, 204]], ["mediawiki.widgets.SelectWithInputWidget.styles", "1fufa"], ["mediawiki.widgets.SizeFilterWidget", "sawvf", [184, 204]], ["mediawiki.widgets.SizeFilterWidget.styles", "15b9u"], ["mediawiki.widgets.MediaSearch", "16ox3", [54, 204]], ["mediawiki.widgets.Table", "1gmb8", [204]], ["mediawiki.widgets.UserInputWidget", "qnre9", [46, 204]], ["mediawiki.widgets.UsersMultiselectWidget", "1iec8", [46, 204]], ["mediawiki.widgets.NamespacesMultiselectWidget", "1nuht", [204]], ["mediawiki.widgets.TitlesMultiselectWidget", "2tq85", [171]], ["mediawiki.widgets.TagMultiselectWidget.styles", "1vzh9"], ["mediawiki.widgets.SearchInputWidget", "1ri9j", [70, 171, 220]], ["mediawiki.widgets.SearchInputWidget.styles", "68its"], ["mediawiki.widgets.StashedFileWidget", "1ik9v", [46, 201]], ["mediawiki.watchstar.widgets", "1wp29", [200]], ["mediawiki.deflate", "gu4pi"], ["oojs", "1fhbo"], ["mediawiki.router", "1f8qs", [199]], ["oojs-router", "1xhla", [197]], ["oojs-ui", "yfxca", [207, 204, 209]], ["oojs-ui-core", "pupcs", [108, 197, 203, 202, 211]], ["oojs-ui-core.styles", "9mnxe"], ["oojs-ui-core.icons", "x9sbv"], ["oojs-ui-widgets", "19mjk", [201, 206]], ["oojs-ui-widgets.styles", "iy2ca"], ["oojs-ui-widgets.icons", "15x1h"], ["oojs-ui-toolbars", "1x2ja", [201, 208]], ["oojs-ui-toolbars.icons", "1bpkp"], ["oojs-ui-windows", "1fbtf", [201, 210]], ["oojs-ui-windows.icons", "18pva"], ["oojs-ui.styles.indicators", "1wc30"], ["oojs-ui.styles.icons-accessibility", "6s530"], ["oojs-ui.styles.icons-alerts", "1tiwp"], ["oojs-ui.styles.icons-content", "1ubyy"], ["oojs-ui.styles.icons-editing-advanced", "1lyjb"], ["oojs-ui.styles.icons-editing-citation", "3fktc"], ["oojs-ui.styles.icons-editing-core", "1yvpi"], ["oojs-ui.styles.icons-editing-list", "zpvfu"], ["oojs-ui.styles.icons-editing-styling", "1lzen"], ["oojs-ui.styles.icons-interactions", "1ul4s"], ["oojs-ui.styles.icons-layout", "g10yd"], ["oojs-ui.styles.icons-location", "7xeql"], ["oojs-ui.styles.icons-media", "1jasv"], ["oojs-ui.styles.icons-moderation", "napv2"], ["oojs-ui.styles.icons-movement", "1tj6j"], ["oojs-ui.styles.icons-user", "72wea"], ["oojs-ui.styles.icons-wikimedia", "17a1g"], ["skins.monobook.styles", "1hqi0"], ["skins.monobook.responsive", "m2aiv"], ["skins.monobook.mobile", "1s0qb", [84]], ["skins.timeless", "1chyy"], ["skins.timeless.js", "ktgsk"], ["skins.timeless.mobile", "d5ocj"], ["skins.vector.styles.legacy", "nurtp"], ["skins.vector.styles", "mqt1w"], ["skins.vector.icons", "1bqzh"], ["skins.vector.styles.responsive", "1fx4s"], ["skins.vector.js", "7gtxs", [119]], ["skins.vector.legacy.js", "ob8ru", [84]], ["socket.io", "is39l"], ["dompurify", "1q6qs"], ["color-picker", "1qvmf"], ["unicodejs", "13wdo"], ["papaparse", "17t4y"], ["rangefix", "f32vh"], ["spark-md5", "11tzz"], ["ext.visualEditor.supportCheck", "13m8w", [], 4], ["ext.visualEditor.sanitize", "jrkg8", [241, 264], 4], ["ext.visualEditor.progressBarWidget", "qevve", [], 4], ["ext.visualEditor.tempWikitextEditorWidget", "1ess5", [90, 82], 4], ["ext.visualEditor.desktopArticleTarget.init", "1g860", [249, 247, 250, 261, 36, 81, 120, 71], 4], ["ext.visualEditor.desktopArticleTarget.noscript", "11b6q"], ["ext.visualEditor.targetLoader", "590mt", [263, 261, 36, 81, 71, 82], 4], ["ext.visualEditor.desktopTarget", "1stbc", [], 4], ["ext.visualEditor.desktopArticleTarget", "1dwoo", [267, 272, 254, 277], 4], ["ext.visualEditor.collabTarget", "1yw92", [265, 271, 220, 221], 4], ["ext.visualEditor.collabTarget.desktop", "173h7", [256, 272, 254, 277], 4], ["ext.visualEditor.collabTarget.init", "e5g1t", [247, 171, 200], 4], ["ext.visualEditor.collabTarget.init.styles", "xc7ez"], ["ext.visualEditor.ve", "1scgz", [], 4], ["ext.visualEditor.track", "mi4nm", [260], 4], ["ext.visualEditor.core.utils", "9uq4f", [261, 200], 4], ["ext.visualEditor.core.utils.parsing", "1dfxr", [260], 4], ["ext.visualEditor.base", "1povc", [262, 263, 243], 4], ["ext.visualEditor.mediawiki", "a55qd", [264, 253, 34, 303], 4], ["ext.visualEditor.mwsave", "843o6", [275, 27, 50, 220], 4], ["ext.visualEditor.articleTarget", "dy23r", [276, 266, 173], 4], ["ext.visualEditor.data", "1d6j3", [265]], ["ext.visualEditor.core", "2vn4d", [248, 247, 18, 244, 245, 246], 4], ["ext.visualEditor.commentAnnotation", "ufndb", [269], 4], ["ext.visualEditor.rebase", "8wxje", [242, 286, 270, 226, 240], 4], ["ext.visualEditor.core.desktop", "4hsf8", [269], 4], ["ext.visualEditor.welcome", "1i2s5", [200], 4], ["ext.visualEditor.switching", "13kx0", [46, 200, 212, 215, 217], 4], ["ext.visualEditor.mwcore", "1otip", [287, 265, 274, 273, 127, 69, 12, 171], 4], ["ext.visualEditor.mwextensions", "yfxca", [268, 298, 291, 293, 278, 295, 280, 292, 281, 283], 4], ["ext.visualEditor.mwextensions.desktop", "yfxca", [276, 282, 78], 4], ["ext.visualEditor.mwformatting", "9wsr9", [275], 4], ["ext.visualEditor.mwimage.core", "i76n9", [275], 4], ["ext.visualEditor.mwimage", "triau", [279, 185, 40, 223, 227], 4], ["ext.visualEditor.mwlink", "18z1j", [275], 4], ["ext.visualEditor.mwmeta", "12d6q", [281, 104], 4], ["ext.visualEditor.mwtransclusion", "1rl1x", [275, 187], 4], ["treeDiffer", "1g4bg"], ["diffMatchPatch", "kauq0"], ["ext.visualEditor.checkList", "tl0rp", [269], 4], ["ext.visualEditor.diffing", "ymexp", [285, 269, 284], 4], ["ext.visualEditor.diffPage.init.styles", "1lbiz"], ["ext.visualEditor.diffLoader", "te1ma", [253], 4], ["ext.visualEditor.diffPage.init", "5603d", [289, 200, 212, 215], 4], ["ext.visualEditor.language", "lf7uk", [269, 303, 113], 4], ["ext.visualEditor.mwlanguage", "1msvw", [269], 4], ["ext.visualEditor.mwalienextension", "1ehhv", [275], 4], ["ext.visualEditor.mwwikitext", "iabe3", [281, 90], 4], ["ext.visualEditor.mwgallery", "1mraz", [275, 117, 185, 223], 4], ["ext.visualEditor.mwsignature", "15xz9", [283], 4], ["ext.visualEditor.experimental", "yfxca", [], 4], ["ext.visualEditor.icons", "yfxca", [299, 300, 213, 214, 215, 217, 218, 219, 220, 221, 224, 225, 226, 211], 4], ["ext.visualEditor.moduleIcons", "k7cm9"], ["ext.visualEditor.moduleIndicators", "2yq36"], ["ext.cite.styles", "u9796"], ["ext.cite.style", "1r5f1"], ["jquery.uls.data", "14rdf"], ["ext.cite.ux-enhancements", "g4sqf"], ["ext.cite.visualEditor.core", "1h3sf", [275]], ["ext.cite.visualEditor.data", "1fjf8", [265]], ["ext.cite.visualEditor", "7xnxo", [302, 301, 305, 306, 283, 213, 216, 220]], ["mediawiki.messagePoster", "vwyha", [54]]]);
        mw.config.set(window.RLCONF || {});
        mw.loader.state(window.RLSTATE || {});
        mw.loader.load(window.RLPAGEMODULES || []);
        queue = window.RLQ || [];
        RLQ = [];
        RLQ.push = function(fn) {
            if (typeof fn === 'function') {
                fn();
            } else {
                RLQ[RLQ.length] = fn;
            }
        }
        ;
        while (queue[0]) {
            RLQ.push(queue.shift());
        }
        NORLQ = {
            push: function() {}
        };
    }());
}
