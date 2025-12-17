import React, { useState } from 'react';
import BasePanel from '../BasePanel';
import { TabContainer, TabButtons, TabContent } from '../../ui/Tab';
import MonthlyTab from './MonthlyTab';
import AnalysisTab from './AnalysisTab';
import TrendTab from './TrendTab';
import styles from './styles.module.css';

const AccountingPanel = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('monthly');

  const tabs = [
    { id: 'monthly', label: 'Aylık Kazanç' },
    { id: 'analysis', label: 'Gelir Analizi' },
    { id: 'trend', label: 'Trend Analizi' }
  ];

  return (
    <BasePanel
      isOpen={true}
      onClose={onClose}
      title="💰 Muhasebe"
      maxWidth="600px"
    >
      <TabContainer>
        <TabButtons
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <TabContent>
          {activeTab === 'monthly' && <MonthlyTab onClose={onClose} />}
          {activeTab === 'analysis' && <AnalysisTab />}
          {activeTab === 'trend' && <TrendTab />}
        </TabContent>
      </TabContainer>
    </BasePanel>
  );
};

export default AccountingPanel;

