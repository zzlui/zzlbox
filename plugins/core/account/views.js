
// Account Edit
ZZLBox.Views.Account = ZZLBox.View.extend({
    tpl: 'account',

    onAfterRender: function() {

        zzlbox.plugins.Navigation && zzlbox.plugins.Navigation.setState('account', __('acc.edit'));

        this.$('#account-change-pwd').zzlform({
            message: 'Password changed',
        });

        this.$('#account-change-email').zzlform({
            message: {
                button: 'Email changed',
                info: 'Please confirm your email'
            }
        });

        //this.$('#account-cancel').zzlform();

        if(zzlbox.plugins.Metasearch) {
            this.$('#mf' + (zzlbox.models.User.get('prefs_flags') == 'moderated_full' ? 0 : 1)).attr('checked', true);
            this.$('#account-change-mf').zzlform({
                message: {
                    success: 'Saved'
                },
                onSuccess: this.saveToModel
            });
            this.$('#moderated_full').buttonset().change(function(e) {
                $('#account-change-mf').submit();
            });
        } else {
            $('#full-moderated').hide();
        }


        this.$('#account-change-ddl select[name=dl_uri_scheme]').val(zzlbox.models.User.get('dl_uri_scheme'));
        this.$('#account-change-ddl select[name=dl_uri_host]').val(zzlbox.models.User.get('dl_uri_host'));
        this.$('#account-change-ddl select[name=dl_uri_port]').val(zzlbox.models.User.get('dl_uri_port'));
        this.$('#account-change-ddl input[name=dl_uri_key]').val(zzlbox.models.User.get('dl_uri_key'));
        this.$('#account-change-ddl').zzlform({onSuccess: this.saveToModel});

        this.$('#account-theme').zzlform();
        this.$('#account-theme select')
            .val(zzlbox.models.User.option('theme') || $.cookie('_zt') || 'zzlbox')
            .change(function() {
                zzlbox.plugins.Account.loadTheme($(this).val());
                return false;
            });
    },

    saveToModel: function() {
        var set = {};
        $.each(this.serializeArray(), function() {
            set[this.name] = this.value;
        });
        zzlbox.models.User.set(set, {silent: true});
    }
});

// Manage plugins
ZZLBox.Views.Plugins = ZZLBox.View.extend({

    tpl: 'plugins',

    initialize: function() {

        var that = this;

        var ws = new WaitSync(function(){
            that.ready = true;
            that.rendered && that.onAfterRender();
        });

        var loadList = _.without(ZZLBox.Plugins.AvailableList, _.keys(zzlbox.plugins.info));

        if(loadList.length > 0) {
            $.each(loadList, function(i, p) {
                zzlbox.plugins.loadPlugin(p, null, null, null, ws.wrap($.noop));
            });
        } else {
            ws.wrap($.noop)();
        }

    },

    onAfterRender: function() {

        if(!this.ready) return;

        var plugins = zzlbox.models.User.option('plugins');

        zzlbox.plugins.Navigation && zzlbox.plugins.Navigation.setState('plugins', __('acc.plugins'));

        function pluginInfo(v) {
            var group = v.split('/');
            group = group.length > 1 ? group[0] : '';

            return _.extend(zzlbox.plugins.info[v], {
                group: group
            });
        }

        // all available plugins
        $.tmpl('plugins-item', $.map(ZZLBox.Plugins.AvailableList, pluginInfo))
            .appendTo('#plugins-list');
        // users custom plugins
        $.tmpl('plugins-item', $.map(_.without(plugins || [], ZZLBox.Plugins.AvailableList), pluginInfo))
            .appendTo('#plugins-list');

        $.each(zzlbox.models.User.get('options').plugins || [], function(i, p) {
            $('#plugin-' + p
                            .split('/').join('\\/')
                            .split('.').join('\\.')
                            .split(':').join('\\:')
                            .split('@').join('\\@') + '-1').attr('checked', true);
        });

        $('#plugins-list .plugins-enable-buttonset').css('font-size', '0.7em').buttonset().change(function(e){
            var input = $(e.target).get(0)
            if(input.value == 1) {
                plugins.push(input.name.substr(7));
            } else {
                plugins = zzlbox.models.User.get('options').plugins = _.without(plugins, input.name.substr(7));
            }
            zzlbox.models.User.option('plugins', plugins);
        });

        // reload button
        $('#reload-zzlbox').button().click(function(){
            document.location.href = '/';
        });

        $('#plugins-add-custom').button().click(function() {
            $('<div />')
                .html('Custom plugin URL: <input type="text" size="30" />')
                .dialog({
                    width: 370,
                    title: 'Add custom plugin',
                    resizable: false,
                    modal: true,
                    hide: 'fade',
                    show: 'fade',
                    buttons: {
                        'Add and reload ZZLBox': function() {
                            plugins.push($(this).find('input[type=text]').val());
                            zzlbox.models.User.option('plugins', plugins, function() {
                                document.location.href = '/';
                            });
                        },
                        'Cancel': function() {
                            $(this).dialog('destroy');
                        },
                    }
                });
        });

        $('#reset-plugins').click(function() {
            zzlbox.models.User.reset(function() {
                document.location.href = '/';
            });
            return false;
        })
    }
});

// Transactions
ZZLBox.Views.Transactions = ZZLBox.View.extend({

    tpl: ['transactions', 'transaction-item'],

    initialize: function() {

        var that = this;

        $.get('/api/account/txns', {}, function(resp) {
            that.txns = resp.premiums.concat(resp.addons).sort(function(a, b) {
                //a.ctime == null && (a.ctime = '2012-01-01 00:00:00');
                //b.ctime == null && (b.ctime = '2012-01-01 00:00:00');
                return (a.ctime || '0') < (b.ctime || '0');
            });
            that.onAfterRender();
        }, 'json')
    },

    onAfterRender: function() {

        if(!this.render || !this.txns) return;

        zzlbox.plugins.Navigation && zzlbox.plugins.Navigation.setState('transactions', __('acc.trans'));

        $.tmpl('transaction-item', this.txns)
            .appendTo('#transactions-list').find('*[title]').tipTip();
    }
});
