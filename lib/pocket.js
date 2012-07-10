(function() {
  var Pocket, request;

  request = require("request");

  /*
  Class for interacting with getpocket.com api
  
  All callback functions accept 2 params:
      1) error, must be null,
      2) resulting object in json/javascript format.
  */


  Pocket = (function() {
    /*
      Class constructor, `user` and `password` params may be ommitted only for
      signup call
    
      @param {String} user Username
      @param {String} password User password
      @param {String} apikey Application api key
    */

    function Pocket(user, password, apikey) {
      this.user = user;
      this.password = password;
      this.apikey = apikey;
      this._domain = "https://getpocket.com/v2";
      this.password = this.password;
    }

    /*
      ##  --------------------------------------------------------------------------------
      ##   Helper functions
      ##  --------------------------------------------------------------------------------
    */


    /*
      Join params from dict to query string
    
      @param {Object} params Dict of params
    */


    Pocket.prototype._joinParams = function(params) {
      var k, p, v;
      if (params == null) {
        params = {};
      }
      params.username || (params.username = this.user);
      params.password || (params.password = this.password);
      params.apikey = this.apikey;
      p = [];
      for (k in params) {
        v = params[k];
        if (v) {
          p.push("" + k + "=" + (escape(v)));
        }
      }
      return p.join("&");
    };

    /*
      Check result for errors
    */


    Pocket.prototype._checkErrors = function(err, res, fn) {
      if (err) {
        return fn(err, false);
      } else {
        return fn(null, res.statusCode === 200);
      }
    };

    /*
      Get responce body, if no errors, otherwise return error
    */


    Pocket.prototype._getBody = function(err, res, body, fn) {
      if (err) {
        return fn(err);
      } else if (res.statusCode === 200) {
        return fn(null, JSON.parse(body));
      } else {
        return fn({
          errCode: res.statusCode
        });
      }
    };

    /*
      Authenticate user
    
      @param {Function} fn Callback function
    */


    Pocket.prototype.auth = function(fn) {
      var url,
        _this = this;
      url = "" + this._domain + "/auth?" + (this._joinParams());
      return request(url, function(err, res) {
        return _this._checkErrors(err, res, fn);
      });
    };

    /*
      Signup new user
    
      @param {String} username New user name
      @param {String} password Password for user
      @param {Function} fn Callback function
    */


    Pocket.prototype.signup = function(user, password, fn) {
      var url,
        _this = this;
      url = "" + this._domain + "/signup?" + (this._joinParams({
        username: user,
        password: password
      }));
      return request(url, function(err, res) {
        return _this._checkErrors(err, res, fn);
      });
    };

    /*
      Add new url to pocket
    
      @param {String} url Url, starting from http
      @param {String} title Personal title for url
      @param {String|Function} ref_id Ref_id string, or callback function
      @param {Function} fn Callback function, if ref_id is set
    */


    Pocket.prototype.add = function(url, title, ref_id, fn) {
      var _this = this;
      if ("function" === typeof ref_id) {
        fn = ref_id;
        ref_id = null;
      }
      url = "" + this._domain + "/add?" + (this._joinParams({
        url: url,
        title: title,
        ref_id: ref_id
      }));
      return request(url, function(err, res) {
        return _this._checkErrors(err, res, fn);
      });
    };

    /*
      Get stats for user
    
      @param {Function} fn Callback function
    */


    Pocket.prototype.stats = function(fn) {
      var _this = this;
      return request("" + this._domain + "/stats?" + (this._joinParams()), function(err, res, body) {
        return _this._getBody(err, res, body, fn);
      });
    };

    /*
      Get api info - dict with "x-limit-..." values
    
      @param {Function} fn Callback function
    */


    Pocket.prototype.apiInfo = function(fn) {
      return request("" + this._domain + "/api?apikey=" + this.apikey, function(err, res) {
        var k, out, v, _ref;
        if (err) {
          return fn(err);
        } else if (res.statusCode === 200) {
          out = {};
          _ref = res.headers;
          for (k in _ref) {
            v = _ref[k];
            if (0 === k.toLowerCase().indexOf("x-limit")) {
              out[k] = v;
            }
          }
          return fn(null, out);
        } else {
          return fn({
            errCode: res.statusCode
          });
        }
      });
    };

    /*
      Get request with predefined options
    */


    Pocket.prototype._get = function(opts, fn) {
      var _this = this;
      opts.format = "json";
      opts.tags = opts.tags === false ? 0 : 1;
      opts.myAppOnly = opts.myAppOnly === true ? 1 : 0;
      return request("" + this._domain + "/get?" + (this._joinParams(opts)), function(err, res, body) {
        return _this._getBody(err, res, body, fn);
      });
    };

    /*
      Get user urls
    
      @param {Object} opts Options
                      opts.myAppOnly - set to yes for getting urls, saved only from current app
                      opts.state     - get urls with state: "read", "unread", undefined (default)
                      opts.since     - select url updted/added after this time (unix format)
                      opts.count     - count for urls, default - infinity, not recommended!
                      opts.page      - page number, for paged output
                      opts.tags      - include tags, default is yes
      @param {Function} fn Callback function
    */


    Pocket.prototype.get = function(opts, fn) {
      return this._get(opts, fn);
    };

    /*
      Normalize object for pushing to api: if object type is Array,
      it will be normalized to dictionary
    
      @param {Object|Array} obj Object to normalize
      @return {Object} obj Normalized object
    */


    Pocket.prototype._normalizeObject = function(obj) {
      var i, o, v, _i, _len;
      if (obj instanceof Array) {
        o = {};
        for (i = _i = 0, _len = obj.length; _i < _len; i = ++_i) {
          v = obj[i];
          o[i] = v;
        }
        return o;
      } else {
        return obj;
      }
    };

    /*
      Internal function for sending data, utilised by `new`, `read`, `updateTitle`, `updateTags`
    
      @param {Object} obj Object to send, @see http://getpocket.com/api/docs/#send
      @param {Function} fn Callback function
    */


    Pocket.prototype._sendData = function(obj, fn) {
      var body, headers, k, url, v,
        _this = this;
      url = "" + this._domain + "/send?" + (this._joinParams());
      headers = {
        "content-type": "application/x-www-form-urlencoded"
      };
      body = [];
      for (k in obj) {
        v = obj[k];
        if (k === "new" || k === "read" || k === "update_title" || k === "update_tags") {
          body.push("" + k + "=" + (JSON.stringify(this._normalizeObject(obj[k]))));
        }
      }
      return request.post({
        url: url,
        headers: headers,
        body: body.join("&")
      }, function(err, res) {
        return _this._checkErrors(err, res, fn);
      });
    };

    /*
      Send new data objects in Array
    
      @param {Array} data Url objects
                     data[].url     - url
                     data[].title   - title for url
                     data[].ref_id  - id, only for twitter clients
      @param {Function} fn Callback function
    */


    Pocket.prototype["new"] = function(data, fn) {
      return this._sendData({
        "new": data
      }, fn);
    };

    /*
      Mark urls in array as read
    
      @param {Array} data Url objects
                     data[].url     - url
      @param {Function} fn Callback function
    */


    Pocket.prototype.read = function(data, fn) {
      return this._sendData({
        read: data
      }, fn);
    };

    /*
      Update Title for array of urls
    
      @param {Array} data Urls with new titles
                     data[].url     - url
                     data[].title   - new title for url
      @param {Function} fn Callback function
    */


    Pocket.prototype.updateTitle = function(data, fn) {
      return this._sendData({
        update_title: data
      }, fn);
    };

    /*
      Update url tags
    
      @param {Array} data Urls with new titles
                     data[].url     - url
                     data[].tags    - new tags - string, comma separated
      @param {Function} fn Callback function
    */


    Pocket.prototype.updateTags = function(data, fn) {
      return this._sendData({
        update_tags: data
      }, fn);
    };

    return Pocket;

  })();

  exports.Pocket = Pocket;

  exports.version = "0.2.4";

}).call(this);
