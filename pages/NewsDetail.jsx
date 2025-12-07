import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
const supabase = { storage: { from: () => ({ upload: async () => ({}) }) } };
import toast from 'react-hot-toast';
import ReactGA from 'react-ga4';

const NewsDetail = () => {
  const { slug, schoolId } = useParams();
  const [news, setNews] = useState(null);
  const [relatedNews, setRelatedNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async (retries = 3) => {
      setLoading(true);
      setError(null);
      for (let i = 0; i < retries; i++) {
        try {
          const { data: newsData, error: newsError } = await supabase
            .from('newsPosts')
            .select('*')
            .eq('schoolId', schoolId)
            .eq('slug', slug)
            .single();
          if (newsError || !newsData) throw new Error('News article not found');
          setNews(newsData);

          const { data: relatedData, error: relatedError } = await supabase
            .from('newsPosts')
            .select('*')
            .eq('schoolId', schoolId)
            .eq('published', true)
            .eq('category', newsData.category || '')
            .neq('slug', slug)
            .order('createdAt', { ascending: false })
            .limit(3);
          if (relatedError) throw relatedError;
          setRelatedNews(relatedData || []);
          setLoading(false);
          toast.success('News article loaded successfully!');
          return;
        } catch (err) {
          console.error(`Attempt ${i + 1} failed:`, err);
          if (i === retries - 1) {
            setError(err.message || 'Failed to load news detail');
            setNews(null);
            setRelatedNews([]);
            setLoading(false);
            toast.error('Failed to load news detail');
          } else {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
    };
    if (schoolId && slug) fetchNews();
  }, [schoolId, slug]);

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error || !news) {
    return (
      <div className="text-center py-10 text-red-500">
        {error || 'News article not found.'}
        <br />
        <Link
          to="/news"
          className="text-blue-600 underline mt-4 inline-block"
          aria-label="Back to news list"
        >
          Back to News
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-3xl mx-auto px-4 py-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Helmet>
        <title>{news.title} | {news.name || 'School'}</title>
        <meta name="description" content={news.content ? news.content.slice(0, 150) + '...' : news.title} />
      </Helmet>
      <motion.h1
        className="text-3xl font-bold mb-4"
        style={{ fontFamily: 'var(--font-family)' }}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        role="heading"
        aria-level="1"
      >
        {news.title}
      </motion.h1>
      <motion.p
        className="text-sm text-gray-500 mb-6"
        style={{ fontFamily: 'var(--font-family)' }}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {new Date(news.createdAt).toLocaleDateString()} | {news.category || 'General'}
      </motion.p>
      {news.imageUrl && (
        <motion.img
          src={news.imageUrl}
          alt={news.title}
          className="w-full h-64 object-cover rounded mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        />
      )}
      <motion.div
        className="prose prose-lg max-w-none"
        style={{ fontFamily: 'var(--font-family)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        dangerouslySetInnerHTML={{ __html: news.content || '<p>No content available.</p>' }}
      />
      <motion.div
        className="mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <p className="font-semibold" style={{ fontFamily: 'var(--font-family)' }}>Share this article:</p>
        <div className="flex gap-4">
          <a
            href={`https://twitter.com/intent/tweet?text=${news.title}&url=${window.location.href}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
            aria-label="Share on Twitter"
            onClick={() => ReactGA.event({ category: 'Share', action: 'Click', label: 'Twitter Share' })}
          >
            Twitter
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${window.location.href}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
            aria-label="Share on Facebook"
            onClick={() => ReactGA.event({ category: 'Share', action: 'Click', label: 'Facebook Share' })}
          >
            Facebook
          </a>
        </div>
      </motion.div>
      {relatedNews.length > 0 && (
        <motion.div
          className="mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <h2 className="text-2xl font-semibold mb-4" style={{ fontFamily: 'var(--font-family)' }} role="heading" aria-level="2">
            Related News
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {relatedNews.map(item => (
              <Link
                to={`/news/${item.slug}`}
                key={item.id}
                className="border p-4 rounded shadow-sm hover:shadow-lg transition"
                aria-label={`Read related news: ${item.title}`}
              >
                <h3 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-family)' }}>{item.title}</h3>
                <p className="text-sm text-gray-600" style={{ fontFamily: 'var(--font-family)' }}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        </motion.div>
      )}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <Link
          to="/news"
          className="inline-block mt-6 text-blue-600 hover:underline"
          aria-label="Back to news list"
        >
          ← Back to News
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default NewsDetail;
