
// Add message for error plugin
zzlbox.plugins.Errors.messages['JPLAYER_ERROR'] = 'JPlayer error: {0} ({1})';
zzlbox.plugins.Errors.messages['JPLAYER_WARNING'] = 'JPlayer warning: {0} ({1})';

ZZLBox.Plugins.FileMedia = ZZLBox.Plugin.extend({

    initialize: function() {

        this.initPlayer();

        /*actions filelist - play
        actions fileinfo - play+
        fileset-actions-item - play+
        fileset-actions-folder - play+*/

        zzlbox.plugins.bind('actions', this.actions, this, 50);

        //zzlbox.plugins.bind('fileset-actions-all', this.filesetAll, this);
        zzlbox.plugins.bind('fileset-actions-item', this.filesetItem, this);
        zzlbox.plugins.bind('fileset-actions-folder', this.filesetFolder, this);

        zzlbox.plugins.bind('fileset-info-main', function(item, model, file) {
            // bitrate
            if(parseInt(file.bitrate) > 0) {
                $('<span />').html(
                    ', <span title="length: ' + file.length + ' seconds">' + this.timeFormat(file.length) + '</span>' +
                    ', <span title="bitrate">' + file.bitrate + ' kb/s</span>').appendTo(item);
            }
        }, this);
    },

    timeFormat: function (time) {
        time = parseInt(time);
        var h = Math.floor(time / 3600),
            m = Math.floor((time % 3600) / 60),
            s = time % 60,
            d = function(v) {
                return v < 10 ? ('0' + v) : v;
            },
            ret = [d(h), d(m), d(s)]

        while(ret.length > 2 && !parseInt(ret[0])) {
            ret.shift();
        }

        return ret.join(':')
    },

    actions: function(el, file, type) {

        this.file = file;

        // toolbar  (file => null)
        // filelist
        // fileinfo

        if(zzlbox.views.Files.collection !== zzlbox.collections.Files
            && zzlbox.views.Files.collection !== zzlbox.collections.Metasearch) {
            return;
        }


        // VLC button
        if(type == 'filelist' || type == 'fileinfo') {
            this.filesetAll(el, file, type == 'fileinfo' ? file.fileset() : null, null, type);

            var b = $('<a href="#" />')
                .text(__('media.vlc'))
                .addClass('zzlbox-button-icon')
                .button({
                    icons: {primary: 'ui-icon-vlc'},
                    //text: false
                })
                .appendTo(el);
            if(type == 'filelist') {
                b.addClass('zzlbox-button-icon-small')
                    .button('option', 'text', false);
            }
            if(file.has('url_pls')) {
                b.attr('href', file.get('url_pls'));
                if(type == 'filelist') {
                    b.tipTip();
                }
            } else {
                b.button('disable').attr('title', '');
            }
        }

        /*if(!file.has('url_pls')) {
            //b.css({visibility: 'hidden'});
            b.button('disable').attr('title', '');
        } else if (type == 'small') {
            b.tipTip();
        }*/

    },

    filesetAll: function(el, file, fileset, tree, noHook) {
        var that = this;

        var warn = '', count, support = 0;

        if(!file.has('url_dl')) {
            return;
        }

        if(!noHook || !fileset) {
            count = parseInt(file.get('files_num_video')) + parseInt(file.get('files_num_audio'));
            if(isNaN(count)) {
                count = 0;
            }
        } else {
            // FIXME need list of support files on server side to calc media files count for every folder
            //count = fileset.length;
            count = 0;
        }

        if(fileset) {
            // check support count
            $.each(fileset, function(i, f) {
                if(that.player.format[this.ext]) {
                    //console.log(that.player.format[this.ext], el, this.ext);
                    support++;
                }
            });
        } else {
            support = parseInt(file.get('files_num_video_player')) + parseInt(file.get('files_num_audio_player'));
            if(isNaN(support)) {
                support = 0;
            }
        }

        if(support == 0) {
            return;
        } 

        if(support < count && fileset) {
            warn = '<div class="info" style="' +
                            'position: absolute; width: 300px; margin-top: 50px; margin-right: -20px;">' +
                            __('media.supportwarn', support, count) + '</div>';
        }

        // buttonset
        var bs = $('<span />');

        var b = $('<span class="play-all-button">' + __('media.play') + '</span>')
            .addClass('zzlbox-button-icon' + (noHook == 'fileinfo' ? '' : ' zzlbox-button-icon-small'))
            .button({
                icons: {primary: 'ui-icon-play'},
                text: noHook == 'fileinfo'
            })
            .click(function(){
                if(fileset) {
                    that.addMediaList(fileset, true, true);
                } else {
                    file.fileset({
                        success: function(fileset, tree) {
                            that.addMediaList(fileset, true, true);
                        }
                    });
                }
            })
            .appendTo(bs)

        if(noHook != 'fileinfo') {
            b.tipTip({content: __('media.play' + (count > 1 ? '' : 'one')) + warn});
        }

        if(noHook != 'filelist') {
            // ADD button
            $('<span />')
                .addClass('zzlbox-button-icon' + (noHook == 'fileinfo' ? '' : ' zzlbox-button-icon-small'))
                .text(__('media.add'))
                .appendTo(bs)
                .button({
                    icons: {primary: 'ui-icon-add'},
                    text: false
                })
                .click(function(e, efiles){
                    if(fileset) {
                        that.addMediaList(fileset);
                    } else {
                        file.fileset({
                            success: function(fileset, tree) {
                                that.addMediaList(fileset);
                            }

                        });
                    }
                })
                .tipTip({content: __('media.add' + (count > 1 ? '' : 'one')) + warn});

            bs.appendTo(el).buttonset();

            // fix ui corner bug
            bs.children('.ui-button')
                .first().removeClass('ui-corner-right').addClass('ui-corner-left')
                .end()
                .last().removeClass('ui-corner-left').addClass('ui-corner-right');
        } else {
            b.appendTo(el);
        }
    },

    filesetFolder: function(el, file, folder, tree) {
        this.filesetAll(el, file, folder, tree, true);
    },

    filesetItem: function(el, file, item) {
        this.filesetAll(el, file, [item], null, true);
    },

    initPlayer: function() {

        _initJplayerPlugin();

        var that = this;

        // append player html
        $.tmpl('jplayer').appendTo($('body'));

        // init jplayer playlist
        this.playlist = new ZZLBox.Plugins.JPlayer({
            jPlayer: "#jplayer",
            cssSelectorAncestor: "#jplayer-player"
        }, [], {
            // player options
            swfPath: "/plugins/file.media/jquery.jplayer",
            supplied: _.keys($.jPlayer.prototype.format).join(','),

            // events
            warning: function(e) {
                //console.log('jPlayer warning: ' + e.jPlayer.warning.message + '(' + e.jPlayer.warning.hint + ')');
                zzlbox.error(e, 'JPLAYER_WARNING', [e.jPlayer.warning.message, e.jPlayer.warning.hint]);
            },
            error: function(e) {
                zzlbox.error(e, 'JPLAYER_ERROR', [e.jPlayer.error.message, e.jPlayer.error.hint]);
            },
            /*ready: function(e) {
            },*/
            volume: (zzlbox.models.User.option('vl') || 80) / 100,

            // playlist options
            playlistOptions: {
                displayTime: 0,
                addTime: 0,
                shuffleTime: 0,
                removeTime: 200,
                enableRemoveControls: true
            }
        });

        this.player = $('#jplayer').data('jPlayer');
        this.player.element.bind($.jPlayer.event.volumechange, function() {
            zzlbox.models.User.option('vl', Math.round(that.player.options.volume * 100));
        });

        $('#jplayer-player').css('z-index', 800).mouseenter(function() {
            setTimeout(function() {
                var p = $(that.playlist.cssSelector.playlist),
                    h = p.find('ul li:visible:not(.jp-playlist-current)').outerHeight(true);
                if(h) {
                    p.longList('option', 'itemHeight', h);
                    p.longList('option', 'wheelSize', h);
                }
                that.playlist._highlight(null);
            }, 22);
        });

    },

    addMediaList: function(medias, reset, playNow) {

        var that = this;

        var ms = [];
        $.each($.isArray(medias) ? medias : [medias], function(i, media) {
            if(that.player.format[media.ext]) {
                ms.push(that._mediaObj(media));
            }
        });

        this.playlist.setPlaylist(ms, !reset);

        playNow && this.player.play(0);
    },

    _mediaObj: function(media) {
        var m = {
            title: media.name,
            artist: this.file.get('name'),
            type: this.player.format[media.ext].media,
            free: true
        };
        m[media.ext] = media.url_player || media.url_dl;
        return m;
    },

    addMedia: function(media, playNow) {
        if(this.player.format[media.ext]) {
            this.playlist.add(this._mediaObj(media), playNow);
        }
    }

});

