const fs = require("fs");
const PdfReader = require('pdfreader').PdfReader;

const dateRegex = /^\d{2}.\d{2}.\d{2}/
const pdfFile = "tg-january.pdf"//"tg-february.pdf" tg-january.pdf
const program = []
const itemRegex = [
  /^\d{2}:\d{2}$/,
  /•/,
  /^\(\d{1} min./,
  /^Awit \d{1,3} -/
]

let meeting = {}
const MEETING_CBS = "Pag-aaral ng Kongregasyon sa Bibliya"
const MEETING_MIDWEEK = "Buhay at Ministeryong Kristiyano"

fs.readFile(pdfFile, (err, pdfBuffer) => {
  let day = {}
  let item = {}
  let program = []

  new PdfReader().parseBuffer(pdfBuffer, function(err, cell){
    if (err) {
      callback(err);
    } else if (!cell) {
      if(meeting.rows)
        program.push(meeting)
      console.log(program)
    } else if (cell.text) {

      let text = cell.text.trim()

      if (dateRegex.test(text)) {
        if(meeting.rows)
          program.push(meeting)
        meeting = createMetting(text)
      } else if (meeting.rows &&  !itemRegex.some(rx => rx.test(text))) {
        meeting.rows.push(text)
      }
    }
   })
});

function createCalendarExport(program) {
  const events = []

  program.forEach(meeting => {
    let date = meeting.date
    events.push({
      title: 'Lunch',
      start: [
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
        date.getHours(),
        date.getMinutes()
      ],
      duration: { minutes: 45 }
    })
  })

  /*
  {
    title: 'Lunch',
    start: [2020, 1, 15, 12, 15],
    duration: { minutes: 45 }
  }*/
}

function createMetting(dateText) {

  const SUNDAY = 0
  const MONDAY = 1
  const TUESDAY = 2
  const WEDNESDAY = 3
  const THURSDAY = 4
  const FRIDAY = 5
  const SATURDAY = 6

  const date = createDate(dateText)
  if(!date)
    return false

  const dateTitle = dateText.split('|')
  let title = ""
  if(dateTitle[1])
    title = dateTitle[1].trim()

  let meetingType = ""
  if(date.getDay() === TUESDAY)
    meetingType = MEETING_MIDWEEK
  else if (date.getDay() === SUNDAY)
    meetingType = MEETING_CBS
  else
    meetingType = undefined

  return {
    date: date,
    type: meetingType,
    title: title,
    rows: []
  }
}

function createDate(dateText) {
  const dateRegexFilter = /^\d{2}.\d{2}.\d{2}/
  const dateMatch = dateText.match(dateRegexFilter)
  if(!dateMatch)
    return false
  const dateSplit = dateMatch[0].split('.');
  const date = new Date();
  date.setDate(dateSplit[0])
  date.setMonth(dateSplit[1] - 1)
  date.setFullYear("20" + dateSplit[2])

  return date
}

function callback(err) {
  console.log(err);
}
