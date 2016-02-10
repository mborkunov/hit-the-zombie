import 'dart:async';
import 'dart:html';

class Health {
  int _health;
  DivElement healthContainer;
  Function callback;
  int INITIAL_HEALTH = 10;

  Health(DivElement container, void callback()) {
    this.callback = callback;
    healthContainer = new DivElement();
    healthContainer.classes.add("health");
    _health = INITIAL_HEALTH;
    render();
    container.children.add(healthContainer);
  }

  void render() {
    healthContainer.children.clear();
    for (int i = 1; i < health; i++) {
      if (i % 2 != 0) {
        DivElement heart = new DivElement();
        heart.classes.add("heart");
        healthContainer.children.add(heart);
      } else if (i + 2 > health) {
        DivElement heart = new DivElement();
        heart.classes.add("heart");
        heart.classes.add("half");
        healthContainer.children.add(heart);
      }
    }
  }

  update() {
    if (healthContainer.children.isEmpty) return;
    if (health % 2 == 0) {
      healthContainer.children.last.remove();
    } else {
      healthContainer.children.last.classes.add("half");
    }
  }

  reset() {
    health = INITIAL_HEALTH;
    render();
  }

  bool attack() {
    final IMMUNE_CLASSNAME = "immune";
    if (healthContainer.classes.contains(IMMUNE_CLASSNAME)) {
      return false;
    }
    health = health - 1;
    healthContainer.classes.add(IMMUNE_CLASSNAME);
    new Timer(const Duration(milliseconds: 1200), () {
      healthContainer.classes.remove(IMMUNE_CLASSNAME);
    });
    if (health == 0) {
      this.callback();
      this.reset();
    }
    return true;
  }

  get health => _health;

  set health(int health) {
    _health = health;
    update();
  }

}