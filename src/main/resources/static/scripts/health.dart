import 'dart:html';

class Health {
  int value;
  DivElement healthContainer;
  Function callback;

  Health(DivElement container, void callback()) {
    this.callback = callback;
    healthContainer = new DivElement();
    healthContainer.classes.add("health");
    reset();
    container.children.add(healthContainer);
  }

  draw() {
    if (healthContainer.children.length > 0) {
      if (value % 2 == 0) {
        healthContainer.children.last.classes.add("half");
      } else {
        healthContainer.children.last.remove();
      }
    } else {
      for (int i = 1; i < value; i++) {
        if (i % 2 != 0) {
          DivElement heart = new DivElement();
          heart.classes.add("heart");
          healthContainer.children.add(heart);
        } else if (i + 2 > value) {
          DivElement heart = new DivElement();
          heart.classes.add("heart");
          heart.classes.add("half");
          healthContainer.children.add(heart);
        }
      }
    }
  }

  reset() {
    health = 10;
  }

  void attack() {
    health = value - 1;
    if (value == 0) {
      this.callback();
      this.reset();
    }
  }

  set health(int health) {
    value = health;
    draw();
  }

}