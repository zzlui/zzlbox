
ZZLBox.Plugins.FileVideo = ZZLBox.Plugin.extend({

    initialize: function() {
        zzlbox.plugins.bind('fileset-info-main', this.fileset, this);
        zzlbox.plugins.bind('file-info', this.fileInfo, this);
    },

    fileInfo: function(el, model) {
        var v = model.get("video_info");
        if(v && v.length) {
            // append video_info
            $('<b />').text(__('video.info') + ':').appendTo(el);
            var ul = $('<ul/>').css({'margin-top':0}).appendTo(el);
            $.each(v.split('\n'), function(i, v){
                ul.append($('<li/>').text(v));
            });
        }
    },

    fileset: function(item, model, file) {
        // ensure that we have video file (not audio or image)
        if(file.ct.indexOf('video') == 0) {
            $('<span />').html(', ' + file.width + 'x' + file.height).appendTo(item);
        }
    }

});
