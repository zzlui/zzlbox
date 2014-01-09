(function($){

$.widget( "ui.scrollbars", {

    options: {
        wheelSize: 40,
        d: 1, //px
        autoHide: false
    },

    _init: function() {
        this.refresh();
    },

    _create: function() {
        var that = this;

        var expanded = false;

        $.inArray(this.element.css('position'), ['static', '']) >=0 && this.element.css('position', 'relative');

        this.element
            .css({
                //overflow: 'hidden',
                //overflow: 'auto',
                'overflow-x': 'hidden',
                'overflow-y': this.options.autoHide ? 'hidden' : 'auto',
                ///position: 'relative'
            })
            /*.mouseenter(function() { that.v.stop(true, true).fadeIn(); })
            .mouseleave(function() { that.v.stop(true, true).fadeOut(); })
            .mousewheel(function(e, d, dx, dy) {
                that.element.scrollTo(Math.max(0, that.element.scrollTop() + that.options.wheelSize * (0 - dy)), 0, {axis: 'y'});
                return that.refreshBarPosition();
            });*/
            .scroll(function() {
                that.refreshBarPosition();
            });

        if(this.options.autoHide) {
            this.element.add(this.element.find('*')).hover(
                function() {
                    that.element.css('overflow', 'auto');
                },
                function() {
                    that.element.css('overflow', 'hidden');
                }
            );
        }

        // vertical scrollbar
        /*this.v =
            $('<div />')
                .css({
                    'position': 'absolute',
                    'right': this.options.d,
                    'width': 10,
                    'background': '#9A9A9A',
                })
                .hide()
                .draggable({
                    containment: this.element,
                    scroll: false,
                    axis: 'y',
                    drag: function(e, ui) {
                        that.element.scrollTo(
                            (ui.position.top - that.element.scrollTop() - that.options.d)
                            * (that.element.get(0).scrollHeight - that.element.innerHeight())
                            / (that.element.innerHeight() - 2 * that.options.d - that.v.outerHeight())
                        , 0, {axis: 'y'});
                        that.refreshBarPosition();
                    },
                });*/

        this.vtop =
            $('<div class="scroll-highlight-top" />');

        this.vbottom =
            $('<div class="scroll-highlight-bottom" />');

        this.old = 0;
        setInterval(function() {
            if(that.old != that.element.get(0).scrollHeight) {
                that.old = that.element.get(0).scrollHeight;
                that.refresh();
            }
        }, 100)
    },

    refreshBarPosition: function() {
        /*var t = this.element.scrollTop()
                * (this.element.innerHeight()
                        - 2 * this.options.d
                        - this.v.outerHeight())
                / (this.element.get(0).scrollHeight
                        - this.element.innerHeight())
                + this.options.d
                + this.element.scrollTop(),
            old = parseInt(this.v.css('top'));

        this.v.css({'top': t});

        this.vtop.css('visibility', t == this.options.d ? 'hidden': 'visible');
        this.vbottom.css('visibility', t == (this.options.d + this.element.get(0).scrollHeight - this.v.outerHeight() - 2 * this.options.d) ? 'hidden' : 'visible');
162
        return t == old;*/

        this.vtop.add(this.vbottom).css({
            position: this.element.css('position'),
            width: this.element.width(),
            left: this.element.css('left'),
            top: this.element.css('top'),
            'z-index': this.element.css('z-index') + 1
        });

        this.vbottom.css({
            'margin-top': this.element.height() - 8
        });

        this.vtop.css('visibility', this.element.scrollTop() == 0 ? 'hidden': 'visible');
        this.vbottom.css('visibility', (this.element.get(0).scrollHeight - this.element.scrollTop() == this.element.innerHeight()) ? 'hidden' : 'visible');
    },

    refresh: function() {
        var s = this.element.get(0).scrollHeight;
            h = this.element.innerHeight();

        if(s > h) {
            //this.v.appendTo(this.element);
            this.vtop.insertBefore(this.element);
            this.vbottom.insertAfter(this.element);
        } else {
            //this.v.remove();
            this.vtop.remove();
            this.vbottom.remove();
        }

        //this.v.height(Math.max(30, (h - this.options.d) * h / s))
        this.refreshBarPosition();
    }

});

})(jQuery)
