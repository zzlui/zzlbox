(function($){

    $.fn.fileDate = function(o) {

        o = $.extend({
            // defaults
            fullDate: false,
            withTitle: true
        }, o)

        var orig,
            now = new Date(),
            date, m, ret;

        if(this.length == 0) {
            orig = this.selector;
        } else {
            var s = this.get(0);
            if(s instanceof Date) {
                orig = date = s;
            } else {
                orig = parseInt(s);
            }
        }

        if(date == undefined) {
            m = orig.match(/(\d+)-(\d+)-(\d+) (\d+):(\d+):(\d+)/);
            date = new Date(+m[1], m[2]-1, +m[3], +m[4], +m[5], +m[6]); // Note: January = 0
        }

        // add first 0-digit
        function a(i) {
            return i < 10 ? ('0' + i) : i;
        }

        // e.g. 2012-12-21
        function formatFullDate(y, m, d) {
            return a(y) + '-' + a(m+1) + '-' + a(d);
        }

        // e.g. 8 Mar
        var mm = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        function formatDate(m, d) {
            return a(d) + ' ' + mm[m];
        }

        // e.g. 3:03:03
        function formatTime(h, m, s) {
            return h + ':' + a(m) + (s == undefined ? '': ('-' + a(s)));
        }

        // e.g. 2012-12-21 3:03:33
        /*function formatDateTime(y, m, d, h, m, s) {
            return formatFullDate(y, m, d) + ' ' + formatTime(h, m, s);
        }*/

        if(date.getFullYear() != now.getFullYear() || o.fullDate) {
            // not this year
            ret = formatFullDate(date.getFullYear(), date.getMonth(), date.getDate());
        } else if(date.getDate() == now.getDate() && date.getMonth() == now.getMonth()) {
            // today
            ret = formatTime(date.getHours(), date.getMinutes());
        } else {
            // this year, but not today
            ret = formatDate(date.getMonth(), date.getDate());
        }

        return o.withTitle ? ('<span title="' + orig + '">' + ret + '</span>') : ret;
    }

})(jQuery)
