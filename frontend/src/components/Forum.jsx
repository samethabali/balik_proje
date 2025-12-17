import React, { useState, useEffect } from 'react';
import { fetchAllPosts, fetchZonePosts } from '../api/api';
import PostList from './features/forum/PostList';
import PostCreateModal from './modals/PostCreateModal';
import Button from './ui/Button';
import styles from './styles.module.css';

const Forum = ({ selectedZone, currentUser }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [zonesList, setZonesList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const isLoggedIn = !!localStorage.getItem('token');

  useEffect(() => {
    loadPosts();
    loadZones();
  }, [selectedZone]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      let data;
      if (selectedZone) {
        const zoneId = selectedZone.zone_id || selectedZone.id;
        if (zoneId) {
          data = await fetchZonePosts(zoneId);
        } else {
          data = await fetchAllPosts();
        }
      } else {
        data = await fetchAllPosts();
      }
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Postlar yüklenemedi:', err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadZones = async () => {
    try {
      const { fetchZones } = await import('../api/api');
      const data = await fetchZones();
      if (data && data.features) {
        setZonesList(data.features);
      }
    } catch (err) {
      console.error('Bölgeler yüklenemedi:', err);
      setZonesList([]);
    }
  };

  const handlePostCreated = (updatedPosts) => {
    setPosts(updatedPosts);
  };

  const toggleComments = (postId) => {
    setExpandedPostId(expandedPostId === postId ? null : postId);
  };

  return (
    <div className={styles.forumContainer}>
      <div className={styles.forumHeader}>
        <h3 className={styles.forumTitle}>
          💬 {selectedZone ? `${selectedZone.name} Forumu` : 'Genel Forum'}
        </h3>
        {isLoggedIn && (
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            className={styles.newPostButton}
          >
            ➕ Yeni Paylaşım
          </Button>
        )}
      </div>

      <div className={`${styles.forumContent} forum-main-scroll`}>
        <PostList
          posts={posts}
          loading={loading}
          selectedZone={selectedZone}
          isLoggedIn={isLoggedIn}
          expandedPostId={expandedPostId}
          onToggleComments={toggleComments}
        />
      </div>

      <PostCreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedZone={selectedZone}
        zonesList={zonesList}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
};

export default Forum;
