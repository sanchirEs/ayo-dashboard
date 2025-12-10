import { auth } from "@/auth";

const getToken = async () => {
  try {
    const session = await auth();
    
    if (!session) {
      console.warn('[Auth] No session found in getToken');
      return null;
    }
    
    if (!session?.user?.accessToken) {
      console.error('[Auth] Session exists but no accessToken', {
        hasUser: !!session.user,
        userId: session.user?.id,
        timestamp: new Date().toISOString(),
      });
      return null;
    }
    
    return session.user.accessToken;
  } catch (error) {
    console.error('[Auth] Error in getToken:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    return null;
  }
};

export const getSession = async () => {
  try {
    const session = await auth();
    
    if (!session) {
      console.warn('[Auth] No session found in getSession');
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('[Auth] Error in getSession:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    return null;
  }
};

export default getToken;
