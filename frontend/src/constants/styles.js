// Ortak style objeleri - inline style'lar için

export const panelStyles = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10000,
  padding: '20px'
};

export const panelContentStyles = {
  backgroundColor: '#020817',
  border: '2px solid #00ffff',
  borderRadius: '8px',
  padding: '20px',
  maxWidth: '800px',
  width: '100%',
  maxHeight: '90vh',
  color: 'white',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
};

export const buttonStyles = {
  primary: {
    padding: '10px 20px',
    background: '#00ffff',
    color: '#00111f',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    transition: 'all 0.2s ease'
  },
  secondary: {
    padding: '10px 20px',
    background: '#333',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    transition: 'all 0.2s ease'
  },
  danger: {
    padding: '10px 20px',
    background: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    transition: 'all 0.2s ease'
  },
  success: {
    padding: '10px 20px',
    background: '#22c55e',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    transition: 'all 0.2s ease'
  }
};

export const inputStyles = {
  base: {
    width: '100%',
    padding: '10px',
    background: '#111',
    border: '1px solid #333',
    color: 'white',
    borderRadius: '4px',
    marginBottom: '10px',
    fontSize: '0.9rem',
    boxSizing: 'border-box',
    outline: 'none'
  },
  focus: {
    borderColor: '#00ffff',
    boxShadow: '0 0 8px rgba(0, 255, 255, 0.3)'
  }
};

export const cardStyles = {
  base: {
    background: 'rgba(0, 255, 255, 0.05)',
    border: '1px solid rgba(0, 255, 255, 0.3)',
    borderRadius: '6px',
    padding: '12px',
    color: 'white'
  },
  boat: {
    background: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '8px',
    padding: '20px'
  },
  equipment: {
    background: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    borderRadius: '8px',
    padding: '20px'
  },
  activity: {
    background: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: '6px',
    padding: '10px'
  }
};

export const errorStyles = {
  background: 'rgba(220, 38, 38, 0.2)',
  border: '1px solid #dc2626',
  borderRadius: '4px',
  padding: '10px',
  marginBottom: '15px',
  color: '#fca5a5',
  flexShrink: 0
};

export const loadingStyles = {
  color: '#888',
  textAlign: 'center',
  padding: '20px'
};

