define(function(require, exports, module) {

    function _get(key) {
        var val = localStorage[key];
        val = JSON.parse(val);
        return val;
    }

    function _set(key, val) {
        localStorage[key] = JSON.stringify(val);
    }


    function set(key, val) {

        if (!_.isArray(key)) {
            key = [key];
        }
        var primaryKey = key[0], result, primary;
        result = primary = _get(primaryKey);


        var l = key.length;
        if (l == 1) {
            if (val) {
                primary = val;
            }
        } else {
            if (result == null) {
                result = primary = {};
            }
            for (var i = 1; i < l - 1; ++i) {
                if (result[key[i]] == null) {
                    result[key[i]] = {};
                }
                result = result[key[i]];
            }

            if (val) {
                result[key[i]] = val;
            } else {
                result = result[key[i]];
            }

        }

        if (!val) {
            return result;
        }
        
        _set(primaryKey, primary);
        
    }


    function append(key, val_) {

        var val = set(key);
        if (val) {
            val.push(val_);
        } else {
            val = [val_];
        }
        set(key, val);
    }

    function remove(key) {
        localStorage.removeItem(key);
    }

    function mapReduce(key, cb) {
        var items = set(key), result;
        if (items) {
            result = _.filter(items, cb);
            set(key, result);
        }
    }

    exports.set = set;
    exports.append = append;
    exports.remove = remove;
    exports.mapReduce = mapReduce;  
})