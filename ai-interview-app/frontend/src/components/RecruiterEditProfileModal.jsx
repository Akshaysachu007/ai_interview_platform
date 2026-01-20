import React, { useState } from 'react';
import './RecruiterEditProfileModal.css';

export default function RecruiterEditProfileModal({ profile, onSave, onClose }) {
  const [form, setForm] = useState({
    name: profile.name || '',
    email: profile.email || '',
    phone: profile.phone || '',
    companyName: profile.companyName || '',
    companyWebsite: profile.companyWebsite || '',
    industry: profile.industry || '',
    companySize: profile.companySize || '',
    location: profile.location || '',
    bio: profile.bio || '',
    logo: profile.logo || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setForm((prev) => ({ ...prev, logo: ev.target.result }));
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="edit-profile-modal-backdrop" onClick={onClose}>
      <div className="edit-profile-modal recruiter-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Edit Recruiter Profile</h2>
        <form onSubmit={handleSubmit}>
          {form.logo && <img src={form.logo} alt="logo preview" className="avatar-preview" />}
          
          <label>
            Company Logo:
            <input type="file" accept="image/*" onChange={handleLogoChange} />
          </label>
          
          <label>
            Contact Name:
            <input name="name" type="text" value={form.name} onChange={handleChange} placeholder="John Doe" required />
          </label>
          
          <label>
            Email:
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="contact@company.com" required readOnly />
          </label>
          
          <label>
            Phone:
            <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+1 (555) 123-4567" />
          </label>
          
          <label>
            Company Name:
            <input name="companyName" type="text" value={form.companyName} onChange={handleChange} placeholder="TechCorp Inc." required />
          </label>
          
          <label>
            Company Website:
            <input name="companyWebsite" type="url" value={form.companyWebsite} onChange={handleChange} placeholder="https://company.com" />
          </label>
          
          <label>
            Industry:
            <select name="industry" value={form.industry} onChange={handleChange}>
              <option value="">Select Industry</option>
              <option value="Technology">Technology</option>
              <option value="Finance">Finance</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Education">Education</option>
              <option value="Retail">Retail</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Consulting">Consulting</option>
              <option value="Other">Other</option>
            </select>
          </label>
          
          <label>
            Company Size:
            <select name="companySize" value={form.companySize} onChange={handleChange}>
              <option value="">Select Size</option>
              <option value="1-10">1-10</option>
              <option value="11-50">11-50</option>
              <option value="51-200">51-200</option>
              <option value="201-500">201-500</option>
              <option value="501-1000">501-1000</option>
              <option value="1000+">1000+</option>
            </select>
          </label>
          
          <label>
            Location:
            <input name="location" type="text" value={form.location} onChange={handleChange} placeholder="San Francisco, CA" />
          </label>
          
          <label>
            Company Description:
            <textarea name="bio" value={form.bio} onChange={handleChange} placeholder="Tell us about your company..." rows={4} />
          </label>
          
          <div className="modal-actions">
            <button type="button" className="cancel" onClick={onClose}>Cancel</button>
            <button type="submit">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
