// components/Forum.jsx
import React, { useState, useEffect } from 'react';
import { fetchAllPosts, fetchZonePosts, createPost, fetchComments, createComment, fetchZones } from '../api/api';

const Forum = ({ selectedZone, currentUser }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Bölgeler Listesi
  const [zonesList, setZonesList] = useState([]);

  // Yeni Post State'leri
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [postZoneId, setPostZoneId] = useState(''); 
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Yorum State'leri
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');

  // 1. Postları ve Bölgeleri Çekme
  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      setExpandedPostId(null); 
      setComments([]);

      try {
        let data;
        // Buradaki ID yakalama mantığını da güçlendirelim
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
        // Veriyi konsola yazdıralım ki yapısını görelim (Hata ayıklama için)
        // console.log("Gelen Bölgeler:", data); 
        
        if (data && Array.isArray(data)) {
           // Bazen direkt array gelir
           setZonesList(data);
        } else if (data && data.features) {
           // Bazen GeoJSON gelir
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
    const activeZoneId = selectedZone ? (selectedZone.zone_id || selectedZone.id) : '';
    setPostZoneId(activeZoneId || ''); 
    setIsModalOpen(true);
  };

  // 4. Post Gönderme (Backend Hatasını Engelleyen Yer)
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    const userId = currentUser ? currentUser.user_id : 1; 

    // --- KRİTİK DÜZELTME ---
    // Backend'e asla String gitmemeli. Kesinlikle Integer veya Null olmalı.
    let zoneToSend = null;

    if (postZoneId && postZoneId !== "") {
        // String gelen "5" değerini Sayı olan 5'e çeviriyoruz
        const parsed = parseInt(postZoneId, 10);
        
        // Eğer gerçekten bir sayıysa atama yap, değilse null kalsın
        if (!isNaN(parsed)) {
            zoneToSend = parsed;
        }
    }

    // Konsola yazdıralım ki ne gittiğini görelim
    console.log("Gönderilecek Veri:", { title: newTitle, zone_id: zoneToSend });

    try {
      await createPost({
        user_id: userId,
        title: newTitle,
        content: newContent,
        zone_id: zoneToSend, // Burası artık ya bir Sayı ya da Null. Asla "Van Gölü" yazısı değil.
        visibility: 'public'
      });
      
      setNewTitle('');
      setNewContent('');
      setIsModalOpen(false);
      alert("Gönderi paylaşıldı!");
      
      const currentViewId = selectedZone ? (selectedZone.zone_id || selectedZone.id) : null;
      const updated = currentViewId ? await fetchZonePosts(currentViewId) : await fetchAllPosts();
      setPosts(updated);
    } catch (err) {
      console.error(err);
      alert("Hata: " + err.message);
    }
  };

  // 5. Yorum Gönderme
  const handleCommentSubmit = async (e, postId) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    const userId = currentUser ? currentUser.user_id : 1;
    try {
      await createComment(postId, userId, newCommentText);
      setNewCommentText('');
      const updatedComments = await fetchComments(postId);
      setComments(updatedComments);
    } catch (err) {
      alert("Yorum hatası: " + err.message);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewTitle('');
    setNewContent('');
  };

  return (
    <div style={{ padding: '14px', color: 'white', height: '100%', overflowY: 'auto', position: 'relative' }}>
      
      {/* Üst Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', position: 'sticky', top: 0, background: '#020817', paddingBottom: '12px', zIndex: 10 }}>
        <h3 style={{ color: '#00ffff', margin: 0, fontSize: '1rem', fontWeight: 'bold', textShadow: '0 0 10px #00ffff' }}>
          {selectedZone ? `📍 ${selectedZone.name} Forumu` : "🌐 Genel Balıkçı Forumu"}
        </h3>
        <button 
          onClick={handleOpenModal}
          style={{ padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', background: '#00ffff', color: '#00111f', fontWeight: 'bold', fontSize: '0.85rem' }}
        >
          + Paylaş
        </button>
      </div>

      {/* Post Listesi */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#888' }}>Yükleniyor...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '40px' }}>
          {posts.length === 0 && <p style={{ color: '#ccc', textAlign: 'center' }}>Burada henüz ses yok.</p>}
          
          {posts.map((post) => (
            <div key={post.post_id} style={{ background: 'rgba(0, 255, 255, 0.05)', border: '1px solid #00ffff33', borderRadius: 6, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h4 style={{ fontWeight: 'bold', color: 'white', margin: 0, fontSize: '0.95rem' }}>{post.title}</h4>
                <span style={{ fontSize: '0.75rem', color: '#888' }}>{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
              <p style={{ color: '#ccc', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '12px' }}>{post.content}</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #00ffff22', paddingTop: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8rem', color: '#00ffff' }}>👤 {post.author || "Anonim"}</span>
                  {!selectedZone && post.zone_name && (
                    <span style={{ fontSize: '0.7rem', color: '#aaa', marginTop: '2px' }}>📍 {post.zone_name}</span>
                  )}
                </div>
                <button 
                  onClick={() => toggleComments(post.post_id)}
                  style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  💬 {expandedPostId === post.post_id ? "Gizle" : "Yorumlar"}
                </button>
              </div>

              {/* Yorum Alanı */}
              {expandedPostId === post.post_id && (
                <div style={{ marginTop: '15px', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '4px' }}>
                  {commentsLoading ? (
                    <p style={{ fontSize: '0.8rem', color: '#888' }}>Yorumlar yükleniyor...</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                      {comments.length === 0 ? (
                        <p style={{ fontSize: '0.8rem', color: '#666', fontStyle: 'italic' }}>Henüz yorum yapılmamış.</p>
                      ) : (
                        comments.map(comment => (
                          <div key={comment.comment_id} style={{ borderBottom: '1px solid #333', paddingBottom: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '0.75rem', color: '#00ffff', fontWeight: 'bold' }}>{comment.author}</span>
                              <span style={{ fontSize: '0.7rem', color: '#555' }}>{new Date(comment.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: '#ddd', margin: '4px 0 0 0' }}>{comment.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  <form onSubmit={(e) => handleCommentSubmit(e, post.post_id)} style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" placeholder="Yorum yaz..." value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)}
                      style={{ flex: 1, background: '#1a202c', border: '1px solid #444', color: 'white', borderRadius: '4px', padding: '6px', fontSize: '0.85rem', outline: 'none' }}
                    />
                    <button type="submit" style={{ background: '#22c55e', border: 'none', borderRadius: '4px', padding: '0 10px', color: 'white', cursor: 'pointer', fontSize: '0.8rem' }}>➜</button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ background: '#020817', padding: '20px', borderRadius: '8px', border: '1px solid #00ffff', width: '90%', maxWidth: '400px', boxShadow: '0 0 20px rgba(0,255,255,0.2)' }}>
            <h3 style={{ color: '#00ffff', marginTop: 0, marginBottom: '16px' }}>Yeni Paylaşım</h3>
            <form onSubmit={handlePostSubmit}>
              <input 
                type="text" placeholder="Başlık" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required 
                style={{ width: '100%', padding: '10px', marginBottom: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '4px', outline: 'none' }}
              />
              <textarea 
                placeholder="İçerik" value={newContent} onChange={(e) => setNewContent(e.target.value)} required rows="4"
                style={{ width: '100%', padding: '10px', marginBottom: '12px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '4px', outline: 'none', resize: 'none' }}
              />
              
              {/* SELECT KUTUSU - Sorun Çözüldü */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: '#aaa', fontSize: '0.8rem', marginBottom: '6px' }}>Konum:</label>
                <select 
                  value={postZoneId} 
                  onChange={(e) => setPostZoneId(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', color: 'white', borderRadius: '4px', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="">🌐 Genel (Konumsuz)</option>
                  
                  {zonesList.map((zone, index) => {
                    // ID'yi her neredeyse bulup çıkarıyoruz
                    const zId = zone.properties?.zone_id || zone.properties?.id || zone.id;
                    const zName = zone.properties?.name || zone.name || "Bilinmeyen Bölge";
                    
                    // Eğer ID yoksa bu seçeneği listelemeyelim (Güvenlik)
                    if (!zId) return null;

                    return (
                      <option key={zId} value={zId}>
                        📍 {zName}
                      </option>
                    );
                  })}
                  
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
    </div>
  );
};

export default Forum;