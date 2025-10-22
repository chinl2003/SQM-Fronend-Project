import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconInput } from "@/components/IconInput";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Clock, Upload, Eye, EyeOff, Users, Store, TrendingUp, Shield, Zap, Star, Lock, Phone, Mail } from "lucide-react";
import { z } from "zod";
import clsx from "clsx";
import { api } from "@/lib/api";
import type { ApiResponse, LoginResponse } from "@/lib/api";

const loginSchema = z.object({
  email: z.string().email({ message: "Email không hợp lệ" }),
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
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState<"phone" | "otp" | "newPassword">("phone");

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup form state
  const [signupPhone, setSignupPhone] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [birthday, setBirthday] = useState(""); 

  // Forgot password state
  const [forgotPhone, setForgotPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // OTP verification state
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otpForVerification, setOtpForVerification] = useState("");
  const [signupPhoneForOtp, setSignupPhoneForOtp] = useState("");

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      loginSchema.parse({ email: loginEmail, password: loginPassword });
      setIsLoading(true);

      const response = await api.post<ApiResponse<LoginResponse>>("/api/account/login", {
        email: loginEmail.trim(),
        password: loginPassword,
        rememberLogin: true,
      });
      if (!response?.code?.toLowerCase().includes("success") || !response?.data?.accessToken) {
        throw new Error(response?.message || "Đăng nhập thất bại");
      }

      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      localStorage.setItem("fullName", response.data.fullName);
      localStorage.setItem("userId", response.data.userId);
      localStorage.setItem("role", response.data.role);

      toast.success("Đăng nhập thành công!");
      const role = response.data.role?.toLowerCase();
      if (role === "customer") {
        navigate("/");
      } else if (role === "vendor") {
        navigate("/vendor");
      } else if (role === "admin") {
        navigate("/admin");
      } else {
        navigate("/"); 
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Đăng nhập thất bại! Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      signupSchema.parse({ phone: signupPhone, password: signupPassword, fullName, address });
      if (signupPassword !== confirmPassword) throw new Error("Mật khẩu xác nhận không khớp");

      setIsLoading(true);

      const formData = new FormData();
      formData.append("FullName", fullName);
      formData.append("Email", signupEmail || `${signupPhone.replace(/\D/g, '')}@smartqueue.app`);
      formData.append("Username", signupPhone.replace(/\D/g, ''));
      formData.append("Password", signupPassword);
      formData.append("PhoneNumber", signupPhone);
      formData.append("Gender", gender === "male" ? "true" : "false");
      if (address) formData.append("Address", address);
      if (birthday) formData.append("Birthday", new Date(birthday).toISOString());
      if (avatarFile) formData.append("Image", avatarFile);

      const response = await api.post("/api/account/register", formData);

      setSignupPhoneForOtp(signupEmail || signupPhone);
      setShowOtpVerification(true);

      toast.success("Đăng ký thành công", {
        description: "Tài khoản của bạn đã được tạo!",
      });
    } catch (error) {
      toast.error("Đăng ký thất bại", {
        description:
          error instanceof z.ZodError
            ? error.errors[0].message
            : error.message || "Vui lòng thử lại",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async () => {
    if (forgotPasswordStep === "phone") {
      toast.success("OTP đã được gửi! Vui lòng kiểm tra điện thoại của bạn.");
      setForgotPasswordStep("otp");
    } 
    else if (forgotPasswordStep === "otp") {
      if (otp.length === 6) {
        toast.success("Xác thực OTP thành công!");
        setForgotPasswordStep("newPassword");
      } else {
        toast.error("OTP không hợp lệ! Vui lòng nhập đúng mã OTP.");
      }
    } 
    else if (forgotPasswordStep === "newPassword") {
      toast.success("Đổi mật khẩu thành công! Vui lòng đăng nhập lại với mật khẩu mới.");
      setShowForgotPassword(false);
      setForgotPasswordStep("phone");
      setForgotPhone("");
      setOtp("");
      setNewPassword("");
    }
  };

  const handleOtpVerification = async () => {
    if (!otpForVerification || otpForVerification.length !== 6) {
      toast.error("OTP không hợp lệ! Vui lòng nhập đúng mã OTP.");
      return;
    }

    try {
      setIsLoading(true);

      const email =
        signupEmail && signupEmail.trim() !== ""
          ? signupEmail.trim()
          : `${signupPhoneForOtp.replace(/\D/g, "")}@smartqueue.app`;

      const response = await api.post("/api/account/verify-otp", {
        email,
        otp: otpForVerification,
      });

      toast.success("Xác thực thành công! Tài khoản của bạn đã được kích hoạt.");
      setShowOtpVerification(false);
      setOtpForVerification("");
      setSignupPhoneForOtp("");
      setIsSignup(false);
    } catch (error) {
      toast.error(error.message || "Xác thực thất bại! Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute top-1/4 left-1/4 w-60 h-60 bg-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: "2s" }}></div>
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

        {/* Card with transition between Login/Signup */}
        <div className="relative">
          <Card
            key={isSignup ? "signup" : "login"}
            className={clsx(
              "shadow-2xl border-0 backdrop-blur-sm bg-white/95 transition-all duration-500 ease-in-out transform",
              "animate-fade-scale"
            )}
          >
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                {isSignup ? "Đăng ký" : "Đăng nhập"}
              </CardTitle>
              <CardDescription>{isSignup ? "Tạo tài khoản mới để bắt đầu" : "Chào mừng bạn quay trở lại"}</CardDescription>
            </CardHeader>
            <CardContent>
              {!isSignup ? (
                <form onSubmit={handleLogin} className="space-y-5">
                  <IconInput
                    id="login-email"
                    label="Email"
                    placeholder="Vui lòng nhập email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    icon={<Mail />}
                  />
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-base">Mật khẩu</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground opacity-60 w-4 h-4" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        className="h-12 pr-10 pl-10 border-2 text-base"
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
                  <Button type="submit" className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105" disabled={isLoading}>
                    {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                  </Button>
                  <div className="text-center pt-4 border-t-2">
                    <p className="text-sm text-muted-foreground">
                      Chưa có tài khoản?{" "}
                      <button type="button" onClick={() => setIsSignup(true)} className="text-primary font-bold hover:underline text-base">
                        Đăng ký ngay
                      </button>
                    </p>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSignup} className="space-y-5">
                  {/* Avatar */}
                  <div className="flex flex-col items-center mb-4">
                    <div
                      className="relative w-28 h-28 rounded-full border-4 border-primary/20 overflow-hidden bg-secondary cursor-pointer hover:border-primary transition-all group"
                      onClick={() => document.getElementById('avatar')?.click()}
                    >
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
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
                    <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                    <p className="text-xs text-muted-foreground mt-2">Click để tải ảnh lên</p>
                  </div>

                  <IconInput id="fullname" label="Họ và tên" placeholder="Nguyễn Văn A" value={fullName} onChange={(e) => setFullName(e.target.value)} icon={<Users />} />
                  <IconInput id="signup-phone" label="Số điện thoại" placeholder="Vui lòng nhập số điện thoại" value={signupPhone} onChange={(e) => setSignupPhone(e.target.value)} icon={<Phone />} />
                  <IconInput id="signup-email" label="Email" placeholder="Vui lòng nhập email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} icon={<Mail  />} />
                  <IconInput id="address" label="Địa chỉ" placeholder="123 Đường ABC, Quận XYZ" value={address} onChange={(e) => setAddress(e.target.value)} icon={<Store />} />
                  <div className="space-y-2">
                    <Label className="text-base">Giới tính</Label>
                    <div className="flex gap-4">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value="male"
                          checked={gender === "male"}
                          onChange={() => setGender("male")}
                          className="accent-primary"
                        />
                        Nam
                      </label>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value="female"
                          checked={gender === "female"}
                          onChange={() => setGender("female")}
                          className="accent-primary"
                        />
                        Nữ
                      </label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthday" className="text-base">Ngày sinh</Label>
                    <Input
                      id="birthday"
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      className="h-12 text-base border-2"
                    />
                  </div>
                  <IconInput id="signup-password" label="Mật khẩu" type="password" placeholder="••••••••" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} icon={<Lock />} showPasswordToggle />
                  <IconInput id="signup-confirm-password" label="Nhập lại mật khẩu" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} icon={<Lock />} showPasswordToggle />

                  <Button type="submit" className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105" disabled={isLoading}>
                    {isLoading ? "Đang đăng ký..." : "Đăng ký"}
                  </Button>
                  <div className="text-center pt-4 border-t-2">
                    <p className="text-sm text-muted-foreground">
                      Đã có tài khoản?{" "}
                      <button type="button" onClick={() => setIsSignup(false)} className="text-primary font-bold hover:underline text-base">
                        Đăng nhập ngay
                      </button>
                    </p>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-white/70 text-sm mt-8 drop-shadow">© 2024 Smart Queue. All rights reserved.</p>
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

          {/* Multi-step modal with slide + fade */}
          <div className="relative h-52 overflow-hidden">
            <div className={clsx(
              "absolute inset-0 transition-all duration-500 ease-in-out",
              forgotPasswordStep === "phone" ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-full"
            )}>
              <IconInput
                id="forgot-phone"
                label="Số điện thoại"
                placeholder="Vui lòng nhập số điện thoại"
                value={forgotPhone}
                onChange={(e) => setForgotPhone(e.target.value)}
                icon={<Phone />}
              />
            </div>

            <div className={clsx(
              "absolute inset-0 transition-all duration-500 ease-in-out",
              forgotPasswordStep === "otp" ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
            )}>
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

            <div className={clsx(
              "absolute inset-0 transition-all duration-500 ease-in-out",
              forgotPasswordStep === "newPassword" ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
            )}>
              <IconInput id="new-password" label="Mật khẩu mới" type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} icon={<Lock />} showPasswordToggle />
              <IconInput id="confirm-new-password" label="Nhập lại mật khẩu" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} icon={<Lock />} showPasswordToggle />
            </div>
          </div>

          <Button onClick={handleForgotPasswordSubmit} className="w-full h-11 font-semibold mt-4">
            {forgotPasswordStep === "phone" && "Gửi mã OTP"}
            {forgotPasswordStep === "otp" && "Xác nhận OTP"}
            {forgotPasswordStep === "newPassword" && "Đặt lại mật khẩu"}
          </Button>
        </DialogContent>
      </Dialog>

       {/* OTP Verification Modal */}
        {showOtpVerification && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-96">
              <h2 className="text-2xl font-bold mb-4">Xác thực OTP</h2>
              <p className="mb-4">Nhập mã OTP đã gửi tới số {signupPhoneForOtp}</p>
              <Input
                placeholder="000000"
                value={otpForVerification}
                onChange={(e) => setOtpForVerification(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="mb-4 text-center text-xl"
              />
              <div className="flex gap-4">
                <Button className="flex-1" onClick={handleOtpVerification} disabled={isLoading}>
                  {isLoading ? "Đang xác thực..." : "Xác thực"}
                </Button>
                <Button className="flex-1" onClick={() => setShowOtpVerification(false)}>
                  Hủy
                </Button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default Auth;
