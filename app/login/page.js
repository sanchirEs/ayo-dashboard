"use client";
import Link from "next/link";
import { loginSchema } from "@/schemas/userSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import Head from "next/head";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import LoadingButton from "@/components/customui/LoadingButton";
import { PasswordInput } from "@/components/customui/PasswordInput";
import { login } from "@/components/auth/actions/login";

// Force dynamic rendering to prevent SSR issues with browser APIs
export const dynamic = 'force-dynamic';

export default function Login() {
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [currentTime, setCurrentTime] = useState("");
  const [greeting, setGreeting] = useState("");
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  useEffect(() => {
    setIsClient(true);
    
    // Update time and greeting
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
      setCurrentTime(timeString);
      
      const hour = now.getHours();
      if (hour < 12) setGreeting("Good Morning");
      else if (hour < 17) setGreeting("Good Afternoon");
      else setGreeting("Good Evening");
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    
    // Animated background
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      let particles = [];
      
      const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      
      class Particle {
        constructor() {
          this.x = Math.random() * canvas.width;
          this.y = Math.random() * canvas.height;
          this.vx = (Math.random() - 0.5) * 0.5;
          this.vy = (Math.random() - 0.5) * 0.5;
          this.size = Math.random() * 2 + 1;
          this.opacity = Math.random() * 0.5 + 0.1;
        }
        
        update() {
          this.x += this.vx;
          this.y += this.vy;
          
          if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
          if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }
        
        draw() {
          ctx.save();
          ctx.globalAlpha = this.opacity;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      
      // Initialize particles
      for (let i = 0; i < 50; i++) {
        particles.push(new Particle());
      }
      
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach(particle => {
          particle.update();
          particle.draw();
        });
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animate();
    }
    
    return () => {
      clearInterval(interval);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  async function onSubmit(values) {
    setError(undefined);
    startTransition(async () => {
      const result = await login(values);
      
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        // Successful login - redirect to the specified page
        window.location.href = result.redirectTo || "/";
      }
    });
  }

  return (
    <>
      <Head>
        <link rel="stylesheet" href="/css/luxury-login.css" />
      </Head>
             <div className="min-h-screen relative overflow-hidden" style={{
         background: `
           radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.3) 0%, transparent 50%),
           radial-gradient(circle at 80% 20%, rgba(236, 72, 153, 0.3) 0%, transparent 50%),
           radial-gradient(circle at 40% 40%, rgba(6, 182, 212, 0.3) 0%, transparent 50%),
           linear-gradient(135deg, #1e293b 0%, #7c3aed 25%, #ec4899 50%, #3b82f6 75%, #06b6d4 100%)
         `
       }}>
      {/* Animated Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-30"
        style={{ zIndex: 1 }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-purple-900/60 to-slate-900/80" style={{ zIndex: 2 }} />
      
             {/* Enhanced Geometric Patterns */}
       <div className="absolute inset-0" style={{ zIndex: 3 }}>
         <div className="absolute top-20 left-20 w-64 h-64 rounded-full blur-3xl animate-pulse" style={{
           background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.1) 50%, transparent 100%)'
         }}></div>
         <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full blur-3xl animate-pulse" style={{
           background: 'radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, rgba(6, 182, 212, 0.1) 50%, transparent 100%)',
           animationDelay: '2s'
         }}></div>
         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl animate-pulse" style={{
           background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, rgba(139, 92, 246, 0.1) 50%, transparent 100%)',
           animationDelay: '4s'
         }}></div>
       </div>

             {/* Main Content */}
       <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
         <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
                     {/* Left Side - Brand & Value Proposition */}
           <div className="text-white space-y-10">
            {/* Time and Greeting */}
            <div className="space-y-2">
              <div className="text-4xl font-light tracking-wider">{currentTime}</div>
              <div className="text-2xl font-medium">{greeting}, Business Owner</div>
            </div>
            
                         {/* Main Headline */}
             <div className="space-y-6">
               <h1 className="text-6xl lg:text-7xl font-bold leading-tight">
                 Power Your
                 <span className="block gradient-text" style={{
                   background: 'linear-gradient(45deg, #8B5CF6, #A855F7, #EC4899, #3B82F6, #06B6D4, #8B5CF6)',
                   backgroundSize: '300% 300%',
                   animation: 'gradientShift 4s ease-in-out infinite'
                 }}>
                   E-commerce Empire
                 </span>
               </h1>
               <p className="text-2xl text-gray-300 leading-relaxed max-w-lg">
                 Access the most sophisticated dashboard designed for serious entrepreneurs. 
                 Where data meets design, and success becomes inevitable.
               </p>
             </div>
            
                                        {/* Enhanced Value Proposition */}
               <div className="pt-10">
                 <p className="text-xl text-gray-300 leading-relaxed max-w-lg">
                   Experience the future of e-commerce management with our cutting-edge platform designed for ambitious entrepreneurs.
                 </p>
               </div>
          </div>
          
                     {/* Right Side - Login Form */}
           <div className="flex justify-center lg:justify-end">
             <div className="w-full max-w-lg">
               {/* Glass-morphism Login Card */}
               <div className="luxury-glass rounded-3xl p-10 shadow-2xl animate-[scaleIn_0.6s_ease-out]">
                                 {/* Logo/Brand */}
                 <div className="text-center mb-10">
                   <div className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{
                   background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 25%, #EC4899 50%, #3B82F6 75%, #06B6D4 100%)'
                 }}>
                     <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                     </svg>
                   </div>
                   <h2 className="text-3xl font-bold text-white mb-3">Welcome Back</h2>
                   <p className="text-gray-300 text-lg">Access your business dashboard</p>
                 </div>
                
                                 {/* Login Form */}
                 <Form {...form}>
                   <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                         {error && (
                       <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-red-200 text-center text-lg">
                         {error}
                       </div>
                     )}
                    
                    <FormField
                      control={form.control}
                      name="identifier"
                      render={({ field }) => (
                        <FormItem>
                                                     <FormLabel className="text-white font-semibold text-lg">
                             Email or Username
                           </FormLabel>
                          <FormControl>
                            <div className="relative">
                                                             <Input
                                 className="premium-input h-16 text-white placeholder-gray-400 rounded-xl transition-all duration-300 text-lg"
                                 placeholder="Enter your email or username"
                                 {...field}
                               />
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-300 text-base" />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white font-semibold text-lg">
                            Password
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <PasswordInput
                                className="premium-input h-16 text-white placeholder-gray-400 rounded-xl transition-all duration-300 pr-12 text-lg"
                                placeholder="Enter your password"
                                {...field}
                              />
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-300 text-base" />
                        </FormItem>
                      )}
                    />
                    
                                         {/* Forgot Password */}
                     <div className="flex justify-end">
                       <Link href="/reset-password" className="text-purple-400 hover:text-purple-300 text-base transition-colors font-medium">
                         Forgot password?
                       </Link>
                     </div>
                    
                    {/* Login Button */}
                                         <LoadingButton
                       loading={isPending}
                       type="submit"
                       className="luxury-button w-full h-16 text-white font-bold text-lg rounded-xl"
                     >
                      {isPending ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Authenticating...</span>
                        </div>
                      ) : (
                        <span>Access Dashboard</span>
                      )}
                    </LoadingButton>
                  </form>
                </Form>
                
                
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-gray-400 text-sm z-10">
        <p>© 2024 AIM TRENDSETT LLC. All rights reserved. | Enterprise-grade e-commerce platform</p>
      </div>
      
             {/* Dashboard Preview */}
       <div className="absolute top-1/2 right-20 transform -translate-y-1/2 z-10 hidden xl:block">
         <div className="luxury-glass rounded-2xl p-6 w-80 floating-element">
           <div className="text-white text-sm">
             <div className="font-semibold text-lg mb-4">Dashboard Preview</div>
             <div className="space-y-3">
               <div className="flex justify-between items-center">
                 <span className="text-gray-300">Today's Sales</span>
                 <span className="text-purple-400 font-semibold">$24,580</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-gray-300">Orders</span>
                 <span className="text-pink-400 font-semibold">1,247</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-gray-300">Conversion Rate</span>
                 <span className="text-cyan-400 font-semibold">3.2%</span>
               </div>
               <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                 <div className="h-2 rounded-full" style={{ 
                   width: '75%',
                   background: 'linear-gradient(90deg, #8B5CF6 0%, #A855F7 25%, #EC4899 50%, #3B82F6 75%, #06B6D4 100%)'
                 }}></div>
               </div>
             </div>
           </div>
         </div>
       </div>
       
       {/* Floating Elements */}
       <div className="absolute top-10 right-10 z-10">
         <div className="luxury-glass rounded-2xl p-4">
           <div className="text-white text-sm">
             <div className="font-semibold">Live Status</div>
             <div className="flex items-center space-x-2 mt-1">
               <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
               <span className="text-gray-300">All systems operational</span>
             </div>
           </div>
         </div>
       </div>
     </div>
     </>
   );
 }
