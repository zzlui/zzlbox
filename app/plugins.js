
/* Plugin instance */

ZZLBox.Plugin = function(){
    this.initialize && this.initialize();
}

ZZLBox.Plugin.extend = Backbone.View.extend;

_.extend(ZZLBox.Plugin.prototype, Backbone.Events);


/* Plugins factory */

ZZLBox.Plugins = function() {
    this.binds = {};
    this.hooks = {};
    this.waits = {};
    this.info = {};
    this.loaded = [];
};

ZZLBox.Plugins.AvailableList = [
    // Custom plugins, can be disabled
    'checkall',
    'display-type',
    'feeds',
    'fileset',
    'file.image',
    'file.media',
    'file.video',
    'labels',
    'metasearch',
    'panel',
    'screenshots',
    'scroll-pagination',
    'status-navigation',
    'torrents',
    // CORE functionality, can't be disabled
    'core/files',
    'core/errors',
    'core/account',
    'core/add',
    'core/downloads',
    'core/file',
    'core/link',
    'core/navigation',
    'core/toolbar',
    'core/filters',
    'core/static',
    'core/welcome'
];

ZZLBox.Plugins.prototype.init = function(list, callback) {

    if(!window.DEBUG && zzlbox.models.User && zzlbox.models.User.auth) {
        // allways load all core plugins for registered user
        // but not in DEBUG mode
        var corePlugins = $.grep(ZZLBox.Plugins.AvailableList, function(p) {
            return p.substr(0, 5) == 'core/';
        });
        list = _.union(corePlugins, _.without(list, corePlugins));
    }

    if(list.length == 0) {
        callback();
        return this;
    }

    var that = this;

    var ready = 0, waits = 0;
    function _callback() {
        if(waits > 0 && ready + waits == list.length) {
            that._wait();
        } else if(ready == list.length) {
            callback();
        }
    }

    $.each(list, function(i, id) {
        that.loadPlugin(id, function() {
            ready++;
            _callback();
        }, function() {
            waits++;
            _callback();
        }, function() {
            ready++;
            _callback();
        });
    });

};

// load plugin info, check requires and run initPlugin
ZZLBox.Plugins.prototype.loadPlugin = function(id, success, wait, error, onlyInfo) {

    if(this.info[id]) {
        success && success();
        return true;
    }

    var that = this, url;

    if($.inArray(id.substr(0, 7), ['http://', 'https:/']) >= 0) {
        // full url, custom plugin
        url = id.split('plugin.json').join('');
        if(url.substr(-1) != '/') {
            url += '/';
        }
    } else {
        // official plugin
        url = '/plugins/' + id + '/';
    }
    function fakeInfo(error) {
        that.info[id] = {
            id: id,
            name: 'Unknown',
            url: url,
            error: zzlbox.plugins['Errors'] ? zzlbox.plugins.Errors.format(error, [id]) : error
        }
    }
    $.ajax({
        url: url + 'plugin.json?' + URIREV,
        data: {},
        success: function(info) {
            try {
                info = JSON.parse(info);
            } catch (e) {
                fakeInfo('PLUGIN_JSON');
                zzlbox.error(e, 'PLUGIN_JSON', [id]);
            }
            info.url || (info.url = url);
            info.id = id;
            that.info[id] = info;

            if(info.locales) {
                $.locales.addFolder(info.url + 'locales/', info.locales, function() {
                    info.name = __(info.name);
                    info.description = __(info.description);
                    load();
                });
            } else {
                load();
            }

            function load() {
                if(onlyInfo) {
                    onlyInfo();
                    return;
                }

                if(info.require) {
                    that.wait(info.require, function() {
                        that.initPlugin(id, success);
                    }, function() {
                        error && error();
                        zzlbox.error({}, 'PLUGIN_REQ', [id, JSON.stringify(_.without(_.union(info.require), that.loaded))]);
                    });
                    wait && wait();
                } else {
                    that.initPlugin(id, success);
                }
            }
        },
        error: function(xhr, type, err) {
            error && error();
            fakeInfo('PLUGIN_LOAD');
            zzlbox.error(err || 'Unknown', 'PLUGIN_LOAD', [id]);
        },
        dataType: 'text'
    });
}

