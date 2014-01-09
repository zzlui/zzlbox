
// File Model
ZZLBox.Models.File = ZZLBox.Model.extend({

    // Default attributes for a file item.
    defaults: {
        name: Math.round(),
        date: new Date(),
        size: null,
        ctime: null,
        mtime: null,
        is_linked: '1'
    },

    ready: false,

    _read: function(o) {
        if(this.ready) {
            o.success();
            return;
        }
        $.get(this.collection.uri.get, {
            id: this.id,
            t_files: 1
        }, _.bind(function(data) {
            if(data.status == 'ok' && parseInt(data.found_files || data.found_dls) > 0) {
                this.ready = true;
                o.success((data.files || data.dls)[0]);
            } else {
                o.error(data.message);
            }
        }, this), 'json');
    },

    tree: function(files) {
        var files, tree;

        if((tree = this.get('t_files_tree')) == undefined) {

            files = this.get('t_files');
            tree = {allfiles: files, size: this.get('size')};
            // build files tree
            $.each(files, function() {
                this.path = this.path.replace('//', '/');
                var chunks = this.name.split('.');
                this.ext = chunks.pop().toLowerCase();
                this.basename = chunks.join('.');
                chunks = this.path.split('/');
                chunks.pop();
                var last = tree;
                $.each(chunks, _.bind(function(i, v){
                    last = last[v] || (last[v] = {});
                    (last['allfiles'] || (last['allfiles'] = [])).push(this);
                    last['size'] || (last['size'] = 0);
                    last['size'] += parseInt(this.size);
                }, this));
                (last['files'] || (last['files'] = [])).push(this);
            });

            this.set({'t_files_tree': tree});

            return tree;
        } else {
            return tree;
        }
    },

    fileset: function(o, stop) {

        var that = this, files, tree;

        o || (o = {});

        if((files = this.get('t_files')) == undefined) {

            if(stop) {
                o.error && o.error('has no fileset');
            } else {
                this.fetch({
                    success: function() {
                        that.fileset(o, true);
                        //files = that.get('t_files');
                        //o.success(files, that.tree(files));
                    }
                });
            }

        } else {
            tree = this.tree(files);
            o.success && o.success(files, tree);
            return files;
        }

    },

});

