
ZZLBox.Plugins.Toolbar = ZZLBox.Plugin.extend({

    initialize: function() {

        var that = this;

        // show/hide toolbar
        zzlbox.router.bind('change:view', function(name){
            this.el.toggle(name == 'Files');
            //console.log($(this.el).outerHeight(true))
            this.el.parent().css('padding-top', name == 'Files' ? $(this.el).outerHeight(true) : 0);
            this.el.css('top', $('#header').outerHeight());
        }, this);

        this.el = $('<div id="toolbar" />')
            .addClass('ui-widget-header ui-corner-all')
            .prependTo('#wrapper')
            .toggle(zzlbox.router.view == 'Files')
            .css({
                'position': 'fixed',
                'top': $('#header').outerHeight(),
            });

        this.clear = $('<div class="clear" />').appendTo(this.el);

        // groups array
        this._groups = [];
        // groups by name
        this.groups = {};

        zzlbox.plugins.hook('toolbar', this);
    },

    // get/add group
    group: function(name, order) {

        if(typeof name != 'string') {
            // this is already group object
            return name;
        }

        if(!this.groups[name]) {
            // create new group
            var group = $('<div class="group ' + name + '"></div>').data('order', order == undefined ? 10 : order);
            this._groups.push(this.groups[name] = group);

            // re-order group array
            this._groups = this._groups.sort(function(a, b) {
                return a.data('order') - b.data('order');
            });

            // re-order groups on page
            $.each(this._groups, _.bind(function(i, el) {
                el.insertBefore(this.clear);
            }, this));

            // items array
            group.data('items', []);
        }

        return this.groups[name];
    },

    // add item to group
    add: function(item, title, order, group, groupOrder) {

        // item group
        group = this.group(group || 'default', groupOrder);

        // create item
        var item = $('<span class="left"><span class="title">&nbsp;' + title + '</span></span>')
            .append(item)
            .data('order', order == undefined ? 10 : order)
            .data('group', group);

        // append item to group
        var items = group.data('items');
        items.push(item.get(0));

        // re-order items array
        items = items.sort(function(a, b) {
            return $(a).data('order') - $(b).data('order');
        });

        // re-order items on page
        $.each(items, function(i, el) {
            $(el).appendTo(group)
        });

        return item;
    },

    // remove item
    remove: function(item, orig) {
        orig && (item = item.parent());
        item.data('group').data('items', _.without(item.data('group').data('items'), item.get(0)));
        item.remove();
    },

});
