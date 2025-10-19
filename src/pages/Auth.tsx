import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Clock, Upload, Eye, EyeOff, Users, Store, TrendingUp, Shield, Zap, Star } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  phone: z.string().min(10, { message: "Số điện thoại phải có ít nhất 10 số" }),
  password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),
});

const signupSchema = z.object({
  phone: z.string().min(10, { message: "Số điện thoại phải có ít nhất 10 số" }),
  password: z.string().min(6, { message: "Mật khẩu phải có ít nhất 6 ký tự" }),
  fullName: z.string().min(2, { message: "Họ tên phải có ít nhất 2 ký tự" }),
  address: z.string().min(5, { message: "Địa chỉ phải có ít nhất 5 ký tự" }),
});

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<"phone" | "otp" | "newPassword">("phone");
  const [countryCode, setCountryCode] = useState("+84");

  // Login form state
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");

  // Forgot password state
  const [forgotPhone, setForgotPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      loginSchema.parse({ phone: loginPhone, password: loginPassword });
      
      setIsLoading(true);
      
      // Convert phone to email format for Supabase auth
      const email = `${loginPhone.replace(/\D/g, '')}@smartqueue.app`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: loginPassword,
      });

      if (error) throw error;

      toast({
        title: "Đăng nhập thành công",
        description: "Chào mừng bạn quay trở lại!",
      });

      navigate("/");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Lỗi xác thực",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Đăng nhập thất bại",
          description: error.message || "Vui lòng kiểm tra lại số điện thoại và mật khẩu",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      signupSchema.parse({
        phone: signupPhone,
        password: signupPassword,
        fullName,
        address,
      });

      setIsLoading(true);

      // Convert phone to email format for Supabase auth
      const email = `${signupPhone.replace(/\D/g, '')}@smartqueue.app`;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: signupPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
            phone: signupPhone,
            address: address,
            avatar_url: avatarPreview || "",
          },
        },
      });

      if (authError) throw authError;

      toast({
        title: "Đăng ký thành công",
        description: "Tài khoản của bạn đã được tạo!",
      });

      navigate("/");
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Lỗi xác thực",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Đăng ký thất bại",
          description: error.message || "Vui lòng thử lại",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async () => {
    if (forgotPasswordStep === "phone") {
      // Simulate sending OTP
      toast({
        title: "OTP đã được gửi",
        description: "Vui lòng kiểm tra điện thoại của bạn",
      });
      setForgotPasswordStep("otp");
    } else if (forgotPasswordStep === "otp") {
      // Verify OTP (simplified)
      if (otp.length === 6) {
        setForgotPasswordStep("newPassword");
      } else {
        toast({
          title: "OTP không hợp lệ",
          description: "Vui lòng nhập đúng mã OTP",
          variant: "destructive",
        });
      }
    } else if (forgotPasswordStep === "newPassword") {
      // Reset password
      toast({
        title: "Đổi mật khẩu thành công",
        description: "Vui lòng đăng nhập lại với mật khẩu mới",
      });
      setShowForgotPassword(false);
      setForgotPasswordStep("phone");
      setForgotPhone("");
      setOtp("");
      setNewPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated 3D Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating orbs */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute top-1/4 left-1/4 w-60 h-60 bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "2s" }}></div>
        
        {/* Floating icons */}
        <div className="absolute top-20 left-10 animate-float">
          <Users className="h-12 w-12 text-white/20" />
        </div>
        <div className="absolute top-40 right-20 animate-float" style={{ animationDelay: "0.5s" }}>
          <Store className="h-16 w-16 text-white/15" />
        </div>
        <div className="absolute bottom-40 left-20 animate-float" style={{ animationDelay: "1s" }}>
          <TrendingUp className="h-14 w-14 text-white/20" />
        </div>
        <div className="absolute bottom-20 right-40 animate-float" style={{ animationDelay: "1.5s" }}>
          <Shield className="h-12 w-12 text-white/15" />
        </div>
        <div className="absolute top-1/2 left-10 animate-float" style={{ animationDelay: "2s" }}>
          <Zap className="h-10 w-10 text-white/20" />
        </div>
        <div className="absolute top-1/3 right-10 animate-float" style={{ animationDelay: "2.5s" }}>
          <Star className="h-12 w-12 text-white/15" />
        </div>
        
        {/* Animated text */}
        <div className="absolute top-10 right-1/4 text-white/10 font-bold text-6xl animate-float" style={{ animationDelay: "0.3s" }}>
          Smart
        </div>
        <div className="absolute bottom-10 left-1/4 text-white/10 font-bold text-5xl animate-float" style={{ animationDelay: "1.8s" }}>
          Queue
        </div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-2xl mb-4 transform hover:scale-110 transition-transform duration-300">
            <Clock className="h-11 w-11 text-primary animate-pulse" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-lg">Smart Queue</h1>
          <p className="text-white/90 text-lg">Hệ thống quản lý hàng đợi thông minh</p>
        </div>

        <Card className="shadow-2xl border-0 animate-scale-in backdrop-blur-sm bg-white/95">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              {isSignup ? "Đăng ký" : "Đăng nhập"}
            </CardTitle>
            <CardDescription className="text-base">
              {isSignup ? "Tạo tài khoản mới để bắt đầu" : "Chào mừng bạn quay trở lại"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isSignup ? (
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="login-phone" className="text-base">Số điện thoại</Label>
                  <div className="flex gap-2">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger className="w-24 h-12 border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="+84">🇻🇳 +84</SelectItem>
                        <SelectItem value="+1">🇺🇸 +1</SelectItem>
                        <SelectItem value="+44">🇬🇧 +44</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      id="login-phone"
                      type="tel"
                      placeholder="987 654 321"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      required
                      className="flex-1 h-12 border-2 text-base"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password" className="text-base">Mật khẩu</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="h-12 pr-10 border-2 text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105" 
                  disabled={isLoading}
                >
                  {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>
                
                <div className="text-center pt-4 border-t-2">
                  <p className="text-sm text-muted-foreground">
                    Chưa có tài khoản?{" "}
                    <button
                      type="button"
                      onClick={() => setIsSignup(true)}
                      className="text-primary font-bold hover:underline text-base"
                    >
                      Đăng ký ngay
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-5">
                {/* Avatar at top center */}
                <div className="flex flex-col items-center mb-4">
                  <div 
                    className="relative w-28 h-28 rounded-full border-4 border-primary/20 overflow-hidden bg-secondary cursor-pointer hover:border-primary transition-all group"
                    onClick={() => document.getElementById('avatar')?.click()}
                  >
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                        <Upload className="h-8 w-8 mb-1" />
                        <span className="text-xs">No image</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Upload className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground mt-2">Click để tải ảnh lên</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullname" className="text-base">Họ và tên</Label>
                  <Input
                    id="fullname"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="h-12 border-2 text-base"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-phone" className="text-base">Số điện thoại</Label>
                  <div className="flex gap-2">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger className="w-24 h-12 border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="+84">🇻🇳 +84</SelectItem>
                        <SelectItem value="+1">🇺🇸 +1</SelectItem>
                        <SelectItem value="+44">🇬🇧 +44</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      id="signup-phone"
                      type="tel"
                      placeholder="987 654 321"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      required
                      className="flex-1 h-12 border-2 text-base"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-base">Mật khẩu</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      className="h-12 pr-10 border-2 text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-base">Địa chỉ</Label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="123 Đường ABC, Quận XYZ"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    className="h-12 border-2 text-base"
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105" 
                  disabled={isLoading}
                >
                  {isLoading ? "Đang đăng ký..." : "Đăng ký"}
                </Button>
                
                <div className="text-center pt-4 border-t-2">
                  <p className="text-sm text-muted-foreground">
                    Đã có tài khoản?{" "}
                    <button
                      type="button"
                      onClick={() => setIsSignup(false)}
                      className="text-primary font-bold hover:underline text-base"
                    >
                      Đăng nhập ngay
                    </button>
                  </p>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-white/70 text-sm mt-8 drop-shadow">
          © 2024 Smart Queue. All rights reserved.
        </p>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {forgotPasswordStep === "phone" && "Quên mật khẩu"}
              {forgotPasswordStep === "otp" && "Nhập mã OTP"}
              {forgotPasswordStep === "newPassword" && "Đặt mật khẩu mới"}
            </DialogTitle>
            <DialogDescription>
              {forgotPasswordStep === "phone" && "Nhập số điện thoại để nhận mã OTP"}
              {forgotPasswordStep === "otp" && "Nhập mã OTP đã được gửi đến điện thoại của bạn"}
              {forgotPasswordStep === "newPassword" && "Nhập mật khẩu mới cho tài khoản của bạn"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {forgotPasswordStep === "phone" && (
              <div className="space-y-2">
                <Label htmlFor="forgot-phone">Số điện thoại</Label>
                <div className="flex gap-2">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-24 h-11 border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+84">🇻🇳 +84</SelectItem>
                      <SelectItem value="+1">🇺🇸 +1</SelectItem>
                      <SelectItem value="+44">🇬🇧 +44</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id="forgot-phone"
                    type="tel"
                    placeholder="987 654 321"
                    value={forgotPhone}
                    onChange={(e) => setForgotPhone(e.target.value)}
                    className="flex-1 h-11 border-2"
                  />
                </div>
              </div>
            )}
            
            {forgotPasswordStep === "otp" && (
              <div className="space-y-2">
                <Label htmlFor="otp">Mã OTP (6 số)</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="h-11 border-2 text-center text-2xl tracking-widest"
                />
              </div>
            )}
            
            {forgotPasswordStep === "newPassword" && (
              <div className="space-y-2">
                <Label htmlFor="new-password">Mật khẩu mới</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-11 border-2"
                />
              </div>
            )}
            
            <Button 
              onClick={handleForgotPasswordSubmit} 
              className="w-full h-11 font-semibold"
            >
              {forgotPasswordStep === "phone" && "Gửi mã OTP"}
              {forgotPasswordStep === "otp" && "Xác nhận OTP"}
              {forgotPasswordStep === "newPassword" && "Đặt lại mật khẩu"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
