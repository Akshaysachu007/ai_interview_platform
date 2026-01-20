import React, { useState } from 'react';
import './EditProfileModal.css';

export default function EditProfileModal({ profile, onSave, onClose }) {
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

  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => setForm((prev) => ({ ...prev, resume: ev.target.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedProfile = {
      ...form,
      skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      resumeName,
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
          <label>Stream
            <select name="stream" value={form.stream} onChange={handleChange} required>
              <option value="">Select your stream</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Business Management">Business Management</option>
              <option value="Marketing">Marketing</option>
              <option value="Finance">Finance</option>
              <option value="Data Science">Data Science</option>
              <option value="AI/ML">AI/ML</option>
            </select>
          </label>
          <label>Bio
            <textarea name="bio" value={form.bio} onChange={handleChange} rows={3} />
          </label>
          <label>Resume (PDF or DOC)
            <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeChange} />
            {resumeName && <span style={{ fontSize: '0.95em', color: '#6366f1' }}>{resumeName}</span>}
          </label>
          <div className="modal-actions">
            <button type="submit">Save</button>
            <button type="button" onClick={onClose} className="cancel">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
