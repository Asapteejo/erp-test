import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
const supabase = { storage: { from: () => ({ upload: async () => ({}) }) } };
import toast from 'react-hot-toast';

const NewsList = () => {
  const { schoolId } = useParams();
  const [newsItems, setNewsItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async (retries = 3) => {
      setLoading(true);
      for (let i = 0; i < retries; i++) {
        try {
          const query = supabase
            .from('newsPosts')
            .select('*', { count: 'exact' })
            .eq('schoolId', schoolId)
            .eq('published', true)
            .range((currentPage - 1) * 6, currentPage * 6 - 1)
            .order('createdAt', { ascending: false });
          if (category !== 'all') query.eq('category', category);
          const { data, error, count } = await query;
          if (error) throw error;
          setNewsItems(data || []);
          setTotalPages(Math.ceil(count / 6) || 1);
          setLoading(false);
          toast.success('News loaded successfully!');
          return;
        } catch (error) {
          console.error(`Attempt ${i + 1} failed:`, error);
          if (i === retries - 1) {
            setNewsItems([]);
            setTotalPages(1);
            setLoading(false);
            toast.error('Failed to load news');
          } else {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
    };
    if (schoolId) fetchNews();
  }, [schoolId, category, currentPage]);

  const handleCategoryChange = newCategory => {
    setCategory(newCategory);
    setCurrentPage(1);
  };

  if (loading) return <div className="text-center py-8">Loading news...</div>;

  return (
    <motion.div
      className="max-w-5xl mx-auto px-4 py-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl font-bold mb-6 text-center" style={{ fontFamily: 'var(--font-family)' }} role="heading" aria-level="1">
        Latest News
      </h1>
      <div className="flex justify-center gap-4 mb-6">
        {['all', 'news', 'events', 'deadlines'].map(cat => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`px-4 py-2 rounded ${category === cat ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            aria-label={`Filter news by ${cat}`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>
      <div className="space-y-6">
        {newsItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No news articles available.</div>
        ) : (
          newsItems.map(news => (
            <motion.div
              key={news.id}
              className="bg-white p-5 rounded shadow hover:shadow-lg transition"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {news.imageUrl && (
                <img src={news.imageUrl} alt={news.title} className="w-full h-48 object-cover rounded mb-4" />
              )}
              <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'var(--font-family)' }}>{news.title}</h2>
              <p className="text-gray-700 mb-2" style={{ fontFamily: 'var(--font-family)' }} dangerouslySetInnerHTML={{ __html: news.content.slice(0, 150) + '...' }} />
              <Link
                to={`/news/${news.slug}`}
                className="text-blue-600 hover:underline font-medium"
                aria-label={`Read more about ${news.title}`}
              >
                Read More →
              </Link>
              <p className="text-sm text-gray-500 mt-2" style={{ fontFamily: 'var(--font-family)' }}>
                {new Date(news.createdAt).toLocaleDateString()}
              </p>
            </motion.div>
          ))
        )}
      </div>
      <div className="flex justify-center gap-4 mt-6">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
          aria-label="Previous page"
        >
          Previous
        </button>
        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    </motion.div>
  );
};

export default NewsList;