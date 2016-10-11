var __createEvent = document.createEvent
document.createEvent = function (type) {
  return __createEvent(type !== 'MouseEvent' ? type : 'Event')
}
