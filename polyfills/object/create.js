if (!Object.create) {
  Object.create = function (o, properties) {
    function F () {}

    F.prototype = o || {}

    return new F()
  }
}
