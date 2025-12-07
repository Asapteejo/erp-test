//src/pages/SearchPage.jsx
import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { debounce } from '../utils/debounce';

const SearchPage = () => {
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const urlQuery = new URLSearchParams(location.search).get('q') || '';

  const fetchSuggestions = debounce(async q => {
    if (q) {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/search?q=${encodeURIComponent(q)}`);
        setSuggestions(res.data.slice(0, 5));
      } catch (err) {
        console.error('Suggestions error:', err);
      }
    } else {
      setSuggestions([]);
    }
  }, 300);

  useEffect(() => {
    if (urlQuery) {
      setQuery(urlQuery);
      setLoading(true);
      axios
        .get(`${import.meta.env.VITE_API_URL}/api/search?q=${encodeURIComponent(urlQuery)}`)
        .then(res => {
          setResults(Array.isArray(res.data) ? res.data : []);
          setLoading(false);
          toast.success('Search completed!');
        })
        .catch(err => {
          console.error('Search error:', err);
          setError('Failed to load search results.');
          setLoading(false);
          toast.error('Search failed. Please try again.');
        });
    }
  }, [urlQuery]);

  const handleInputChange = e => {
    const value = e.target.value;
    setQuery(value);
    fetchSuggestions(value);
  };

  return (
    <motion.div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.5 }}
    >
      <Helmet>
        <title>Search Results | Azmah College</title>
        <meta name="description" content={`Search results for "${query}" at Azmah College.`} />
      </Helmet>
      <h1 className="text-4xl font-bold text-center mb-10 text-primary">Search Results for "{query}"</h1>
      <form className="relative mb-8">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search departments, news..."
          className="glass w-full pl-10 pr-4 py-3 rounded-full text-lg text-text focus:outline-none focus:ring-2 focus:ring-nav-hover"
          aria-label="Search the site"
        />
        <button
          type="submit"
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-nav-text"
          aria-label="Submit search"
        >
          <i className="fas fa-search"></i>
        </button>
        {suggestions.length > 0 && (
          <motion.div
            className="absolute top-full left-0 w-full bg-nav-bg rounded-lg shadow-lg mt-2 z-10"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {suggestions.map(item => (
              <Link
                key={item.id}
                to={item.url}
                className="block px-4 py-2 text-sm text-nav-text hover:bg-nav-hover hover:text-white"
              >
                {item.title}
              </Link>
            ))}
          </motion.div>
        )}
      </form>
      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : error ? (
        <p className="text-center text-red-600">{error}</p>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 gap-8">
          {results.map(item => (
            <motion.div
              key={item.id}
              className="glass rounded-lg p-6"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to={item.url} className="text-xl font-semibold text-primary hover:underline">
                {item.title}
              </Link>
              <p className="text-gray-600 mt-2">{item.description?.slice(0, 150)}...</p>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-600">No results found for "{query}".</p>
      )}
    </motion.div>
  );
};

export default SearchPage;