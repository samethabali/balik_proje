import React, { useState } from 'react';
import { loginUser } from '../../api/api';
import toast from 'react-hot-toast';
import Input from '../ui/Input';
import Button from '../ui/Button';
import styles from './styles.module.css';

const LoginForm = ({ onSuccess, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await loginUser(email, password);
      toast.success('Giriş başarılı.');
      onSuccess?.(result.token, result.user);
      setEmail('');
      setPassword('');
    } catch (err) {
      toast.error(err.message || 'İşlem başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.authForm}>
      <h3 className={styles.authTitle}>🔐 Giriş Yap</h3>
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
        {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
      </Button>
      <p className={styles.authSwitch}>
        Hesabınız yok mu?{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); onSwitchToRegister?.(); }} className={styles.authLink}>
          Kayıt Ol
        </a>
      </p>
    </form>
  );
};

export default LoginForm;

