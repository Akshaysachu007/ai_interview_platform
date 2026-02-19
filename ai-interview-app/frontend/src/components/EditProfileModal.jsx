import React, { useState } from 'react';
import './EditProfileModal.css';

export default function EditProfileModal({ profile, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    name: profile.name || '',
    email: profile.email || '',
    phone: profile.phone || '',
    skills: profile.skills ? profile.skills.join(', ') : '',
    bio: profile.bio || '',
    avatar: profile.avatar || '',
    stream: profile.stream || '',
    resume: profile.resume || null,
  });
  const [resumeName, setResumeName] = useState(profile.resumeName || '');
  const [resumeFile, setResumeFile] = useState(null); // Store file for Python processing
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setForm((prev) => ({ ...prev, avatar: ev.target.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleResumeChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setResumeName(file.name);
    setLoading(true);

    try {
      // Get file extension
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      // Read file as base64
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64Content = ev.target.result;
        
        // Store file data for backend processing
        setResumeFile({
          base64: base64Content,
          type: fileExtension,
          name: file.name
        });
        
        setForm((prev) => ({ ...prev, resume: base64Content }));
        setLoading(false);
      };
      
      reader.onerror = () => {
        alert('Failed to read file. Please try again.');
        setLoading(false);
      };
      
      reader.readAsDataURL(file);
      
    } catch (err) {
      console.error('Error reading file:', err);
      alert('Failed to read file. Please try again.');
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedProfile = {
      ...form,
      skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      resumeName,
      resumeFile: resumeFile || null, // Include file data for Python extraction
    };
    onSave(updatedProfile);
  };

  return (
    <div className="edit-profile-modal-backdrop">
      <div className="edit-profile-modal">
        <h2>Edit Profile</h2>
        <form onSubmit={handleSubmit}>
          <label>Profile Picture
            <input type="file" accept="image/*" onChange={handleAvatarChange} />
          </label>
          {form.avatar && <img src={form.avatar} alt="avatar preview" className="avatar-preview" />}
          <label>Name
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>Email
            <input name="email" value={form.email} onChange={handleChange} required type="email" />
          </label>
          <label>Phone
            <input name="phone" value={form.phone} onChange={handleChange} required type="tel" />
          </label>
          <label>Skills (comma separated)
            <input name="skills" value={form.skills} onChange={handleChange} placeholder="e.g. React, Node.js, Python" />
          </label>
          <label>Bio
            <textarea name="bio" value={form.bio} onChange={handleChange} rows={3} />
          </label>
          <label>Resume (PDF or DOC)
            <input 
              type="file" 
              accept=".pdf,.doc,.docx" 
              onChange={handleResumeChange} 
              disabled={loading || saving}
            />
            {loading && <span style={{ fontSize: '0.95em', color: '#f59e0b' }}>⏳ Reading file...</span>}
            {!loading && resumeName && <span style={{ fontSize: '0.95em', color: '#6366f1' }}>✓ {resumeName}</span>}
          </label>
          <div className="modal-actions">
            <button 
              type="submit" 
              disabled={loading || saving}
            >
              {saving ? '💾 Parsing & Saving...' : 'Save'}
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="cancel"
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
