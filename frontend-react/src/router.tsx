import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import AppShell from "./components/shell/AppShell";
import RequireAuth from "./components/shell/RequireAuth";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import FrameworksPage from "./pages/FrameworksPage";
import GuesstimatesPage from "./pages/GuesstimatesPage";
import CompanyPage from "./pages/CompanyPage";
import RolePage from "./pages/RolePage";
import MockInterviewPage from "./pages/MockInterviewPage";
import SkillPage from "./pages/SkillPage";
import ResumePage from "./pages/ResumePage";
import ToneShifterPage from "./pages/ToneShifterPage";
import CommunityPage from "./pages/CommunityPage";
// Admin-only (usage + R5 review queue): split into its own chunk so students never download it.
const AdminPage = lazy(() => import("./pages/AdminPage"));

// One route per page (see migration plan §0.9). Skill uses query params
// (?role=...&skill=...) rather than path segments, since role/skill names
// contain spaces - reached only via a click from Role, never a nav item.
// /login sits outside RequireAuth/AppShell (no app chrome pre-session);
// everything else needs a session - email, Google, or guest.
export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          { path: "/", element: <HomePage /> },
          { path: "/frameworks", element: <FrameworksPage /> },
          { path: "/guesstimates", element: <GuesstimatesPage /> },
          { path: "/company", element: <CompanyPage /> },
          { path: "/role", element: <RolePage /> },
          { path: "/mock-interview", element: <MockInterviewPage /> },
          { path: "/skill", element: <SkillPage /> },
          { path: "/resume", element: <ResumePage /> },
          { path: "/tone-shifter", element: <ToneShifterPage /> },
          { path: "/community", element: <CommunityPage /> },
          { path: "/admin", element: <Suspense fallback={null}><AdminPage /></Suspense> }
        ]
      }
    ]
  }
]);
