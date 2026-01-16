import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2, ArrowLeft, Lock, CheckCircle } from 'lucide-react';
import { postDataHandler } from '@/config/services';
import logo from '@/assets/logo.png';

export function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Get email and OTP from localStorage
    const storedEmail = localStorage.getItem('resetEmail');
    const storedOtp = localStorage.getItem('resetOtp');
    
    if (!storedEmail || !storedOtp) {
      navigate('/forgot-password');
      return;
    }
    
    setEmail(storedEmail);
    setOtp(storedOtp);
  }, [navigate]);

  const validatePassword = () => {
    if (newPassword.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])/.test(newPassword)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(newPassword)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(newPassword)) {
      return 'Password must contain at least one number';
    }
    if (newPassword !== confirmPassword) {
      return 'Passwords do not match';
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const res = await postDataHandler("reset_password", {
        email: email,
        otp: otp,
        newPassword: newPassword,
      });

      if (res.message) {
        setSuccess(res.message);
        // Clear localStorage after successful reset
        localStorage.removeItem('resetEmail');
        localStorage.removeItem('resetOtp');
        
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = () => {
    if (newPassword.length === 0) return { text: '', level: 0 };
    if (newPassword.length < 8) return { text: 'Weak', level: 1 };
    
    const hasLower = /[a-z]/.test(newPassword);
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    
    const score = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    
    if (score === 4) return { text: 'Strong', level: 4 };
    if (score >= 3) return { text: 'Good', level: 3 };
    if (score >= 2) return { text: 'Fair', level: 2 };
    return { text: 'Weak', level: 1 };
  };

  const strength = passwordStrength();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="w-12 h-12 rounded-xl" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">CRM</h1>
              <p className="text-sm text-muted-foreground">Management System</p>
            </div>
          </div>
        </div>

        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/verify-otp')}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="text-2xl">Reset Password</CardTitle>
                <CardDescription>
                  Create a new password for your account
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle className="w-4 h-4" />
                  {success}. Redirecting to login...
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="h-11"
                />
                {newPassword && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Password strength:</span>
                      <span className={`
                        ${strength.level >= 3 ? 'text-green-600' : 
                          strength.level >= 2 ? 'text-yellow-600' : 
                          'text-red-600'}
                        font-medium
                      `}>
                        {strength.text}
                      </span>
                    </div>
                    <div className="h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`
                          h-full transition-all duration-300
                          ${strength.level === 4 ? 'w-full bg-green-500' : 
                            strength.level === 3 ? 'w-3/4 bg-green-400' : 
                            strength.level === 2 ? 'w-1/2 bg-yellow-500' : 
                            'w-1/4 bg-red-500'}
                        `}
                      />
                    </div>
                    <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                      <li className={`flex items-center gap-1 ${newPassword.length >= 8 ? 'text-green-600' : ''}`}>
                        {newPassword.length >= 8 ? '✓' : '•'} At least 8 characters
                      </li>
                      <li className={`flex items-center gap-1 ${/(?=.*[a-z])/.test(newPassword) ? 'text-green-600' : ''}`}>
                        {/(?=.*[a-z])/.test(newPassword) ? '✓' : '•'} One lowercase letter
                      </li>
                      <li className={`flex items-center gap-1 ${/(?=.*[A-Z])/.test(newPassword) ? 'text-green-600' : ''}`}>
                        {/(?=.*[A-Z])/.test(newPassword) ? '✓' : '•'} One uppercase letter
                      </li>
                      <li className={`flex items-center gap-1 ${/(?=.*\d)/.test(newPassword) ? 'text-green-600' : ''}`}>
                        {/(?=.*\d)/.test(newPassword) ? '✓' : '•'} One number
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-11"
                />
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Passwords match
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full h-11" disabled={isLoading || !!success}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Reset Password
                  </>
                )}
              </Button>

              <div className="text-center">
                <Button
                  variant="link"
                  onClick={() => navigate('/login')}
                  className="text-sm"
                >
                  Back to login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}