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
      <div className="edit-profile-modal" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
        <div className="modal-header">
          <div>
            <p className="modal-eyebrow">Candidate Profile</p>
            <h2 id="edit-profile-title">Edit Profile</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} disabled={saving} aria-label="Close edit profile modal">
            x
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>Profile Picture
            <input type="file" accept="image/*" onChange={handleAvatarChange} disabled={saving} />
          </label>
          {form.avatar && <img src={form.avatar} alt="avatar preview" className="avatar-preview" />}

          <div className="modal-grid">
          <label>Name
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>Email
            <input name="email" value={form.email} onChange={handleChange} required type="email" />
          </label>
          </div>

          <div className="modal-grid">
          <label>Phone
            <input name="phone" value={form.phone} onChange={handleChange} required type="tel" />
          </label>
          <label>Skills (comma separated)
            <input name="skills" value={form.skills} onChange={handleChange} placeholder="e.g. React, Node.js, Python" />
          </label>
          </div>

          <label>Bio
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleChange}
              rows={5}
              placeholder="Write a concise professional summary about your background and strengths"
            />
          </label>

          <label>Resume (PDF or DOC)
            <input 
              type="file" 
              accept=".pdf,.doc,.docx" 
              onChange={handleResumeChange} 
              disabled={loading || saving}
            />
            <p className="resume-hint">Upload your latest resume for automatic profile extraction and updates.</p>
            {loading && <span className="resume-status warning">Reading file...</span>}
            {!loading && resumeName && <span className="resume-status success">{resumeName}</span>}
          </label>

          <div className="modal-actions">
            <button 
              type="submit" 
              className="save-btn"
              disabled={loading || saving}
            >
              {saving ? 'Parsing and Saving...' : 'Save Changes'}
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="cancel-btn"
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
