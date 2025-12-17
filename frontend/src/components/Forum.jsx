// frontend/src/components/Forum.jsx
import React, { useState, useEffect } from 'react';
import { fetchAllPosts, fetchZonePosts, createPost, fetchComments, createComment, fetchZones, togglePostLike } from '../api/api';
import toast from 'react-hot-toast';

const Forum = ({ selectedZone, currentUser }) => {
  // ---------------- STATE TANIMLARI ----------------
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [zonesList, setZonesList] = useState([]);

  // Yeni Post State'leri
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [postZoneId, setPostZoneId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 🔥 YENİ STATE: Büyütülecek Resim İçin
  const [selectedImage, setSelectedImage] = useState(null);

  // Yorum State'leri
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');


  const isLoggedIn = !!localStorage.getItem('token');

  // 1. Postları ve Bölgeleri Çekme
  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      setExpandedPostId(null);
      setComments([]);
      try {
        let data;
        const activeZoneId = selectedZone ? (selectedZone.zone_id || selectedZone.id) : null;
        if (activeZoneId) {
          data = await fetchZonePosts(activeZoneId);
        } else {
          data = await fetchAllPosts();
        }
        setPosts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Forum hatası:", error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    const loadZonesList = async () => {
      try {
        const data = await fetchZones();
        if (data && Array.isArray(data)) {
          setZonesList(data);
        } else if (data && data.features) {
          setZonesList(data.features);
        }
      } catch (err) {
        console.error("Bölgeler listesi çekilemedi:", err);
      }
    };

    loadPosts();
    loadZonesList();
  }, [selectedZone]);


  // 2. Yorumları Aç/Kapa
  const toggleComments = async (postId) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      setComments([]);
      return;
    }
    setExpandedPostId(postId);
    setCommentsLoading(true);
    try {
      const data = await fetchComments(postId);
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  // 3. Modal Açılınca
  const handleOpenModal = () => {
    if (!isLoggedIn) {
      toast.error('Paylaşım yapmak için giriş yapmalısınız.');
      return;
    }
    const activeZoneId = selectedZone ? (selectedZone.zone_id || selectedZone.id) : '';
    setPostZoneId(activeZoneId || '');
    setIsModalOpen(true);
  };

  // 4. Dosya Seçme Fonksiyonu
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // Limit 5MB olsun
        toast.error("Dosya boyutu çok büyük! Lütfen 5MB'dan küçük bir resim seçin.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPhotoUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 5. Post Gönderme
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    let zoneToSend = null;
    if (postZoneId && postZoneId !== "") {
      const parsed = parseInt(postZoneId, 10);
      if (!isNaN(parsed)) { zoneToSend = parsed; }
    }
    try {
      await createPost({
        title: newTitle, content: newContent, zone_id: zoneToSend, visibility: 'public', photoUrl: newPhotoUrl
      });
      setNewTitle(''); setNewContent(''); setNewPhotoUrl(''); setIsModalOpen(false);
      const currentViewId = selectedZone ? (selectedZone.zone_id || selectedZone.id) : null;
      const updated = currentViewId ? await fetchZonePosts(currentViewId) : await fetchAllPosts();
      setPosts(updated);
      toast.success('Paylaşım oluşturuldu.');
    } catch (err) {
      console.error(err); toast.error(err.message || 'Paylaşım oluşturulamadı.');
    }
  };

  // 6. Beğeni Yap / Geri Al (Mantık Düzeltildi)
  const handleLike = async (postId) => {
    if (!isLoggedIn) { toast.error("Beğenmek için giriş yapmalısınız!"); return; }

    setPosts(prevPosts => prevPosts.map(post => {
      if (post.post_id === postId) {
        const currentLikedStatus = post.is_liked;
        const newCount = currentLikedStatus
          ? parseInt(post.like_count || 0) - 1
          : parseInt(post.like_count || 0) + 1;
        return { ...post, is_liked: !currentLikedStatus, like_count: newCount < 0 ? 0 : newCount };
      }
      return post;
    }));

    try {
      await togglePostLike(postId);
    } catch (err) {
      console.error("Like hatası:", err);
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.post_id === postId) {
          const revertedLikedStatus = !post.is_liked;
          const revertedCount = revertedLikedStatus
            ? parseInt(post.like_count) + 1
            : parseInt(post.like_count) - 1;
          return { ...post, is_liked: revertedLikedStatus, like_count: revertedCount };
        }
        return post;
      }));
      toast.error("İşlem başarısız oldu, geri alınıyor.");
    }
  };

  // 7. Yorum Gönderme
  const handleCommentSubmit = async (e, postId) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    try {
      await createComment(postId, newCommentText);
      setNewCommentText('');
      const updatedComments = await fetchComments(postId);
      setComments(updatedComments);
      toast.success('Yorum eklendi.');
    } catch (err) {
      toast.error("Yorum hatası: " + err.message);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false); setNewTitle(''); setNewContent(''); setNewPhotoUrl('');
  };

  return (
    <div className="forum-main-scroll" style={{ padding: '14px', color: 'white', height: '100%', overflowY: 'auto', position: 'relative' }}>
      {/* Üst Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', position: 'sticky', top: '-14px', background: '#020817', paddingTop: '14px', paddingBottom: '12px', zIndex: 10, marginTop: 0 }}>
        <h3 style={{ color: '#00ffff', margin: 0, fontSize: '1rem', fontWeight: 'bold', textShadow: '0 0 10px #00ffff' }}>
          {selectedZone ? `📍 ${selectedZone.name} Forumu` : "🌐 Genel Balıkçı Forumu"}
        </h3>
        <button onClick={handleOpenModal} style={{ padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#00ffff', color: '#00111f', fontWeight: 'bold', fontSize: '0.85rem' }}>+ Paylaş</button>
      </div>

      {/* Post Listesi */}
      {loading ? (<p style={{ textAlign: 'center', color: '#888' }}>Yükleniyor...</p>) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '40px' }}>
          {posts.length === 0 && <p style={{ color: '#ccc', textAlign: 'center' }}>Burada henüz ses yok.</p>}
          {posts.map((post) => (
            <div key={post.post_id} style={{ background: 'rgba(0, 255, 255, 0.05)', border: '1px solid #00ffff33', borderRadius: 6, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h4 style={{ fontWeight: 'bold', color: 'white', margin: 0, fontSize: '0.95rem' }}>{post.title}</h4>
                <span style={{ fontSize: '0.75rem', color: '#888' }}>{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
              <p style={{ color: '#ccc', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '12px' }}>{post.content}</p>

              {/* 🔥 FOTOĞRAF ALANI (Tıklanınca Büyür) */}
              {post.photos && post.photos.length > 0 && post.photos[0] && (
                <div style={{ marginBottom: '12px' }}>
                  <img
                    src={post.photos[0]}
                    alt="Post Attachment"
                    // Tıklama olayı eklendi
                    onClick={() => setSelectedImage(post.photos[0])}
                    style={{
                      maxWidth: '100%', maxHeight: '300px', borderRadius: '4px', border: '1px solid #333',
                      cursor: 'pointer' // İmleç değişsin
                    }}
                    onError={(e) => e.target.style.display = 'none'}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #00ffff22', paddingTop: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8rem', color: '#00ffff' }}>👤 {post.author || "Anonim"}</span>
                  {!selectedZone && post.zone_name && (<span style={{ fontSize: '0.7rem', color: '#aaa', marginTop: '2px' }}>📍 {post.zone_name}</span>)}
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button onClick={() => handleLike(post.post_id)} style={{ background: 'transparent', border: 'none', color: post.is_liked ? '#ef4444' : '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem', fontWeight: 'bold', transition: 'transform 0.1s' }} onMouseDown={(e) => e.target.style.transform = 'scale(0.9)'} onMouseUp={(e) => e.target.style.transform = 'scale(1)'}>
                    {post.is_liked ? '❤️' : '🤍'} {post.like_count || 0}
                  </button>
                  <button onClick={() => toggleComments(post.post_id)} style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    💬 {expandedPostId === post.post_id ? "Gizle" : "Yorumlar"}
                  </button>
                </div>
              </div>
              {/* Yorum Alanı (Aynı) */}
              {expandedPostId === post.post_id && (
                <div style={{ marginTop: '15px', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '4px' }}>
                  {commentsLoading ? (<p style={{ fontSize: '0.8rem', color: '#888' }}>Yorumlar yükleniyor...</p>) : (
                    <div className="forum-comments-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                      {comments.length === 0 ? (<p style={{ fontSize: '0.8rem', color: '#666', fontStyle: 'italic' }}>Henüz yorum yapılmamış.</p>) : (
                        comments.map(comment => (
                          <div key={comment.comment_id} style={{ borderBottom: '1px solid #333', paddingBottom: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '0.75rem', color: '#00ffff', fontWeight: 'bold' }}>{comment.author}</span>
                              <span style={{ fontSize: '0.7rem', color: '#555' }}>{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: '#ddd', margin: '4px 0 0 0' }}>{comment.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  {isLoggedIn ? (
                    <form onSubmit={(e) => handleCommentSubmit(e, post.post_id)} style={{ display: 'flex', gap: '8px' }}>
                      <input type="text" placeholder="Yorum yaz..." value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)} style={{ flex: 1, background: '#1a202c', border: '1px solid #444', color: 'white', borderRadius: '4px', padding: '6px', fontSize: '0.85rem', outline: 'none' }} />
                      <button type="submit" style={{ background: '#22c55e', border: 'none', borderRadius: '4px', padding: '0 10px', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}>➜</button>
                    </form>
                  ) : (<p style={{ fontSize: '0.8rem', color: '#888' }}>Yorum yapmak için giriş yapmalısınız.</p>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL (Yeni Post Ekleme) - (Aynı) */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ background: '#020817', padding: '20px', borderRadius: '8px', border: '1px solid #00ffff', width: '90%', maxWidth: '400px', boxShadow: '0 0 20px rgba(0,255,255,0.2)', boxSizing: 'border-box' }}>
            <h3 style={{ color: '#00ffff', marginTop: 0, marginBottom: '16px' }}>Yeni Paylaşım</h3>
            <form onSubmit={handlePostSubmit} style={{ width: '100%', boxSizing: 'border-box' }}>
              <input type="text" placeholder="Başlık" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required style={{ width: '100%', padding: '10px', marginBottom: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '4px', outline: 'none', boxSizing: 'border-box' }} />
              <textarea placeholder="İçerik" value={newContent} onChange={(e) => setNewContent(e.target.value)} required rows="4" style={{ width: '100%', padding: '10px', marginBottom: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '4px', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#aaa', fontSize: '0.8rem' }}>Fotoğraf Yükle (Opsiyonel - Max 5MB)</label>
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ width: '100%', color: '#ccc', fontSize: '0.8rem' }} />
                {newPhotoUrl && (<div style={{ marginTop: '5px' }}><p style={{ color: '#00ffff', fontSize: '0.7rem', margin: 0 }}>Resim seçildi! (Önizleme)</p><img src={newPhotoUrl} alt="Önizleme" style={{ height: '50px', marginTop: '5px', borderRadius: '4px' }} /></div>)}
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#aaa', fontSize: '0.8rem', marginBottom: '6px' }}>Konum:</label>
                <select className="forum-select-scroll" value={postZoneId} onChange={(e) => setPostZoneId(e.target.value)} style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '4px', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}>
                  <option value="">🌐 Genel (Konumsuz)</option>
                  {zonesList.map((zone) => { const zId = zone.properties?.zone_id || zone.properties?.id || zone.id; const zName = zone.properties?.name || zone.name || "Bilinmeyen Bölge"; if (!zId) return null; return (<option key={zId} value={zId}>📍 {zName}</option>); })}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={handleCloseModal} style={{ background: '#333', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>İptal</button>
                <button type="submit" style={{ background: '#00ffff', color: 'black', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Paylaş</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔥 YENİ MODAL: FOTOĞRAF BÜYÜTME (Lightbox) */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)} // Arka plana tıklayınca kapat
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)', // Daha koyu arka plan
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 10000, cursor: 'zoom-out'
          }}
        >
          <img
            src={selectedImage}
            alt="Large View"
            style={{
              maxWidth: '90%', maxHeight: '90%',
              borderRadius: '8px', border: '2px solid #00ffff',
              boxShadow: '0 0 20px rgba(0,255,255,0.3)',
              cursor: 'default' // Resim üzerindeyken imleç normal olsun
            }}
            onClick={(e) => e.stopPropagation()} // Resme tıklayınca kapanmasın
          />
        </div>
      )}
    </div>
  );
};

export default Forum;