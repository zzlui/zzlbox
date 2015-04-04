
ZZLBox.Plugins.StaticPages = ZZLBox.Plugin.extend({

    initialize: function() {
        $.tmpl('footer-menu')
            .find('a')
                .each(function() {
                    $(this).click(function(e) {
                        var href = $(this).attr('href');
                        if(e.which == 1 && href.substr(0, 4) != 'http') {
                            zzlbox.router.navigate(href.substr(1));
                            return false;
                        }
                    })
                })
                .end()
            .mouseleave(function() {
                setTimeout(function() {
                    $(window).resize();
                }, 450);
            })
            .prependTo('#footer');

    },

})
