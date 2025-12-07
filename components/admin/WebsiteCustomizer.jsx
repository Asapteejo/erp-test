import React, { useState, useEffect } from 'react';
import { useClerkAuth } from '../../hooks/useClerkAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
const supabase = { storage: { from: () => ({ upload: async () => ({}) }) } }; // Assuming you have a Supabase client setup
import HomePage from '../../pages/HomePage'; // For live preview

const WebsiteCustomizer = () => {
  const { getToken } = useClerkAuth();
  const [searchParams] = useSearchParams();
  const schoolId = searchParams.get('schoolId');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    primaryColor: '#2563eb',
    secondaryColor: '#1d4ed8',
    motto: '',
    layout: 'Classic',
    logoFile: null,
    heroImageFile: null,
    customAbout: '',
  });
  const [previewData, setPreviewData] = useState(formData);
  const [loading, setLoading] = useState(false);

  // Fetch existing school customization
  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const { data, error } = await supabase
          .from('schools')
          .select('primaryColor, secondaryColor, motto, logoUrl, heroImageUrl, customAbout')
          .eq('id', schoolId)
          .single();
        if (error) throw error;
        setFormData({
          primaryColor: data.primaryColor || '#2563eb',
          secondaryColor: data.secondaryColor || '#1d4ed8',
          motto: data.motto || '',
          layout: 'Classic', // Default, as layout isn't in schema yet
          logoFile: null,
          heroImageFile: null,
          customAbout: data.customAbout || '',
        });
        setPreviewData({ ...formData, logoUrl: data.logoUrl, heroImageUrl: data.heroImageUrl });
      } catch (error) {
        console.error('Error fetching school:', error);
      }
    };
    if (schoolId) fetchSchool();
  }, [schoolId]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
    setPreviewData((prev) => ({
      ...prev,
      [name]: files ? URL.createObjectURL(files[0]) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await getToken();

      // Upload files to Supabase Storage
      let logoUrl = previewData.logoUrl;
      let heroImageUrl = previewData.heroImageUrl;
      if (formData.logoFile) {
        const { data, error } = await supabase.storage
          .from('school-assets')
          .upload(`logos/${schoolId}/${formData.logoFile.name}`, formData.logoFile);
        if (error) throw error;
        logoUrl = supabase.storage.from('school-assets').getPublicUrl(data.path).publicURL;
      }
      if (formData.heroImageFile) {
        const { data, error } = await supabase.storage
          .from('school-assets')
          .upload(`hero-images/${schoolId}/${formData.heroImageFile.name}`, formData.heroImageFile);
        if (error) throw error;
        heroImageUrl = supabase.storage.from('school-assets').getPublicUrl(data.path).publicURL;
      }

      // Update school in Supabase
      const { error } = await supabase
        .from('schools')
        .update({
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          motto: formData.motto,
          logoUrl,
          heroImageUrl,
          customAbout: formData.customAbout,
        })
        .eq('id', schoolId);
      if (error) throw error;

      alert('Customization saved!');
      navigate(`/saas/dashboard?schoolId=${schoolId}`);
    } catch (error) {
      console.error('Error saving customization:', error);
      alert('Failed to save customization.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Customization Form */}
      <div className="w-1/2 p-8 bg-white shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-blue-900">Customize Your School Website</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Primary Color</label>
            <input
              type="color"
              name="primaryColor"
              value={formData.primaryColor}
              onChange={handleChange}
              className="w-full h-10 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Secondary Color</label>
            <input
              type="color"
              name="secondaryColor"
              value={formData.secondaryColor}
              onChange={handleChange}
              className="w-full h-10 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Tagline/Motto</label>
            <input
              type="text"
              name="motto"
              value={formData.motto}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter school motto"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Layout</label>
            <select
              name="layout"
              value={formData.layout}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            >
              <option value="Classic">Classic</option>
              <option value="Modern">Modern</option>
              <option value="Minimal">Minimal</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Logo</label>
            <input type="file" name="logoFile" onChange={handleChange} className="w-full" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Hero Image</label>
            <input type="file" name="heroImageFile" onChange={handleChange} className="w-full" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">About Section</label>
            <textarea
              name="customAbout"
              value={formData.customAbout}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              rows="4"
              placeholder="Enter About section content"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-900 text-white py-2 rounded hover:bg-blue-800 disabled:bg-gray-300"
          >
            {loading ? 'Saving...' : 'Save & Publish'}
          </button>
        </form>
      </div>
      {/* Live Preview */}
      <div className="w-1/2 p-8" style={{ '--primary': previewData.primaryColor, '--secondary': previewData.secondaryColor }}>
        <h3 className="text-xl font-bold mb-4">Live Preview</h3>
        <HomePage
          schoolId={schoolId}
          customization={{
            primaryColor: previewData.primaryColor,
            secondaryColor: previewData.secondaryColor,
            motto: previewData.motto,
            logoUrl: previewData.logoUrl,
            heroImageUrl: previewData.heroImageUrl,
            customAbout: previewData.customAbout,
            layout: previewData.layout,
          }}
        />
      </div>
    </div>
  );
};

export default WebsiteCustomizer;
