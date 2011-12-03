define(function(require, exports, module) {

    var EN_AMP_RE = /&/g;
    var EN_LT_RE  = /</g;
    var EN_GT_RE  = />/g;
    var EN_QUOT_RE = /"/g;
    var EN_SINGLE_RE = /'/g;
  
    // encode text into HTML to avoid XSS attacks.
    function htmlEncode(text){
        text = ""+text;
        text = text.toString().replace(EN_AMP_RE, "&amp;");
        text = text.replace(EN_LT_RE, "&lt;");
        text = text.replace(EN_GT_RE, "&gt;");
        text = text.replace(EN_QUOT_RE, "&quot;");
        text = text.replace(EN_SINGLE_RE, "&#39;");
        return text;
    }
  
    var DE_GT_RE = /\&gt\;/g;
    var DE_LT_RE = /\&lt\;/g;
    var DE_QUOT_RE = /\&quot\;/g;
    var DE_SINGLE_RE = /\&#39\;/g;
  
    function htmlDecode(text){
        text = ""+text;
        text = text.toString().replace(DE_GT_RE, ">");
        text = text.replace(DE_LT_RE, "<");
        text = text.replace(DE_QUOT_RE, '"');
        text = text.replace(DE_QUOT_RE, '"');
        text = text.replace(DE_SINGLE_RE, '\'');
        return text;
    }

    function parseQueryParams() {
        var s = location.search.slice(1),
            params = {};
        _.each(s.split('&'), function(str) {
            var pair = str.split('=');
            params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
        });
        return params;
    }

    return {
        parseQueryParams: parseQueryParams,
        htmlEncode: htmlEncode,
        htmlDecode: htmlDecode
    };

});