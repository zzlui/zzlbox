
ZZLBox.Views.File = ZZLBox.View.extend({
    tpl: 'file',

    fetch: function(id) {
        var collection = zzlbox.collections[zzlbox.router.getFragment().split('/')[0] == 'file' ? 'Files' : 'Downloads'];
        var model = collection.get(id);
        if(!model) {
            this.model = model = new ZZLBox.Models.File({id: id});
            // we should use collection.add here, but backbone doesn't change id in _byId hash-map after fetch
            model.collection = collection;
        }
        model.fetch({
            success: _.bind(function(model) {
                this.model && collection.add(model, {silent: true});
                this.renderModel(model)
            }, this),
            error: function() {
                zzlbox.router.navigate('404');
            },
            silent: true
        });
    },

    renderModel: function(model) {
        if(!this.rendered) return;

        this.el.empty().show();
        $.tmpl(this.tpl, model.toJSON()).appendTo(this.el);

        $('<span />')
            .css({
                'float': 'left',
                'border': '1px solid transparent',
                'margin': '3px',
            })
            .text(__('file.back'))
            .addClass('zzlbox-button-icon zzlbox-button-icon-small')
            .button({
                icons: {primary: 'ui-icon-back'},
                text: false
            })
            .click(function(){
                history.back();
                return false;
            })
            .toggle(!!(history.length-1))
            .tipTip()
            .removeClass('ui-state-default')
            .insertBefore(this.el.find('h3.first'));

        $('<span class="actions"></span>').appendTo(this.el.children('#file-buttons'));
        zzlbox.plugins.hook('actions', $('<span />').appendTo(this.el.children('#file-buttons')), model, 'fileinfo');

        // plugins info (video/audio)
        zzlbox.plugins.hook('file-info', this.el, model);

        // file size and av_info
        var info = $('<div class="zzlbox-info"/>').appendTo(this.el);
        model.get('size') && info.append($('<div />').html('<b>Size</b>: <b class="special">' + $(model.get('size')).fileSize() + '</b>'));
        model.get('av_info') && 
            info.append(
                $('<div />').html('<b>Antivirus</b> (Kaspersky) check: '
                        + '<b class="status-' + model.get('av_result') + '">' + model.get('av_result') + '</b>' +
                        ' (<b class="special">' + $(model.get('av_time')).fileDate() + '</b>). '
                        + '<b>Info</b>: ' + model.get('av_info'))
            );

        // plugins info (video/audio)
        zzlbox.plugins.hook('file-additional-info', info, model);

        this.el.find('*[title]').tipTip();

        zzlbox.plugins.Navigation.setState('file', model.get('name'))
        zzlbox.plugins.hook('file-page', this.el, model);
    },

    render: function() {
        this.el.data('view') && this.el.data('view').remove();
        this.el.data('view', this).empty().show();
        this.el.removeClass().addClass('ui-widget-content').addClass(this._viewName);
        this.rendered = true;

        this.fetch(zzlbox.router.chunks[0]);

        return this;
    },

    remove: function() {
        this.rendered = false;
        if(this.model) {
            this.model.collection.remove(this.model, {silent: true});
            delete this.model;
        }
    }
});

ZZLBox.Plugins.File = ZZLBox.Plugin.extend({
    initialize: function() {
        zzlbox.plugins.bind('files-add-one', this.fileList, this);
        zzlbox.plugins.bind('actions', this.actions, this, 100);
    },

    actions: function(el, file, type) {
        if(zzlbox.views.Files.collection !== zzlbox.collections.Files
            && zzlbox.views.Files.collection !== zzlbox.collections.Metasearch) {
            return;
        }

        if(type == 'filelist' || type == 'fileinfo') {
            var b = $('<a href="' + file.get('url_dl') + '" title="' + __('file.dldesc') +'" />').text(__('file.dl'))
                .addClass('zzlbox-button-icon' + (type == 'filelist' ? ' zzlbox-button-icon-small' : '')).button({
                    icons: {primary: 'ui-icon-download'},
                    text: type == 'fileinfo'
                }).appendTo(el);

            if(!file.has('url_dl')) {
                //b.css({visibility: 'hidden'});
                b.button('disable').attr('title', '');
            } else {
                b.tipTip();
            }
        }
    },

    fileList: function(item, model) {
        file = model.toJSON();
        var cl = item.data('model').collection.uri.get.split('/')[2],
            id = file.id;

        if(cl == 'dl' && file.id_files) {
            cl = 'file';
            id = file.id_files;
        }

        if(item.data('model').collection.uri.get == '/api/plugins/metasearch') {
            cl = 'file'
        }

        if(id) {
            var link = model.get('link') || ['', cl, id].join('/');

            zzlbox.router.links(item.find('.name span.title').wrapInner('<a href="' + link + '" />'))
            item.find('.addons .ss').length && zzlbox.router.links(item.children('.addons').wrapAll('<a class="addons-link" href="' + link + '" />').parent());
        } else {
            item.find('.name span.title').addClass('disabled');
        }
    }
});
