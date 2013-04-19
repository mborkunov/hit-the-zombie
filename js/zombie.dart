import 'dart:async';
import 'dart:html';
import 'dart:web_audio';
import 'dart:math' as math;

main() {
  var empty = (e) {
    e.preventDefault();
    return false;
  };
  document.onContextMenu.listen(empty);
  document.onMouseDown.listen(empty);
  document.onTouchStart.listen(empty);
  new Game();
}

class Game {
  static const int ROUND_TIME = 60;

  int _score = 0;
  int get score => _score;
  set score(int score) {
    scoreElement.text = score.toString();
    scoreElement.classes.clear();
    scoreElement.classes.add('score');
    scoreElement.classes.add(score >= _score ? 'grow' : 'shrink');
    _score = score;
  }

  int _highscore = 0;
  int get highscore => _highscore;
  set highscore(int highscore) {
    _highscore = highscore;
    highScoreElement.text = 'Highscore: ${_highscore}';
    window.localStorage['highscore'] = _highscore;
  }

  final Stopwatch stopWatch = new Stopwatch();
  Timer timer;

  DivElement container;
  List<Target> targets = new List();
  Multiplier multiplier;

  DivElement overlay;
  DivElement timerElement;
  DivElement themeElement;
  DivElement startButton;
  DivElement soundButton;
  DivElement scoreElement;
  DivElement highScoreElement;

  Game() {
    container = query('#container');
    Theme.init();
    if (Sound.init()) {
      container.classes.add('sound-enabled');
    }

    soundButton = addElement('sound');
    soundButton.classes.add(Sound.enabled ? 'on' : 'off');
    soundButton.onClick.listen((event) {
      Sound.enabled = !Sound.enabled;
      soundButton.classes.remove(Sound.enabled ? 'off' : 'on');
      soundButton.classes.add(Sound.enabled ? 'on' : 'off');
    });

    startButton = addElement('start');
    startButton.text = 'Start';
    startButton.onClick.listen((event) => start());
    timerElement = addElement('timer');
    themeElement = addElement('theme');
    themeElement.onClick.listen((event) => Theme.next());
    highScoreElement = addElement('highscore');
    scoreElement = addElement('score');
    overlay = addElement('overlay');

    multiplier = new Multiplier();

    if (window.localStorage.containsKey('highscore')) {
      highscore = int.parse(window.localStorage['highscore']);
    }

    for (int i = 0; i < 15; i++) {
      targets.add(new Target(this));
    }
    draw();
  }

  void start() {
    Sound.play('start');
    startButton.style.display = 'none';
    overlay.style.display = 'none';

    stopWatch.reset();
    stopWatch.start();
    score = 0;
    multiplier.progress = 0;
    targets.forEach((Target target) => target.listen());

    if (timer == null) {
      timer = new Timer.periodic(const Duration(milliseconds: 15), update);
    }

    new Timer(const Duration(seconds: ROUND_TIME), stop);
  }

  void stop() {
    stopWatch.stop();
    targets.forEach((Target target) => target.stopListening());
    startButton.style.display = 'block';
    overlay.style.display = 'block';
    timerElement.text = '';
    if (score > highscore) {
      highscore = score;
    }
    multiplier.progress = 0;
    multiplier.factor = 1;
  }

  int get progress => (timeLeft * 100 / ROUND_TIME).round();

  int get timeLeft => stopWatch.isRunning ? (ROUND_TIME * 1000 - stopWatch.elapsedMilliseconds) : -1;

  void update(Timer timer) {
    if (stopWatch.isRunning) {
      multiplier.update();
      double boost  = progress / 100;
      getSleepTargets().forEach((Target target) {
        var random = new math.Random();
        if (target.front && random.nextDouble() + boost < 0.005 + boost) {
          target.flipRandomly(true);
        }
      });
      timerElement.text = (timeLeft / 1000).round();
    } else {
      List<Target> active = getActiveTargets();
      if (active.isEmpty) {
        timer.cancel();
        this.timer = null;
      } else {
        active.where((Target target) => !target.rotating).toList()
              .forEach((Target target) => target.rotate(1));
      }
    }

    targets.forEach((Target target) => target.update());
  }

  Element addElement(final String className) {
    DivElement element = new DivElement();
    element.classes.add(className);
    container.children.add(element);
    return element;
  }

  void draw() {
    for (int i = 0; i < targets.length; i++) {
      final Target target = targets[i];
      int row = (i / 5).floor() + 1;
      int col = i % 5;
      DivElement targetElement = target.draw();
      var top = 120 * row + 25;
      var left = 120 * col + 100;
      targetElement.style.top = '${top}px';
      targetElement.style.left = '${left}px';
      container.children.add(targetElement);
    }
  }

  List<Target> getSleepTargets() {
    return targets.where((Target target) => !target.rotating).toList();
  }

  List<Target> getActiveTargets() {
    return targets.where((Target target) =>
      target.rotating || !target.front
    ).toList();
  }
}

class Target {

  static const int TARGET_DELAY = 2000;
  static const int ANGLE_DELTA = 15;

  Game game;
  DivElement element;
  DivElement remainingElement;
  StreamSubscription listener;

  bool rotating = false;
  bool front = true;

  int angle = 0;
  int turns = 0;
  int currentTurn = 0;
  int started = 0;
  Stopwatch stopwatch = new Stopwatch();

  Target(Game game) {
    this.game = game;
  }

