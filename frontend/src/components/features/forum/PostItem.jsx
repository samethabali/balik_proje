import React from 'react';
import { togglePostLike } from '../../../api/api';
import toast from 'react-hot-toast';
import Card from '../../ui/Card';
import ImageLightbox from '../../modals/ImageLightbox';
import CommentSection from './CommentSection';
import styles from './styles.module.css';

const PostItem = ({ post, selectedZone, isLoggedIn, onImageClick, expandedPostId, onToggleComments }) => {
  const [isLiked, setIsLiked] = React.useState(post.is_liked);
  const [likeCount, setLikeCount] = React.useState(post.like_count || 0);
  const [selectedImage, setSelectedImage] = React.useState(null);

  const handleLike = async () => {
    if (!isLoggedIn) {
      toast.error("Beğenmek için giriş yapmalısınız!");
      return;
    }

    const newLikedStatus = !isLiked;
    const newCount = newLikedStatus ? likeCount + 1 : likeCount - 1;
    
    setIsLiked(newLikedStatus);
    setLikeCount(Math.max(0, newCount));

    try {
      await togglePostLike(post.post_id);
    } catch (err) {
      console.error("Like hatası:", err);
      setIsLiked(!newLikedStatus);
      setLikeCount(likeCount);
      toast.error("İşlem başarısız oldu, geri alınıyor.");
    }
  };

  const handleImageClick = () => {
    if (post.photos && post.photos[0]) {
      setSelectedImage(post.photos[0]);
      onImageClick?.(post.photos[0]);
    }
  };

  return (
    <>
      <Card className={styles.postCard}>
        <div className={styles.postHeader}>
          <h4 className={styles.postTitle}>{post.title}</h4>
          <span className={styles.postDate}>
            {new Date(post.created_at).toLocaleDateString()}
          </span>
        </div>
        <p className={styles.postContent}>{post.content}</p>

        {post.photos && post.photos.length > 0 && post.photos[0] && (
          <div className={styles.postImageContainer}>
            <img
              src={post.photos[0]}
              alt="Post Attachment"
              onClick={handleImageClick}
              className={styles.postImage}
              onError={(e) => e.target.style.display = 'none'}
            />
          </div>
        )}

        <div className={styles.postFooter}>
          <div className={styles.postAuthor}>
            <span className={styles.authorName}>👤 {post.author || "Anonim"}</span>
            {!selectedZone && post.zone_name && (
              <span className={styles.postZone}>📍 {post.zone_name}</span>
            )}
          </div>
          <div className={styles.postActions}>
            <button
              onClick={handleLike}
              className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`}
            >
              {isLiked ? '❤️' : '🤍'} {likeCount}
            </button>
            <button
              onClick={() => onToggleComments(post.post_id)}
              className={styles.actionButton}
            >
              💬 {expandedPostId === post.post_id ? "Gizle" : "Yorumlar"}
            </button>
          </div>
        </div>

        {expandedPostId === post.post_id && (
          <div className={styles.commentsContainer}>
            <CommentSection postId={post.post_id} isLoggedIn={isLoggedIn} />
          </div>
        )}
      </Card>

      <ImageLightbox
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        imageUrl={selectedImage}
      />
    </>
  );
};

export default PostItem;

