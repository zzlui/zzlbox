
ZZLBox.Plugins.Welcome = ZZLBox.Plugin.extend({
    initialize: function() {
        zzlbox.router.links('#header .logo');

        $('#welcome').css('visibility', 'hidden');

        zzlbox.models.User = new ZZLBox.Models.User();
        zzlbox.models.User.bind('change:auth', function(model, auth) {
            if(auth) {
                $('#welcome').css('visibility', 'hidden');

                // load user plugins
                zzlbox.plugins.init(model.get('options').plugins || [], function() {
                    $('#header').css({
                        'position': 'fixed',
                        'top': 0,
                        'box-sizing': 'border-box',
                        '-moz-box-sizing': 'border-box',
                        '-webkit-box-sizing': 'border-box',
                        '-ms-box-sizing': 'border-box',
                        '-o-box-sizing': 'border-box',
                        'width': '100%',
                        'z-index': 4,
                    });
                    $('body').css({
                        'padding-top': $('#header').outerHeight(true),
                        'padding-bottom': $('#footer').outerHeight(true),
                    });

                    var ht = $('<div class="scroll-highlight-top" />')
                                .hide()
                                .css({position: 'fixed'})
                                .appendTo('body'),
                        hb = $('<div class="scroll-highlight-bottom" />')
                                .hide()
                                .css({position: 'fixed'})
                                .appendTo('body'),
                        fixHPos = function() {
                            var o = $('#content').offset(), w = $('#content').width();
                            ht.css({
                                'top': o.top - 1,
                                'left': o.left,
                                width: w
                            }).toggle(!!$(window).scrollTop());
                            hb.css({
                                'top': $(window).height() - $('#footer').outerHeight(),
                                'left': o.left,
                                width: w
                            }).toggle(!!($('body').get(0).scrollHeight - $(window).height() - $(window).scrollTop()));
                        };
                    $(window).on('scroll', fixHPos);
                    $(window).on('resize', fixHPos);
                    fixHPos();

                    zzlbox.router.bind('route:Welcome', function() {
                        if(zzlbox.models.User.get('auth')) {
                            setTimeout(function() {
                                zzlbox.router.navigate('404');
                            }, 20);
                        }
                    });

                    // some plugins added router rules, so we should refresh
                    zzlbox.router.refresh();
                });
            } else {
                if(zzlbox.models.User.get('login') != 'anonymous') {
                    // unexpected logout
                    document.location.href = '/';
                } else {
                    $('#welcome').css('visibility', 'visible');
                }
            }
        });
    }
});
