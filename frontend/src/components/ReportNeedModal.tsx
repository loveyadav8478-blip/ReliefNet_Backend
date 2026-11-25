import React, { useState, useEffect } from 'react';
import { NeedCategory, UrgencyLevel, NeedReport } from '../types';
import { classifyNeedWithGemini, AIClassificationResult } from '../services/geminiService';
import { Sparkles, MapPin, Camera, AlertCircle, CheckCircle } from 'lucide-react';

interface ReportNeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitReport: (newNeed: Partial<NeedReport>) => void;
}

export const ReportNeedModal: React.FC<ReportNeedModalProps> = ({
  isOpen,
  onClose,
  onSubmitReport
}) => {
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<NeedCategory>('Rescue');
  const [address, setAddress] = useState('Sector 62, Noida, NCR');
  const [reporterName, setReporterName] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [hasImage, setHasImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [aiClassification, setAiClassification] = useState<AIClassificationResult | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRunAiAnalysis = async (text: string) => {
    if (!text.trim()) return;
    setIsClassifying(true);
    const result = await classifyNeedWithGemini(text, hasImage);
    setAiClassification(result);
    setCategory(result.category);
    setIsClassifying(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setHasImage(true);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      if (description) {
        handleRunAiAnalysis(description);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const urgency: UrgencyLevel = aiClassification?.urgency || 'HIGH';
    const score = aiClassification?.priorityScore || 75;
    const skills = aiClassification?.requiredSkills || ['General Volunteer'];

    const newReport: Partial<NeedReport> = {
      title: title || description.slice(0, 60) + '...',
      description,
      category: aiClassification?.category || category,
      urgency,
      priorityScore: score,
      location: {
        lat: 28.6300 + (Math.random() - 0.5) * 0.04,
        lng: 77.3600 + (Math.random() - 0.5) * 0.04,
        address: address || 'Community Incident Location'
      },
      status: 'SUBMITTED',
      reportedAt: 'Just now',
      reporterName: reporterName || 'Anonymous Citizen Reporter',
      reporterContact,
      imageUrl: imagePreview || undefined,
      requiredSkills: skills,
      aiClassificationNotes: aiClassification?.justification || 'Analyzed via Gemini 1.5 Flash incident classifier.'
    };

    onSubmitReport(newReport);
    onClose();
  };

  return (
    <div className="rn-modal-backdrop" onClick={onClose}>
      <div className="rn-modal-content rn-report-modal" onClick={e => e.stopPropagation()}>
        <div className="rn-modal-header">
          <div>
            <span className="rn-modal-kicker">ANONYMOUS COMMUNITY INCIDENT REPORTING</span>
            <h3>Report an Urgent Need or Crisis</h3>
            <p>Directly alerts NGO Coordinators &amp; closest verified volunteers</p>
          </div>
          <button className="rn-close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="rn-report-form">
          <div className="rn-form-group">
            <label>Emergency Description *</label>
            <textarea
              required
              rows={4}
              placeholder="Describe the crisis, who is affected, hazards, and what supplies or help is needed immediately..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (e.target.value.length > 15) {
                  handleRunAiAnalysis(e.target.value);
                }
              }}
            />
          </div>

          {/* AI Instant Classifier Box */}
          <div className="rn-ai-live-preview">
            <div className="rn-ai-preview-header">
              <Sparkles size={16} className="rn-ai-sparkle" />
              <span>Gemini 1.5 Flash Auto-Classification</span>
              {isClassifying && <span className="rn-ai-thinking">Analyzing incident...</span>}
            </div>

            {aiClassification ? (
              <div className="rn-ai-preview-body">
                <div className="rn-ai-tags-row">
                  <span className={`rn-urgency-pill urgency-${aiClassification.urgency.toLowerCase()}`}>
                    Urgency: {aiClassification.urgency}
                  </span>
                  <span className="rn-category-tag">Category: {aiClassification.category}</span>
                  <span className="rn-score-badge">Priority Score: {aiClassification.priorityScore}/100</span>
                </div>
                <p className="rn-ai-justification">{aiClassification.justification}</p>
                <div className="rn-ai-skills-req">
                  <strong>Suggested Volunteer Skills:</strong> {aiClassification.requiredSkills.join(', ')}
                </div>
              </div>
            ) : (
              <p className="rn-ai-placeholder">
                Type an incident description or upload photo to trigger instant AI urgency and priority scoring.
              </p>
            )}
          </div>

          <div className="rn-form-row">
            <div className="rn-form-group">
              <label>Location / Landmark Address *</label>
              <div className="rn-input-icon-wrap">
                <MapPin size={16} />
                <input
                  type="text"
                  required
                  placeholder="e.g. Sector 62 Noida near Metro Station"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="rn-form-group">
              <label>Attach Evidence Photo (Optional)</label>
              <label className="rn-upload-btn">
                <Camera size={16} />
                <span>{hasImage ? 'Photo Attached ✓' : 'Upload Incident Photo'}</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          <div className="rn-form-row">
            <div className="rn-form-group">
              <label>Your Name (Optional, anonymous reports allowed)</label>
              <input
                type="text"
                placeholder="Citizen / Community Member"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
              />
            </div>

            <div className="rn-form-group">
              <label>Callback Phone (Optional)</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={reporterContact}
                onChange={(e) => setReporterContact(e.target.value)}
              />
            </div>
          </div>

          <div className="rn-form-footer">
            <button type="button" className="rn-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="rn-btn-primary">
              <CheckCircle size={16} />
              <span>Broadcast Need to Emergency Grid</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