ZZLBox.Collections.FilesAbstract = ZZLBox.Collection.extend({

    // Reference to this collection's model.
    model: ZZLBox.Models.File,

    // api uri
    // should be defined in inherits class
    // uri: '/api/get_files',

    // available filters
    filters: {},

    // current filter
    _filter: {},

    // cache string
    reqID: null,

    // available labels
    labels: false,

    initialize: function() {
        // format uri
        if(typeof this.uri == 'string') {
            this.uri = {
                get: this.uri + '/get',
                link: this.uri + '/link',
                unlink: this.uri + '/unlink',
                upsert: this.uri + '/upsert',
            };
        }
        if(this.uriLabels && typeof this.uriLabels == 'string') {
            this.uriLabels = {
                get: this.uriLabels + '/get',
                link: this.uriLabels + '/link',
                unlink: this.uriLabels + '/unlink',
                upsert: this.uriLabels + '/upsert',
                remove: this.uriLabels + '/remove',
            };
        }

        if(this.uriLabels) {
            // load labels
            $.get(this.uriLabels.get, {}, _.bind(function(data) {
                var labels, byID = {};
                // sort
                labels = data.labels.sort(function(a, b){
                    return parseInt(a.id_labels) < parseInt(b.id_labels) ? -1 : 1;
                }).sort(function(a, b) {
                    return parseInt(a.sorder) < parseInt(b.sorder) ? -1 : 1;
                });
                // by id
                $.each(labels, function(i, label) {
                    byID[label.id] = label;
                });
                // childs
                labels = $.grep(labels, function(label) {
                    if(label.id_labels > 0) {
                        (byID[label.id_labels].childs || (byID[label.id_labels].childs = [])).push(label);
                        return false;
                    }
                    return true;
                });
                // set and trigger change event
                this.trigger('change:labels', this.labels = labels, this.labelsById = byID);
            }, this), 'JSON');
        }
    },

    // filter
    filter: function(filter, append) {
        var _filter = {};
        // remove all extra filters
        $.each(filter, _.bind(function(key, value){
            if(key in this.filters) {
                _filter[key] = value;
            }
        }, this));

        this._filter = _.extend(append ? this._filter : {}, _filter);

        return this;
    },

    buildReqID: function(obj) {

        var hash = [];

        $.each(_.keys(obj).sort(), function(i, v) {
            hash.push(v + '=' + obj[v]);
        });

        return hash.join('&');
    },

    updateReqID: function(req, add) {
        if(add && this.reqID !== null) {
            var curr = {}, p;
            $.each(this.reqID.split('&'), function(i, v) {
                p = v.split('=');
                curr[p[0]] = p[1];
            });
            this.reqID = this.buildReqID($.extend(curr, req));
        } else {
            this.reqID = this.buildReqID(req);
        }
    },

    //////////////////
    // CRUD methods //
    //////////////////
    _create: function(o) {},
    _read: function(o) {

        var that = this,
            add = o.add,
            silent = o.silent,
            length = this.length,
            req = _.clone(o.filter || this._filter);

        if(add) { o.silent = true; }
        else {
            // cached
            if(this.reqID === this.buildReqID(req)) {
                setTimeout(function() {
                    that.trigger('cached', this, o);
                }, 22);
                return;
            }
        }

        $.get(this.uri.get, req, _.bind(function(data, textStatus, jqXHR) {
            if(data.status == 'ok') {
                this.updateReqID(req, add);
                this.found_files = parseInt(data.found_files || data.found_dls || 0);
                this.onAfterRead && this.onAfterRead(data);
                o.success(data.files);
                if (!silent && add) this.trigger('few', this.models.slice(length), this, o);
            } else {
                o.error(data.message);
            }
        }, this), 'json');

    },
    _update: function(o) {},
    _delete: function(o) {},

    update: function(o) {
        var ids = [], that = this;
        o.files && $.each($.isArray(o.files) ? o.files : [o.files], function(i, v) {
            ids.push((typeof v == 'object') ? v.get('id') : v);
        });
        if(ids.length > 0 || o.all || o.status || o.id_labels || o.id_feeds) {
            if(o.attributes.is_linked) {
                // update link
                this.reqID = null; // reset cache
                $.post(this.uri[o.attributes.is_linked == '1' ? 'link' : 'unlink'], {
                    id: ids.length > 0 ? ids : undefined,
                    'do': ids.length == 0 ? (o.all ? 'unlink_all' :
                          o.id_labels ? 'unlink_by_label' :
                          o.id_feeds ? 'unlink_by_feed' :
                          o.status ? ('unlink_' + o.status) :
                          undefined) : undefined,
                    id_labels: o.id_labels,
                    id_feeds: o.id_feeds
                }, function(data){
                    $.each(ids.length == 0 && (o.all || o.id_labels || o.id_feeds || o.status) ? _.keys(that._byId) : ids, function(i, v) {
                        var file = that.get(v);
                        if(o.id_labels) {
                            $.each(o.id_labels, function(i, l) {
                                if($.inArray(l, file.get('id_labels')) >= 0) {
                                    file.set({'is_linked': o.attributes.is_linked});
                                }
                            });
                        } else if(o.id_feeds) {
                            if(file.get('id_feeds') == o.id_feeds) {
                                file.set({'is_linked': o.attributes.is_linked});
                            }
                        } else {
                            file.set({'is_linked': o.attributes.is_linked});
                        }
                    });
                    o.success && o.success(data);
                }, 'json')
            } else if(o.attributes.id_labels && ids.length > 0) {

                if(o.link) {
                    $.post(this.uriLabels.link, {
                        id_labels: o.attributes.id_labels,
                        id_files: ids
                    }, function(data) {

                        $.each(ids, function(i, v) {
                            that.get(v).set({
                                'id_labels': _.union(that.get(v).get('id_labels'), o.attributes.id_labels)
                            });
                        });

                        o.success && o.success(data);
                    }, 'json');
                } else if (o.unlink){
                    $.post(this.uriLabels.unlink, {
                        id_labels: o.attributes.id_labels,
                        id_files: ids
                    }, function(data) {

                        $.each(ids, function(i, v) {
                            that.get(v).set({
                                'id_labels': $.grep(that.get(v).get('id_labels'), function(n) {
                                    return $.inArray(n, o.attributes.id_labels) == -1
                                })
                            });
                        });

                        o.success && o.success(data);
                    }, 'json');
                } else {
                    // TODO
                    // update all labels list for files
                }

            }
        } else {
            o.error && o.error('Empty files list') || console.log('Empty files list', o);
        }
    },

    updateLabel: function(o) {
        
    }
});

// Files Collection
ZZLBox.Collections.Files = ZZLBox.Collections.FilesAbstract.extend({

    uri: '/api/file',
    uriLabels: '/api/label',

    // available filters
    filters: {
        //status: { name: 'Status',  default: 'finished', type: 'radio', values: {'finished': 'Finished', 'active': 'Active', 'failed':'Failed', 'uploads':'Uploads'} },
        type: {name: __('files.f_type'), 'default': '', type: 'select', values: {video: __('files.video'), audio: __('files.audio'), 'default': __('files.other'), '': __('files.all')} },
        offset: {name: __('files.offset'), 'default': 0, type: 'num'},
        limit: {name: __('files.limit'), 'default': 25, type: 'num'},

        id_labels: {name: __('files.labels'), 'default': 0, type: 'num'},
        id_feeds: {name: __('files.feeds'), 'default': 0, type: 'num'},

        src: {name: __('files.source'), type: 'select', 'default': '', values: {'': __('files.all'), 'upload': __('files.upload'), 'torrent': __('files.torrent'), 'http': __('files.http_link'), 'ed2k': __('files.ed2k')}},

        sort_col: {name: __('files.sort_by'), 'default': 'ctime', type: 'select', values: {ctime: __('files.by_date'), size: __('files.by_size'), name: __('files.by_name')}},

        sort_type: {name: __('files.sort_type'), 'default': 'desc', type: 'radio', values: {asc: '&#8595;', desc: '&#8593;'}},

        name_like: {name: __('files.name_like'), 'default': '', type: 'text'},
        link_dt_gt: {name: __('files.link_date_great'), 'default': '', type: 'date', hidden: true},
        /*info_hash: {name: __('files.info_hash'), 'default': '', type: 'text', hidden: true}*/
    }

});
