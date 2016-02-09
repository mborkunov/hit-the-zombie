import 'dart:html';

class Theme {

  static final BodyElement body = querySelector('body');
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
