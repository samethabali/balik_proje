import React, { useState } from 'react';
import { registerUser } from '../../api/api';
import toast from 'react-hot-toast';
import Input from '../ui/Input';
import Button from '../ui/Button';
import styles from './styles.module.css';

const RegisterForm = ({ onSuccess, onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await registerUser(name, email, password, phone);
      toast.success('Kayıt başarılı. Giriş yapıldı.');
      onSuccess?.(result.token, result.user);
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
    } catch (err) {
      toast.error(err.message || 'İşlem başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.authForm}>
      <h3 className={styles.authTitle}>🔐 Kayıt Ol</h3>
      <Input
        type="text"
        placeholder="Ad Soyad"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Input
        type="text"
        placeholder="Telefon (opsiyonel)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <Input
        type="email"
        placeholder="E-posta"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        type="password"
        placeholder="Şifre"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Button type="submit" variant="primary" disabled={loading} className={styles.authButton}>
        {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
      </Button>
      <p className={styles.authSwitch}>
        Zaten hesabınız var mı?{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToLogin?.(); }} className={styles.authLink}>
          Giriş Yap
        </a>
      </p>
    </form>
  );
};

export default RegisterForm;

