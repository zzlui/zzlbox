
(function($){

$.widget( "ui.longList", {

    options: {
        disabled: false,

        height: 'auto',
        itemHeight: 'auto',
        wheelSize: 'auto',

        buffer: 100,
    },

    _create: function() {

        var that = this;

        // list
        this.ul = this.element.is('ul') ? this.element : this.element.find('ul');
        // wrapper
        this.wrapper = this.element.is('ul') ? this.element.wrap('<div>').parent() : this.element;

        this.count = this.ul.children().length;
        // check options
        this.options.height == 'auto' && (this.options.height = Math.max(this.wrapper.innerHeight(), 1));
        this.options.itemHeight == 'auto' && (this.options.itemHeight = Math.max(this.ul.children().first().outerHeight(true), this.options.height / this.count));
        this.options.wheelSize == 'auto' && (this.options.wheelSize = this.options.itemHeight);
        this.height = Math.min(this.options.height, this.count * this.options.itemHeight);

        // hide all extra items
        //this.ul.children(':gt(' + (this.options.buffer * 3 - 1) + ')').hide();

        this.wrapper.css({
            'max-height': this.options.height,
            position: 'relative',
            overflow: 'hidden'
        }).mousewheel(function(e, d, dx, dy) {
            that.scroll(that.offset + that.options.wheelSize * (0 - dy));
            return false;
        });

        this.ul.css({
            'position': 'relative',
            'line-height': 'normal' // FF bug, please use padding instead
        });

        this.scrollbar = $('<div />').css({
            position: 'absolute',
            right: 1,
            top: 0,
            width: 10,
            //background: 'white'
        }).appendTo(this.wrapper).click(function(e) {
            if(e.target === this) {
                that.scroll(
                    (e.pageY - $(this).offset().top - that.bar.outerHeight() / 2) *
                        (that.options.itemHeight * that.count - that.options.height) /
                            (that.scrollbar.height() - that.bar.height()));
            }
        });

        this.bar = $('<div />').appendTo(this.scrollbar).css({
            position: 'absolute',
            top: 0,
            left: 0,
            width: 10,
            background: 'black',
        }).draggable({
            containment: this.scrollbar,
            scroll: false,
            axis: 'y',
            drag: function(e, ui) {
                that.scroll(
                    ui.position.top *
                        (that.options.itemHeight * that.count - that.options.height) /
                            (that.scrollbar.height() - that.bar.height()), true);
            },
        });

        this.updateScrollbar();

        this.bufferNum = -1;
        this.offset = 0;
        this.visibleItems = this.ul.children();
        this.scroll(0);
    },

    updateScrollbar: function() {
        if((this.options.itemHeight * this.count) <= this.height) {
            this.scrollbar.hide();
        } else {
            this.scrollbar.show().height(this.height);
            var barHeight = this.height * this.height / (this.options.itemHeight * this.count);
            this.bar.height(barHeight < 30 ? 30 : barHeight);
        }
    },

    _setOption: function(key, value) {
        $.Widget.prototype._setOption.apply( this, arguments );
        if( key == 'itemHeight') {
            this.height = Math.min(this.options.height, this.count * this.options.itemHeight);
            this.updateScrollbar();
        }
    },

    scroll: function(offset, dontUpdateScrollBar) {
        //console.log(offset);

        // check offset limits
        offset = Math.max(offset, 0);
        offset = Math.min(offset, this.count * this.options.itemHeight - this.height);

        // save current offset
        this.offset = offset;

        // extra item px invisible container
        var ox = this.height % this.options.itemHeight;
        // buffer size in px
        var bufferSizePX = this.options.buffer * this.options.itemHeight;
        // calc buffer num for current offset
        var bufferNum = Math.floor(offset / (bufferSizePX - this.height - ox));
        // calc first buffer item num
        var bufferFirstItem = Math.floor(bufferNum * (bufferSizePX - this.height - ox) / this.options.itemHeight);
        // calc ul offset
        var offset_extra = offset - bufferFirstItem * this.options.itemHeight;

        //console.log(offset, ox, bufferSizePX, offset, bufferNum, offset_extra, bufferFirstItem);

        if(this.bufferNum != bufferNum) {
            // update visible items
            this.visibleItems.hide();
            this.visibleItems = this.ul.children().slice(bufferFirstItem, bufferFirstItem + this.options.buffer).show();
            this.bufferNum = bufferNum;
        }

        // move ul
        this.ul.css('top', 0 - offset_extra);

        if(!dontUpdateScrollBar) {
            // update scrollbar
            this.bar.css('top', offset * (this.scrollbar.height() - this.bar.height()) /
                                        (this.options.itemHeight * this.count - this.height));
        }

    },

    scrollTo: function(item) {
        this.scroll((typeof item == 'number' ? item : item.index()) * this.options.itemHeight - this.height / 2 + this.options.itemHeight / 2);
    },

    removeItem: function(index) { // index now has no effect
        this.count--;
        this.height = this.wrapper.innerHeight();
        this.updateScrollbar();
    },

});

})(jQuery);
