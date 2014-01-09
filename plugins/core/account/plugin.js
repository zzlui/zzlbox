
ZZLBox.Plugins.Account = ZZLBox.Plugin.extend({

    initialize: function() {

        this.currentTheme = $.cookie('_zt') || 'zzlbox';
        this.loadTheme(zzlbox.models.User.option('theme') || this.currentTheme, true);

        zzlbox.plugins.bind('navigation', this.navigation, this);
    },

    loadTheme: function(name, doNotSave) {
        $('body').addClass('theme-' + name);
        if(this.currentTheme == name) {
            return;
        }
        this.currentTheme = name;

        // update theme css
        $('#theme-link-css').replaceWith($("<link>")
            .insertAfter('head > link:lt(1)')
            .attr({type : 'text/css', rel : 'stylesheet'})
            .attr('href', 'themes/' + name + '/theme.css?' + URIREV)
            .attr('id', 'theme-link-css'));

        $.cookie('_zt', name);
        doNotSave || zzlbox.models.User.option('theme', name);
    },

    navigation: function(nav) {
        var b = $('<span id="account-button" class="zzlbox-button-icon"></span>')
        .button({
            icons: {
                primary: 'ui-icon-account',
                secondary: 'ui-icon-triangle-1-s'
            },
            //text: false
        }).click(function(){
            menu.toggle();
            //menu.css({position: 'absolute', 'min-width': b.width(), 'z-index': 10})
            menu.position({
                my: 'right top',
                at: 'right bottom',
                of: b,
                collision: 'none'
            });

        }).unbind('mouseup.button').mouseleave(function(){
            menu.is(':visible') && b.addClass('ui-state-active');
        });

        b.children('.ui-button-text').text(zzlbox.models.User.get('login'))

        nav.addItem(b, 'account', 999, 'main');

        var menu = $.tmpl(
            '<div class="ui-widget ui-widget-content ui-dialog zzlbox-menu zzlbox-navigation">' +
                  '<div>' +
                      '<b>${login} (${type})</b>' +
                      '<div>${email}</div>' +
                      '{{if premium}}<div>' +
                        //'Time left: ${premium.time_left > 0 ? 10 : premium.time_left}' +
                        '<div>' + __('acc.time_left') + ': ${$item.getTimeLeft()}</div>' +
                        '<div>' + __('acc.included') + ': {{html $item.getIncluded(premium.bw_used_month, premium.bw_limit_month)}}</div>' +
                        '<div><a href="/billing/addons" style="display: inline-block">' + __('acc.extra') + '</a>: {{html $item.getIncluded(premium.bw_used_extra, premium.bw_limit_extra)}}</div>' +
                      '</div>{{/if}}' +
                  '</div>' +
                  '<a href="/billing">${__("acc.buy")}</a>' +
                  '<a href="/account">${__("acc.edit")}</a>' +
                  '<a href="/plugins">${__("acc.plugins")}</a>' +
                  '<a href="/transactions">${__("acc.trans")}</a>' +
                  '<a href="/logout" onclick="zzlbox.models.User.logout();return false;">${__("acc.logout")}</a>' +
              '</div>',  zzlbox.models.User.toJSON(), {
                    formatTime: function(time) {
                        // TODO make this as separate jquery plugin (like filesize)
                        return time / 60 / 60 + ' hours';
                    },
                    getTimeLeft: function() {
                        return this.data.premium.time_left < 0 ? __('acc.inf') : this.formatTime(this.data.premium.time_left);
                    },
                    getIncluded: function(a, b) {
                        return $(a).fileSize() + ' / ' + $(b).fileSize();
                    }
                })
            .css({'z-index': 10, 'font-size': '0.9em'})
            .hide()
            .data('toggle-button', b);

        zzlbox.router.links(menu.find('a:not([href="/logout"])'));

        if(zzlbox.models.User.get('email_is_ver') != '1') {
            $('<span />').css({color:'red'}).text(' (' + __('acc.not_ver') + ')').appendTo(menu.children('div').children('div').get(0));
            $('<a href="#/resend-verification-email" />').text(__('ac.resend_ver'))
                .click(function(){
                    $.post('/api/account/resend_email_ver');
                    return false;
                })
                .insertAfter(menu.children('div'));

            b.addClass('account-warning');
        }

        menu
            .find('a')
                .hover(function() {
                    $(this).toggleClass('ui-state-hover ui-corner-all')
                })
                .end()
            .appendTo(nav.el);

    }
});
