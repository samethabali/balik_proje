import React from 'react';
import BasePanel from './panels/BasePanel';
import BoatForm from './forms/BoatForm';
import EquipmentForm from './forms/EquipmentForm';
import ActivityForm from './forms/ActivityForm';

const AdminPanels = ({
  type, // 'boat', 'equipment', 'activity'
  item, // existing item for edit mode (null for create)
  onClose,
  onSuccess
}) => {
  const getTitle = () => {
    const action = item ? 'Düzenle' : 'Yeni Ekle';
    const typeName = type === 'boat' ? 'Tekne' : type === 'equipment' ? 'Ekipman' : 'Etkinlik';
    return `${action} - ${typeName}`;
  };

  return (
    <BasePanel
      isOpen={true}
      onClose={onClose}
      title={getTitle()}
      maxWidth="500px"
    >
      {type === 'boat' && (
        <BoatForm
          item={item}
          onSuccess={onSuccess}
          onClose={onClose}
        />
      )}
      {type === 'equipment' && (
        <EquipmentForm
          item={item}
          onSuccess={onSuccess}
          onClose={onClose}
        />
      )}
      {type === 'activity' && (
        <ActivityForm
          item={item}
          onSuccess={onSuccess}
          onClose={onClose}
        />
      )}
    </BasePanel>
  );
};

export default AdminPanels;
