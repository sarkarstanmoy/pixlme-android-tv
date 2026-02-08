let authContext: any = null;

export const setAuthContext = (context: any) => {
  authContext = context;
};

export const getAuthContext = () => authContext;
