import 'dart:html';
import 'dart:math' as math;

class Multiplier {

  static final int MAX_FACTOR = 5;

  DivElement barElement;
  DivElement progressElement;
  DivElement textElement;

  int _factor = 1;

  int get factor => _factor;
  set factor(int factor) {
    _factor = factor;
    textElement.text = 'x${factor}';
  }

  int _progress = 0;

  void reset() {
    progress = 0;
    factor = 1;
  }

  set progress(int progress) {
    _progress = progress;
    progressElement.style.width = '${_progress.toInt()}%';
  }
  int get progress => _progress;

  Multiplier(DivElement container) {
    DivElement parent = new DivElement();
    parent.classes.add("multiplier");


    textElement = new DivElement();
    textElement.classes.add("text");

    barElement = new DivElement();
    barElement.classes.add("bar");

    progressElement = new DivElement();
    progressElement.classes.add("progress");

    barElement.children.add(progressElement);
    parent.children.add(textElement);
    parent.children.add(barElement);

    container.children.add(parent);
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