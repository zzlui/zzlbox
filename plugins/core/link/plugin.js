ZZLBox.Plugins.FileLink = ZZLBox.Plugin.extend({

    initialize: function() {
        zzlbox.plugins.bind('actions', this.actions, this);
        zzlbox.plugins.bind('toolbar', this.toolbar, this);
    },

    actions: function(el, file, type) {
        var is_linked = file.get('is_linked') == '1',
            is_ready = file.get('is_ready') == '1',
            b, m;

        if(type == 'filelist') {
            b = $('<a href="#" />').addClass('link-button').text(is_linked ? __('link.remove') : __('link.add'))
                .attr('title', is_linked ? __('link.click_to_rm') : __('link.click_to_add'))
                .addClass('zzlbox-button-icon zzlbox-button-icon-small')
                .button({
                    icons:{ primary: 'ui-icon-' + (is_linked ? 'remove' : 'add') },
                    text: false
                }).tipTip();

            if(zzlbox.views.Files.collection === zzlbox.collections.Downloads) {
                if(!is_ready) {
                    m = $('<a href="#" />')
                        .text(__('link.reload'))
                        //.addClass('is_ready2')
                        .addClass('zzlbox-button-icon zzlbox-button-icon-small')
                        .attr('title', __('files.not_ready'))
                        .button({
                            icons: {primary: 'ui-icon-refresh'},
                            text: false
                        }).tipTip();
                } else {
                    m = $('<span />').addClass('is_ready').attr('title', __('link.ready'));
                }
            }
        } else if(type == 'fileinfo') {
            b = $('<span />').text(file.get('is_linked') == '1' ? __('link.remove') : __('link.add'))
                .addClass('zzlbox-button-icon')
                .button({
                    icons:{ primary: 'ui-icon-' + (is_linked ? 'remove' : 'add') },
                });
        }

        m && m.appendTo(el).click(function() {
            if(file.get('is_ready') != 1) {
                $.post('/api/dl/add', {info_hash: file.get('info_hash')});
            }
            return false;
        });

        b.appendTo(el).click(function() {
            if(file.get('is_linked') != 1 && file.get('info_hash')) {
                $.post('/api/dl/add', {info_hash: file.get('info_hash')});
                file.set({'is_linked': '1'});
            } else {
                file.collection.update({
                    attributes: {
                        is_linked: file.get('is_linked') == '1' ? '0' : '1'
                    },
                    files: file.get('id')
                });
            }
            return false;
        });

        file.bind('change:is_linked', function() {
            b.find('.ui-button-icon-primary')
                .removeClass('ui-icon-remove ui-icon-add')
                .addClass('ui-icon-' + (file.get('is_linked') == '1' ? 'remove' : 'add'))
                .end()
                .find('.ui-button-text').text(file.get('is_linked') == '1' ? __('link.remove') : __('link.add'))
            type == 'filelist' && b.attr('title', 'Click to ' + (file.get('is_linked') == '1' ? 'remove' : 'add')).tipTip();
        }, this);
    },

    toolbar: function(toolbar) {

        var dialog = $('<div />').text(__('link.delete_warn')),
            dialogOptions = {
                resizable: false,
                modal: true,
                hide: 'fade',
                show: 'fade',
                buttons: [{
                    text: __('link.remove'),
                    click: function() {
                        $(this).data('dialog').options.removeCallback();
                        $(this).dialog("close");
                    },
                }, {
                    text: __('link.cancel'),
                    click: function() {
                        $(this).dialog("close");
                    }
                }]
            };

        var rm = $('<span />').text(__('link.checked')).button().click(function(){
            $(dialog).dialog('destroy');
            dialog.dialog(_.extend(dialogOptions, {
                title: __('link.delete_qst_sel'),
                removeCallback: function() {
                    zzlbox.views.Files.collection.update({
                        attributes: {
                            is_linked: '0'
                        },
                        files: zzlbox.views.Files.checked().models
                    });
                }
            }));
            return false;
        });

        var rmall = $('<span />').text(__('link.all')).button().click(function(){
            dialog.dialog(_.extend(dialogOptions, {
                title: __('link.delete_qst_all'),
                removeCallback: function() {
                    zzlbox.views.Files.collection.update({
                        attributes: {
                            is_linked: '0'
                        },
                        status: zzlbox.router.query.dl_status,
                        id_labels: zzlbox.router.query.id_labels,
                        id_feeds: zzlbox.router.query.id_feeds,
                        all: !zzlbox.router.query.dl_status && !zzlbox.router.query.id_labels && !zzlbox.router.query.id_feeds
                    });
                }
            }));
            return false;
        });

        var set = $('<div />').append(rm).append(rmall).buttonset();

        // fix jquery UI corners bug
        set.children().first().removeClass('ui-corner-right').addClass('ui-corner-left');
        set.children().last().removeClass('ui-corner-left').addClass('ui-corner-right');

        var s = toolbar.add(set, __('link.remove'), 999, toolbar.group('actions', 0));

        zzlbox.views.Files.bind('change:collection', function(collection, old) {
            s.toggle(collection !== zzlbox.collections.Metasearch);
        }, this);

        rm.button('disable');
        zzlbox.views.Files.bind('change:checked', function(models){
            // disable/enable label button in toolbar
            rm.button(models.length > 0 ? 'enable' : 'disable');
        }, this);

    },
});
