if (!Object.keys) {
  Object.keys = function (o) {
    var a = []
    for (var k in o) {
      a.push(k)
    }
    return a
  }
}