// init plugin
ZZLBox.Plugins.prototype.initPlugin = function(id, callback) {
    var info = this.info[id], that = this;
    // include css
    info.css && $.each($.isArray(info.css) ? info.css : [info.css], function(i, css) {
        $("<link>")
            .appendTo('head')
            .attr({type : 'text/css', rel : 'stylesheet'})
            .attr('href', info.url + css + '?' + URIREV);
    });
    // load templates
    ZZLBox.View.prototype._loadTemplates.call({tpl: info.tpl || false}, function() {
        // include js
        if(info.include) {
            var ws = new WaitSync(function() {
                that.loaded.push(id);
                // init plugin class
                if(info.init) {
                    try {
                        that[info.init] = new ZZLBox.Plugins[info.init];
                        that[info.init]._name = info.init; // for debug
                        that[info.init].url = info.url;
                    } catch(e) {
                        zzlbox.error(e, 'PLUGIN_INIT', [id, info.init]);
                    }
                    that._wait(info.init);
                }
                // add routes
                info.routes && $.each(info.routes, $.isArray(info.routes) ? function() {zzlbox.router.add(this)} : _.bind(zzlbox.router.add, zzlbox.router));
                that._wait(id);
                callback && callback();
            });
            $.each(_.union(info.include), function(i, incl) {
                $.ajax(info.url + incl + '?' + URIREV, {
                    crossDomain: true, // jquery will attach new script tag in head instead eval
                    complete: ws.wrap(function(){}),
                    dataType: 'script',
                    cache: true,
                });
            });
        } else {
            that._wait(id);
            callback && callback();
        }
    }, info.url);

};

// run hook callbacks and remove it from array
// check if can run before
ZZLBox.Plugins.prototype._hook = function(name) {
    var hook, binds;
    if((hook = this.hooks[name]) && (binds = this.binds[name])) {
        for(; hook.last < binds.sort(function(a, b) { return a[2] - b[2]; }).length; hook.last++) {
            try {
                binds[hook.last][0].apply(binds[hook.last][1], hook.args);
            } catch(e) {
                // third param for debug
                zzlbox.error(e, 'HOOK_INIT', [name, hook.last, (binds[hook.last][1] || {})._name || 'unknown']);
            }
        }
    }
}

ZZLBox.Plugins.prototype.hook = function(name) {
    var args = Array.prototype.slice.call(arguments, 1);
    this.hooks[name] = {args: args, last: 0};
    this._hook(name);
};

ZZLBox.Plugins.prototype.bind = function(name, callback, obj, order) {
    (this.binds[name] || (this.binds[name] = [])).push([callback, obj || null, order == undefined ? 9999 : order]);
    this._hook(name);
};

ZZLBox.Plugins.prototype._wait = function(name) {
    if(name == undefined) {
        // run errors
        $.each(this.waits, function(name, v) {
            $.each(v, function(i, waiter) {
                waiter.complete = true;
                try {
                    waiter.error && waiter.error();
                } catch(e) {
                    zzlbox.error(e, 'WAITER_FAIL', [name, i]);
                }
            });
        });
        return;
    }

    var plugin;
    if(plugin = this.info[name] ? this[this.info[name].init] : this[name]) {
        this.waits[name] = $.grep(this.waits[name] || [], function(waiter, i) {
            if((waiter.names = _.without(waiter.names, name)).length == 0) {
                waiter.complete = true;
                try {
                    waiter.success.apply(plugin);
                } catch(e) {
                    zzlbox.error(e, 'WAITER_SUCCESS', [name, i]);
                }
            }
            return false;
        });
    }
};

ZZLBox.Plugins.prototype.wait = function(names, success, error) {
    var waiter = {
        names: _.union(names), // make array from string
        success: success,
        error: error
    }, that = this;

    $.each(waiter.names, function(i, name) {
        (that.waits[name] || (that.waits[name] = [])).push(waiter);
        that._wait(name);
    });

};
