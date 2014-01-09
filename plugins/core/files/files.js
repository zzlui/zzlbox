// File Item View
ZZLBox.Views.Files = ZZLBox.View.extend({

    tpl: ['files', 'files-item'],

    collections: {},
    collection: null,

    initialize: function() {

        this.itemsByModelMap = {};

        this.cacheEl = null;
        this.cacheScroll = 0;

        // add navigation buttons:
        zzlbox.plugins.bind('navigation', function(nav){
            nav.addItem($('<a class="menu-icon-folder" href="/files" />').text(__('files.files')), 'files', 10);
        }, this)

        zzlbox.router.bind('router-refresh', function() {
            // reset cache
            this.collection.reqID = null;
        }, this);

        zzlbox.router.bind('query:Files', this.query, this);

        this.addCollection(zzlbox.collections.Files = new ZZLBox.Collections.Files, 'default');
        this.setCollection(zzlbox.collections.Files);


        zzlbox.plugins.wait('core/toolbar', function() {
            // refresh button
            var refresh = $('<span />').text(__('files.refresh'))
                .addClass('zzlbox-button-icon zzlbox-button-icon-small zzlbox-toolbar-button')
                .button({icons: {primary: 'ui-icon-refresh'}, text: false})
                .click(function() {
                    zzlbox.router.refresh();
                }).tipTip();
            this.add(refresh, ' ', 2, 'first');
        });
    },

    query: function(path, query) {
        var uri = zzlbox.router.getFragment(),
            collection = this.collections[uri] || this.collections['default'];

        zzlbox.plugins.Navigation && zzlbox.plugins.Navigation.setState(zzlbox.router.getFragment() || 'files', collection.title);

        if(collection != this.collection) {
            // update collection
            this.setCollection(collection);
        }

        query = _.extend({}, query || zzlbox.router.query);
        this.collection.filter(query).fetch();
    },

    addCollection: function(collection, routes, title) {
        collection.title = title || __('files.files');

        // routes should be array
        routes = $.isArray(routes) ? routes : [routes]

        // add collections uri association
        $.each(routes, _.bind(function(i, uri){
            this.collections[uri] = collection;
            uri !== 'default' && zzlbox.router.add(uri + '*query', 'Files');
        }, this));
    },

    setCollection: function(collection) {
        var old;
        if(old = this.collection) {
            // unbind updates from old collection
            this.collection.unbind('add', this.addOne);
            this.collection.unbind('reset', this.addAll);
            this.collection.unbind('few', this.addFew);
            this.collection.unbind('remove', this.removeOne);
            this.collection.unbind('cached', this.cached, this);
            this.cacheEl && this.cacheEl.empty();
            this.cacheEl = null;
            this.cacheScroll = 0;
        }

        // set new collection
        this.collection = collection;

        // bind updates
        this.collection.bind('add', this.addOne, this);
        this.collection.bind('reset', this.addAll, this);
        this.collection.bind('few', this.addFew, this);
        this.collection.bind('remove', this.removeOne, this);
        this.collection.bind('cached', this.cached, this);

        // trigger event for plugins
        this.trigger('change:collection', collection, old);
    },

    /*render: function() {
        this.el.empty();
        $.tmpl('files').appendTo(this.el);
        this.addAll(this.collection);
        return this;
    },*/

    onAfterRender: function() {
        //this.addAll(this.collection);
    },

    remove: function() {
        // detach file-list from content but save in document to prevent buttons destroy
        this.cacheScroll = $(window).scrollTop();
        this.cacheEl = $('#file-list').detach();

        return ZZLBox.View.prototype.remove.call(this);
    },

    cached: function() {
        if(this.cacheEl) {
            this.$('#file-list').replaceWith(this.cacheEl);
            $(window).scrollTop(this.cacheScroll);
        } else {
            this.addAll(this.collection);
        }
    },

    addOne: function(model) {
        if(!this.rendered) return;

        this.addFew([model]);

        //this.buildItem(model).appendTo(this.$('#file-list'));
    },

    buildItem: function(model) {
        var file = model.toJSON(),
            item = $.tmpl('files-item', file)
                    .data('file', file)
                    .data('model', model);

        this.itemsByModelMap[model.id] = item;

        // add tip tip for size, date, etc
        item.find('*[title]').tipTip();

        // init tristate on checkbox
        item.find('input[type="checkbox"]').tristate({
            mixed: false,
            change: _.bind(function(){
                var checked = this.checked();
                this.trigger('change:checked', checked.models, checked.els);
            }, this)
        });

        zzlbox.plugins.hook('main', item.children('.main'), model);
        zzlbox.plugins.hook('actions', item.children('.actions'), model, 'filelist');
        zzlbox.plugins.hook('addons', item.children('.addons'), model);
        zzlbox.plugins.hook('files-add-one', item, model);

        return item;
    },

    addFew: function(models) {
        if(!this.rendered) return;

        var list = $(), that = this;

        $.each(models, function(i, model){
            list = list.add(that.buildItem(model));
        });

        zzlbox.plugins.hook('files-add', this.collection, list, models);

        list.appendTo(this.$('#file-list'));

        zzlbox.plugins.hook('files-append', this.$('#file-list'), list, models);
    },

    addAll: function(collection) {
        if(!this.rendered) return;

        this.$('#file-list').empty();

        if(collection.models.length == 0) {
            $('<div />')
                .css({
                    'text-align': 'center',
                    'font-style': 'italic'
                })
                .text(__('files.no_files'))
                .appendTo($('#file-list'));
            return;
        }

        this.addFew(collection.models);
    },

    removeOne: function(model, collection, o) {
        $.each(this.$('#file-list').children(), function(){
            $(this).data('model') === model && $(this).remove();
        });
    },

    checked: function(returnEl) {
        var els = $(), models = [];

        $.each(this.$('#file-list .file input[type="checkbox"]'), function(i, el) {
            el = $(el);
            if(el.tristate('option', 'state') == 1) {
                els = els.add(el = el.parents('.file'));
                models.push(el.data('model'));
            }
        });

        return {els: els, models: models};
        /*return $.map($($.grep(this.$('#file-list .file input[type="checkbox"]'), function(el){
            return $(el).tristate('option', 'state') == 1;
        })).parents('.file').toArray(), function(i) {
            return returnEl ? $(i) : $(i).data('model');
        });*/
    },

    getItemByModel: function(model) {
        return this.itemsByModelMap[model.id];
    }

});

ZZLBox.Plugins.Files = ZZLBox.Plugin.extend({
    initialize: function() {
        // TODO rewrite all plugins to bind events on View instead collection
        //      and wait while view is ready
        //      then remove this
        zzlbox.views.Files = new ZZLBox.Views.Files({el: $('#content')});
    }
});
