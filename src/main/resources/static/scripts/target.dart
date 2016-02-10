import 'dart:html';
import 'game.dart';
import 'dart:math' as math;
import 'dart:async';

import 'sound.dart';
import 'stats.dart';

class Target {

  static const int TARGET_DELAY = 2000;
  static const int ANGLE_DELTA = 15;

  Game game;
  DivElement element;
  DivElement remainingElement;
  StreamSubscription listener;
  StreamSubscription touchListener;

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
        if (!stopwatch.isRunning) {stopwatch.reset();
          stopwatch.start();
          remainingElement.style.display = 'block';
        } else if (stopwatch.elapsedMilliseconds > TARGET_DELAY) {
          remainingElement.style.display;
          hideRemaining();
          stopwatch.stop();
          if (game.health.attack()) {
            Sound.play('attack');
          }
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
    var handler = (e) {
      if (e is MouseEvent && (e as MouseEvent).button != 0) {
        e.preventDefault();
        return false;
      }
      int score = game.score;
      String className = null;
      if (front) {
        className = 'shrink';
        score = math.max(0, game.score - 5);
        Sound.play('fail');
        Stats.miss++;
        game.multiplier.miss();
      } else {
        className = 'grow';
        rotate(1);
        score = game.score + 10 * game.multiplier.factor;
        element.classes.add('target-hit');
        Stats.hit++;
        game.multiplier.hit();
        Sound.play('hit');
        hideRemaining();
      }
      stopwatch.stop();

      if (score != game.score) {
        game.score = score;
      }
      e.preventDefault();
      return false;
    };

    touchListener = element.onTouchStart.listen(handler);
    listener = element.onMouseDown.listen(handler);
  }


  void stopListening() {
    touchListener.cancel();
    listener.cancel();
  }

  void rotate(int _turns) {
    stopwatch.reset();
    rotating = true;
    turns = _turns;
    currentTurn = 0;
  }

  void continueRotation() {
    if (angle >= 360) {
      angle %= 360;
    }

    if (angle % 180 == 0) {
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
      element.style.transform = 'rotateY(${angle}deg)';
    }
  }

  void flipRandomly(bool even) {
    int flips = (new math.Random().nextDouble() * 3).round();
    this.rotate(flips % 2 == (even ? 1 : 0) ? flips : flips + 1);
  }
}