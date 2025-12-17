import React from 'react';
import styles from './styles.module.css';

const SidebarTabs = ({ activeTab, onTabChange, currentUser }) => {
  const tabs = [
    { id: 'info', label: 'Bilgi' },
    { id: 'boat', label: 'Tekne' },
    { id: 'equip', label: 'Ekipman' },
    { id: 'forum', label: 'Forum' },
    { id: 'account', label: currentUser ? 'Hesabım' : 'Giriş' }
  ];

  return (
    <div className={styles.tabButtons}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`${styles.tabButton} ${activeTab === tab.id ? styles.tabButtonActive : ''}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default SidebarTabs;