// because plugin files loaded assync
function _initJplayerPlugin() {
ZZLBox.Plugins.JPlayer = ZZLBox.Plugin.extend.call(jPlayerPlaylist, {
    shuffle: function(shuffled, playNow) {
        var that = this;

        if(shuffled === undefined) {
            shuffled = !this.shuffled;
        }

        if(shuffled || shuffled !== this.shuffled) {
            this.shuffled = shuffled;
            if(shuffled) {
                this.shuffledPlaylist = this.playlist.slice(0);
                this.shuffledPlaylist.sort(function() {
                    return 0.5 - Math.random();
                });
                // update this.current
                $.each(this.shuffledPlaylist, function(i, media) {
                    if(media === that.playlist[that.current]) {
                        //that.current = i;
                        that.shuffledPlaylist = _.without(that.shuffledPlaylist, media);
                        that.shuffledPlaylist.unshift(media);
                        that.current = 0;
                        return false; // break
                    }
                });
            } else {
                // update this.current
                $.each(this.playlist, function(i, media) {
                    if(media === that.shuffledPlaylist[that.current]) {
                        that.current = i;
                        return false; // break
                    }
                });
                this.shuffledPlaylist = null;
                //this._originalPlaylist();
            }
            this._updateControls();

            if(playNow) {
                if(this.shuffled) {
                    this.playShufled(0);
                } else {
                    this.play(0);
                }
            }

        }
    },

    play: function(index, fromSuffled) {
        if(index && this.shuffled && !fromSuffled) {
            // manually changed item
            // move top of queue
            var that = this, cur;
            $.each(this.shuffledPlaylist, function(i, media) {
                if(media === that.playlist[index]) {
                    that.shuffledPlaylist = _.without(that.shuffledPlaylist, media);
                    that.shuffledPlaylist.splice(++that.current, 0, media);
                    return;
                }
            });
            cur = this.current;
            jPlayerPlaylist.prototype.play.apply(this, arguments);
            this.current = cur;
        } else {
            jPlayerPlaylist.prototype.play.apply(this, arguments);
        }
    },

    playShufled: function(index) {
        var that = this;
        $.each(this.playlist, function(i, media) {
            if(media === that.shuffledPlaylist[index]) {
                that.play(i, true);
                that.current = index;
                return false; // break
            }
        });
    },

    next: function() {
        if(!this.shuffled) {
            jPlayerPlaylist.prototype.next.apply(this, arguments);
            return;
        }

        var index = (this.current + 1 < this.shuffledPlaylist.length) ? this.current + 1 : 0;

        if(this.loop) {
            // See if we need to shuffle before looping to start, and only shuffle if more than 1 item.
            if(index === 0 && this.shuffled && this.options.playlistOptions.shuffleOnLoop && this.shuffledPlaylist.length > 1) {
                this.shuffle(true, true); // playNow
            } else {
                this.playShufled(index);
            }
        } else {
            // The index will be zero if it just looped round
            if(index > 0) {
                this.playShufled(index);
            }
        }
    },

    previous: function() {
        if(!this.shuffled) {
            jPlayerPlaylist.prototype.previous.apply(this, arguments);
            return;
        }

        var index = (this.current - 1 >= 0) ? this.current - 1 : this.shuffledPlaylist.length - 1;

        if(this.loop && this.options.playlistOptions.loopOnPrevious || index < this.shuffledPlaylist.length - 1) {
            this.playShufled(index);
        }
    },

    _highlight: function(index) {
        index === null || jPlayerPlaylist.prototype._highlight.call(this, index);

        if($(this.cssSelector.playlist + " .jp-playlist-current").length > 0) {
            //$(this.cssSelector.playlist).data('longList').scrollTo($(this.cssSelector.playlist + " li.jp-playlist-current"));
            $(this.cssSelector.playlist).longList('scrollTo', $(this.cssSelector.playlist + " li.jp-playlist-current"));
        }

        if(this.playlist.length && index !== undefined) {
            var m = this.playlist[this.current];
            $('#jplayer').toggleClass('audio-play', m.type == 'audio');
            $('#jplayer-gui').toggleClass('audio-play', m.type == 'audio');
        }
    },

    remove: function(i) {
        jPlayerPlaylist.prototype.remove.apply(this, arguments);
        var that = this;
        setTimeout(function() {
            $(that.cssSelector.playlist).longList('removeItem', i);
            that.shuffled && $.each(that.shuffledPlaylist, function(i, media) {
                if($.inArray(media, that.original) == -1) {
                    that.shuffledPlaylist.splice(i, 1);
                    return false; //break
                }
            });
            $('#jplayer-player').toggleClass('hidden', that.original.length == 0);
        }, this.options.playlistOptions.removeTime + 30);
    },

    add: function(media, playNow) {
        jPlayerPlaylist.prototype.add.apply(this, arguments);
        this.shuffled && this.shuffledPlaylist.push(media);
        $('#jplayer-player').toggleClass('hidden', this.original.length == 0);
    },

    setPlaylist: function(playlist, append) {
        if(append) {
            var shuffled = this.shuffled,
                select = this.original.length == 0,
                current;
            shuffled && this.shuffle(false);
            current = this.current;
            select || (playlist = this.original.concat(playlist));
            this._initPlaylist(playlist);
            this._refresh();
            this._highlight(current);
            this.current = current;
            select && this.select(current);
            shuffled && this.shuffle(true);
        } else {
            jPlayerPlaylist.prototype.setPlaylist.call(this, playlist);
        }
        $('#jplayer-player').toggleClass('hidden', this.original.length == 0);
    },

    _refresh: function(instant) {
        var pl = $('<ul />'), that = this;
        $.each(this.playlist, function(i,v) {
            pl.append(that._createListItem(that.playlist[i]));
        });
        pl = $(this.cssSelector.playlist).clone().empty().append(pl);
        pl.longList({
            height: 200
        });
        $(this.cssSelector.playlist).replaceWith(pl);
        if($.isFunction(instant)) {
            instant();
        }
        this._updateControls();
    },
});
}
