// components/Forum.jsx
import React, { useState, useEffect } from 'react';
import { fetchAllPosts, fetchZonePosts, createPost } from '../api/api';

const Forum = ({ selectedZone, currentUser }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  // Verileri Çekme
  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      try {
        let data;
        
        // --- DÜZELTME BURADA ---
        // Harita verisi bazen 'zone_id', bazen 'id' olarak gelebilir.
        // İkisini de kontrol edip hangisi varsa onu alıyoruz.
        const activeZoneId = selectedZone ? (selectedZone.zone_id || selectedZone.id) : null;

        if (activeZoneId) {
          console.log(`Bölge ID (${activeZoneId}) için postlar çekiliyor...`);
          data = await fetchZonePosts(activeZoneId);
        } else {
          // Zone seçili değilse veya ID bulunamadıysa genel akış
          console.log("Filtre yok veya ID bulunamadı, tüm postlar getiriliyor...");
          data = await fetchAllPosts();
        }
        
        // Gelen verinin dizi olduğundan emin oluyoruz
        setPosts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Forum hatası:", error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [selectedZone]);

  // Post Gönderme
  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = currentUser ? currentUser.user_id : 1; 
    
    // ID kontrolünü burada da yapıyoruz
    const activeZoneId = selectedZone ? (selectedZone.zone_id || selectedZone.id) : null;

    try {
      const postData = {
        user_id: userId,
        title: newTitle,
        content: newContent,
        zone_id: activeZoneId, // Düzeltilmiş ID
        visibility: 'public'
      };

      await createPost(postData);
      setNewTitle('');
      setNewContent('');
      alert("Post gönderildi!");
      
      // Listeyi yenile
      if (activeZoneId) {
          const updated = await fetchZonePosts(activeZoneId);
          setPosts(Array.isArray(updated) ? updated : []);
      } else {
          const updated = await fetchAllPosts();
          setPosts(Array.isArray(updated) ? updated : []);
      }
    } catch (err) {
      alert("Hata: " + err.message);
    }
  };

  return (
    <div className="p-4 text-white h-full overflow-y-auto">
      <h3 className="text-lg font-bold text-cyan-400 mb-4">
        {selectedZone ? `📍 ${selectedZone.name} Forumu` : "🌐 Genel Balıkçı Forumu"}
      </h3>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mb-6 bg-gray-800 p-3 rounded border border-gray-700">
        <input 
          type="text" 
          placeholder="Başlık..." 
          className="w-full mb-2 p-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-cyan-500 outline-none"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          required
        />
        <textarea 
          placeholder="Deneyimlerini paylaş..." 
          className="w-full mb-2 p-2 bg-gray-700 rounded text-white border border-gray-600 focus:border-cyan-500 outline-none"
          rows="3"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          required
        />
        <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded transition font-bold">
          Paylaş
        </button>
      </form>

      {/* Liste */}
      {loading ? <p className="text-center text-gray-500">Yükleniyor...</p> : (
        <div className="space-y-4 pb-20">
          {posts.length === 0 && <p className="text-gray-400 text-sm text-center">Burada henüz ses yok.</p>}
          
          {posts.map((post) => (
            <div key={post.post_id} className="bg-gray-800 p-3 rounded border-l-4 border-cyan-500 shadow-lg">
              <div className="flex justify-between items-start">
                <h4 className="font-bold text-sm text-white">{post.title}</h4>
                <span className="text-[10px] text-gray-400">{new Date(post.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-gray-300 text-xs mt-1">{post.content}</p>
              <div className="mt-2 text-[10px] text-cyan-300 flex justify-between items-center">
                <span>👤 {post.author || "Anonim"}</span>
                {!selectedZone && post.zone_name && (
                   <span className="bg-gray-700 px-2 py-0.5 rounded text-gray-300">📍 {post.zone_name}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Forum;