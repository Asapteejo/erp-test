import React, { useEffect, useState } from 'react';
import Chatbot from 'react-chatbot-kit';
import 'react-chatbot-kit/build/main.css';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import ReactGA from 'react-ga4';
import Fuse from 'fuse.js';

// --- Message Parser ---
const MessageParser = ({ children, actions, faqs }) => {
  const fuse = new Fuse(faqs, {
    keys: ['question'],
    threshold: 0.4,
    includeScore: true,
  });

  const parse = (message) => {
    const results = fuse.search(message);

    if (results.length > 0) {
      const bestMatch = results[0].item;
      actions.handleAnswer(bestMatch.question, bestMatch.answer);
    } else {
      actions.handleNoAnswer(faqs); // Pass faqs for suggestions
    }
  };

  return <div>{React.cloneElement(children, { parse })}</div>;
};

// --- Action Provider ---
const ActionProvider = ({ createChatBotMessage, setState, children, faqs, faqClicks, registerFaqClick }) => {
  const handleAnswer = (question, answer) => {
    const message = createChatBotMessage(
      `📌 **${question}**\n\n${answer}`
    );
    setState((prev) => ({ ...prev, messages: [...prev.messages, message] }));
  };

  const handleNoAnswer = () => {
    // Sort by popularity (clicks), fallback to random if no clicks
    const sortedFaqs = [...faqs].sort(
      (a, b) => (faqClicks[b.id] || 0) - (faqClicks[a.id] || 0) || 0.5 - Math.random()
    );

    const suggestions = sortedFaqs.slice(0, 3); // Top 3 popular FAQs

    const message = createChatBotMessage(
      "🤔 I couldn’t find an exact match. But here are some FAQs you can try:",
      {
        widget: 'faqSuggestions',
        payload: suggestions,
      }
    );

    setState((prev) => ({ ...prev, messages: [...prev.messages, message] }));
  };

  const handleChipClick = async (faq) => {
    await registerFaqClick(faq.id); // Persist click to DB
    const message = createChatBotMessage(
      `📌 **${faq.question}**\n\n${faq.answer}`
    );
    setState((prev) => ({ ...prev, messages: [...prev.messages, message] }));
  };

  return (
    <div>
      {React.cloneElement(children, {
        actions: { handleAnswer, handleNoAnswer, handleChipClick },
      })}
    </div>
  );
};

// --- Bot Config ---
const config = {
  initialMessages: [
    {
      id: 1,
      message: '👋 Hello! Ask me anything about Azmah College.',
      user: 'bot',
    },
  ],
  botName: 'AzmahBot',
  customStyles: {
    botMessageBox: { backgroundColor: '#1e3a8a' },
    chatButton: { backgroundColor: '#1e3a8a' },
  },
  widgets: [
    {
      widgetName: 'faqSuggestions',
      widgetFunc: (props) => {
        const faqs = props.payload || [];
        return (
          <div className="flex flex-wrap gap-2 mt-2">
            {faqs.map((faq) => (
              <button
                key={faq.id}
                className="px-3 py-1 bg-blue-100 text-blue-900 rounded-full hover:bg-blue-200"
                onClick={() => props.actions.handleChipClick(faq)}
              >
                {faq.question}
              </button>
            ))}
          </div>
        );
      },
    },
  ],
};

// --- Utility Function ---
const registerFaqClick = async (faqId) => {
  try {
    await axios.post(`/api/faqs/${faqId}/click`);
  } catch (error) {
    console.error('Failed to register click:', error);
  }
};

// --- Main Component ---
const FAQChatbot = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [faqClicks, setFaqClicks] = useState({}); // Track FAQ clicks

  useEffect(() => {
    setLoading(true);
    axios
      .get('/api/faqs')
      .then((res) => {
        console.log('FAQs response:', res.data);
        setFaqs(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching FAQs:', err);
        setError('⚠️ Failed to load FAQs. Please try again later.');
        setLoading(false);
      });
  }, []);

  // Increment FAQ clicks
  const handleRegisterFaqClick = (faqId) => {
    setFaqClicks((prev) => ({
      ...prev,
      [faqId]: (prev[faqId] || 0) + 1,
    }));
    registerFaqClick(faqId); // Persist to backend
  };

  if (loading) return <div className="text-center py-8">Loading FAQs...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
  if (!loading && faqs.length === 0)
    return <div className="text-center py-8">No FAQs available yet. Check back soon!</div>;

  return (
    <motion.div
      className="max-w-6xl mx-auto px-4 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Helmet>
        <title>FAQ Chatbot | Azmah College</title>
        <meta
          name="description"
          content="Chat with AzmahBot to get answers to common questions about Azmah College of Health Science."
        />
      </Helmet>

      <h1 className="text-4xl font-bold text-center mb-8 text-blue-900">
        Ask AzmahBot
      </h1>

      <div className="bg-white p-6 rounded-lg shadow max-w-md mx-auto">
        <Chatbot
          config={config}
          messageParser={(props) => <MessageParser {...props} faqs={faqs} />}
          actionProvider={(props) => (
            <ActionProvider
              {...props}
              faqs={faqs}
              faqClicks={faqClicks}
              registerFaqClick={handleRegisterFaqClick} // Use custom handler
            />
          )}
          headerText="AzmahBot"
          placeholderText="Type your question..."
        />
      </div>
    </motion.div>
  );
};

export default FAQChatbot;