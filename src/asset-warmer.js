/**
 * Asset warmer
 *
 * Package for warming up website assets.
 *
 * @version 0.0.4
 * @author Rytis Grincevicius <public@kiberzauras.com>
 * @licence MIT
 */
(function (global) {
    'use strict';

    var Warmer = function(files, options) {
        this.VERSION = '0.0.4';
        this.const = {
            STATUS: {
                FLIGHT: 'flight',
                PENDING: 'pending',
                PROGRESS: 'progress',
                FINISHED: 'finished',
                FAILED: 'failed'
            }
        };
        this.events = [];
        this.files = [];
        this.options = {};

        this.registerEvent('update');
        // this.registerEvent('started');
        // this.registerEvent('progress');
        // this.registerEvent('finished');
        // this.registerEvent('loaded');
        // this.registerEvent('failed');

        this.registerEvent('asset_appended');
        this.registerEvent('finished');
        this.registerEvent('appended');

        this.options = this._mergeOptions({
            byOrder: true,
            preFlight: false,
            appendStyles: true,
            appendScripts: true,
            appendAtOnce: false,
            appendWhenDone: true
        }, options);

        this._prepare(files);
    };

    function Event(name) {
        this.name = name;
        this.callbacks = [];
    }

    Warmer.prototype.registerEvent = function(eventName){
        this.events[eventName] = new Event(eventName);
    };

    Warmer.prototype.dispatch = function(eventName, eventArgs){
        this.events[eventName].callbacks.forEach(function(callback){
            callback(eventArgs);
        });
    };

    Warmer.prototype.on = function(eventName, callback) {
        if (this.events.hasOwnProperty(eventName))
            this.events[eventName].callbacks.push(callback);
        else
            console.warn('asset-warmer: Event `' + eventName + '` is not registered.');
        return this;
    };

    Warmer.prototype._mergeOptions = function(origin, other) {
        var result = {};
        for (var attrname in origin) { result[attrname] = origin[attrname]; }
        for (var attrname in other) { result[attrname] = other[attrname]; }
        return result;
    };

    Warmer.prototype._prepare = function (files) {
        var status = this.const.STATUS.PENDING;
        if (this.options.preFlight) {
            status = this.const.STATUS.FLIGHT;
        }
        if (!files || typeof files === 'undefined')
            throw 'asset-warmer: No files added to load!';

        if (typeof files === 'string') {
            files = [ files ];
        } else if(typeof files.length === 'undefined' && files) {
            var temp_file = files,
                item = {};

            if (temp_file.hasOwnProperty('src')) {
                item.src = temp_file.src;
                type = this.getFileExtension(temp_file.src);
            } else {
                throw 'asset-warmer: File object doesn\'t have `src` property.';
            }
            if (temp_file.hasOwnProperty('name')) {
                item.name = temp_file.name;
            } else {
                item.name = item.src.replace(/^.*[\\\/]/, '')
            }
            if (temp_file.hasOwnProperty('size')) {
                item.size = temp_file.size;
            }

            files = [ item ];
        }

        for (var i = 0; i<files.length; i++) {
            var file = files[i],
                size = 0,
                name,
                type,
                src;

            if (typeof file === 'string') {
                name = file.replace(/^.*[\\\/]/, '');
                type = this.getFileExtension(name);
                src = file;
            } else {
                if (file.hasOwnProperty('src')) {
                    src = file.src;
                    type = this.getFileExtension(file.src);
                } else {
                    console.warn('asset-warmer: File object doesn\'t have `src` property.', src);
                    return;
                }
                if (file.hasOwnProperty('name')) {
                    name = file.name;
                } else {
                    name = src.replace(/^.*[\\\/]/, '')
                }
                if (file.hasOwnProperty('size')) {
                    size = file.size;
                }
            }

            this.files.push({
                src: src,
                name: name,
                total: size,
                loaded: null,
                percentage: null,
                knownLength: false,
                type: type,
                status: status
            });
        }

        if (this.options.preFlight) {
            this._beginFlight();
        } else {
            this._begin();
        }
    };

    Warmer.prototype._beginFlight = function() {
        var _this = this;
        var pending = this.files.filter(function(item) {
            return item.status === _this.const.STATUS.FLIGHT;
        });
        if (pending.length) {
            this._flightDownload(pending[0]);
        } else {
            // this.dispatch('finished_flight', this.files);
            this._begin();
        }
    };

    Warmer.prototype._begin = function() {
        var _this = this;
        var pending = this.files.filter(function(item) {
            return item.status === _this.const.STATUS.PENDING;
        });
        if (pending.length) {
            this._download(pending[0]);
        } else {
            this.dispatch('finished', this.files);
            if (this.options.appendWhenDone) {
                this._appendAll();
            }
        }
    };

    Warmer.prototype._download = function(file) {
        var xhr;
        if (window.XMLHttpRequest){
            xhr = new XMLHttpRequest();
        } else {
            xhr = new ActiveXObject("Microsoft.XMLHTTP");
        }

        xhr.onprogress = onProgress.bind(null, file, this);
        xhr.addEventListener('load', onLoad.bind(null, file, this), false);
        xhr.addEventListener('error', onFailed.bind(null, file, this, 'error'), false);
        xhr.addEventListener('abort', onFailed.bind(null, file, this, 'abort'), false);
        xhr.open('GET', file.src, true);
        xhr.getResponseHeader('Content-Length');
        xhr.send();

        function onProgress(file, _this, $event) {
            file.status = _this.const.STATUS.PROGRESS;
            file.knownLength = $event.lengthComputable;
            file.loaded = $event.loaded;
            file.total = parseInt($event.lengthComputable ? $event.total : file.total);
            file.percentage = $event.lengthComputable ? _this.fixPercent(($event.loaded / $event.total * 100)) : 0;

            _this.dispatch('update', {
                file: file,
                type: 'asset_progress',
                progress: _this.progressInfo(),
                event: $event
            });
        }
        function onLoad(file, _this, $event) {
            file.status = _this.const.STATUS.FINISHED;
            _this.dispatch('update', {
                file: file,
                type: 'asset_loaded',
                progress: _this.progressInfo(),
                event: $event
            });
            _this._begin();
        }
        function onFailed(file, _this, type, $event) {
            file.status = _this.const.STATUS.FAILED;
            _this.dispatch('update', {
                file: file,
                type: 'asset_failed',
                progress: _this.progressInfo(),
                event: $event,
                errorType: type
            });
            _this._begin();
        }
    };

    Warmer.prototype._flightDownload = function(file) {
        var xhr;
        if (window.XMLHttpRequest){
            xhr = new XMLHttpRequest();
        } else {
            xhr = new ActiveXObject("Microsoft.XMLHTTP");
        }

        xhr.onprogress = onProgress.bind(null, file, this);
        xhr.addEventListener('load', onLoad.bind(null, file, this), false);
        xhr.addEventListener('error', onFailed.bind(null, file, this, 'error'), false);
        xhr.addEventListener('abort', onFailed.bind(null, file, this, 'abort'), false);
        xhr.open('HEAD', file.src, true);
        xhr.getResponseHeader('Content-Length');
        xhr.send();

        function onProgress(file, _this, $event) {
            //
        }
        function onLoad(file, _this, $event) {
            var contentLength = xhr.getResponseHeader('Content-Length');
            file.status = _this.const.STATUS.PENDING;
            if (contentLength) {
                file.total = parseInt(contentLength);
            }
            _this._beginFlight();
        }
        function onFailed(file, _this, type, $event) {
            _this._beginFlight();
        }
    };

    Warmer.prototype._appendAll = function() {
        var _this = this;
        var downloaded = this.files.filter(function(item) {
            return item.status === _this.const.STATUS.FINISHED;
        });
        for (var i = 0; i<downloaded.length; i++) {
            var item = downloaded[i];
            var elem;
            if (item.type === 'js') {
                if (this.options.appendScripts) {
                    elem = document.createElement('script');
                    elem.type = 'text/javascript';
                    elem.src = item.src;
                    document.getElementsByTagName('head')[0].appendChild(elem);
                    this.dispatch('asset_appended', item.file);
                }
            } else if (item.type === 'css') {
                if (this.options.appendStyles) {
                    elem = document.createElement('link');
                    elem.rel = 'stylesheet';
                    elem.href = item.src;
                    elem.media = 'screen';
                    document.getElementsByTagName('head')[0].appendChild(elem);
                    this.dispatch('asset_appended', item.file);
                }
            }

        }
        this.dispatch('appended', this.files);
    };

    Warmer.prototype.bytesLoaded = function() {
        var size = 0;
        for (var i = 0; i<this.files.length; i++) {
            size += +this.files[i].loaded;
        }
        return size;
    };

    Warmer.prototype.bytesTotal = function() {
        var size = 0;
        for (var i = 0; i<this.files.length; i++) {
            size += +this.files[i].total;
        }
        return size;
    };

    Warmer.prototype.progressInfo = function() {
        var _this = this;
        var downloaded = _this.files.filter(function(item) { return item.status === _this.const.STATUS.FINISHED}).length;
        var bytesLoaded =  _this.bytesLoaded();
        var bytesTotal = _this.bytesTotal();
        var filesCount = _this.files.length;
        return {
            bytes: {
                loaded: bytesLoaded,
                total: bytesTotal,
                percentage: _this.fixPercent(bytesLoaded / bytesTotal * 100)
            },
            files: {
                loaded: downloaded,
                loading: downloaded + 1 > filesCount ? filesCount : downloaded + 1,
                total: filesCount,
                percentage: _this.fixPercent(downloaded / filesCount * 100)
            },
            result: downloaded == filesCount ? 'finished' : 'progress'
        };
    };

    Warmer.prototype.fixPercent = function (value) {
        if (value > 100)
            value = 100;
        return parseFloat(value).toFixed(3);
    };

    Warmer.prototype.getFileExtension = function (name) {
        return name.split(/[?#]/)[0].split('.').pop();
    };

    // AMD support
    if (typeof define === 'function' && define.amd) {
        define(function () { return Warmer; });
        // CommonJS and Node.js module support.
    } else if (typeof exports !== 'undefined') {
        // Support Node.js specific `module.exports` (which can be a function)
        if (typeof module !== 'undefined' && module.exports) {
            exports = module.exports = Warmer;
        }
        // But always support CommonJS module 1.1.1 spec (`exports` cannot be a function)
        exports.Warmer = Warmer;
    } else {
        global.Warmer = Warmer;
    }

    if (typeof window !== 'undefined') {
        window.Warmer = Warmer;
    }

})(this);