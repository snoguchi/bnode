(function() {
  var repo = 'https://rawgit.com/joyent/node/master/';

  function load(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  }

  function setupBindings() {
    var bindings = {}

    // contextify
    bindings.contextify = {};
    function ContextifyScript(code, options) {
      this._code = code;
    }
    ContextifyScript.prototype = {
      runInThisContext: function() {
        return eval(this._code);
      }
    };
    bindings.contextify.ContextifyScript = ContextifyScript;

    // natives
    bindings.natives = {};
    'assert events module path tracing util vm'.split(' ').forEach(function(id) {
      Object.defineProperty(bindings.natives, id, {
        get: function() { return load(repo + 'lib/' + id + '.js'); }
      });
    });
    bindings.natives.config = '\n{}';
    bindings.natives.buffer = 'exports.Buffer = function() { throw "not impl"; }';
    bindings.natives._console = console;
    bindings.natives.console = 'module.exports =   bindings.natives._console;';
    // bindings.natives._third_party_main = 'console.log("_third_party_main");';

    // v8
    bindings.v8 = {}
    bindings.v8.getHeapStatistics = function() { throw 'not impl'; }

    return bindings;
  }

  function setupProcess() {
    var process = {}, bindings = setupBindings(), pathname = document.location.pathname;

    // attributes
    process.argv = [ pathname.slice(pathname.lastIndexOf('/') + 1) ];

    process._eval = ''; // enter '--eval' mode to expose global variables

    process.env = {};

    process.execPath = pathname;

    process.moduleLoadList = [];

    // methods
    process.binding = function(name) {
      return bindings[name];
    }

    process.cwd = function() {
      return pathname.slice(0, pathname.lastIndexOf('/'));
    }

    process._setupAsyncListener = function(asyncFlags,
                                           runAsyncQueue,
                                           loadAsyncQueue,
                                           unloadAsyncQueue) {
      delete process._setupAsyncListener;
    }

    process._setupNextTick = function(tickInfo, tickCallback) {
      delete process._setupNextTick;
    }

    return process;
  }

  // main
  eval(load(repo + 'src/node.js'))(setupProcess());
})();
