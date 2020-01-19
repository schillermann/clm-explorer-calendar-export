const fs = require("fs")
const { writeFileSync } = require('fs')
const PdfReader = require('pdfreader').PdfReader
const ics = require('ics')

const uppercaseRegex = /^[A-Z]{2}/
const dateRegex = /^\d{2}.\d{2}.\d{2}/
const itemRegex = [
  /^\d{2}:\d{2}$/,
  /•/,
  /^\(\d{1} min./,
  /^Awit \d{1,3} -/,
  /”$/,
  /^Pambungad na Komento$/,
  /^Student/,
  /^Conductor/
]

let meeting = {}
const MEETING_MIDWEEK = "Buhay at Ministeryong Kristiyano"

if(!process.argv[2])
  return "PDF file name param is missing"
const pdfFile = process.argv[2]
const calendarFile = pdfFile.substring(0, pdfFile.indexOf('.')) + ".ics"

fs.readFile(pdfFile, (err, pdfBuffer) => {
  let program = []

  new PdfReader().parseBuffer(pdfBuffer, function(err, cell){
    if (err) {
      callback(err);
    } else if (!cell) {
      if(meeting.rows)
        program.push(meeting)
      createCalendarExport(program)
    } else if (cell.text) {

      let text = cell.text.trim()

      if (dateRegex.test(text)) {
        if(meeting.rows)
          program.push(meeting)
        meeting = createMetting(text)
        console.log(meeting.date)
      } else if (meeting.rows &&  !itemRegex.some(rx => rx.test(text))) {
        meeting.rows.push(text)
      }
    }
   })
});

function shorten(str, maxLen = 26, separator = ' ') {
  if (str.length <= maxLen)
    return str
  return str.substr(0, maxLen) + "..."
}

function createCalendarEvents(program) {
  const events = []

  program.forEach(meeting => {
    let date = meeting.date
    let title = meeting.title || meeting.rows[0]
    let duration = {}

    if (meeting.rows.length > 3) {
      duration = {
        minutes: 105
      }
      date.setHours(19)
      date.setMinutes(0)
    } else {
      duration = {
        minutes: 30
      }
      date.setHours(20)
      date.setMinutes(5)
    }

    events.push({
      title: title,
      description: convertDescription(meeting.rows),
      start: [
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
        date.getHours(),
        date.getMinutes()
      ],
      duration: duration
    })
  })

  return events
}

function convertDescription(rows) {
  let result = ""
  let secondRow = 0
  for (let counter = 0; counter < rows.length; counter++) {
    let row = rows[counter]

    if(row.match(uppercaseRegex))
      result += "---"
    else {
      if((secondRow%2) == 0)
        result += "• "
      result += shorten(row)
      secondRow++
    }



    result += "\n"
  }
  return result
}

function createCalendarExport(program) {

  const events = createCalendarEvents(program)
  const { error, value } = ics.createEvents(events)

  if (error) {
    console.log(error)
    return
  }
  writeFileSync(`${__dirname}/${calendarFile}`, value)
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
  else
    meetingType = undefined

  return {
    date: date,
    duration: 0,
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
