import 'dart:html';
import 'dart:web_audio';
import 'theme.dart';

class Sound {

  static bool _initialized = false;
  static bool _enabled = true;

  static bool get enabled => _enabled;

  static AudioContext _audioContext;

  static Map<String, AudioBuffer> _buffers = new Map();

  static set enabled(bool enabled) {
    _enabled = enabled;
    window.localStorage['sound'] = enabled.toString();
  }

  static init() {
    if (!_initialized) {
      _initialized = true;
      try {
        _audioContext = new AudioContext();
        if (window.localStorage.containsKey('sound')) {
          _enabled = window.localStorage['sound'] == 'true';
        }
      } catch (e) {
        print(e);
        return false;
      }
    }
    return true;
  }

  static _playBuffer(AudioBuffer buffer) {
    if (buffer == null) return;
    AudioBufferSourceNode sourceNode = _audioContext.createBufferSource();
    sourceNode.buffer = buffer;
    sourceNode.connectNode(_audioContext.destination);
    sourceNode.start(0);
  }

  static void play(String name) {
    if (!enabled) {
      return;
    }
    var key  = '${Theme.current}.${name}';
    if (_buffers.containsKey(key)) {
      _playBuffer(_buffers[key]);
    } else {
      HttpRequest request = new HttpRequest();
      request.open('GET', 'sounds/${Theme.current}/${name}.ogg');
      request.responseType = "arraybuffer";
      request.onLoadEnd.listen((e) {
        try {
          _audioContext.decodeAudioData(request.response)
              .then((buffer) {
            _playBuffer(buffer);
            _buffers[key] = buffer;
          }, onError: (error) {
            _buffers[key] = null;
            print(error);
          });
        } catch (e) {
          _buffers[key] = null;
          print(e);
        }
      });
      request.send();
    }
  }
}