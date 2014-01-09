
ZZLBox.Plugins.FileImage = ZZLBox.Plugin.extend({

    initialize: function() {

        zzlbox.plugins.bind('actions', function(el, model, type) {
            if(type == 'fileinfo') this.actions(el, model, type);
            if(type == 'filelist') {
                if(!el.find('.play-all-button').length){
                    if(!this.actions(el, model, type)) {
                        $('<span />')
                            .addClass('zzlbox-button-icon zzlbox-button-icon-small')
                            .text('_')
                            .button({
                                icons: {primary: 'ui-icon-placeholder'},
                                text: false,
                                disabled: true
                            })
                            .css('visibility', 'hidden')
                            .attr('title', '')
                            .prependTo(el);
                    }
                }
            }
        }, this, 100);
        zzlbox.plugins.bind('fileset-actions-all', function(el, model, file, tree) {
            if(!tree) this.actions(el, model);
        }, this);

        zzlbox.plugins.bind('file-info', this.fileView, this, 70);
        zzlbox.plugins.bind('fileset-info-main', function(item, model, file) {
            // ensure that we have video file
            if(file.ct.substr(0, 6) == 'image/' && parseInt(file.width) > 0) {
                $('<span />').html(', ' + file.width + 'x' + file.height).appendTo(item);
            }
        }, this);

    },

    // show image files inline in doc on file page
    fileView: function(item, file) {
        var formats = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'];
        if($.inArray(file.get('name').split('.').pop(), formats) >= 0) {
            $('<div class="zzlbox-info" />')
                .css('text-align', 'center')
                .append('<img width="100%" src="' + file.get('url_dl') + '" />')
                .appendTo(item);
        }
    },

    // add slideshow button in fileset actions
    actions: function(el, model, type) {

        if(!model.has('url_dl')) {
            return;
        }

        var count = parseInt(model.get('files_num_image'));
        if(count == 0 || isNaN(count)) {
            return false;
        }

        var that = this;

        var b = $('<span>' + __('img.slideshow') + '</span>')
            .attr('title', __('img.slideshowdesc'))
            .addClass('zzlbox-button-icon' + (type == 'fileinfo' ? '' : ' zzlbox-button-icon-small'))
            .button({
                icons: {primary: 'ui-icon-albums'},
                text: type == 'fileinfo'
            }).click(function(){
                model.fileset({
                    success: function(fileset, tree) {
                        that.gallery(model, tree);
                    }
                })
            });

        if(type == 'filelist') {
            b.prependTo(el);
        } else {
            b.appendTo(el);
        }

        //if(type != 'fileinfo') {
            b.tipTip();
        //}

        return true;
    },

    // show gallery
    gallery: function(model, tree) {
        //console.log(tree);

        var that = this;

        function prepareAlbums(tree, name) {
            var albums = [];

            function appendAlbum(tree, name) {
                $.each(tree, function(i, t) {
                    if(i != 'files' && i != 'allfiles' && i != 'size') {
                        appendAlbum(t, i);
                    }
                });
                if(tree.files && tree.files.length) {
                    var images = [];

                    $.each(tree.files, function(i, f) {
                        f.ct.substr(0, 6) == 'image/' && images.push({
                            src: f.url_dl,
                            href: f.url_dl,
                            title: f.basename.split('_').join(' ') || f.basename,
                            ext: f.ext,
                            size: f.size
                        });
                    });

                    images.length && albums.push({
                        name: name.split('_').join(' ') || name,
                        images: images
                    });
                }
            }

            appendAlbum(tree, name);

            //console.log(albums);

            return albums;
        }

        $('<div />').appendTo('body').imageGallery({
            albums: prepareAlbums(tree, model.get('name'))
        });
    },

});
