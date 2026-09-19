import { createBrowserRouter } from "react-router-dom";
import AppShell from "./components/shell/AppShell";
import HomePage from "./pages/HomePage";
import FrameworksPage from "./pages/FrameworksPage";
import CompanyPage from "./pages/CompanyPage";
import RolePage from "./pages/RolePage";
import MockInterviewPage from "./pages/MockInterviewPage";
import SkillPage from "./pages/SkillPage";
import ResumePage from "./pages/ResumePage";
import ToneShifterPage from "./pages/ToneShifterPage";
import CommunityPage from "./pages/CommunityPage";

// One route per page (see migration plan §0.9). Skill uses query params
// (?role=...&skill=...) rather than path segments, since role/skill names
// contain spaces - reached only via a click from Role, never a nav item.
export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/frameworks", element: <FrameworksPage /> },
      { path: "/company", element: <CompanyPage /> },
      { path: "/role", element: <RolePage /> },
      { path: "/mock-interview", element: <MockInterviewPage /> },
      { path: "/skill", element: <SkillPage /> },
      { path: "/resume", element: <ResumePage /> },
      { path: "/tone-shifter", element: <ToneShifterPage /> },
      { path: "/community", element: <CommunityPage /> }
    ]
  }
]);
