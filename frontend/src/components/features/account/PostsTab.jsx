import React from 'react';
import Card from '../../ui/Card';
import styles from './styles.module.css';

const PostsTab = ({ myPosts }) => {
  if (myPosts.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyMessage}>Henüz hiç paylaşım yapmadınız.</p>
        <p className={styles.emptyHint}>Foruma gidip ilk gönderinizi paylaşın!</p>
      </div>
    );
  }

  return (
    <div className={`${styles.postsContainer} sidebar-content-scroll`}>
      {myPosts.map((post) => (
        <Card key={post.post_id} className={styles.postCard}>
          <div className={styles.postHeader}>
            <h4 className={styles.postTitle}>{post.title}</h4>
            <span className={styles.postDate}>
              {new Date(post.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className={styles.postContent}>
            {post.content.length > 100 ? post.content.substring(0, 100) + '...' : post.content}
          </p>

          {post.photos && post.photos.length > 0 && post.photos[0] && (
            <div className={styles.postImageContainer}>
              <img
                src={post.photos[0]}
                alt="Post Attachment"
                className={styles.postImage}
                onError={(e) => e.target.style.display = 'none'}
              />
            </div>
          )}

          <div className={styles.postFooter}>
            <span className={styles.postZone}>
              {post.zone_name ? `📍 ${post.zone_name}` : '🌐 Genel'}
            </span>
            <div className={styles.postStats}>
              <span>❤️ {post.like_count || 0}</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default PostsTab;

