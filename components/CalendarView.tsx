import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface Event {
  title: string;
  start: Date;
  end: Date;
}

// Enhance Calendar with drag-and-drop support
const DnDCalendar = withDragAndDrop<Event>(Calendar);

const CalendarView = ({ events }: { events: Event[] }) => {
  return (
    <div className="h-[400px]">
      <DnDCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        draggableAccessor={() => true}
      />
    </div>
  );
};

export default CalendarView;