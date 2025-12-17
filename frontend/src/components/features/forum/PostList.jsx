import React from 'react';
import PostItem from './PostItem';
import LoadingSpinner from '../../ui/LoadingSpinner';
import styles from './styles.module.css';

const PostList = ({ 
  posts, 
  loading, 
  selectedZone, 
  isLoggedIn, 
  expandedPostId, 
  onToggleComments 
}) => {
  if (loading) {
    return <LoadingSpinner text="Yükleniyor..." />;
  }

  if (posts.length === 0) {
    return <p className={styles.emptyMessage}>Burada henüz ses yok.</p>;
  }

  return (
    <div className={styles.postList}>
      {posts.map((post) => (
        <PostItem
          key={post.post_id}
          post={post}
          selectedZone={selectedZone}
          isLoggedIn={isLoggedIn}
          expandedPostId={expandedPostId}
          onToggleComments={onToggleComments}
        />
      ))}
    </div>
  );
};

export default PostList;

