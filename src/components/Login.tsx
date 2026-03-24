import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from '../hooks/useNavigate';
import { LogIn, Shield } from 'lucide-react';

export function Login() {
  const { setAccessToken, setUserEmail } = useAuth();
  const navigate = useNavigate();

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setAccessToken(tokenResponse.access_token);

      try {
        const userInfoResponse = await fetch(
          'https://www.googleapis.com/oauth2/v2/userinfo',
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          }
        );

        if (userInfoResponse.ok) {
          const userInfo = await userInfoResponse.json();
          setUserEmail(userInfo.email);
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }

      navigate('/dashboard');
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
    scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full">
              <Shield className="w-8 h-8 text-slate-700" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">
              Asset Management
            </h1>
            <p className="text-slate-600">
              Sign in with your Google account to access the dashboard
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => login()}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-300 hover:border-slate-400 text-slate-700 font-semibold py-3.5 px-6 rounded-xl transition-all hover:shadow-md active:scale-95"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-500">
                  Secure authentication
                </span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <LogIn className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-slate-700 space-y-1">
                  <p className="font-medium">Required Permissions:</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    <li>Access to Google Sheets</li>
                    <li>View your email address</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500">
            By signing in, you agree to access your Google Sheets data
          </div>
        </div>
      </div>
    </div>
  );
}
