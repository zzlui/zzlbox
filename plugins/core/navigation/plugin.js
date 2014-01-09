
ZZLBox.Plugins.Navigation = ZZLBox.Plugin.extend({

    initialize: function() {

        this.items = {
            main: [],
            'default': []
        };

        this.states = {};

        this.el = $('<div id="navigation" />').prependTo('#header');

        var that = this;
        zzlbox.plugins.wait('Panel', function(){
            // success
            that.done = true;
            that.nav = $('<div class="panel-navigation zzlbox-navigation" />').appendTo(this.el);
            that._appendItems('default');
        }, function(){
            // fail. create navigation button and menu ?
            that.done = true;
            that.nav = $('<div class="panel-navigation zzlbox-navigation zzlbox-menu detached" />')
                .appendTo('body')
                .hide()
                .data('toggle-button', $('#header .logo'));

            $('#header .logo').click(function(){
                that.nav.toggle().position({
                    my: 'left top',
                    at: 'left bottom',
                    of: this,
                    collision: 'none'
                });
                return false;
            }).append(
                $('<span class="ui-button-icon-secondary ui-icon ui-icon-triangle-1-s">')
                    .css({
                        'position': 'absolute',
                        'top': 17,
                        right: -10
                    })
            ).css({
                'position': 'relative',
                'margin-right': 10
            });
            that._appendItems('default');

            zzlbox.router.bind('all', function() {
                this.nav.hide();
            }, that);
        })

        // init navigation buttons
        zzlbox.plugins.hook('navigation', that);
    },

    _appendItems: function(type) {
        var items = this.items[type];
        items = items.sort(function(a, b){
            return a.data('order') - b.data('order');
        });
        $.each(items, _.bind(function(i, item) {
            item.appendTo(type == 'main' ? this.el : this.nav);
        }, this));
    },

    addItem: function(item, state, order, type) {
        item.is('a') && zzlbox.router.links(item);

        item.data('order', order);
        this._decorate(item);

        this.states[state] = (this.states[state] || (this.states[state] = $())).add(item);

        this.items[type || 'default'].push(item);

        if(this.done || type == 'main') {
            this._appendItems(type || 'default');
        }
    },

    setState: function(state, name, link) {
        var item;

        if(this.last) {
            this.last.filter('a, b').removeClass('active bold');
            this.last.filter(':not(a, b)').removeClass('ui-state-active');
            if(this.last.data('nav-tmp')) {
                this.last.remove();
            }
        }

        document.title = 'ZZLBox' + (name ? ' :: ' + name : '');

        if(item = this.states[state]) {
            item.filter('a, b').addClass('active bold');
            //item.filter(':not(a, b)').addClass('ui-state-active');
        } else if(name) {
            if(typeof name == 'string') {
                item = $('<b />').text(name).wrap('<a href="#' + (link || state) + '" />').parent();
            } else {
                item = name;
            }
            this._decorate(item);
            item.addClass('active');

            item = $('<div />').addClass('navigation-item-group')
                .append(item).appendTo(this.nav).data('nav-tmp', true);
        }

        this.last = item;
    },

    _decorate: function(item) {
        if(item.is('a, b')) {
            item
                .addClass('navigation-item')
                .hover(function(){$(this).toggleClass('ui-state-hover ui-corner-all')});
        }
    }

});
