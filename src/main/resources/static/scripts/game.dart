import 'dart:html';
import 'dart:async';
import 'dart:math' as math;

import 'multiplier.dart';
import 'health.dart';
import 'theme.dart';
import 'stats.dart';
import 'sound.dart';
import 'target.dart';

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
    window.localStorage['highscore'] = _highscore.toString();
  }

  final Stopwatch stopWatch = new Stopwatch();
  Timer timer;

  DivElement container;
  List<Target> targets = new List();
  Multiplier multiplier;
  Health health;

  DivElement overlay;
  DivElement timerElement;
  DivElement themeElement;
  DivElement startButton;
  DivElement soundButton;
  DivElement scoreElement;
  DivElement highScoreElement;
  int zoom = 1;

  Game() {
    container = querySelector('#container');
    Theme.init();
    if (Sound.init()) {
      container.classes.add('sound-enabled');
    }

    soundButton = addElement('sound');
    soundButton.classes.add(Sound.enabled ? 'on' : 'off');
    var soundListener = (event) {
      Sound.enabled = !Sound.enabled;
      soundButton.classes.remove(Sound.enabled ? 'off' : 'on');
      soundButton.classes.add(Sound.enabled ? 'on' : 'off');
    };
    soundButton.onMouseDown.listen(soundListener);
    soundButton.onTouchStart.listen(soundListener);

    startButton = addElement('start');
    startButton.text = 'Start';
    var startListener = (event) {
      start();
      event.preventDefault();
    };
    startButton.onMouseDown.listen(startListener);
    startButton.onTouchStart.listen(startListener);
    timerElement = addElement('timer');
    themeElement = addElement('theme');

    document.body.onMouseWheel.listen((WheelEvent e) {
      this.zoom += (e.deltaY > 0 ?  -.05 : .05);
      this.zoom = math.max(0.2, math.min(5, this.zoom.abs()));
      container.style.transform = "scale(${this.zoom})";
    });

    themeElement.onMouseDown.listen((event) => Theme.next());
    themeElement.onTouchStart.listen((event) => Theme.next());
    highScoreElement = addElement('highscore');
    scoreElement = addElement('score');
    overlay = addElement('overlay');

    multiplier = new Multiplier(container);
    health = new Health(container, () => this.stop());

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
    Stats.reset();
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
    Stats.show(startButton, score, stopWatch.elapsed);
    multiplier.reset();
  }

  int get progress => (timeLeft * 100 / ROUND_TIME).round();

  int get timeLeft {
    var timeLeft = (ROUND_TIME * 1000 - stopWatch.elapsedMilliseconds);
    return stopWatch.isRunning ? timeLeft : -1;
  }

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
      timerElement.text = (timeLeft / 1000).round().toString();
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