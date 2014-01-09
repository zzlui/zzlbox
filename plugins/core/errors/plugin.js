
ZZLBox.Views.NotFound = ZZLBox.View.extend({

    onAfterRender: function () {
        $('<h3 />').text('404 ' + __('err.404')).appendTo(this.el);
    },

});

ZZLBox.Plugins.Errors = ZZLBox.Plugin.extend({

    initialize: function() {

        window.DEBUG || (window.DEBUG = false);

        var el, that = this;

        zzlbox.models.User.bind('change:auth', function(model, auth) {
            if(auth && !el) {
                el = that.el = $('<div />')
                    .addClass('error')
                    .appendTo($('body'))
                    .hide()
                    .css({
                        bottom: '5px',
                        right: '5px',
                        position: 'fixed',
                        'z-index': 9999
                    }).ajaxSend(function(e, xhr){
                        el.hide();
                    }).ajaxSuccess(function(e, xhr, ops, data){
                        if(data && data.status && data.status == 'error') {
                            if(data.error == 'access denied') {
                                setTimeout(function() {
                                    zzlbox.models.User.set({auth: false});
                                }, 1000)
                            }
                            el.html('<b class="special">' + __('err.api') + '</b>: ' + data.error).fadeIn();
                        }
                    }).ajaxError(function(e, xhr, ops, error) {
                        el.html('<b class="special">' + __('err.req') + '</b>: ' + error).fadeIn();
                    }).click(function() {
                        el.fadeOut();
                    });
            }
        });

        zzlbox.plugins.bind('error', this.error, this);

    },

    format: function(type, args) {

        var s, i;

        if(s = this.messages[type]) {
            for(i = args.length; i--;) {
                s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), args[i]);
            }
        } else {
            s = this.messages['_UNKNOWN'] + ' (args: ' + args.join(', ') + ')';
        }

        return s;
    },

    messages: {
        'HOOK_INIT': 'Can\'t run callback #{1} for hook \'{0}\' (added by \'{2}\' plugin)',
        'PLUGIN_INIT': 'Can\'t init plugin class \'{1}\' ({0})',
        'PLUGIN_JSON': 'Error while parsing plugin JSON ({0})',
        'PLUGIN_REQ': 'Can\'t resolve all requires for plugin: {0} (Doesn\'t exists plugins: {1})',
        'PLUGIN_LOAD': 'Can\'t load plugin: {0}',
        'WAITER_SUCCESS': 'Can\'t call success callback #{1} for waiter \'{0}\'',
        'WAITER_FAIL': 'Can\'t call fail callback #{1} for waiter \'{0}\'',

        '_UNKNOWN': 'Unknow error'
    },

    error: function(e) {

        var s = {
            message: this.format(e.type, e.args),
            history: zzlbox.router.history,
            userAgent: window.navigator.userAgent,
            platform: window.navigator.platform,
            plugins: zzlbox.models.User.get('options').plugins,
            user: zzlbox.models.User.get('login'),
            options: (function(o){
                var r = _.clone(o);
                delete r.plugins;
                return r;
            })(zzlbox.models.User.get('options')),
            js_error: e.orig.message,
            js_stack: e.orig.stack
        };

        if(!DEBUG) {
            var dialog = $('<div />').html(
                __('err.errdesc') + ': <p class="red bold">' + s.message + '</p>' +
                '<p>' + __('err.senddesc') + '.</p>' +
                '<div id="reportAccordion">' +
                    '<h3><a href="#">' + __('err.view') + '</a></h3>' +
                    '<div style="white-space: pre; display:none; height: 150px;">' + JSON.stringify(s, null, '\t').split('\\n').join('\n') + '</div>' +
                '</div>'
            );

            $(dialog).dialog({
                title: __('err.err'),
                resizable: false,
                modal: true,
                hide: 'fade',
                show: 'fade',
                //position: ['right', 'bottom'],
                minWidth: 400,
                buttons: [{
                    text: __('err.reset'),
                    click: function() {
                        zzlbox.models.User.reset(function() {
                            //$(dialog).dialog('destroy');
                            document.location.href = '/';
                        });
                    }
                }, {
                    text: __('err.send'),
                    click: function() {
                        $.post('/api/bug_report', s, function(resp) {
                            //console.log(resp)
                            $(dialog).dialog('destroy');
                        }, 'JSON');
                    }
                }, {
                    text: __('err.ignore'),
                    click: function() {
                        $(dialog).dialog('destroy');
                    }
                }]
            }).find('#reportAccordion').accordion({
                collapsible:true,
                active: false,
                autoHeight: false
            }).end().parent().css('font-size', '0.8em')
              .find('.ui-button-text:lt(2):gt(0)').addClass('bold');
        }

        if(DEBUG) {
            window.zzlerr = s;
            console.error('[ZZLBox] ' + s.message, s);
            throw e.orig;
        }

    },

});
