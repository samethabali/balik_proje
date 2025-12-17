import React from 'react';
import Card from '../../ui/Card';
import styles from './styles.module.css';

const ForumTab = ({ allUsersForumStats }) => {
  if (allUsersForumStats.length === 0) {
    return <p className={styles.emptyMessage}>Forum istatistiği bulunamadı.</p>;
  }

  return (
    <div className={styles.scrollableList}>
      <h3 className={styles.tabTitle}>💬 Forum İstatistikleri</h3>
      <div className={styles.listContainer}>
        {allUsersForumStats.map((stat) => (
          <Card key={stat.user_id} className={styles.forumCard}>
            <div className={styles.statName}>{stat.full_name}</div>
            <div className={styles.statDetails}>
              Post: {stat.post_count || 0} | Yorum: {stat.comment_count || 0} | Beğeni: {stat.liked_post_count || 0} | Fotoğraf: {stat.total_photos || 0}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ForumTab;

