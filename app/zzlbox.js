
// traditinal urls used in zzlbox API
jQuery.ajaxSettings.traditional = true;

// override default jQuery transport for IE
if(window['XDomainRequest']) {
    // save default xhr
    jQuery.ajaxSettings.xhr_back = jQuery.ajaxSettings.xhr;
    jQuery.ajaxSettings.xhr = function() {
        if(this.crossDomain) {
            try {
                // IE sucs
                var xhr = new window.XDomainRequest();
                xhr.onload = function() {
                    setTimeout(function(a,b,c) {
                        xhr.readyState = 4;
                        xhr.status = 200;
                        xhr.getAllResponseHeaders = function(){return '';}
                        xhr.onreadystatechange.apply(this, arguments);
                    }, 22);
                };
                return xhr;
            } catch(e) {}
        }
        // return original xhr
        return jQuery.ajaxSettings.xhr_back.apply(this, arguments);
    };

    // also, override the support check
    jQuery.support.cors = true;
}

// core class
var ZZLBox = function() {
    window.zzlbox = this;

    if(window.DEBUG) {
        // disable cache in DEBUG mode
        window.URIREV = Math.random();
    }

    // save plugins/views/models/collections for later using
    this.plugins = {};
    this.views = {};
    this.models = {};
    this.collections = {};

    // last view, used for remove it before next view load
    this.last = null;

    window.onerror = function(message, file, line) {
        // XXX important!! Line nubmber should be saved to avoid memory leaks
        if(!(file.split('/').pop() == 'zzlbox.js' && line == 112)) {
            zzlbox.error({
                message: message,
                stack: 'not defined (window.onerror call)'
            }, 'UNKNOWN', [file, line]);
        }
        if(!window.DEBUG) {
            return true;
        }
    };

    // count of active loaders
    // whet is 0 then all elements with class 'loader' will be hidden
    this.loaders = 1;  // loader is active on start

    // init loader for every ajax request
    $('.loader').ajaxSend(function(){
        zzlbox.load(true);
    }).ajaxComplete(function() {
        zzlbox.load(false);
    });

    // init router
    this.router = new ZZLBox.Router();

    // init plugins
    this.plugins = new ZZLBox.Plugins();

    // welcome and static should be loaded immediately
    // static plugin provides some wiki pages that are available for unregistered users
    zzlbox.plugins.init(['core/welcome', 'core/errors', 'core/static'], function() {
        zzlbox.router.refresh();
    });

    // bind event to render pages
    zzlbox.router.bind('change:view', function(name){
        zzlbox.render(name, $('#content'));
    });

    // start app
    this.router.start();

    // hide all menus when click outside menu container or menu button
    $(document.body).click(function(e){
        var el = $(e.target || e.srcElement),
            all = el.parents().add(el);
        $('.zzlbox-menu').each(function(){
            if(all.filter(this).length == 0 && all.filter($(this).data('toggle-button')).length == 0) {
                $(this).hide();
            }
            $(this).data('toggle-button')
                && $(this).is(':not(:visible)')
                    && $(this).data('toggle-button').removeClass('ui-state-active');
        });
    });
    // hide all menus on change page
    zzlbox.router.bind('all', function(){
        $('.zzlbox-menu').hide().each(function(){
            $(this).data('toggle-button')
                && $(this).data('toggle-button').removeClass('ui-state-active');
        });
    });

    // loaded!
    zzlbox.load(false);
};

ZZLBox.prototype.error = function(e, type, args) {
    if(e.zzldone) {
        throw e;
    } else {
        if(typeof e == 'string') {
            e = {message: e};
        }
        e.zzldone = true;
        zzlbox.plugins.hook('error', {
            type: type,
            args: args,
            orig: e
        });
    }
};

// load method, allow easy increase/decrease loader count
ZZLBox.prototype.load = function(status) {
    this.loaders += status ? 1 : -1;
    $('.loader').toggle(this.loaders > 0);
};

// need for debug
ZZLBox.prototype.timeCheck = function(label) {
    if(this.t && label) {
        console.log(label, new Date() - this.t);
    }
    this.t = new Date();
};

//render specific view
ZZLBox.prototype.render = function(viewName, el) {

    var view;

    if(!(view = this.views[viewName])) {
        view = this.views[viewName] = new ZZLBox.Views[viewName]({el: el});
    }
    view._viewName = viewName;

    if(view.rendered) {
        return false;
    }

    if(view.loaded) {
        view.render();
    } else {
        view._loadTemplates(function(){
            view.render();
        });
    }

    return;

};

// base View class
ZZLBox.View = Backbone.View.extend({

    _loadTemplates: function(callback, tplDir) {

        if(!this.tpl) {
            callback();
            return;
        }

        zzlbox.load(true);
        var ws = new WaitSync(_.bind(function(){
            this.loaded = true;
            zzlbox.load(false);
            callback();
        }, this));

        setTimeout(ws.wrap(function(){}), 22);

        $.each($.isArray(this.tpl) ? this.tpl : [this.tpl], function(i, tplName) {
            if(!$.template[tplName]) {
                $.get((tplDir || 'templates/') + tplName + '.html?' + URIREV, {}, ws.wrap(_.bind(function (tpl) {
                    // compile and cache template
                    $.template(this + '', tpl);
                }, tplName)));
            }
        });
    },

    rendered: false,

    render: function() {
        // clear all view data
        this.el.data('view') && this.el.data('view').remove();
        // clear and show View element (if it is hidden)
        this.el.data('view', this).empty().show();

        // add view name as class for simple styling
        this.el.removeClass().addClass('ui-widget-content').addClass(this._viewName);

        // render View template
        // meaning that we have no data
        // in case when View need two and more tpl files used first for render
        // in other cases this method should be overwrite in View
        this.tpl && $.tmpl($.isArray(this.tpl) ? this.tpl[0] : this.tpl).appendTo(this.el);

        this.rendered = true;

        // callback for init UI items or other rendering
        this.onAfterRender && this.onAfterRender();

        // trigger render event, can be used in plugins
        this.trigger('render');
        zzlbox.plugins.hook(this._viewName + '-render', this, this.el);

        return this;
    },

    remove: function() {
        this.el.empty();
        this.rendered = false;

        $(window).scrollTop(0);

        return this;
    }
});

// proxy some classes
// allow to change it in future (add some methods, etc, as it done for View class)
ZZLBox.Model = Backbone.Model;
ZZLBox.Collection = Backbone.Collection;

ZZLBox.Models = {};
ZZLBox.Collections = {};
ZZLBox.Views = {};
