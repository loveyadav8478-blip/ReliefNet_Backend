import React from 'react';
import { NeedReport, Volunteer } from '../types';
import { Shield, Database, Cpu, Activity, Key } from 'lucide-react';

interface AdminPortalProps {
  needs: NeedReport[];
  volunteers: Volunteer[];
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ needs, volunteers }) => {
  return (
    <div className="rn-admin-portal">
      <div className="rn-admin-header">
        <h2>SYSTEM ADMINISTRATION &amp; AI GOVERNANCE</h2>
        <p>Spring Boot 3 REST Services &amp; Gemini 1.5 Flash Model Diagnostics</p>
      </div>

      <div className="rn-admin-grid">
        <div className="rn-admin-card">
          <div className="rn-admin-card-title">
            <Cpu size={18} />
            <span>AI Service Configuration</span>
          </div>
          <div className="rn-admin-field">
            <label>Model Engine</label>
            <input type="text" readOnly value="Google Gemini 1.5 Flash (Multimodal)" />
          </div>
          <div className="rn-admin-field">
            <label>Classification Latency</label>
            <input type="text" readOnly value="~340ms average response" />
          </div>
          <div className="rn-admin-field">
            <label>Matching Algorithm</label>
            <input type="text" readOnly value="Haversine Geodesic + Cosine Skill Matrix" />
          </div>
        </div>

        <div className="rn-admin-card">
          <div className="rn-admin-card-title">
            <Database size={18} />
            <span>Database &amp; Persistence</span>
          </div>
          <div className="rn-admin-field">
            <label>Primary Store</label>
            <input type="text" readOnly value="PostgreSQL 16 (Relational Schema)" />
          </div>
          <div className="rn-admin-field">
            <label>Cache Layer</label>
            <input type="text" readOnly value="Redis 7.2 (Real-time Counters &amp; JWT Cache)" />
          </div>
          <div className="rn-admin-field">
            <label>Total Incidents Logged</label>
            <input type="text" readOnly value={`${needs.length} emergency reports`} />
          </div>
        </div>

        <div className="rn-admin-card">
          <div className="rn-admin-card-title">
            <Shield size={18} />
            <span>Security &amp; RBAC</span>
          </div>
          <div className="rn-admin-field">
            <label>Authentication Standard</label>
            <input type="text" readOnly value="JWT / Spring Security / OAuth2" />
          </div>
          <div className="rn-admin-field">
            <label>Registered Verified Volunteers</label>
            <input type="text" readOnly value={`${volunteers.length} active responders`} />
          </div>
          <div className="rn-admin-field">
            <label>Audit Status</label>
            <span className="rn-pill-green">Compliant (Disaster Data Protection Standards)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
