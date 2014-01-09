
ZZLBox.Plugins.SS = ZZLBox.Plugin.extend({

    initialize: function() {
        zzlbox.plugins.bind('file-info', this.fileInfo, this, 50);
        zzlbox.plugins.bind('addons', this.addons, this);
        zzlbox.plugins.bind('fileset-info-addons', this.fsAddons, this);
        var that = this;
        zzlbox.plugins.wait('display-type', function() {
            this.bind('change:display', that.updateDisplay, that);
            that.display = this.display;
        });

        zzlbox.plugins.bind('fileset-actions-all', this.fsAll, this);

        this.items = [];
    },

    fileInfo: function(el, model) {
        if(parseInt(model.get('ss_num')) > 0) {
            // append screenshots
            // ss wrapper
            var ssw = $('<div class="zzlbox-info" />').css({
                'padding-left': '55px',
                'padding-right': '55px',
                'position': 'relative'
            }).appendTo(el);
            // ss container
            var ss = $('<div />').css({
                'overflow': 'hidden',
                'white-space': 'nowrap',
            });
            $.each(model.get('ss_urls_tn'), function(i, url) {
                $('<a href="' + model.get('ss_urls')[i] + '" rel="fancybox"><img src="' + url+ '" /></a>')
                    .css({margin: '0 1px'})
                    .appendTo(ss)
                    .children('img')
                        .css({border: 0});
            });
            ss.appendTo(ssw);
            // arrows
            var l = $('<span data-direction="prev"/>').text('<').css({left:0}).prependTo(ssw).tipTip({content: __('ss.sleft')}),
                r = $('<span data-direction="next"/>').text('>').css({right:0}).appendTo(ssw).tipTip({content: __('ss.sright')});
            ssw.children('span').button().css({
                'position': 'absolute',
                'top': model.get('ss_height') / 2 - ssw.children('span').height() / 2,
                'margin-right': 0
            }).click(function(){
                // current offset
                var pos = ss.get(0).scrollLeft,
                    // offset to change
                    offset = (parseInt(model.get('ss_width')) + 2) * 2,
                    // max offset (min is 0)
                    max = ss.get(0).scrollWidth - ss.width();
                // calc new offset
                if($(this).data('direction') == 'prev') {
                    pos -= offset;
                } else {
                    pos += offset;
                }
                // check offset limits
                pos > max && (pos = max);
                pos < 0 && (pos = 0);
                // show/hide arrows
                l.button(pos == 0 ? 'disable' : 'enable');
                r.button(pos == max ? 'disable' : 'enable');
                // run scroll
                ss.animate({
                    scrollLeft: pos
                }, 400)
            });
            l.button('disable');
            // init fancybox
            ss.children('a').fancybox({type: 'image'});
        }
    },

    updateDisplay: function(display, item) {
        display && (this.display = display);
        var that = this;
        $.each(item || $('#file-list .addons .ss'), function() {
            that.display != 'table' && that.showOrigSrc(this, 'filelist');
            switch(that.display) {
                case 'grid':
                    $(this).css({
                        width: 250,
                        height: $(this).data('ss-height'),
                        //'background-position': 0 - (Math.ceil($(this).first().closest('.file').data('file').ss_num / 2) * 152 + 1) + 'px 0px'
                        'background-image': 'url(' + $(this).data('src-grid') + ')'
                    });
                    break;
                case 'table':
                case 'list':
                default:
                    $(this).css({
                        width: 'auto',
                        height: $(this).data('ss-height') / 2,
                        //'background-position': '0px 0px'
                        'background-image': 'url(' + $(this).data('src-original') + ')'
                    });
            }
        });
    },

    addons: function(item, model) {
        data = model.toJSON();
        if(data.ss_num > 0 && data.ss_urls_tn_all) {
            this.updateDisplay(null, $('<div class="ss ss-hidden" />').css({
                height: data.ss_height / 2,
                'background-image': 'url(data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==)',
                'background-repeat': 'no-repeat',
                margin: 'auto'
            }).data('src-original', data.ss_urls_tn_all)
              .data('src-grid',  data.ss_urls_tn[4])
              .data('ss-height',  data.ss_height)
              .appendTo(item))
        }
    },

    showOrigSrc: function(item, type) {
        if(type == 'fileset') {
            $(item && $(item).filter('.ss-ss-hidden') || $('.ss-ss-hidden')).each(function(){
                $(this).removeClass('ss-ss-hidden').attr('src', $(this).data('src-original'));
            });
        } else {
            $(item && $(item).filter('.ss-hidden') || $('#file-list').find('.ss-hidden')).each(function(){
                $(this).removeClass('ss-hidden')
                    .css('background-image', 'url(' + $(this).data('src-original') + ')');
            });
        }
    },

    fsAddons: function(item, model, file) {
        if(file.url_tn) {
            var checked = this.ssToggleButton.children('input[type=checkbox]').is(':checked');
            // TODO lazyload ??
            var i = $('<img class="ss-ss ss-ss-hidden" height="' + file.tn_height + '" />')
                // 1px transparent gif
                .attr('src', 'data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==')
                .data('src-original', file.url_tn)
                .toggle(checked)
                .appendTo(item);
            checked && this.showOrigSrc(i, 'fileset');
            this.ssToggleButton.show();
        }
    },

    fsAll: function(item, files, tree) {
        if(!files) {
            return;
        }
        // toggle ss in fileset
        this.ssToggleButton = $('<span />').appendTo(item).hide();
        $('<label for="ss-toggle"/>')
            .text(__('ss.showhide'))
            .appendTo(this.ssToggleButton)
            .addClass('zzlbox-button-icon zzlbox-button-icon-small')
            .tipTip();
        var st = zzlbox.models.User.option('ss-toggle'), that = this;
        $('<input type="checkbox" id="ss-toggle"/>')
            .attr('checked', st == undefined ? true : st)
            .appendTo(this.ssToggleButton)
            .button({
                icons: {primary: 'ui-icon-ss'},
                text: false
            }).change(function() {
                var toggle = $(this).is(':checked');
                zzlbox.models.User.option('ss-toggle', toggle);
                $('.ss-ss').toggle(toggle);
                that.showOrigSrc(null, 'fileset');
            });
    }
});
