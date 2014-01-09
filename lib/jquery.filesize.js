(function($){

    $.fn.fileSize = function() {

        var size = parseInt(this.length == 0 ? this.selector : this.get(0)),
            orig = size;

        var sizes = ['b', 'Kb', 'Mb', 'Gb', 'Tb', 'Pb'], i = 0;

        while(size / Math.pow(1024, i + 1) >= 1) i++;

        size = size / Math.pow(1024, i);

        size = Math.round(size * 10) / 10;

        if(size >= 10) {
            size = Math.round(size)
        }

        return '<span title="' + orig + ' bytes">' + size + ' ' + sizes[i] + '</span>';
    }

})(jQuery)
