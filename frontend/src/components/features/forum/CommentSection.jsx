import React from 'react';
import { fetchComments, createComment } from '../../../api/api';
import toast from 'react-hot-toast';
import Input from '../../ui/Input';
import Button from '../../ui/Button';
import LoadingSpinner from '../../ui/LoadingSpinner';
import styles from './styles.module.css';

const CommentSection = ({ postId, isLoggedIn, onCommentAdded }) => {
  const [comments, setComments] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [newCommentText, setNewCommentText] = React.useState('');

  React.useEffect(() => {
    if (postId) {
      loadComments();
    }
  }, [postId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await fetchComments(postId);
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    
    try {
      await createComment(postId, newCommentText);
      setNewCommentText('');
      await loadComments();
      onCommentAdded?.();
      toast.success('Yorum eklendi.');
    } catch (err) {
      toast.error("Yorum hatası: " + err.message);
    }
  };

  return (
    <div className={styles.commentSection}>
      {loading ? (
        <LoadingSpinner size="small" text="Yorumlar yükleniyor..." />
      ) : (
        <div className={`${styles.commentsList} forum-comments-scroll`}>
          {comments.length === 0 ? (
            <p className={styles.noComments}>Henüz yorum yapılmamış.</p>
          ) : (
            comments.map(comment => (
              <div key={comment.comment_id} className={styles.commentItem}>
                <div className={styles.commentHeader}>
                  <span className={styles.commentAuthor}>{comment.author}</span>
                  <span className={styles.commentTime}>
                    {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className={styles.commentContent}>{comment.content}</p>
              </div>
            ))
          )}
        </div>
      )}
      {isLoggedIn ? (
        <form onSubmit={handleCommentSubmit} className={styles.commentForm}>
          <Input
            type="text"
            placeholder="Yorum yaz..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            className={styles.commentInput}
          />
          <Button type="submit" variant="success" className={styles.commentSubmit}>
            ➜
          </Button>
        </form>
      ) : (
        <p className={styles.loginPrompt}>Yorum yapmak için giriş yapmalısınız.</p>
      )}
    </div>
  );
};

export default CommentSection;

