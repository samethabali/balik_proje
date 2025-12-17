import React from 'react';
import Forum from '../../Forum';
import styles from '../styles.module.css';

const ForumTab = ({ selectedZone, currentUser }) => {
  return (
    <div className={styles.forumTab}>
      <Forum selectedZone={selectedZone} currentUser={currentUser} />
    </div>
  );
};

export default ForumTab;

