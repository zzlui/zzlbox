
ZZLBox.Plugins.FilterStatus = ZZLBox.Plugin.extend({

    initialize: function() {

        zzlbox.plugins.wait('core/downloads', function() {
            zzlbox.plugins.wait('Filters', function(){
                this.hide('dl_status');
            });

            // add navigation button
            zzlbox.plugins.bind('navigation', function(nav){
                    $.each(zzlbox.collections.Downloads.filters.dl_status.values, function(key, name) {
                        key.length && nav.addItem($('<a href="/downloads?dl_status=' + key + '" />').text(name), key, 6);
                    });
            });

            zzlbox.router.bind('query:Files', function(chunks, query) {
                query.dl_status && zzlbox.plugins.Navigation.setState(query.dl_status);
            }, null, 99);
        });
    }

});
