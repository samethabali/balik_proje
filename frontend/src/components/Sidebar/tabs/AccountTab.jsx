import React, { useState } from 'react';
import { isAdmin } from '../../../utils/admin';
import { TabContainer, TabButtons, TabContent } from '../../ui/Tab';
import LoginForm from '../../forms/LoginForm';
import RegisterForm from '../../forms/RegisterForm';
import ProfileTab from '../../features/account/ProfileTab';
import RentalsTab from '../../features/account/RentalsTab';
import PostsTab from '../../features/account/PostsTab';
import AdminRentalsTab from '../../features/account/AdminRentalsTab';
import AccountingPanel from '../../panels/AccountingPanel';
import AdminStatsPanel from '../../panels/AdminStatsPanel';
import RentalHistoryPanel from '../../panels/RentalHistoryPanel';
import styles from '../styles.module.css';

const ACCOUNT_SUBTABS = {
  LOGIN: 'login',
  PROFILE: 'profile',
  RENTALS: 'rentals',
  POSTS: 'posts',
  ADMIN_RENTALS: 'admin_rentals',
};

const AccountTab = ({
  isLoggedIn,
  currentUser,
  userInfo,
  userStats,
  userForumStats,
  myActiveRentals,
  myPosts,
  accountLoading,
  allRentals,
  rentalsLoading,
  onLoginSuccess,
  onLogout,
  onRefreshRentals,
  calculateCurrentCost
}) => {
  const [accountSubtab, setAccountSubtab] = useState(ACCOUNT_SUBTABS.LOGIN);
  const [authMode, setAuthMode] = useState('login');
  const [accountingPanelOpen, setAccountingPanelOpen] = useState(false);
  const [adminStatsPanelOpen, setAdminStatsPanelOpen] = useState(false);
  const [rentalHistoryPanelOpen, setRentalHistoryPanelOpen] = useState(false);

  React.useEffect(() => {
    if (isLoggedIn && currentUser) {
      if (accountSubtab === ACCOUNT_SUBTABS.LOGIN) {
        setAccountSubtab(isAdmin(currentUser) ? ACCOUNT_SUBTABS.PROFILE : ACCOUNT_SUBTABS.RENTALS);
      }
      if (isAdmin(currentUser) && accountSubtab === ACCOUNT_SUBTABS.RENTALS) {
        setAccountSubtab(ACCOUNT_SUBTABS.PROFILE);
      }
    } else {
      setAccountSubtab(ACCOUNT_SUBTABS.LOGIN);
    }
  }, [isLoggedIn, currentUser]);

  if (!isLoggedIn || !currentUser) {
    return (
      <div className={styles.accountTab}>
        {authMode === 'login' ? (
          <LoginForm
            onSuccess={onLoginSuccess}
            onSwitchToRegister={() => setAuthMode('register')}
          />
        ) : (
          <RegisterForm
            onSuccess={onLoginSuccess}
            onSwitchToLogin={() => setAuthMode('login')}
          />
        )}
      </div>
    );
  }

  const tabs = [];
  if (!isAdmin(currentUser)) {
    tabs.push({ id: ACCOUNT_SUBTABS.RENTALS, label: 'Kiralamalarım' });
  }
  tabs.push({ id: ACCOUNT_SUBTABS.POSTS, label: 'Postlarım' });
  tabs.push({ id: ACCOUNT_SUBTABS.PROFILE, label: 'Profil' });
  if (isAdmin(currentUser)) {
    tabs.push({ id: ACCOUNT_SUBTABS.ADMIN_RENTALS, label: 'Kiralamalar Yönetimi' });
  }

  return (
    <div className={styles.accountTab}>
      <TabContainer>
        <TabButtons
          tabs={tabs}
          activeTab={accountSubtab}
          onTabChange={setAccountSubtab}
        />
        <TabContent>
          {accountLoading ? (
            <p className={styles.loadingText}>Yükleniyor...</p>
          ) : (
            <>
              {accountSubtab === ACCOUNT_SUBTABS.PROFILE && (
                <ProfileTab
                  userInfo={userInfo}
                  userStats={userStats}
                  userForumStats={userForumStats}
                  currentUser={currentUser}
                  onLogout={onLogout}
                  loading={accountLoading}
                />
              )}
              {accountSubtab === ACCOUNT_SUBTABS.RENTALS && !isAdmin(currentUser) && (
                <RentalsTab
                  myActiveRentals={myActiveRentals}
                  calculateCurrentCost={calculateCurrentCost}
                />
              )}
              {accountSubtab === ACCOUNT_SUBTABS.POSTS && (
                <PostsTab myPosts={myPosts} />
              )}
              {accountSubtab === ACCOUNT_SUBTABS.ADMIN_RENTALS && isAdmin(currentUser) && (
                <div>
                  <div className={styles.adminActions}>
                    <button
                      onClick={() => setRentalHistoryPanelOpen(true)}
                      className={styles.adminActionButton}
                    >
                      📊 Geçmiş Kiralamalar
                    </button>
                    <button
                      onClick={() => setAccountingPanelOpen(true)}
                      className={styles.adminActionButton}
                    >
                      💰 Muhasebe
                    </button>
                    <button
                      onClick={() => setAdminStatsPanelOpen(true)}
                      className={styles.adminActionButton}
                    >
                      📊 İstatistikler
                    </button>
                  </div>
                  <AdminRentalsTab
                    allRentals={allRentals}
                    loading={rentalsLoading}
                    onRefresh={onRefreshRentals}
                  />
                </div>
              )}
            </>
          )}
        </TabContent>
      </TabContainer>

      {/* Panels */}
      {accountingPanelOpen && (
        <AccountingPanel onClose={() => setAccountingPanelOpen(false)} />
      )}
      {adminStatsPanelOpen && (
        <AdminStatsPanel onClose={() => setAdminStatsPanelOpen(false)} />
      )}
      {rentalHistoryPanelOpen && (
        <RentalHistoryPanel onClose={() => setRentalHistoryPanelOpen(false)} />
      )}
    </div>
  );
};

export default AccountTab;

