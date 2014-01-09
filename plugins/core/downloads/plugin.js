
ZZLBox.Collections.Downloads = ZZLBox.Collections.FilesAbstract.extend({
    uri: '/api/dl',

    filters: {
        dl_status: {name: __('dls.status'), 'default': '', type: 'radio', values: {'': __('dls.all'), active: __('dls.active'), failed: __('dls.failed')}},
        offset: {name: 'Offset', 'default': 0, type: 'num'},
        limit: {name: 'Limit', 'default': 25, type: 'num'},
    },

    onAfterRead: function(data) {
        data.files = data.torrents;
        $.each(data.files, function(i, file) {
            file.status = file.dl_status;
        });
    }

});

ZZLBox.Plugins.Downloads = ZZLBox.Plugin.extend({
    initialize: function() {
        var collection = this.collection = zzlbox.collections.Downloads = new ZZLBox.Collections.Downloads;
        zzlbox.views.Files.addCollection(collection, ['downloads'], __('dls.downloads'));

        // add navigation button
        zzlbox.plugins.bind('navigation', function(nav){
            nav.addItem($('<a href="/downloads" class="menu-icon-download" />').text(__('dls.downloads')), 'downloads', 5);
        }, this);

        zzlbox.plugins.bind('files-add-one', this.addons, this);

        var that = this;
        this.display = 'list';
        zzlbox.plugins.wait('display-type', function() {
            this.bind('change:display', that.updateDisplay, that);
            that.updateDisplay(this._display);
        });
    },

    updateDisplay: function(display) {
        this.display = display;
        if(zzlbox.views.Files.collection !== this.collection) {
            return;
        }
        $('#file-list .file').each(function() {
            if($(this).data('downloads-el')) {
                $(this).data('downloads-el').appendTo($(this).children(display == 'table' ? '.name' : '.addons'));
            }
        });
    },

    addons: function(el, model) {
        file = model.toJSON();

        if(zzlbox.views.Files.collection === zzlbox.collections.Downloads) {
            var dEl = $('<div />');

            if(file.dl_status == 'failed') {
                $('<div />').text(
                    __('dls.fail_reason') + ': ' + file.fail_reason
                ).appendTo(dEl);
            } else {
                if(file.bytes != file.size) {
                    var progress = file.have + '% | ' + $(file.bytes).fileSize() + ' / ' + $(file.size).fileSize() + ' | Speed: ' + $(file.speed).fileSize() + '/s';
                    $('<div class="zzlbox-progressbar"/>').progressbar({value: parseFloat(file.have)})
                        .prepend($('<div class="progressbar-text"></div>').html(progress))
                        .prependTo(dEl);
                } else {
                    var info = [];
                    info.push(__('dls.postproc') + ': ' + (__(file.post_proc_status || 'st.in_progress')));
                    $('<div />').html(info.join(' | ')).appendTo(dEl);
                }
            }

            el.data('downloads-el', dEl.appendTo(el.children(this.display == 'table' ? '.name' : '.addons')));
        }
    }
})
