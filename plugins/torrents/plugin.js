
ZZLBox.Plugins.Torrents = ZZLBox.Plugin.extend({

    initialize: function() {
        zzlbox.plugins.bind('addons', this.addons, this);
        zzlbox.plugins.bind('file-additional-info', function(el, model) {
            model.get('info_hash') &&
            $('<div />').html(__('tor.search') + ' ' +
                '<a target="_blank" href="http://www.google.com/search?q=' + model.get('name') + '">' + __('tor.byname') + '</a> ' + __('tor.or') + ' ' +
                '<a target="_blank" href="http://www.google.com/search?q=' + model.get('info_hash') + '">' + __('tor.info_hash') + '</a>').appendTo(el);
        }, this);
    },

    addons: function(el, model) {
        file = model.toJSON();
        if(zzlbox.views.Files.collection === zzlbox.collections.Downloads) {
            if(file.dl_status != 'failed') {
                var info = [];
                info.push(__('tor.status') + ': <b>' + __('st.' + file.active_status) + '</b>');
                info.push(__('tor.peers') + ': ' + file.peers);
                info.push(__('tor.seeds') + ': ' + file.seeders);
                if(file.active_status == 'seeding') {
                    info.push(__('tor.upspeed') + ': ' + $(file.up_speed).fileSize());
                    info.push(__('tor.upsize') + ': ' + $(file.up_bytes).fileSize());
                }
                $('<div />').html(info.join(' | ')).appendTo(el)
            }
        }
    }

});
