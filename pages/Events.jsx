import { useEffect, useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import axios from 'axios';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { motion } from 'framer-motion';
import ReactGA from 'react-ga4';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const localizer = momentLocalizer(moment);

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('calendar');

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/news?category=events`)
      .then(res => {
        const eventData = Array.isArray(res.data.items)
          ? res.data.items.map(event => ({
              title: event.title,
              start: new Date(event.createdAt),
              end: new Date(event.createdAt),
              allDay: true,
            }))
          : [];
        setEvents(eventData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching events:', err);
        setError('Failed to load events');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error) return <div className="text-center py-8 text-red-600">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-8 text-primary">Upcoming Events</h1>
      <div className="mb-4 flex justify-center gap-4">
        <button
          onClick={() => {
            setView('calendar');
            ReactGA.event({ category: 'Events', action: 'View', label: 'Calendar' });
          }}
          className={`px-4 py-2 rounded ${view === 'calendar' ? 'bg-primary text-white' : 'bg-gray-200'}`}
        >
          Calendar
        </button>
        <button
          onClick={() => {
            setView('cards');
            ReactGA.event({ category: 'Events', action: 'View', label: 'Cards' });
          }}
          className={`px-4 py-2 rounded ${view === 'cards' ? 'bg-primary text-white' : 'bg-gray-200'}`}
        >
          Cards
        </button>
      </div>
      {events.length === 0 ? (
        <p className="text-center text-gray-600">No events available.</p>
      ) : view === 'calendar' ? (
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 500 }}
          className="bg-white rounded-lg shadow"
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {events.map(event => (
            <motion.div
              key={event.title}
              className="glass p-6 rounded-lg"
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-xl font-semibold">{event.title}</h3>
              <p>{moment(event.start).format('LL')}</p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Events;