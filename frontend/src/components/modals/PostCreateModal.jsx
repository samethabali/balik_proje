import React, { useState } from 'react';
import { createPost, fetchZonePosts, fetchAllPosts } from '../../api/api';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import Button from '../ui/Button';
import styles from './styles.module.css';

const PostCreateModal = ({ isOpen, onClose, selectedZone, zonesList, onPostCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      const activeZoneId = selectedZone ? (selectedZone.zone_id || selectedZone.id) : '';
      setZoneId(activeZoneId || '');
    } else {
      // Modal kapandığında formu temizle
      setTitle('');
      setContent('');
      setPhotoUrl('');
      setZoneId('');
    }
  }, [isOpen, selectedZone]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Dosya boyutu çok büyük! Lütfen 5MB'dan küçük bir resim seçin.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let zoneToSend = null;
      if (zoneId && zoneId !== "") {
        const parsed = parseInt(zoneId, 10);
        if (!isNaN(parsed)) {
          zoneToSend = parsed;
        }
      }

      await createPost({
        title,
        content,
        zone_id: zoneToSend,
        visibility: 'public',
        photoUrl: photoUrl || null
      });

      setTitle('');
      setContent('');
      setPhotoUrl('');
      setZoneId('');
      onClose();

      // Post listesini yenile
      const currentViewId = selectedZone ? (selectedZone.zone_id || selectedZone.id) : null;
      const updated = currentViewId ? await fetchZonePosts(currentViewId) : await fetchAllPosts();
      onPostCreated?.(updated);

      toast.success('Paylaşım oluşturuldu.');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Paylaşım oluşturulamadı.');
    } finally {
      setLoading(false);
    }
  };

  const zoneOptions = zonesList.map((zone) => {
    const zId = zone.properties?.zone_id || zone.properties?.id || zone.id;
    const zName = zone.properties?.name || zone.name || "Bilinmeyen Bölge";
    if (!zId) return null;
    return { value: zId, label: `📍 ${zName}` };
  }).filter(Boolean);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Yeni Paylaşım" maxWidth="400px">
      <form onSubmit={handleSubmit} className={styles.postForm}>
        <Input
          type="text"
          placeholder="Başlık"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <Textarea
          placeholder="İçerik"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={4}
        />
        <div className={styles.fileUploadSection}>
          <label className={styles.fileLabel}>Fotoğraf Yükle (Opsiyonel - Max 5MB)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className={styles.fileInput}
          />
          {photoUrl && (
            <div className={styles.previewSection}>
              <p className={styles.previewText}>Resim seçildi! (Önizleme)</p>
              <img src={photoUrl} alt="Önizleme" className={styles.previewImage} />
            </div>
          )}
        </div>
        <Select
          label="Konum"
          value={zoneId}
          onChange={(e) => setZoneId(e.target.value)}
          options={[{ value: '', label: '🌐 Genel (Konumsuz)' }, ...zoneOptions]}
        />
        <div className={styles.modalActions}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            İptal
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Paylaşılıyor...' : 'Paylaş'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PostCreateModal;

