(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['exports'], function (exports) {
      factory((root.ajax = exports));
    });
  } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
    // CommonJS
    factory(exports);
  } else {
    // Browser globals
    factory((root.ajax = {}));
  }
}(this, function (exports) {
  //use b in some fashion.

  // attach properties to the exports object to define
  // the exported module properties.
  exports.ajax = function ajax() {
    var tool = (function () {
      function createXHR() {
        if (window.XDomainRequest) return new XDomainRequest();     // code for IE7+, Firefox, Chrome, Opera, Safari
        if (window.XMLHttpRequest) return new XMLHttpRequest();     // code for IE7+, Firefox, Chrome, Opera, Safari
        if (window.ActiveXObject)  return new ActiveXObject("Microsoft.XMLHTTP");  //   code for IE6, IE5
        throw "Can't create xhr object";
      };
      return function (url, data, fn, errfn) { // https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS
        data || (data = {});
        errfn || (errfn = function (e) {log(e)})
        var xhr  = createXHR();
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-type', 'text/plain'); // for ie9 issue
        xhr.onreadystatechange = function() {
          if (xhr.status === 0) {
            xhr.abort();
            errfn && errfn('Server not found');
            return;
          }
          if (xhr.readyState == 4)   {
            if (xhr.status  == 200) {
              try {
                var resp = JSON.parse(xhr.responseText);
              }
              catch (e) {
                throw e;
              }
              fn && fn(resp);
              xhr=null;
            }
            else {
              errfn && errfn('Error status code: '+xhr.status);
            }
          }
        }
        xhr.send(JSON.stringify(data));
      };
    })();

    return tool.apply(this, arguments);
  };
}));



