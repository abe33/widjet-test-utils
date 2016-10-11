var createEvent = document.createEvent
document.createEvent = function (type) { return createEvent('Event') }
