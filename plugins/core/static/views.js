
ZZLBox.Views.Static = ZZLBox.View.extend({

    initialize: function() {
        zzlbox.router.bind('query:Static', function(chunks, query) {
            this.renderStatic(this.staticUrl(chunks, query));
        }, this)
    },

    staticUrl: function(chunks) {
        return '/inline/t/' + chunks[0];
    },

    renderStatic: function(url) {
        if($('.static-page').data('url') == url) {
            return;
        }
        $('.static-page').data('url', url);
        var el = this.el;
        $('<div class="static-page" />')
            .load(url, function() {
                var text = $('#footer a[href="' + url.substr(7) + '"]').text();
                if(text && zzlbox.plugins.Navigation) {
                    zzlbox.plugins.Navigation.setState(url, text);
                }
                $('.static-page').remove();
                if(text) {
                    $(this).prepend('<h1>' + text + '</h1>');
                }
                $(this)
                    .find('link').remove().end()
                    .find('a[href^="/t/"], a[href^="/billing/"], a[href^="/docs/"]').click(function() {
                        zzlbox.router.navigate($(this).attr('href').substr(1));
                        return false;
                    }).end()
                    .find('.box-info').removeClass('box-info').addClass('info').end()
                    .append('<div class="clear" />')
                    .appendTo(el);

                $(window).scrollTo(0);
            });
    },

    onAfterRender: function() {
        this.renderStatic(this.staticUrl(zzlbox.router.chunks));
    }

});

ZZLBox.Views.Billing = ZZLBox.Views.Static.extend({
    initialize: function() {
        zzlbox.router.bind('query:Billing', function(chunks, query) {
            this.renderStatic(this.staticUrl(chunks, query));
        }, this)
    },
    staticUrl: function(chunks) {
        return '/inline/' + zzlbox.router.getFragment();
    }
});

ZZLBox.Views.Docs = ZZLBox.Views.Static.extend({
    initialize: function() {
        zzlbox.router.bind('query:Docs', function(chunks, query) {
            this.renderStatic(this.staticUrl(chunks, query));
        }, this)
    },
    staticUrl: function(chunks) {
        return zzlbox.plugins.StaticPages.url + 'docs/' + chunks[0] + '.html';
    },
});
