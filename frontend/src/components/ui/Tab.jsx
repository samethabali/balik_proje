import React from 'react';
import styles from './styles.module.css';

export const TabContainer = ({ children, className = '' }) => {
  return (
    <div className={`${styles.tabContainer} ${className}`}>
      {children}
    </div>
  );
};

export const TabButtons = ({ tabs, activeTab, onTabChange, className = '' }) => {
  return (
    <div className={`${styles.tabButtons} ${className}`}>
      {tabs.map((tab) => {
        const tabId = typeof tab === 'string' ? tab : tab.id;
        const tabLabel = typeof tab === 'string' ? tab : tab.label;
        const isActive = activeTab === tabId;
        
        return (
          <button
            key={tabId}
            onClick={() => onTabChange(tabId)}
            className={`${styles.tabButton} ${isActive ? styles.tabButtonActive : ''}`}
          >
            {tabLabel}
          </button>
        );
      })}
    </div>
  );
};

export const TabContent = ({ children, className = '' }) => {
  return (
    <div className={`${styles.tabContent} ${className}`}>
      {children}
    </div>
  );
};

