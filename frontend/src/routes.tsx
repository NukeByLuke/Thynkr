import { lazyWithPreload } from './utils/lazyWithPreload';

// Code-split page components with preloading for optimal bundle size
export const Login = lazyWithPreload(() => import('./pages/Login'));
export const Register = lazyWithPreload(() => import('./pages/Register'));
export const AuthCallback = lazyWithPreload(() => import('./pages/AuthCallback'));
export const OAuthCallback = AuthCallback; // Alias for /oauth-callback route
export const ForgotPassword = lazyWithPreload(() => import('./pages/ForgotPassword'));
export const VerifyEmail = lazyWithPreload(() => import('./pages/VerifyEmail'));
export const ResetPassword = lazyWithPreload(() => import('./pages/ResetPassword'));
export const Pricing = lazyWithPreload(() => import('./pages/Pricing'));
export const Account = lazyWithPreload(() => import('./pages/Account'));
export const Admin = lazyWithPreload(() => import('./pages/Admin'));
export const Study = lazyWithPreload(() => import('./pages/Study'));
export const ImmersiveStudy = lazyWithPreload(() => import('./pages/ImmersiveStudy'));
export const Files = lazyWithPreload(() => import('./pages/Files'));
export const Settings = lazyWithPreload(() => import('./pages/SettingsPage'));
export const HelpCenter = lazyWithPreload(() => import('./pages/HelpCenter'));
export const Courses = lazyWithPreload(() => import('./pages/Courses'));
export const MyCourseDetail = lazyWithPreload(() => import('./pages/MyCourseDetail'));
export const StudyModePage = lazyWithPreload(() => import('./pages/StudyModePage'));
export const Achievements = lazyWithPreload(() => import('./pages/Achievements'));
export const SavedPacks = lazyWithPreload(() => import('./pages/SavedPacks'));
export const PublicAchievements = lazyWithPreload(() => import('./pages/PublicAchievements'));
export const NotFound = lazyWithPreload(() => import('./pages/NotFound'));

// Legal pages
export const Privacy = lazyWithPreload(() => import('./pages/legal/Privacy'));
export const Terms = lazyWithPreload(() => import('./pages/legal/Terms'));
export const Cookies = lazyWithPreload(() => import('./pages/legal/Cookies'));

// Public pages
export const Landing = lazyWithPreload(() => import('./pages/Landing'));
export const About = lazyWithPreload(() => import('./pages/public/About'));
export const Contact = lazyWithPreload(() => import('./pages/public/Contact'));
export const Testimonials = lazyWithPreload(() => import('./pages/public/Testimonials'));
export const Roadmap = lazyWithPreload(() => import('./pages/public/Roadmap'));
