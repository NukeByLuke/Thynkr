import { lazyWithPreload } from './utils/lazyWithPreload';

// Code-split page components with preloading for optimal bundle size
export const Login = lazyWithPreload(() => import('./pages/Login'));
export const Register = lazyWithPreload(() => import('./pages/Register'));
export const AuthCallback = lazyWithPreload(() => import('./pages/AuthCallback'));
export const OAuthCallback = AuthCallback; // Alias for /oauth-callback route
export const Pricing = lazyWithPreload(() => import('./pages/Pricing'));
export const Account = lazyWithPreload(() => import('./pages/Account'));
export const Admin = lazyWithPreload(() => import('./pages/Admin'));
export const Study = lazyWithPreload(() => import('./pages/Study'));
export const StudyDetail = lazyWithPreload(() => import('./pages/StudyDetail'));
export const ImmersiveStudy = lazyWithPreload(() => import('./pages/ImmersiveStudy'));
export const Files = lazyWithPreload(() => import('./pages/Files'));
export const Settings = lazyWithPreload(() => import('./pages/SettingsPage'));
export const Courses = lazyWithPreload(() => import('./pages/CoursesUnified'));
export const MyCourseDetail = lazyWithPreload(() => import('./pages/MyCourseDetail'));
export const Achievements = lazyWithPreload(() => import('./pages/Achievements'));
export const SavedPacks = lazyWithPreload(() => import('./pages/SavedPacks'));
export const PublicAchievements = lazyWithPreload(() => import('./pages/PublicAchievements'));
export const NotFound = lazyWithPreload(() => import('./pages/NotFound'));
