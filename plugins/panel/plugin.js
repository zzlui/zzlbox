
ZZLBox.Plugins.Panel = ZZLBox.Plugin.extend({

    initialize: function() {

        // wrapper
        $('#wrapper').wrap('<div class="panel-wrapper" />');

        // panel
        this.el = $('<div id="panel" class="left" />')
            .addClass('ui-widget-content')
            .prependTo($('#wrapper').parent());

        zzlbox.plugins.hook('panel', this);
        zzlbox.plugins.bind('navigation', function() {
            //this.el.css('top', $('#header').outerHeight(true));
        }, this, 999);

        var that = this;
        // #panel size fix
        $(window).resize(_.bind(this.fixSize, this));
        zzlbox.router.bind('router-refresh', function() {
            this.fixSize();
        }, this);
    },

    fixSize: function() {
        this.el && this.el
                    .outerHeight(
                        $(window).innerHeight()
                            - $('#footer').outerHeight(true)
                            - $('#header').outerHeight(true))
                    .scrollbars({autoHide: true});
    }

});
