
(function($){

// 1x1 transparent gif
var px = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///////yH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';

$.widget('ui.imageGallery', {

    options: {
        tree: false,
        images: [],
        preload: 2,
        slideshow: 5000,
    },

    _create: function() {

        var that = this;

        this.element.addClass('image-gallery').css('z-index', 901);

        this.loader = $('<div />').addClass('loader');

        this.albums = $('<div />').addClass('albums').hide();//.appendTo(this.element);

        this.view = $('<div />').addClass('image-view fit-to-screen').appendTo(this.element);

        this.scroll = $('<div />').addClass('thumbs-scroll');//.appendTo(this.element);

        this.element.parent().scrollTo(0);
        this.overlay = $('<div />').addClass('ui-widget-overlay').insertBefore(this.element).css('z-index', 900);
        this.overflowBack = this.element.parent().css('overflow');
        this.element.parent().css('overflow', 'hidden');

        // controls
        this.controls = $('<div />').addClass('controls');
            // toggle fit to screen
            $('<label for="ig-fit"/>')
                .appendTo(this.controls).addClass('zzlbox-button-icon zzlbox-button-icon-small')
                .tipTip({content: __('img.fittoscreen')});
            $('<input type="checkbox" checked="true" id="ig-fit"/>').appendTo(this.controls).button({
                icons: {primary: 'ui-icon-fit-to-screen'},
                text: false
            }).change(function() {
                var toggle = $(this).is(':checked');
                that.view.toggleClass('fit-to-screen', toggle);
                toggle || that.view.scrollTo('50%');
            });

            // toggle full screen
            /*$('<label for="ig-fullscreen"/>').appendTo(this.controls).addClass('zzlbox-button-icon zzlbox-button-icon-small');
            $('<input type="checkbox" checked="true" id="ig-fullscreen"/>').appendTo(this.controls).button({
                icons: {primary: 'ui-icon-fullscreen'},
                text: false
            }).change(function() {
                var toggle = $(this).is(':checked');
            });*/

            // toggle thumbnails
            $('<label for="ig-thumbs"/>')
                .appendTo(this.controls).addClass('zzlbox-button-icon zzlbox-button-icon-small')
                .tipTip({content: __('img.thumbs')});
            $('<input type="checkbox" checked="true" id="ig-thumbs"/>').appendTo(this.controls).button({
                icons: {primary: 'ui-icon-thumbnails'},
                text: false
            }).change(function() {
                var toggle = $(this).is(':checked');
                that.scroll.toggle(toggle);
            });

            // toggle previews
            $('<label for="ig-preview"/>')
                .appendTo(this.controls).addClass('zzlbox-button-icon zzlbox-button-icon-small')
                .tipTip({content: __('img.preview') + '<div class="warning">' + __('img.previewwarn') + '</div>'});
            $('<input type="checkbox" id="ig-preview"/>').appendTo(this.controls).button({
                icons: {primary: 'ui-icon-preview'},
                text: false
            }).change(function() {
                var toggle = $(this).is(':checked');
                that.toggleThumbnails(toggle);
            });

            // show albums
            if(this.options.albums.length > 1) {
                $('<span />').appendTo(this.controls).addClass('zzlbox-button-icon zzlbox-button-icon-small').button({
                    icons: {primary: 'ui-icon-albums'},
                    text: false
                }).click(function() {
                    that.albums.show();
                }).tipTip({content: __('img.albums')});
            }

            // arrows left
            $('<span />').appendTo(this.controls).addClass('zzlbox-button-icon zzlbox-button-icon-small').button({
                icons: {primary: 'ui-icon-arrow-left'},
                text: false
            }).click(function() {
                that.next(-1);
            }).tipTip({content: __('img.prev')});

            // arrow right
            $('<span />').appendTo(this.controls).addClass('zzlbox-button-icon zzlbox-button-icon-small').button({
                icons: {primary: 'ui-icon-arrow-right'},
                text: false
            }).click(function() {
                that.next();
            }).tipTip({content: __('img.next')});

            // slideshow play
            this.playButton = $('<span />').appendTo(this.controls).addClass('zzlbox-button-icon zzlbox-button-icon-small').button({
                icons: {primary: 'ui-icon-play-slideshow'},
                text: false
            }).click(function() {
                that[that._play ? 'stop' : 'play']();
            }).tipTip({content: __('img.play')});

            // download button
            $('<span />').appendTo(this.controls).addClass('zzlbox-button-icon zzlbox-button-icon-small').button({
                icons: {primary: 'ui-icon-download'},
                text: false
            }).click(function() {
                document.location.href = that.view.find('img').attr('src');
            }).tipTip({content: __('img.dl')});

            // exit button
            $('<span />').appendTo(this.controls).addClass('zzlbox-button-icon zzlbox-button-icon-small').button({
                icons: {primary: 'ui-icon-exit'},
                text: false
            }).click(function() {
                that._destroy();
            }).tipTip({content: __('img.exit')});

        this.controls.appendTo(this.element);

        // for preloading
        this.queue = [];
        this.busy = false;
        this._preloaded = false;

        // allow to use without albums
        if(!this.options.albums) {
            this.options.albums = [{
                images: this.options.images
            }];
        }

        this.current = {album: 0, image: 0};

        this.drag = false;
        // allow to move full-sized immage
        $('body')
            .on('mouseup.imagegallery', function(e) {
                that.view.removeClass('moveable');
                that.drag = false;
            })
            .on('mousemove.imagegallery', function(e) {
                if(that.drag && !that.view.hasClass('fit-to-screen')) {
                    that.view.scrollTo({
                        left: that.drag.sx - (e.pageX - that.drag.x),
                        top: that.drag.sy - (e.pageY - that.drag.y)
                    }, 0);
                }
            })
            .on('mouseenter.imagegallery', function(e) {
                if(that.drag && e.which == 0) {
                    that.view.removeClass('moveable');
                    that.drag = false;
                }
            })
            .on('keydown.imagegallery', function(e) {
                switch(e.keyCode) {
                    case 37: // left arrow
                        that.next(-1); break;
                    case 32: // space
                    case 39: // right arrow
                        that.next(+1); break;
                    case 33: // page up
                        that.next(-1, true); break;
                    case 34: // page down
                        that.next(-1, true); break;
                    case 34: // page down
                        that.next(+1, true); break;
                    case 27: // escape
                        that._destroy();
                }
                //console.log(e.keyCode);
            });

        // init albums list
        this.albumList();

        // show first album
        this.showAlbum();

        // append close buttons
        /*this.closeable(this.element, function() {
            that._destroy();
        });*/
        this.closeable(this.albums);
    },

    closeable: function(el, callback) {
        $('<div />').addClass('closeable').appendTo(el).click(function() {
            callback && callback();
            el.hide();
            return false;
        });
    },

    toggleThumbnails: function(toggle) {
        var that = this, img, s = 90;

        if(toggle) {
            $.each(this.scroll.find('.scroll-item'), function(i, el) {
                if(img = $(el).children('img').get(0)) {
                    $(img).show();
                } else {
                    that.preload($(el).data('image'), el, 'thumb', function(image) {
                        var size = $(this).data('size');
                        var w = size.width, h = size.height;
                        $(this).css('margin-top', w > h ? (100 - h / (w / s)) / 2 : (50 - s / 2));
                        $(this).css(w > h ? 'width' : 'height', s);
                        if(!that.controls.find('#ig-preview').is(':checked')) {
                            $(this).hide();
                        }
                    });
                }
            });
        } else {
            this.queue = [];
            this.scroll.find('img').hide();
        }
    },

    _preload: function(src, callback) {
        if(this._preloaded[src]) {
            callback.apply(this._preloaded[src]);
        } else {
            var that = this;
            $('<img src="' + px + '" />').one('load', function() {
                that._preloaded[src] = this;
                if($.browser.msie) {
                    this.src = src; // fix IE image rendering
                    // this.width == 0 in IE, so need to create new img object
                    var i = new Image(); i.src = this.src;
                    $(this).data('size', {
                        width: i.width,
                        height: i.height
                    });
                } else {
                    $(this).data('size', {
                        width: this.width,
                        height: this.height
                    });
                }
                callback && callback.apply(this);
            }).attr('src', src);
        }
    },

    preload: function(image, el, what, callback) {
        if(image) {
            this.queue[what == 'src' ? 'unshift' : 'push']({
                image: image,
                what: what,
                el: el,
                callback: callback
            });
        }
        if(this.busy || this.queue.length == 0) {
            return;
        }
        this.busy = true;
        var load = this.queue.shift(),
            that = this,
            s = 90;

        this.loader.prependTo(load.el);
        this._preload(load.image[load.what] || load.image.src, function() {
            var img = $(this);
            if(load.what == 'thumb' && !load.image.thumb) {
                img = img.clone();
                img.data('size', $(this).data('size'));
            }
            img.attr('style', '').hide().prependTo(load.el).fadeIn();
            load.callback && load.callback.call(img.get(0), load.image);
            that.loader.remove();
            that.busy = false;
            that.preload();
        });

    },

    preloadSibling: function() {

        for(var i = 1, x = 1, image; x < this.options.preload + 1; i++, x = Math.ceil(i / 2) * (2 * (i % 2) - 1)) {
            if(image = this.images[this.current.image + x]) {
                this._preload(image.src);
            }
        }

    },

    albumList: function() {

        var that = this;

        $.each(this.options.albums, function(i, album) {
            $('<div />')
                .addClass('albums-item')
                .text(album.name + ' ')
                .append('(<b class="special">' + album.images.length + '</b>)')
                .appendTo(that.albums)
                .click(function() {
                    that.showAlbum(i);
                    that.albums.hide();
                });
        });

        this.albums.appendTo(this.element);
    },

    showAlbum: function(index) {

        index === undefined || (this.current.album = index);

        var that = this,
            images = this.images = this.options.albums[this.current.album].images;

        // detach from DOM to speed up
        this.scroll.remove().empty();

        $.each(images, function(i, image) {

            var item = $('<div />')
                .data('image', image)
                .addClass('scroll-item file-type-' + image.ext)
                .appendTo(that.scroll)
                //.append($('<img src="/themes/core/img/loader.gif" />').hide().data('image', image))
                .append('<span>' + image.title + '</span>')
                .click(function(){
                    that.showImage(i);
                });
        });

        // return to DOM
        this.scroll.insertBefore(this.view);

        // fast hack to fix scrol width (disable horizontal scrollbar)
        this.scroll.scrollLeft(100).width(this.scroll.width() + this.scroll.scrollLeft());

        // active album
        this.albums.children().removeClass('active').filter(':eq(' + this.current.album + ')').addClass('active');

        this.showImage();
    },

    showImage: function(index) {

        index === undefined || (this.current.image = index);

        var that = this,
            old = this.view.children('img');

        this.preload(this.images[this.current.image], this.view, 'src', function(image) {

            old.css({
                'position': 'absolute',
                'top': 0,
                'left': (that.view.innerWidth() - old.outerWidth(true)) / 2,
            }).fadeOut(function() {
                old.remove();
            });

            $(this).off('mousedown.imagegallery');
            $(this).on('mousedown.imagegallery', function(e) {
                that.view.addClass('moveable');
                that.drag = {
                    x: e.pageX,
                    y: e.pageY,
                    sx: that.view.scrollLeft(),
                    sy: that.view.scrollTop()
                };
                return false;
            });

            that.scroll.find('.scroll-item').removeClass('active');
            var span = that.scroll.find('.scroll-item:eq(' + that.current.image + ')').addClass('active').children('span');

            that.scroll.scrollTo(span.parent(), {duration: 500,
                over: 0.5 - that.scroll.width() / span.parent().outerWidth(true) / 2 });

            that.view.hasClass('fit-to-screen') || that.view.scrollTo('50%');

            that.preloadSibling();
        });
    },

    next: function(i, album, auto) {
        auto || this.stop();
        if(i == undefined) {
            i = +1;
        }
        if(!album) {
            this.current.image += i;
            if(this.images.length <= this.current.image) {
                i = +1;
                album = true;
            }
            if(this.current.image < 0) {
                i = -1;
                album = true;
            }
        }
        if(album) {
            this.current.album += i;
            if(this.options.albums.length <= this.current.album) {
                this.current.album = 0;
                this.current.image = 0;
            }
            if(this.current.album < 0) {
                this.current.album = this.options.albums.length - 1;
                this.current.image = this.options.albums[this.current.album].images.length - 1;
            }
            this.showAlbum();
        } else {
            this.showImage();
        }
    },

    stop: function() {
        this.playButton.button('option', 'icons', {primary: 'ui-icon-play-slideshow'})
            .tipTip({content: __('img.play')});
        if(this._play) {
            clearTimeout(this._play);
            this._play = null;
        }
    },

    play: function() {
        this.playButton.button('option', 'icons', {primary: 'ui-icon-pause-slideshow'})
            .tipTip({content: __('img.pause')});
        var that = this;
        this._play = setTimeout(function() {
            that.next(+1, false, true);
            that.play();
        }, this.options.slideshow);
    },

    _destroy: function() {
        this.element.parent().css('overflow', this.overflowBack);
        this.element.empty().hide();
        this.overlay.remove();
        $('body').off('.imagegallery');
    },

});

})(jQuery);