  DivElement draw() {
    element = new DivElement();
    element.classes.add('target');
    element.classes.add('front');

    remainingElement = new DivElement();
    remainingElement.classes.add('remaining');

    element.children.add(remainingElement);

    return element;
  }

  void update() {
    if (rotating) {
      continueRotation();
    } else {
      if (!front) {
        if (!stopwatch.isRunning) {
          stopwatch.reset();
          stopwatch.start();
          remainingElement.style.display = 'block';
        }
        if (stopwatch.elapsedMilliseconds > TARGET_DELAY) {
          hideRemaining();
          stopwatch.stop();
          rotate(1);
        } else {
          String scaleX = (1 - stopwatch.elapsedMilliseconds / TARGET_DELAY).toStringAsFixed(2);
          remainingElement.style.transform  = 'scale(${scaleX}, 1)';
        }
      }
    }
  }

  void hideRemaining() {
    remainingElement.style.transform = '';
    remainingElement.style.display = 'none';
  }

  void listen() {
    listener = element.onMouseDown.listen((e) {
      int score = game.score;
      String className = null;
      if (front) {
        className = 'shrink';
        score = math.max(0, game.score - 5);
        Sound.play('fail');
        game.multiplier.miss();
      } else {
        className = 'grow';
        rotate(1);
        score = game.score + 10 * game.multiplier.factor;
        element.classes.add('target-hit');
        game.multiplier.hit();
        Sound.play('hit');
        hideRemaining();
      }

      if (score != game.score) {
        game.score = score;
      }
      e.preventDefault();
      return false;
    });
  }

  void stopListening() => listener.cancel();

  void rotate(int _turns) {
    rotating = true;
    turns = _turns;
    currentTurn = 0;
  }

  void continueRotation() {
    if (angle >= 360) {
      angle %= 360;
    }

    if (angle % 180 === 0) {
      currentTurn++;
      if (currentTurn > turns) {
        rotating = false;
      }
    }

    if (currentTurn <= turns) {
      if (angle < 90 && angle + ANGLE_DELTA >= 90) {
        element.classes.remove('front');
        element.classes.remove('target-hit');
        element.classes.add('target');
        element.classes.add('target-${(new math.Random().nextDouble() * 3).ceil()}');
        this.front = false;
      }
      if (angle < 270 && angle + ANGLE_DELTA >= 270) {
        element.classes.clear();
        element.classes.add('front');
        element.classes.add('target');
        this.front = true;
      }
      angle += ANGLE_DELTA;
      element.style.transform = 'scale(${math.cos(angle * math.PI / 180)}, 1)';
    }
  }

  void flipRandomly(bool even) {
    int flips = (new math.Random().nextDouble() * 5).round();
    this.rotate(flips % 2 === (even ? 1 : 0) ? flips : flips + 1);
  }
}

class Multiplier {

  static final int MAX_FACTOR = 5;

  DivElement barElement;
  DivElement textElement;

  int _factor = 1;

  int get factor => _factor;
  set factor(int factor) {
    _factor = factor;
    textElement.text = 'x${factor}';
  }

  int _progress = 0;

  set progress(int progress) {
    _progress = progress;
    barElement.style.width = '${_progress}%';
  }
  int get progress => _progress;

  Multiplier() {
    DivElement parent = query('.multiplier');
    textElement = parent.query('.text');
    barElement = parent.query('.bar .progress');
  }

  void miss() {
    factor = 1;
    progress = 0;
  }

  void hit() {
    int localProgress = 0;
    if (factor < MAX_FACTOR) {
      localProgress = progress + 10;
      if (localProgress >= 100) {
        localProgress %= 100;
        factor += 1;
        if (factor >= MAX_FACTOR) {
          factor = MAX_FACTOR;
          localProgress = 100;
        }
      }
    } else {
      localProgress = math.min(progress + 10, 100);
    }
    progress = localProgress;
  }

  void update() {
    if (progress <= 0) {
      if (factor > 1) {
        factor -= 1;
        progress = 100;
      } else {
        progress = 0;
        factor = 1;
      }
    } else if (progress > 0) {
      progress -= 0.1;
    }
  }
}

class Theme {
  static final BodyElement body = query('body');
  static final List<String> LIST = ['zombie', 'cat'];
  static final String KEY = 'theme';
  static String current = LIST[0];
  static init() {
    if (window.localStorage.containsKey(KEY)) {
      current = window.localStorage[KEY];
    }
    body.classes.add(current);
  }

  static void next() {
    int index = LIST.indexOf(current);
    if (index >= 0) {
      String newTheme = LIST[(index + 1) % LIST.length];
      body.classes.remove(current);
      body.classes.add(newTheme);
      current = newTheme;
      window.localStorage[KEY] = current;
    }
  }
}

class Sound {

  static bool _initialized = false;
  static bool _enabled = true;

  static bool get enabled => _enabled;

  static AudioContext _ctx;

  static Map<String,AudioBuffer> _buffers = new Map();

  static set enabled(bool enabled) {
    _enabled = enabled;
    window.localStorage['sound'] = enabled;
  }

  static init() {
    if (!_initialized) {
      _initialized = true;
      try {
        _ctx = new AudioContext();
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
    AudioBufferSourceNode sourceNode = _ctx.createBufferSource();
    sourceNode.connect(_ctx.destination, 0, 0);
    sourceNode.buffer = buffer;
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
          _ctx.decodeAudioData(request.response, (buffer) {
            _playBuffer(buffer);
            _buffers[key] = buffer;
          }, (error) {
            _buffers[key] = null;
            print('Error decoding ogg file');
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