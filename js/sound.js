goog.provide('energy.sound');

goog.require('energy.theme');
goog.require('goog.events');

energy.sound.initialized = false;
energy.sound.enabled = true;
energy.sound._buffers = {};


/**
 * @type {Object}
 */
energy.sound.ctx = null;

/**
 *
 * @param name {string}
 * @param format
 */
energy.sound.play = function(name, format) {
  if (!energy.sound.isEnabled()) return;
  format = format || 'wav';
  if (typeof (energy.sound._buffers[energy.theme.current]) == 'undefined') {
    energy.sound._buffers[energy.theme.current] = {};
  }
  if (typeof (energy.sound._buffers[energy.theme.current][name]) == 'undefined') {

    var xhr = new XMLHttpRequest();
    xhr.open('get', 'sounds/' + energy.theme.current + '/' + name + '.' + format, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function() {
      energy.sound.ctx['decodeAudioData'](xhr.response, function(buffer) {
        energy.sound._buffers[energy.theme.current][name] = buffer;
        energy.sound._playBuffer(buffer);
      }, function() {
        var console = window.console || {error: function(){}};
        console.error('Cannot load sound buffer', arguments);
        energy.sound._buffers[energy.theme.current][name] = null;
      });
    };
    xhr.send();
  } else {
    energy.sound._playBuffer(energy.sound._buffers[energy.theme.current][name]);
  }
};

energy.sound._playBuffer = function(buffer) {
  if (!buffer) return;
  var source = energy.sound.ctx['createBufferSource'](0);
  source.buffer = buffer;
  source['connect'](energy.sound.ctx['destination']);
  source['noteOn'](0);
};

energy.sound.isEnabled = function() {
  return energy.sound.enabled;
};

energy.sound.setEnabled = function(enabled) {
  var localStorage = window.localStorage || {setItem: function(){}, getItem: function(){}};
  localStorage.setItem('sound', enabled);
  energy.sound.enabled = enabled;
};


energy.sound.init = function() {
  try {
    energy.sound.ctx = new window['webkitAudioContext']();
    var localStorage = window.localStorage || {setItem: function(){}, getItem: function(){}};
    energy.sound.enabled = (!(localStorage.getItem('sound') != null && localStorage.getItem('sound') == 'false'));
  } catch (ignored) {}
};

if (!energy.sound.initialized) {
  energy.sound.initialized = true;
  energy.sound.init();
}
