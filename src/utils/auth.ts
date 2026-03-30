export const loginMock = (email: string) => {
  localStorage.setItem('pagode_finance_token', 'mock-token-123');
  localStorage.setItem('pagode_finance_user', email);
};

export const logoutMock = () => {
  localStorage.removeItem('pagode_finance_token');
  localStorage.removeItem('pagode_finance_user');
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('pagode_finance_token');
};
