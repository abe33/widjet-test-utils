window.HTMLElement = window.Element
const createEvent = document.createEvent
document.createEvent = (type) => createEvent('Event')
