import 'dart:html';
import 'dart:html_common';
import 'game.dart';

main() {
  var empty = (e) {
    e.preventDefault();
    return false;
  };

  document.onContextMenu.listen(empty);
  document.onMouseDown.listen(empty);
  document.onTouchStart.listen(empty);

  var game = new Game();
  if (Device.isWebKit) {
    var container = querySelector("#container");
    document.onMouseMove.listen((MouseEvent e) {
      var y = ((e.client.x / document.body.clientWidth) * 30) - 15;
      var x = ((e.client.y / document.body.clientHeight) * 30) - 15;
      container.style.transform = "scale(${game.zoom})rotateX(${x}deg) rotateY(${-y}deg)";
    });
  }

}

