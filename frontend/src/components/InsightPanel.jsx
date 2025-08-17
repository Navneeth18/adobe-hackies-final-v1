import React from 'react';
import './InsightPanel.css';

const InsightPanel = ({ contradictions, alternateViewpoints }) => {
  return (
    <div className="insight-panel">
      {contradictions && contradictions.length > 0 && (
        <div className="contradictions-section">
          <h3>Contradictory Viewpoints</h3>
          <div className="contradictions-list">
            {contradictions.map((contradiction, index) => (
              <div key={index} className="contradiction-item">
                <p>
                  <span className="keyword">{contradiction.keyword}</span>: {contradiction.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {alternateViewpoints && alternateViewpoints.length > 0 && (
        <div className="viewpoints-section">
          <h3>Alternative Perspectives</h3>
          <div className="viewpoints-list">
            {alternateViewpoints.map((viewpoint, index) => (
              <div key={index} className="viewpoint-item">
                <p>
                  <span className="keyword">{viewpoint.keyword}</span>: {viewpoint.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!contradictions || contradictions.length === 0) && 
       (!alternateViewpoints || alternateViewpoints.length === 0) && (
        <div className="no-insights">
          <p>No contradictions or alternative viewpoints found for the selected text.</p>
        </div>
      )}
    </div>
  );
};

export default InsightPanel;